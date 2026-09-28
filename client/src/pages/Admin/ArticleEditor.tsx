import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { BlockEditor, insertImageIntoEditor } from "@/components/Editor/BlockEditor";
import { MediaGallery } from "@/components/MediaGallery";
import { readingStats, excerptFromContent } from "@shared/excerpt";
import { toast } from "sonner";
import { Save, Eye, ArrowLeft, Image as ImageIcon, Check, AlertTriangle, Search, Share2, BookOpen, X } from "lucide-react";
import { SidebarArticlesPanel } from "@/components/Admin/SidebarArticlesPanel";
import type { LexicalEditor } from "lexical";

/** Google truncates around these; going over is not an error, just a warning. */
const TITLE_LIMIT = 60;
const DESCRIPTION_LIMIT = 155;

function toDatetimeLocalValue(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function toIsoStringFromDatetimeLocal(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function isFutureDatetimeLocal(value: string) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function countState(length: number, limit: number) {
  if (length > limit) return "over";
  if (length > limit * 0.9) return "warn";
  return "ok";
}

function Counter({ value, limit }: { value: string; limit: number }) {
  return (
    <span className="ca-adm-count" data-state={countState(value.length, limit)}>
      {value.length} / {limit}
    </span>
  );
}

export default function ArticleEditor() {
  const params = useParams<{ id: string }>();
  const parsedArticleId = params.id ? parseInt(params.id, 10) : undefined;
  const articleId = Number.isFinite(parsedArticleId) ? parsedArticleId : undefined;
  const isEditing = !!articleId;
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("{}");
  const [featuredImage, setFeaturedImage] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [fuentes, setFuentes] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [publishedAt, setPublishedAt] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<"featured" | "og" | "editor">("editor");
  const [dirty, setDirty] = useState(false);
  const editorRef = useRef<LexicalEditor | null>(null);
  const handleEditorReady = useCallback((editor: LexicalEditor) => {
    editorRef.current = editor;
  }, []);

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: existingArticle } = trpc.articles.adminList.useQuery(undefined, {
    enabled: isEditing,
    select: (articles) => articles.find((a) => a.id === articleId),
  });

  const createMutation = trpc.articles.create.useMutation({
    onSuccess: ({ id: newArticleId }) => {
      setDirty(false);
      toast.success("Artículo guardado");
      navigate(`/admin/editar/${newArticleId}`);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => {
      setDirty(false);
      toast.success("Artículo actualizado");
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  // Load existing article
  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSlug(existingArticle.slug);
      setStatus(existingArticle.status);
      setFeatured(existingArticle.featured);
      setCategoryId(existingArticle.categoryId ?? undefined);
      if (existingArticle.publishedAt) {
        setPublishedAt(toDatetimeLocalValue(existingArticle.publishedAt));
      }
      setDirty(false);
    }
  }, [existingArticle]);

  // Load full article content for editing
  const { data: fullArticle } = trpc.articles.bySlug.useQuery(
    { slug: existingArticle?.slug || "" },
    { enabled: isEditing && !!existingArticle?.slug }
  );

  useEffect(() => {
    if (fullArticle) {
      setExcerpt(fullArticle.excerpt || "");
      setContent(fullArticle.content || "{}");
      setFeaturedImage(fullArticle.featuredImage || "");
      setOgTitle(fullArticle.ogTitle || "");
      setOgDescription(fullArticle.ogDescription || "");
      setOgImage(fullArticle.ogImage || "");
      setFuentes(fullArticle.fuentes || "");
      setDirty(false);
    }
  }, [fullArticle]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      const generated = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generated);
    }
  }, [title, isEditing]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = useCallback((saveStatus?: "draft" | "published") => {
    const finalStatus = saveStatus || status;
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    const selectedPublishedAt = toIsoStringFromDatetimeLocal(publishedAt);
    const shouldPublishNow = finalStatus === "published" && !selectedPublishedAt;
    const finalPublishedAt = shouldPublishNow ? new Date().toISOString() : selectedPublishedAt;

    const data = {
      title,
      slug: slug || undefined,
      excerpt: excerpt || undefined,
      content,
      featuredImage: featuredImage || undefined,
      ogTitle: ogTitle || undefined,
      ogDescription: ogDescription || undefined,
      ogImage: ogImage || undefined,
      // Sent as an empty string, not undefined, so clearing the box clears the row.
      fuentes: fuentes.trim(),
      status: finalStatus,
      featured,
      categoryId,
      publishedAt: finalPublishedAt,
    };

    if (isEditing && articleId) {
      updateMutation.mutate({ id: articleId, ...data });
    } else {
      createMutation.mutate(data);
    }
  }, [status, title, publishedAt, slug, excerpt, content, featuredImage, ogTitle, ogDescription, ogImage, fuentes, featured, categoryId, isEditing, articleId, updateMutation, createMutation]);

  // Losing a half-written article to a stray click is the worst thing a CMS can
  // do, so unsaved work both warns on the way out and answers Ctrl+S.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!isSaving) handleSave("draft");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave, isSaving]);

  /** Marks the form dirty on every edit without repeating the setter everywhere. */
  function edit<T>(setter: (value: T) => void) {
    return (value: T) => { setter(value); setDirty(true); };
  }

  const openGallery = (target: "featured" | "og" | "editor") => {
    setGalleryTarget(target);
    setShowGallery(true);
  };

  const handleGallerySelect = (url: string) => {
    if (galleryTarget === "featured") { setFeaturedImage(url); setDirty(true); }
    else if (galleryTarget === "og") { setOgImage(url); setDirty(true); }
    else if (galleryTarget === "editor" && editorRef.current) {
      insertImageIntoEditor(editorRef.current, url);
      setDirty(true);
    }
  };

  const stats = useMemo(() => readingStats(content), [content]);
  const publishActionLabel = isFutureDatetimeLocal(publishedAt) ? "Programar" : "Publicar";
  const selectedStatusLabel = status === "published" && isFutureDatetimeLocal(publishedAt) ? "Programado" : status === "published" ? "Publicado" : "Borrador";
  const statusAccent = selectedStatusLabel === "Programado" ? "#5b2c8f" : selectedStatusLabel === "Publicado" ? "#15803d" : "#b45309";

  // What Google would show. The excerpt is what the server falls back to, so the
  // preview has to follow the same order the server uses.
  const serpTitle = (ogTitle || title || "Título del artículo") + " | Curioseando Ando";
  const serpDescription = ogDescription || excerpt || excerptFromContent(content) || "";

  const sourceCount = fuentes.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("!")).length;
  const checks = [
    { ok: title.trim().length > 0 && title.length <= TITLE_LIMIT + 15, label: title.trim() ? "Título dentro de lo razonable" : "Falta el título" },
    { ok: !!categoryId, label: categoryId ? "Categoría asignada" : "Sin categoría: no aparecerá en ninguna sección" },
    { ok: !!featuredImage, label: featuredImage ? "Imagen destacada lista" : "Sin imagen destacada: se verá vacía al compartir" },
    { ok: serpDescription.length > 0, label: serpDescription ? "Hay descripción para Google" : "Sin extracto: Google inventará el resumen" },
    { ok: sourceCount > 0, label: sourceCount > 0 ? `${sourceCount} fuente${sourceCount === 1 ? "" : "s"} citada${sourceCount === 1 ? "" : "s"}` : "Sin fuentes: AdSense penaliza esto" },
    { ok: stats.words >= 300, label: stats.words >= 300 ? `${stats.words} palabras` : `Solo ${stats.words} palabras: Google lo puede leer como contenido pobre` },
  ];
  const pending = checks.filter((c) => !c.ok).length;

  return (
    <AdminLayout>
      <div className="ca-adm-page">
        <div className="ca-adm-bar">
          <button onClick={() => navigate("/admin/articulos")} className="ca-adm-btn" style={{ padding: "0.4rem" }} aria-label="Volver">
            <ArrowLeft />
          </button>
          <h1 className="ca-adm-bar__title">{isEditing ? "Editar artículo" : "Nuevo artículo"}</h1>
          {dirty && <span className="ca-adm-bar__dirty">Sin guardar</span>}
          <span className="ca-adm-pill" style={{ ["--adm-accent" as string]: statusAccent }}>{selectedStatusLabel}</span>
          {isEditing && existingArticle?.slug && (
            <a href={`/articulo/${existingArticle.slug}`} target="_blank" rel="noopener noreferrer" className="ca-adm-btn ca-adm-btn--ghost">
              <Eye />
              Ver
            </a>
          )}
          <button onClick={() => handleSave("draft")} disabled={isSaving} className="ca-adm-btn ca-adm-btn--ghost" title="Ctrl + S">
            <Save />
            Borrador
          </button>
          <button onClick={() => handleSave("published")} disabled={isSaving} className="ca-adm-btn ca-adm-btn--primary">
            {isSaving ? "Guardando..." : publishActionLabel}
          </button>
        </div>

        <div className="ca-adm-editor">
          {/* ── Cuerpo ─────────────────────────────────────────────────────── */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => edit(setTitle)(e.target.value)}
              placeholder="Título del artículo..."
              className="ca-adm-title-input"
            />
            <Counter value={title} limit={TITLE_LIMIT} />

            <div className="ca-adm-field" style={{ marginTop: "1rem" }}>
              <label htmlFor="excerpt">Extracto</label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => edit(setExcerpt)(e.target.value)}
                placeholder="La frase que Google y las redes usarán como resumen."
                rows={2}
                className="ca-adm-input resize-none"
              />
              <Counter value={excerpt} limit={DESCRIPTION_LIMIT} />
            </div>

            <div className="ca-adm-field">
              <label>Contenido</label>
              <BlockEditor
                initialContent={content !== "{}" ? content : undefined}
                onChange={edit(setContent)}
                onInsertImageRequest={() => openGallery("editor")}
                onEditorReady={handleEditorReady}
              />
              <div className="ca-adm-metrics">
                <span><b>{stats.words}</b> palabras</span>
                <span><b>{stats.minutes}</b> min de lectura</span>
                <span><b>{sourceCount}</b> fuentes</span>
              </div>
            </div>
          </div>

          {/* ── Ajustes ────────────────────────────────────────────────────── */}
          <div className="ca-adm-editor__side">
            <section className="ca-adm-card">
              <div className="ca-adm-card__head">
                <h2 className="ca-adm-card__title"><Check />Antes de publicar</h2>
                {pending > 0 && <span className="ca-adm-pill" style={{ ["--adm-accent" as string]: "#b45309" }}>{pending}</span>}
              </div>
              <div className="ca-adm-card__body" style={{ paddingTop: "0.35rem", paddingBottom: "0.55rem" }}>
                {checks.map((check) => (
                  <div key={check.label} className="ca-adm-check" data-ok={check.ok}>
                    {check.ok ? <Check /> : <AlertTriangle />}
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="ca-adm-card">
              <div className="ca-adm-card__head">
                <div>
                  <h2 className="ca-adm-card__title"><Search />Así se verá en Google</h2>
                  <p className="ca-adm-card__hint">Aproximado: Google puede reescribirlo.</p>
                </div>
              </div>
              <div className="ca-adm-card__body">
                <div className="ca-adm-serp">
                  <div className="ca-adm-serp__crumb">curioseandoando.com › articulo › {slug || "mi-articulo"}</div>
                  <p className="ca-adm-serp__title">{serpTitle}</p>
                  <p className="ca-adm-serp__desc">
                    {serpDescription || <em>Escribe un extracto o más contenido y aquí aparecerá el resumen.</em>}
                  </p>
                </div>
              </div>
            </section>

            <section className="ca-adm-card">
              <div className="ca-adm-card__head">
                <h2 className="ca-adm-card__title"><BookOpen />Publicación</h2>
              </div>
              <div className="ca-adm-card__body">
                <div className="ca-adm-field">
                  <label htmlFor="status">Estado</label>
                  <select id="status" value={status} onChange={(e) => edit(setStatus)(e.target.value as "draft" | "published")} className="ca-adm-input">
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado / Programado</option>
                  </select>
                </div>
                <div className="ca-adm-field">
                  <label htmlFor="publishedAt">Fecha de publicación</label>
                  <input id="publishedAt" type="datetime-local" value={publishedAt} onChange={(e) => edit(setPublishedAt)(e.target.value)} className="ca-adm-input" />
                  <p className="ca-adm-help">Una fecha futura programa la nota en lugar de publicarla.</p>
                </div>
                <div className="ca-adm-field">
                  <label htmlFor="category">Categoría</label>
                  <select id="category" value={categoryId ?? ""} onChange={(e) => edit(setCategoryId)(e.target.value ? parseInt(e.target.value) : undefined)} className="ca-adm-input">
                    <option value="">Sin categoría</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="ca-adm-field">
                  <label htmlFor="slug">Slug (URL)</label>
                  <input id="slug" type="text" value={slug} onChange={(e) => edit(setSlug)(e.target.value)} placeholder="mi-articulo" className="ca-adm-input font-mono" />
                  {isEditing && <p className="ca-adm-help">Cambiarlo rompe los enlaces que ya apuntan a esta nota.</p>}
                </div>
                <label className="flex items-center gap-2 cursor-pointer" style={{ marginTop: "0.9rem" }}>
                  <input type="checkbox" checked={featured} onChange={(e) => edit(setFeatured)(e.target.checked)} className="w-4 h-4" style={{ accentColor: "#5b2c8f" }} />
                  <span style={{ fontSize: "0.82rem" }}>Artículo destacado</span>
                </label>
              </div>
            </section>

            <section className="ca-adm-card">
              <div className="ca-adm-card__head">
                <h2 className="ca-adm-card__title"><ImageIcon />Imagen destacada</h2>
              </div>
              <div className="ca-adm-card__body">
                {featuredImage ? (
                  <div className="relative rounded-lg overflow-hidden mb-2" style={{ aspectRatio: "16/9" }}>
                    <img src={featuredImage} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => edit(setFeaturedImage)("")}
                      className="absolute top-2 right-2"
                      style={{ padding: "0.3rem", borderRadius: "999px", background: "rgba(0,0,0,0.7)", color: "#fff" }}
                      aria-label="Quitar imagen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    className="w-full grid place-items-center mb-2"
                    style={{ aspectRatio: "16/9", borderRadius: "0.6rem", background: "var(--adm-surface-2)", border: "1px dashed var(--adm-line)", color: "var(--adm-ink-3)" }}
                    onClick={() => openGallery("featured")}
                  >
                    <ImageIcon className="w-7 h-7" />
                  </button>
                )}
                <button onClick={() => openGallery("featured")} className="ca-adm-btn ca-adm-btn--ghost ca-adm-btn--block">
                  {featuredImage ? "Cambiar imagen" : "Seleccionar imagen"}
                </button>
              </div>
            </section>

            <section className="ca-adm-card">
              <div className="ca-adm-card__head">
                <div>
                  <h2 className="ca-adm-card__title"><BookOpen />Fuentes consultadas</h2>
                  <p className="ca-adm-card__hint">Se muestran al final de la nota.</p>
                </div>
              </div>
              <div className="ca-adm-card__body">
                <textarea
                  value={fuentes}
                  onChange={(e) => edit(setFuentes)(e.target.value)}
                  rows={5}
                  placeholder={"BBC Mundo | https://www.bbc.com/mundo/articulo\nhttps://es.wikipedia.org/wiki/Ejemplo"}
                  className="ca-adm-input"
                />
                <p className="ca-adm-help">
                  Una por línea: solo el enlace, o <code>Nombre | enlace</code>. Una línea que empiece
                  con <code>!</code> se muestra como aviso y no como fuente — para folclore sin origen documentado.
                </p>
              </div>
            </section>

            <section className="ca-adm-card">
              <div className="ca-adm-card__head">
                <div>
                  <h2 className="ca-adm-card__title"><Share2 />Al compartir en redes</h2>
                  <p className="ca-adm-card__hint">Vacío usa el título y el extracto.</p>
                </div>
              </div>
              <div className="ca-adm-card__body">
                <div className="ca-adm-field">
                  <label htmlFor="ogTitle">Título</label>
                  <input id="ogTitle" type="text" value={ogTitle} onChange={(e) => edit(setOgTitle)(e.target.value)} placeholder={title || "Título para redes"} className="ca-adm-input" />
                </div>
                <div className="ca-adm-field">
                  <label htmlFor="ogDescription">Descripción</label>
                  <textarea id="ogDescription" value={ogDescription} onChange={(e) => edit(setOgDescription)(e.target.value)} placeholder={excerpt || "Descripción para redes"} rows={2} className="ca-adm-input resize-none" />
                  <Counter value={ogDescription} limit={DESCRIPTION_LIMIT} />
                </div>
                <div className="ca-adm-field">
                  <label>Imagen (1200×630)</label>
                  {ogImage && (
                    <div className="relative rounded-lg overflow-hidden mb-2" style={{ aspectRatio: "1200/630" }}>
                      <img src={ogImage} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => edit(setOgImage)("")}
                        className="absolute top-2 right-2"
                        style={{ padding: "0.3rem", borderRadius: "999px", background: "rgba(0,0,0,0.7)", color: "#fff" }}
                        aria-label="Quitar imagen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <button onClick={() => openGallery("og")} className="ca-adm-btn ca-adm-btn--ghost ca-adm-btn--block">
                    {ogImage ? "Cambiar imagen" : "Seleccionar imagen"}
                  </button>
                </div>
              </div>
            </section>

            <SidebarArticlesPanel />
          </div>
        </div>
      </div>

      {showGallery && (
        <MediaGallery onSelect={handleGallerySelect} onClose={() => setShowGallery(false)} />
      )}
    </AdminLayout>
  );
}
