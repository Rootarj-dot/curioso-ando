import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { Calendar, ArrowLeft, ArrowRight, Facebook, Clock, Check, Link2, MessageCircle } from "lucide-react";
import { CuriousCard } from "@/components/CuriousCard";
import { useSeoMeta } from "@/hooks/useSeoMeta";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// setMetaTags replaced by useSeoMeta hook

// ─── Reading time ─────────────────────────────────────────────────────────────
const WORDS_PER_MINUTE = 200;

function countWordsInNode(node: any): number {
  if (!node) return 0;
  if (node.type === "text") {
    const words = String(node.text || "").trim();
    return words ? words.split(/\s+/).length : 0;
  }
  return (node.children || []).reduce((sum: number, child: any) => sum + countWordsInNode(child), 0);
}

function readingMinutes(content: string | null | undefined): number {
  if (!content) return 0;
  let words = 0;
  try {
    const parsed = JSON.parse(content);
    words = countWordsInNode(parsed?.root);
  } catch {
    words = String(content).replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  }
  if (!words) return 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

// ─── Reading progress ─────────────────────────────────────────────────────────
function ReadingProgress({ targetRef }: { targetRef: React.RefObject<HTMLElement | null> }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const el = targetRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const travelled = -top;
      const distance = height - window.innerHeight;
      if (distance <= 0) {
        setProgress(travelled > 0 ? 100 : 0);
        return;
      }
      setProgress(Math.min(100, Math.max(0, (travelled / distance) * 100)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetRef]);

  return (
    <div className="ca-reading-progress" aria-hidden="true">
      <span className="ca-reading-progress__bar" style={{ transform: `scaleX(${progress / 100})` }} />
    </div>
  );
}

// ─── Inline Articles Block ────────────────────────────────────────────────────
function InlineArticlesBlock({
  blockType,
  count,
  currentSlug,
}: {
  blockType: "recent" | "recommended";
  count: number;
  currentSlug: string;
}) {
  const { data: articles } = trpc.articles.list.useQuery(
    { limit: count + 1 },
    { staleTime: 60_000 }
  );

  const filtered = (articles || []).filter((a) => a.slug !== currentSlug).slice(0, count);

  if (!filtered.length) return null;

  const label = blockType === "recent" ? "Artículos Recientes" : "Artículos Recomendados";
  const cols =
    count === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : count === 3
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="ca-inline-articles my-8 py-6">
      <h3 className="ca-inline-articles__title font-bold text-lg mb-4">{label}</h3>
      <div className={`grid ${cols} gap-4`}>
        {filtered.map((a) => (
          <ArticleCard key={a.id} {...a} />
        ))}
      </div>
    </div>
  );
}

// ─── Lexical Content Renderer ─────────────────────────────────────────────────
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function renderImageNode(node: any): string {
  if (!node.src) return "";
  const src = escapeAttribute(String(node.src));
  const alt = escapeAttribute(String(node.altText || ""));
  return `<img src="${src}" alt="${alt}" />`;
}

function renderTextNode(node: any): string {
  let text = escapeHtml(node.text || "");
  if (node.format & 1) text = `<strong>${text}</strong>`;
  if (node.format & 2) text = `<em>${text}</em>`;
  if (node.format & 8) text = `<u>${text}</u>`;
  return text;
}

function renderInlineNodes(nodes: any[]): string {
  return (nodes || [])
    .map((n) => {
      if (n.type === "text") return renderTextNode(n);
      if (n.type === "image") return renderImageNode(n);
      if (n.type === "linebreak") return "<br/>";
      if (n.children) return renderInlineNodes(n.children);
      return "";
    })
    .join("");
}

