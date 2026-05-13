import { Link } from "wouter";

interface FlipCardProps {
  id: number;
  slug: string;
  title: string;
  categoryName?: string | null;
  featuredImage?: string | null;
  ogImage?: string | null;
  publishedAt?: Date | number | string | null;
  authorName?: string | null;
}

function formatDate(ts: Date | number | string | null | undefined) {
  if (!ts) return "";
  return new Date(ts as number).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FlipCard({ slug, title, categoryName, featuredImage, ogImage, publishedAt, authorName }: FlipCardProps) {
  const image = featuredImage || ogImage || "";

  return (
    <div className="flip-card-wrapper" style={{ perspective: "900px", height: 160 }}>
      <div className="flip-card-inner">
        {/* ── FRONT ── */}
        <div className="flip-card-front">
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0D0020 0%, #2B037D 60%, #5B2C8F 100%)" }}>
              <span style={{ fontFamily: "Poppins, sans-serif", color: "rgba(255,255,255,0.18)", fontSize: "2.5rem", fontWeight: 900, letterSpacing: "0.12em" }}>CA</span>
            </div>
          )}
          {/* Overlay inferior para legibilidad del texto */}
          <div className="flip-card-front-overlay" />
          {/* Texto sobre la imagen */}
          <div className="flip-card-front-text">
            {categoryName && (
              <span className="flip-card-category">{categoryName}</span>
            )}
            <p className="flip-card-front-title">{title}</p>
          </div>
        </div>

        {/* ── BACK ── */}
        <div className="flip-card-back">
          {/* Animated grid lines */}
          <div className="flip-card-grid" aria-hidden="true" />

          <div className="flip-card-back-content">
            {categoryName && (
              <span className="flip-card-back-cat">{categoryName}</span>
            )}
            <p className="flip-card-back-title">{title}</p>
            <div className="flip-card-back-meta">
              {authorName && <span>{authorName}</span>}
              {publishedAt && <span>{formatDate(publishedAt)}</span>}
            </div>
            <Link href={`/articulo/${slug}`} className="flip-card-cta no-underline">
              Leer nota →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .flip-card-wrapper {
          position: relative;
          width: 100%;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(0.4, 0.2, 0.2, 1);
          border-radius: 14px;
        }
        .flip-card-wrapper:hover .flip-card-inner {
          transform: rotateY(180deg);
        }

        /* FRONT */
        .flip-card-front,
        .flip-card-back {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-card-front {
          background: #0D0020;
          box-shadow: 0 0 0 1px rgba(139,92,246,0.25), 0 4px 20px rgba(43,3,125,0.35);
        }
        .flip-card-front-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(10,0,30,0.75) 0%, transparent 55%);
        }
        .flip-card-front-text {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 8px 10px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .flip-card-category {
          display: inline-block;
          align-self: flex-start;
          font-size: 0.58rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(139,92,246,0.85);
          color: #fff;
          backdrop-filter: blur(4px);
        }
        .flip-card-front-title {
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1.3;
          color: #fff;
          font-family: Poppins, sans-serif;
          text-shadow: 0 1px 6px rgba(0,0,0,0.8);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0;
        }

        /* BACK */
        .flip-card-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, #0A0018 0%, #1A0050 50%, #2B037D 100%);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.5), 0 0 24px rgba(139,92,246,0.2), inset 0 0 40px rgba(43,3,125,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Animated grid lines on back */
        .flip-card-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px);
          background-size: 24px 24px;
          border-radius: 14px;
          animation: gridMove 6s linear infinite;
        }
        @keyframes gridMove {
          0%   { background-position: 0 0; }
          100% { background-position: 24px 24px; }
        }

        .flip-card-back-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px;
          width: 100%;
        }
        .flip-card-back-cat {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #A78BFA;
        }
        .flip-card-back-title {
          font-size: 0.78rem;
          font-weight: 700;
          line-height: 1.35;
          color: #F5F0FF;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 12px rgba(167,139,250,0.4);
        }
        .flip-card-back-meta {
          display: flex;
          flex-direction: column;
          gap: 1px;
          font-size: 0.6rem;
          color: rgba(167,139,250,0.65);
        }
        .flip-card-cta {
          margin-top: 4px;
          display: inline-block;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #C4B5FD;
          border: 1px solid rgba(167,139,250,0.45);
          border-radius: 999px;
          padding: 3px 12px;
          width: fit-content;
          transition: background 0.2s, color 0.2s;
          text-shadow: 0 0 8px rgba(167,139,250,0.6);
          box-shadow: 0 0 8px rgba(139,92,246,0.2);
        }
        .flip-card-cta:hover {
          background: rgba(139,92,246,0.35);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
