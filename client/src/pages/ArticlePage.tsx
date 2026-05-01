import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { AdSlot } from "@/components/AdSense";
import { Calendar, User, ArrowLeft, Share2, Facebook } from "lucide-react";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function setMetaTags(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
}) {
  // Title
  document.title = `${opts.title} | Curioso Ando`;

  const setMeta = (attr: string, value: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, value);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  // Standard
  setMeta("name", "description", opts.description);

  // Open Graph
  setMeta("property", "og:title", opts.title);
  setMeta("property", "og:description", opts.description);
  setMeta("property", "og:image", opts.image);
  setMeta("property", "og:image:width", "1200");
  setMeta("property", "og:image:height", "630");
  setMeta("property", "og:url", opts.url);
  setMeta("property", "og:type", opts.type || "article");
  setMeta("property", "og:site_name", "Curioso Ando");

  // Twitter Card
  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", opts.title);
  setMeta("name", "twitter:description", opts.description);
  setMeta("name", "twitter:image", opts.image);
}

function renderContent(content: string): string {
  try {
    const parsed = JSON.parse(content);
    // If it's a Lexical JSON, render it as HTML
    if (parsed.root && parsed.root.children) {
      return renderLexicalNodes(parsed.root.children);
    }
    // Fallback: treat as plain text
    return `<p>${content}</p>`;
  } catch {
    // Plain HTML or text
    return content || "<p>Sin contenido</p>";
  }
}