// Splits Lexical root children into segments: either HTML strings or articles-block descriptors
function splitContentSegments(
  nodes: any[]
): Array<{ kind: "html"; html: string } | { kind: "articles-block"; blockType: "recent" | "recommended"; count: number }> {
  const segments: Array<
    { kind: "html"; html: string } | { kind: "articles-block"; blockType: "recent" | "recommended"; count: number }
  > = [];

  let htmlBuffer = "";

  const flush = () => {
    if (htmlBuffer.trim()) {
      segments.push({ kind: "html", html: htmlBuffer });
      htmlBuffer = "";
    }
  };

  for (const node of nodes || []) {
    if (node.type === "articles-block") {
      flush();
      segments.push({
        kind: "articles-block",
        blockType: node.blockType as "recent" | "recommended",
        count: node.count || 3,
      });
    } else if (node.type === "paragraph") {
      htmlBuffer += `<p>${renderInlineNodes(node.children || [])}</p>`;
    } else if (node.type === "heading") {
      const tag = node.tag || "h2";
      htmlBuffer += `<${tag}>${renderInlineNodes(node.children || [])}</${tag}>`;
    } else if (node.type === "list") {
      const tag = node.listType === "number" ? "ol" : "ul";
      const items = (node.children || [])
        .map((li: any) => `<li>${renderInlineNodes(li.children || [])}</li>`)
        .join("");
      htmlBuffer += `<${tag}>${items}</${tag}>`;
    } else if (node.type === "quote") {
      htmlBuffer += `<blockquote>${renderInlineNodes(node.children || [])}</blockquote>`;
    } else if (node.type === "image") {
      htmlBuffer += renderImageNode(node);
    } else if (node.type === "linebreak") {
      htmlBuffer += "<br/>";
    } else if (node.children) {
      htmlBuffer += renderInlineNodes(node.children);
    }
  }

  flush();
  return segments;
}

