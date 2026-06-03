import { Link } from "wouter";
import { Calendar } from "lucide-react";

interface ArticleCardProps {
  id: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  ogImage?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  publishedAt?: Date | null;
  featured?: boolean;
  size?: "normal" | "large";
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  featuredImage,
  ogImage,
  categoryName,
  categorySlug,
  publishedAt,
  size = "normal",
}: ArticleCardProps) {
  const image = ogImage || featuredImage;

  if (size === "large") {
    return (
      <Link href={`/articulo/${slug}`} className="no-underline group block">
        <article className="relative rounded-xl overflow-hidden" style={{ minHeight: 420 }}>
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 ca-gradient-hero" />
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,28,29,0.97) 0%, rgba(28,28,29,0.5) 50%, transparent 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {categoryName && (
              <span className="ca-badge mb-3">{categoryName}</span>
            )}
            <h2 className="font-bold text-2xl md:text-3xl leading-tight mb-2 group-hover:text-purple-300 transition-colors" style={{ color: "#FFFFFF" }}>
              {title}
            </h2>
            {excerpt && (
              <p className="text-sm mb-3 line-clamp-2" style={{ color: "#E0D8FF" }}>{excerpt}</p>
            )}
            <div className="flex items-center gap-4 text-xs" style={{ color: "#C0B8E8" }}>
              {publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(publishedAt)}
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/articulo/${slug}`} className="no-underline group block">
      <article className="ca-card overflow-hidden transition-transform duration-200 group-hover:-translate-y-1 h-full flex flex-col">
        <div className="relative overflow-hidden bg-white" style={{ aspectRatio: "1792 / 1024" }}>
          {image ? (
            <img
              src={image}
              alt={title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 ca-gradient-hero flex items-center justify-center">
              <span className="text-white/30 text-4xl font-bold">CA</span>
            </div>
          )}
          {categoryName && (
            <div className="absolute top-3 left-3">
              <span className="ca-badge">{categoryName}</span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-base leading-snug mb-2 group-hover:text-purple-600 transition-colors line-clamp-2" style={{ color: "#1A1A1A" }}>
            {title}
          </h3>
          {excerpt && (
            <p className="text-sm mb-3 line-clamp-2 flex-1" style={{ color: "#6B6B6B" }}>{excerpt}</p>
          )}
          <div className="flex items-center gap-3 text-xs mt-auto" style={{ color: "#9B9890" }}>
            {publishedAt && (
              <span className="flex items-center gap-1 ml-auto">
                <Calendar className="w-3 h-3" />
                {formatDate(publishedAt)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
