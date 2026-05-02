import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { BlockEditor, insertImageIntoEditor } from "@/components/Editor/BlockEditor";
import { MediaGallery } from "@/components/MediaGallery";
import { toast } from "sonner";
import { Save, Eye, ArrowLeft, Image as ImageIcon } from "lucide-react";
import type { LexicalEditor } from "lexical";

export default function ArticleEditor() {
  const params = useParams<{ id: string }>();
  const articleId = params.id ? parseInt(params.id) : undefined;
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
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [publishedAt, setPublishedAt] = useState("");
  const [showGallery, setShowGallery] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<"featured" | "og" | "editor">("editor");
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
    onSuccess: ({ slug: newSlug }) => {
      toast.success("Artículo guardado");
      navigate(`/admin/editar/${newSlug}`);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => toast.success("Artículo actualizado"),
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
        const d = new Date(existingArticle.publishedAt);
        setPublishedAt(d.toISOString().slice(0, 16));
      }
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
    }
  }, [fullArticle]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      const generated = title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
      setSlug(generated);
    }
  }, [title, isEditing]);

  const handleSave = (saveStatus?: "draft" | "published") => {
    const finalStatus = saveStatus || status;
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    const data = {
      title,
      slug: slug || undefined,
      excerpt: excerpt || undefined,
      content,
      featuredImage: featuredImage || undefined,
      ogTitle: ogTitle || undefined,
      ogDescription: ogDescription || undefined,
      ogImage: ogImage || undefined,
      status: finalStatus,
      featured,
      categoryId,
      publishedAt: publishedAt || undefined,
    };

    if (isEditing && articleId) {
      updateMutation.mutate({ id: articleId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openGallery = (target: "featured" | "og" | "editor") => {
    setGalleryTarget(target);
    setShowGallery(true);
  };

  const handleGallerySelect = (url: string) => {
    if (galleryTarget === "featured") setFeaturedImage(url);
    else if (galleryTarget === "og") setOgImage(url);
    else if (galleryTarget === "editor" && editorRef.current) {
      insertImageIntoEditor(editorRef.current, url);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/articulos")}
              className="p-2 rounded-lg transition-colors"
              style={{ color: "#6B6B6B" }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
                {isEditing ? "Editar Artículo" : "Nuevo Artículo"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && existingArticle?.slug && (
              <a
                href={`/articulo/${existingArticle.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm no-underline"
                style={{ color: "#6B6B6B", border: "1px solid #E5E3DE" }}
              >
                <Eye className="w-4 h-4" />
                Vista previa
              </a>
            )}
            <button
              onClick={() => handleSave("draft")}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ color: "#6B6B6B", border: "1px solid #E5E3DE" }}
            >
              <Save className="w-4 h-4" />
              Borrador
            </button>
            <button
              onClick={() => handleSave("published")}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}
            >
              {isSaving ? "Guardando..." : "Publicar"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Title */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título del artículo..."
                className="w-full bg-transparent text-white text-2xl font-bold border-0 border-b-2 pb-3 outline-none placeholder:text-gray-600"
                style={{ borderColor: "#E5E3DE", fontFamily: "Poppins, sans-serif" }}
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6B6B" }}>Extracto / Descripción corta</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Breve descripción del artículo..."
                rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E3DE" }}
              />
            </div>

            {/* Block Editor */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6B6B6B" }}>Contenido</label>
              <BlockEditor
                initialContent={content !== "{}" ? content : undefined}
                onChange={setContent}
                onInsertImageRequest={() => openGallery("editor")}
                onEditorReady={handleEditorReady}
              />
            </div>
          </div>

          {/* Sidebar settings */}
          <div className="flex flex-col gap-4">
            {/* Publish settings */}
            <div className="ca-card p-4">
              <h3 className="font-semibold text-sm mb-4">Publicación</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6B6B" }}>Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ backgroundColor: "#F8F7F4", border: "1px solid #E5E3DE" }}
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6B6B" }}>Fecha de publicación</label>
                  <input
                    type="datetime-local"
                    value={publishedAt}
                    onChange={(e) => setPublishedAt(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ backgroundColor: "#F8F7F4", border: "1px solid #E5E3DE" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6B6B" }}>Categoría</label>
                  <select
                    value={categoryId ?? ""}
                    onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ backgroundColor: "#F8F7F4", border: "1px solid #E5E3DE" }}
                  >
                    <option value="">Sin categoría</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6B6B" }}>Slug (URL)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="mi-articulo"
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ backgroundColor: "#F8F7F4", border: "1px solid #E5E3DE" }}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: "#5B2C8F" }}
                  />
                  <span className="text-sm text-white">Artículo destacado</span>
                </label>
              </div>
            </div>

            {/* Featured Image */}
            <div className="ca-card p-4">
              <h3 className="font-semibold text-sm mb-3">Imagen Destacada</h3>
              {featuredImage ? (
                <div className="relative rounded-lg overflow-hidden mb-2" style={{ aspectRatio: "16/9" }}>
                  <img src={featuredImage} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setFeaturedImage("")}
                    className="absolute top-2 right-2 p-1 rounded-full"
                    style={{ background: "rgba(0,0,0,0.7)", color: "#ef4444" }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-lg flex items-center justify-center cursor-pointer mb-2"
                  style={{ aspectRatio: "16/9", backgroundColor: "#F8F7F4", border: "1px dashed #E5E3DE" }}
                  onClick={() => openGallery("featured")}
                >
                  <ImageIcon className="w-8 h-8" style={{ color: "#5A5C5E" }} />
                </div>
              )}
              <button
                onClick={() => openGallery("featured")}
                className="w-full py-2 rounded-lg text-sm font-medium"
                style={{ border: "1px solid #E5E3DE", color: "#6B6B6B" }}
              >
                {featuredImage ? "Cambiar imagen" : "Seleccionar imagen"}
              </button>
            </div>

            {/* Open Graph */}
            <div className="ca-card p-4">
              <h3 className="font-semibold text-sm mb-3">Open Graph (Facebook)</h3>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6B6B" }}>OG Title</label>
                  <input
                    type="text"
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder={title || "Título para redes sociales"}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                    style={{ backgroundColor: "#F8F7F4", border: "1px solid #E5E3DE" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6B6B" }}>OG Description</label>
                  <textarea
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder={excerpt || "Descripción para redes sociales"}
                    rows={2}
                    className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
                    style={{ backgroundColor: "#F8F7F4", border: "1px solid #E5E3DE" }}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6B6B" }}>
                    OG Image (1200×630)
                  </label>
                  {ogImage ? (
                    <div className="relative rounded-lg overflow-hidden mb-2" style={{ aspectRatio: "1200/630" }}>
                      <img src={ogImage} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setOgImage("")}
                        className="absolute top-2 right-2 p-1 rounded-full"
                        style={{ background: "rgba(0,0,0,0.7)", color: "#ef4444" }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                  <button
                    onClick={() => openGallery("og")}
                    className="w-full py-2 rounded-lg text-sm font-medium"
                    style={{ border: "1px solid #E5E3DE", color: "#6B6B6B" }}
                  >
                    {ogImage ? "Cambiar OG Image" : "Seleccionar OG Image"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showGallery && (
        <MediaGallery
          onSelect={handleGallerySelect}
          onClose={() => setShowGallery(false)}
        />
      )}
    </AdminLayout>
  );
}
