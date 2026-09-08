import { Link } from "wouter";
import { ArrowUpRight, CalendarDays } from "lucide-react";

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
  size?: "normal" | "large" | "compact" | "legacyMobile";
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export function ArticleCard({
  title,
  slug,
  excerpt,
  featuredImage,
  ogImage,
  categoryName,
  publishedAt,
  size = "normal",
}: ArticleCardProps) {
  const image = ogImage || featuredImage;
  const label = categoryName || "Curioseando";

  if (size === "legacyMobile") {
    return (
      <Link href={`/articulo/${slug}`} className="no-underline group block h-full">
        <article className="ca-legacy-mobile-card overflow-hidden transition-transform duration-200 group-hover:-translate-y-1 h-full flex flex-col">
          <div className="relative aspect-[1792/1024] overflow-hidden bg-white">
            {image ? (
              <img src={image} alt={title} width={1792} height={1024} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            ) : (
              <div className="ca-gradient-hero flex h-full w-full items-center justify-center"><span className="text-white/30 text-4xl font-bold">CA</span></div>
            )}
            <div className="absolute top-3 left-3"><span className="ca-legacy-mobile-card__cta">Clic aquí para leer</span></div>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <h3>{title}</h3>
            {excerpt && <p>{excerpt}</p>}
            {publishedAt && <span className="ca-legacy-mobile-card__date"><CalendarDays className="w-3 h-3" aria-hidden="true" /> {formatDate(publishedAt)}</span>}
          </div>
        </article>
      </Link>
    );
  }

  if (size === "compact") {
    return (
      <Link href={`/articulo/${slug}`} className="no-underline group block h-full">
        <article className="ca-rail-card h-full">
          {image ? (
            <img src={image} alt={title} width={480} height={360} loading="lazy" decoding="async" className="ca-rail-card__image" />
          ) : (
            <div className="ca-rail-card__fallback">CA</div>
          )}
          <div className="ca-rail-card__shade" />
          <div className="ca-rail-card__content">
            <span className="ca-rail-card__category">{label}</span>
            <h2>{title}</h2>
            {publishedAt && <span className="ca-rail-card__date"><CalendarDays className="w-3 h-3" aria-hidden="true" /> {formatDate(publishedAt)}</span>}
          </div>
          <span className="ca-rail-card__open" aria-hidden="true"><ArrowUpRight className="w-3.5 h-3.5" /></span>
        </article>
      </Link>
    );
  }

  if (size === "large") {
    return (
      <Link href={`/articulo/${slug}`} className="no-underline group block">
        <article className="ca-story-card ca-story-card--large">
          {image ? (
            <img src={image} alt={title} width={1792} height={1024} loading="lazy" decoding="async" className="ca-story-card__image" />
          ) : (
            <div className="ca-story-card__fallback">CA</div>
          )}
          <div className="ca-story-card__shade" />
          <div className="ca-story-card__content">
            <span className="ca-story-card__category">{label}</span>
            <h2>{title}</h2>
            {excerpt && <p>{excerpt}</p>}
            <span className="ca-story-card__read-link">Leer historia <ArrowUpRight className="w-4 h-4" aria-hidden="true" /></span>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/articulo/${slug}`} className="no-underline group block h-full">
      <article className="ca-story-card h-full">
        <div className="ca-story-card__media">
          {image ? (
            <img src={image} alt={title} width={720} height={480} loading="lazy" decoding="async" className="ca-story-card__image" />
          ) : (
            <div className="ca-story-card__fallback">CA</div>
          )}
          <div className="ca-story-card__shade" />
          <span className="ca-story-card__category">{label}</span>
          <span className="ca-story-card__open" aria-hidden="true"><ArrowUpRight className="w-4 h-4" /></span>
        </div>
        <div className="ca-story-card__body">
          <h3>{title}</h3>
          {excerpt && <p>{excerpt}</p>}
          {publishedAt && (
            <span className="ca-story-card__date"><CalendarDays className="w-3.5 h-3.5" aria-hidden="true" /> {formatDate(publishedAt)}</span>
          )}
        </div>
      </article>
    </Link>
  );
}