function ArticleContent({ content, currentSlug }: { content: string; currentSlug: string }) {
  let segments: ReturnType<typeof splitContentSegments> = [];
  try {
    const parsed = JSON.parse(content);
    if (parsed?.root?.children) {
      segments = splitContentSegments(parsed.root.children);
    } else {
      segments = [{ kind: "html", html: `<p>${content}</p>` }];
    }
  } catch {
    segments = [{ kind: "html", html: content || "<p>Sin contenido</p>" }];
  }

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === "html") {
          return (
            <div
              key={i}
              className="article-content"
              dangerouslySetInnerHTML={{ __html: seg.html }}
            />
          );
        }
        return (
          <InlineArticlesBlock
            key={i}
            blockType={seg.blockType}
            count={seg.count}
            currentSlug={currentSlug}
          />
        );
      })}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: article, isLoading, error } = trpc.articles.bySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );
  const { data: relatedArticles } = trpc.articles.list.useQuery(
    { categorySlug: article?.categorySlug || undefined, limit: 4 },
    { enabled: !!article?.categorySlug }
  );
  const { data: sidebarData } = trpc.siteConfig.getSidebarArticleData.useQuery();
  const { data: triviaList } = trpc.trivia.listByArticle.useQuery(
    { articleId: article?.id ?? 0 },
    { enabled: !!article?.id }
  );

  // Dynamic SEO meta tags + JSON-LD for this article
  const ogImage = article?.ogImage || article?.featuredImage || "";
  const ogTitle = article?.ogTitle || article?.title || "Curioseando Ando";
  const ogDesc = article?.ogDescription || article?.excerpt || "";
  const ogUrl = article ? `${window.location.origin}/articulo/${article.slug}` : window.location.href;

  useSeoMeta({
    title: ogTitle,
    description: ogDesc,
    image: ogImage || undefined,
    url: ogUrl,
    type: "article",
    jsonLd: article ? {
      "@type": "NewsArticle",
      "headline": ogTitle,
      "description": ogDesc,
      "image": ogImage ? [ogImage] : undefined,
      "datePublished": article.publishedAt ? new Date(article.publishedAt).toISOString() : undefined,
      "dateModified": article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
      "author": { "@type": "Person", "name": article.authorName || "Curioseando Ando" },
      "publisher": {
        "@type": "Organization",
        "name": "Curioseando Ando",
        "url": "https://curioseandoando.com"
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": ogUrl },
    } : undefined,
  });

  const articleRef = useRef<HTMLElement | null>(null);
  const [copied, setCopied] = useState(false);

  const minutes = useMemo(() => readingMinutes(article?.content), [article?.content]);

  // First article of the same category that is not the one being read.
  const nextArticle = useMemo(
    () => (relatedArticles || []).find((a) => a.slug !== slug),
    [relatedArticles, slug]
  );

  const shareOnFacebook = useCallback(() => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  }, []);

  const shareOnWhatsApp = useCallback(() => {
    const text = encodeURIComponent(`${document.title} ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
  }, []);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="ca-article-page min-h-screen flex flex-col">
      <Navbar />

      {isLoading && (
        <div className="container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="ca-article-skeleton h-8 rounded" style={{ width: "60%" }} />
              <div className="ca-article-skeleton h-4 rounded" style={{ width: "40%" }} />
              <div className="ca-article-skeleton h-64 rounded-xl" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="ca-article-skeleton h-4 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="container py-20 text-center">
          <h1 className="ca-article-title text-2xl font-bold mb-4">Artículo no encontrado</h1>
          <p className="ca-article-muted mb-6">El artículo que buscas no existe o fue eliminado.</p>
          <Link href="/" className="ca-article-cta px-6 py-2 rounded-lg no-underline font-medium">
            Volver al inicio
          </Link>
        </div>
      )}

      {article && (
        <main className="flex-1">
          <ReadingProgress targetRef={articleRef} />

          {/* Hero Image */}
          {(article.ogImage || article.featuredImage) && (
            <div className="ca-article-hero relative w-full overflow-hidden">
              <img
                src={article.ogImage || article.featuredImage || ""}
                alt={article.title}
                width={1792}
                height={720}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          )}

          <div className="container py-6 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Article */}
              <article ref={articleRef} className="ca-article-body lg:col-span-3">
                {/* Breadcrumb */}
                <div className="ca-article-breadcrumb flex items-center gap-2 mb-6 text-sm">
                  <Link href="/" className="no-underline transition-colors">
                    Inicio
                  </Link>
                  <span>/</span>
                  {article.categoryName && (
                    <>
                      <Link
                        href={`/categoria/${article.categorySlug}`}
                        className="no-underline transition-colors capitalize"
                      >
                        {article.categoryName}
                      </Link>
                      <span>/</span>
                    </>
                  )}
                  <span className="ca-article-breadcrumb__current line-clamp-1">{article.title}</span>
                </div>

                {/* Category badge */}
                {article.categoryName && (
                  <Link href={`/categoria/${article.categorySlug}`} className="no-underline">
                    <span className="ca-badge mb-4">{article.categoryName}</span>
                  </Link>
                )}

                {/* Title */}
                <h1 className="ca-article-title font-bold text-2xl sm:text-3xl md:text-4xl leading-tight mt-3 mb-4">
                  {article.title}
                </h1>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="ca-article-excerpt text-lg mb-6">{article.excerpt}</p>
                )}

                {/* Meta */}
                <div className="ca-article-meta flex flex-wrap items-center gap-x-4 gap-y-3 pb-6 mb-6">
                  {article.publishedAt && (
                    <span className="ca-article-meta__date flex items-center gap-1.5 text-sm">
                      <Calendar className="w-4 h-4" />
                      {formatDate(article.publishedAt)}
                    </span>
                  )}
                  {minutes > 0 && (
                    <span className="ca-article-meta__date flex items-center gap-1.5 text-sm">
                      <Clock className="w-4 h-4" />
                      {minutes} min de lectura
                    </span>
                  )}
                  <div className="ca-share-row flex items-center gap-2 sm:ml-auto">
                    <button onClick={shareOnWhatsApp} className="ca-share-button ca-share-button--whatsapp" aria-label="Compartir por WhatsApp">
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button onClick={shareOnFacebook} className="ca-share-button" aria-label="Compartir en Facebook">
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </button>
                    <button onClick={copyLink} className="ca-share-button" aria-label="Copiar enlace">
                      {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                      <span>{copied ? "¡Copiado!" : "Copiar"}</span>
                    </button>
                  </div>
                </div>

                {/* Content — supports inline articles blocks */}
                <ArticleContent content={article.content ?? "{}"} currentSlug={slug || ""} />

                {/* Share footer */}
                <div className="ca-article-share mt-10 pt-6">
                  <span className="ca-article-share__label">¿Te gustó? Compártelo</span>
                  <div className="ca-share-row flex flex-wrap items-center gap-2 mt-3">
                    <button onClick={shareOnWhatsApp} className="ca-share-button ca-share-button--whatsapp">
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button onClick={shareOnFacebook} className="ca-share-button">
                      <Facebook className="w-4 h-4" />
                      <span>Facebook</span>
                    </button>
                    <button onClick={copyLink} className="ca-share-button">
                      {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                      <span>{copied ? "¡Copiado!" : "Copiar enlace"}</span>
                    </button>
                  </div>
                </div>

                {/* Next article — keep the reader moving instead of sending them away */}
                {nextArticle && (
                  <Link href={`/articulo/${nextArticle.slug}`} className="ca-next-article">
                    <span className="ca-next-article__media">
                      {(nextArticle.ogImage || nextArticle.featuredImage) ? (
                        <img
                          src={nextArticle.ogImage || nextArticle.featuredImage || ""}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="ca-next-article__image"
                        />
                      ) : (
                        <span className="ca-next-article__fallback">CA</span>
                      )}
                    </span>
                    <span className="ca-next-article__content">
                      <span className="ca-next-article__kicker">Sigue leyendo</span>
                      <span className="ca-next-article__title">{nextArticle.title}</span>
                      {nextArticle.excerpt && (
                        <span className="ca-next-article__excerpt">{nextArticle.excerpt}</span>
                      )}
                      <span className="ca-next-article__cta">
                        Leer ahora <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </span>
                  </Link>
                )}

                {/* Back */}
                <div className="mt-8">
                  <Link href="/" className="ca-article-back flex items-center gap-2 text-sm no-underline">
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                  </Link>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="lg:sticky lg:top-24 flex flex-col gap-6">
                  {/* Trivia del artículo */}
                  {triviaList && triviaList.length > 0 && (
                    <div>
                      <h3 className="ca-article-aside-title font-bold text-sm mb-3 uppercase tracking-wide">
                        ¿Cuánto sabes?
                      </h3>
                      <div className="flex flex-col gap-3">
                        {triviaList.map((t) => (
                          <CuriousCard
                            key={t.id}
                            id={t.id}
                            pregunta={t.pregunta}
                            respuesta={t.respuesta}
                            opcionCorrecta={t.opcionCorrecta}
                            opcionIncorrecta={t.opcionIncorrecta}
                            opciones={t.opciones}
                            opcionCorrectaIndex={t.opcionCorrectaIndex}
                            icono={t.icono}
                            color={t.color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </aside>
            </div>

            {/* Recomendados — sección de ancho completo debajo del artículo */}
            {sidebarData && sidebarData.recommendedArticles.length > 0 && (
              <section className="ca-article-section ca-article-section--accent mt-10 pt-8">
                <h2 className="ca-article-section__title ca-article-section__title--accent font-bold text-xl mb-6">
                  Recomendados
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {sidebarData.recommendedArticles.map((a) => (
                    <ArticleCard key={a.id} {...a} />
                  ))}
                </div>
              </section>
            )}

            {/* Related Articles */}
            {relatedArticles && relatedArticles.filter((a) => a.slug !== slug && a.slug !== nextArticle?.slug).length > 0 && (
              <section className="ca-article-section mt-12 pt-8">
                <h2 className="ca-article-section__title font-bold text-xl mb-6">
                  Artículos Relacionados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {relatedArticles
                    .filter((a) => a.slug !== slug && a.slug !== nextArticle?.slug)
                    .slice(0, 3)
                    .map((a) => (
                      <ArticleCard key={a.id} {...a} />
                    ))}
                </div>
              </section>
            )}
          </div>
        </main>
      )}

      <Footer />
    </div>
  );
}
