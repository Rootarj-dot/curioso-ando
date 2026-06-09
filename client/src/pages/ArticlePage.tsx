import { useEffect, useCallback } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { Calendar, ArrowLeft, Facebook } from "lucide-react";
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
    <div className="my-8 py-6" style={{ borderTop: "2px solid #E5E3DE", borderBottom: "2px solid #E5E3DE" }}>
      <h3
        className="font-bold text-lg mb-4"
        style={{ fontFamily: "Poppins, sans-serif", color: "#2B037D" }}
      >
        {label}
      </h3>
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
        "url": "https://curiosoando.manus.space"
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": ogUrl },
    } : undefined,
  });

  const shareOnFacebook = useCallback(() => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F8F7F4" }}>
      <Navbar />

      {isLoading && (
        <div className="container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 rounded" style={{ backgroundColor: "#FFFFFF", width: "60%" }} />
              <div className="h-4 rounded" style={{ backgroundColor: "#FFFFFF", width: "40%" }} />
              <div className="h-64 rounded-xl" style={{ backgroundColor: "#FFFFFF" }} />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 rounded" style={{ backgroundColor: "#FFFFFF" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Artículo no encontrado</h1>
          <p style={{ color: "#6B6B6B" }} className="mb-6">El artículo que buscas no existe o fue eliminado.</p>
          <Link href="/" className="px-6 py-2 rounded-lg no-underline font-medium" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}>
            Volver al inicio
          </Link>
        </div>
      )}

      {article && (
        <main className="flex-1">
          {/* Hero Image */}
          {(article.ogImage || article.featuredImage) && (
            <div className="relative w-full overflow-hidden" style={{ maxHeight: 480, aspectRatio: "1792 / 720" }}>
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
              <article className="lg:col-span-3">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: "#6B6B6B" }}>
                  <Link href="/" className="no-underline hover:text-purple-700 transition-colors" style={{ color: "#6B6B6B" }}>
                    Inicio
                  </Link>
                  <span>/</span>
                  {article.categoryName && (
                    <>
                      <Link
                        href={`/categoria/${article.categorySlug}`}
                        className="no-underline hover:text-purple-700 transition-colors capitalize"
                        style={{ color: "#6B6B6B" }}
                      >
                        {article.categoryName}
                      </Link>
                      <span>/</span>
                    </>
                  )}
                  <span className="line-clamp-1" style={{ color: "#1A1A1A" }}>{article.title}</span>
                </div>

                {/* Category badge */}
                {article.categoryName && (
                  <Link href={`/categoria/${article.categorySlug}`} className="no-underline">
                    <span className="ca-badge mb-4">{article.categoryName}</span>
                  </Link>
                )}

                {/* Title */}
                <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl leading-tight mt-3 mb-4" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                  {article.title}
                </h1>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-lg mb-6" style={{ color: "#6B6B6B" }}>{article.excerpt}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 pb-6 mb-6" style={{ borderBottom: "1px solid #E5E3DE" }}>
                  {article.publishedAt && (
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: "#6B6B6B" }}>
                      <Calendar className="w-4 h-4" />
                      {formatDate(article.publishedAt)}
                    </span>
                  )}
                  <button
                    onClick={shareOnFacebook}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ml-auto transition-opacity hover:opacity-80"
                    style={{ background: "#1877F2", color: "#fff" }}
                  >
                    <Facebook className="w-4 h-4" />
                    Compartir
                  </button>
                </div>

                {/* Content — supports inline articles blocks */}
                <ArticleContent content={article.content ?? "{}"} currentSlug={slug || ""} />

                {/* Share footer */}
                <div className="mt-8 pt-6 flex items-center gap-4" style={{ borderTop: "1px solid #E5E3DE" }}>
                  <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>Compartir:</span>
                  <button
                    onClick={shareOnFacebook}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ background: "#1877F2", color: "#fff" }}
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                </div>

                {/* Back */}
                <div className="mt-8">
                  <Link href="/" className="flex items-center gap-2 text-sm no-underline" style={{ color: "#7B4FB8" }}>
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
                      <h3 className="font-bold text-sm mb-3 uppercase tracking-wide" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
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
              <section className="mt-10 pt-8" style={{ borderTop: "2px solid #E5E3DE" }}>
                <h2 className="font-bold text-xl mb-6" style={{ fontFamily: "Poppins, sans-serif", color: "#2B037D" }}>
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
            {relatedArticles && relatedArticles.filter((a) => a.slug !== slug).length > 0 && (
              <section className="mt-12 pt-8" style={{ borderTop: "1px solid #E5E3DE" }}>
                <h2 className="font-bold text-xl mb-6" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                  Artículos Relacionados
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {relatedArticles
                    .filter((a) => a.slug !== slug)
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