function renderLexicalNodes(nodes: any[]): string {
  if (!nodes) return "";
  return nodes
    .map((node) => {
      if (node.type === "paragraph") {
        const text = renderLexicalNodes(node.children || []);
        return `<p>${text}</p>`;
      }
      if (node.type === "heading") {
        const tag = node.tag || "h2";
        const text = renderLexicalNodes(node.children || []);
        return `<${tag}>${text}</${tag}>`;
      }
      if (node.type === "list") {
        const tag = node.listType === "number" ? "ol" : "ul";
        const items = renderLexicalNodes(node.children || []);
        return `<${tag}>${items}</${tag}>`;
      }
      if (node.type === "listitem") {
        const text = renderLexicalNodes(node.children || []);
        return `<li>${text}</li>`;
      }
      if (node.type === "quote") {
        const text = renderLexicalNodes(node.children || []);
        return `<blockquote>${text}</blockquote>`;
      }
      if (node.type === "image") {
        return `<img src="${node.src}" alt="${node.altText || ""}" />`;
      }
      if (node.type === "text") {
        let text = node.text || "";
        if (node.format & 1) text = `<strong>${text}</strong>`;
        if (node.format & 2) text = `<em>${text}</em>`;
        if (node.format & 8) text = `<u>${text}</u>`;
        return text;
      }
      if (node.type === "linebreak") return "<br/>";
      if (node.children) return renderLexicalNodes(node.children);
      return "";
    })
    .join("");
}

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: article, isLoading, error } = trpc.articles.bySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );
  const { data: relatedArticles } = trpc.articles.list.useQuery(
    { categorySlug: article?.categorySlug || undefined, limit: 3 },
    { enabled: !!article?.categorySlug }
  );

  useEffect(() => {
    if (article) {
      const ogImage = article.ogImage || article.featuredImage || "";
      const ogTitle = article.ogTitle || article.title;
      const ogDesc = article.ogDescription || article.excerpt || "";
      const ogUrl = `${window.location.origin}/articulo/${article.slug}`;
      setMetaTags({
        title: ogTitle,
        description: ogDesc,
        image: ogImage,
        url: ogUrl,
        type: "article",
      });
    }
    return () => {
      document.title = "Curioso Ando - Blog de Noticias";
    };
  }, [article]);

  const shareOnFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#252728" }}>
      <Navbar />

      {isLoading && (
        <div className="container py-12">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 rounded" style={{ backgroundColor: "#2E3032", width: "60%" }} />
              <div className="h-4 rounded" style={{ backgroundColor: "#2E3032", width: "40%" }} />
              <div className="h-64 rounded-xl" style={{ backgroundColor: "#2E3032" }} />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-4 rounded" style={{ backgroundColor: "#2E3032" }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="container py-20 text-center">
          <h1 className="text-white text-2xl font-bold mb-4">Artículo no encontrado</h1>
          <p style={{ color: "#A0A0A0" }} className="mb-6">El artículo que buscas no existe o fue eliminado.</p>
          <Link href="/" className="px-6 py-2 rounded-lg no-underline font-medium" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}>
            Volver al inicio
          </Link>
        </div>
      )}

      {article && (
        <main className="flex-1">
          {/* Hero Image */}
          {(article.ogImage || article.featuredImage) && (
            <div className="w-full" style={{ maxHeight: 480, overflow: "hidden" }}>
              <img
                src={article.ogImage || article.featuredImage || ""}
                alt={article.title}
                className="w-full object-cover"
                style={{ maxHeight: 480 }}
              />
            </div>
          )}

          <div className="container py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Article */}
              <article className="lg:col-span-3">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-6 text-sm" style={{ color: "#A0A0A0" }}>
                  <Link href="/" className="no-underline hover:text-white transition-colors" style={{ color: "#A0A0A0" }}>
                    Inicio
                  </Link>
                  <span>/</span>
                  {article.categoryName && (
                    <>
                      <Link
                        href={`/categoria/${article.categorySlug}`}
                        className="no-underline hover:text-white transition-colors capitalize"
                        style={{ color: "#A0A0A0" }}
                      >
                        {article.categoryName}
                      </Link>
                      <span>/</span>
                    </>
                  )}
                  <span className="text-white line-clamp-1">{article.title}</span>
                </div>

                {/* Category badge */}
                {article.categoryName && (
                  <Link href={`/categoria/${article.categorySlug}`} className="no-underline">
                    <span className="ca-badge mb-4">{article.categoryName}</span>
                  </Link>
                )}

                {/* Title */}
                <h1 className="text-white font-bold text-3xl md:text-4xl leading-tight mt-3 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {article.title}
                </h1>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-lg mb-6" style={{ color: "#C0C0C0" }}>{article.excerpt}</p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-4 pb-6 mb-6" style={{ borderBottom: "1px solid #3B3D3E" }}>
                  {article.authorName && (
                    <span className="flex items-center gap-2 text-sm" style={{ color: "#A0A0A0" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      {article.authorName}
                    </span>
                  )}
                  {article.publishedAt && (
                    <span className="flex items-center gap-1.5 text-sm" style={{ color: "#A0A0A0" }}>
                      <Calendar className="w-4 h-4" />
                      {formatDate(article.publishedAt)}
                    </span>
                  )}
                  <button
                    onClick={shareOnFacebook}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ml-auto transition-opacity hover:opacity-80"
                    style={{ background: "#1877F2", color: "#FFFFFF" }}
                  >
                    <Facebook className="w-4 h-4" />
                    Compartir
                  </button>
                </div>

                {/* Content */}
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: renderContent(article.content ?? "{}") }}
                />

                {/* Mid-content AdSense */}
                <div className="my-8">
                  <AdSlot slot="mid-content" />
                </div>

                {/* Share footer */}
                <div className="mt-8 pt-6 flex items-center gap-4" style={{ borderTop: "1px solid #3B3D3E" }}>
                  <span className="text-sm font-medium text-white">Compartir:</span>
                  <button
                    onClick={shareOnFacebook}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                    style={{ background: "#1877F2", color: "#FFFFFF" }}
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
                <div className="sticky top-24 flex flex-col gap-6">
                  <AdSlot slot="sidebar" />
                </div>
              </aside>
            </div>

            {/* Related Articles */}
            {relatedArticles && relatedArticles.filter(a => a.slug !== slug).length > 0 && (
              <section className="mt-12 pt-8" style={{ borderTop: "1px solid #3B3D3E" }}>
                <h2 className="text-white font-bold text-xl mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
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
