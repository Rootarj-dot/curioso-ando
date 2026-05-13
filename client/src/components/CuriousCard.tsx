import { useState } from "react";

interface CuriousCardProps {
  titulo: string;
  contenido: string;
  icono?: string | null;
  color?: string | null;
}

export function CuriousCard({ titulo, contenido, icono = "💡", color = "#7C3AED" }: CuriousCardProps) {
  const [open, setOpen] = useState(false);
  const accentColor = color || "#7C3AED";

  return (
    <>
      {/* Card */}
      <div
        className="curious-card-wrapper"
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        aria-label={`Dato curioso: ${titulo}`}
        style={{ "--accent": accentColor } as React.CSSProperties}
      >
        <div className="curious-card-inner">
          {/* FRONT */}
          <div className="curious-card-front">
            <div className="curious-card-grid" aria-hidden="true" />
            <div className="curious-card-front-content">
              <span className="curious-card-icon">{icono}</span>
              <p className="curious-card-front-title">{titulo}</p>
              <span className="curious-card-hint">Toca para saber más →</span>
            </div>
          </div>

          {/* BACK */}
          <div className="curious-card-back">
            <div className="curious-card-back-grid" aria-hidden="true" />
            <div className="curious-card-back-content">
              <span className="curious-card-back-icon">{icono}</span>
              <p className="curious-card-back-title">{titulo}</p>
              <p className="curious-card-back-text">{contenido.length > 120 ? contenido.slice(0, 120) + "…" : contenido}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="curious-modal-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
        >
          <div
            className="curious-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ "--accent": accentColor } as React.CSSProperties}
          >
            {/* Glow orb */}
            <div className="curious-modal-orb" aria-hidden="true" />
            {/* Grid */}
            <div className="curious-modal-grid" aria-hidden="true" />

            <div className="curious-modal-content">
              <span className="curious-modal-icon">{icono}</span>
              <h3 className="curious-modal-title">{titulo}</h3>
              <p className="curious-modal-text">{contenido}</p>
              <button
                className="curious-modal-close"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
              >
                Cerrar ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Card Wrapper ── */
        .curious-card-wrapper {
          position: relative;
          width: 100%;
          height: 150px;
          perspective: 900px;
          cursor: pointer;
          outline: none;
        }
        .curious-card-wrapper:focus-visible .curious-card-inner {
          box-shadow: 0 0 0 3px var(--accent);
        }

        /* ── Inner (flip container) ── */
        .curious-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
          border-radius: 14px;
        }
        .curious-card-wrapper:hover .curious-card-inner,
        .curious-card-wrapper:focus-visible .curious-card-inner {
          transform: rotateY(180deg);
        }

        /* ── Shared face styles ── */
        .curious-card-front,
        .curious-card-back {
          position: absolute;
          inset: 0;
          border-radius: 14px;
          overflow: hidden;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── FRONT ── */
        .curious-card-front {
          background: linear-gradient(135deg, #0A0018 0%, #1A0050 55%, #2B037D 100%);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(43,3,125,0.4);
        }
        .curious-card-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.1) 1px, transparent 1px);
          background-size: 22px 22px;
          animation: gridMove 8s linear infinite;
        }
        @keyframes gridMove {
          0%   { background-position: 0 0; }
          100% { background-position: 22px 22px; }
        }
        .curious-card-front-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px;
          text-align: center;
        }
        .curious-card-icon {
          font-size: 2rem;
          filter: drop-shadow(0 0 8px var(--accent));
        }
        .curious-card-front-title {
          font-size: 0.72rem;
          font-weight: 700;
          line-height: 1.3;
          color: #F5F0FF;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 12px rgba(167,139,250,0.5);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0;
        }
        .curious-card-hint {
          font-size: 0.58rem;
          color: rgba(167,139,250,0.55);
          letter-spacing: 0.04em;
        }

        /* ── BACK ── */
        .curious-card-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, #0A0018 0%, #1A0050 50%, #2B037D 100%);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.5), 0 0 24px rgba(139,92,246,0.2);
        }
        .curious-card-back-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.15) 1px, transparent 1px);
          background-size: 22px 22px;
          animation: gridMove 4s linear infinite reverse;
        }
        .curious-card-back-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 14px;
          width: 100%;
        }
        .curious-card-back-icon {
          font-size: 1.2rem;
        }
        .curious-card-back-title {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--accent);
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 10px var(--accent);
          margin: 0;
        }
        .curious-card-back-text {
          font-size: 0.65rem;
          color: rgba(245,240,255,0.75);
          line-height: 1.45;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* ── Modal overlay ── */
        .curious-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Modal box ── */
        .curious-modal {
          position: relative;
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(160deg, #111111 0%, #1C1C1C 40%, #2A2A2A 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 0 0 1px var(--accent), 0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(43,3,125,0.3);
          animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalIn {
          from { transform: scale(0.85) rotateY(15deg); opacity: 0; }
          to   { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        .curious-modal-orb {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
          opacity: 0.15;
          pointer-events: none;
        }
        .curious-modal-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .curious-modal-content {
          position: relative;
          z-index: 1;
          padding: 28px 24px 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .curious-modal-icon {
          font-size: 2.8rem;
          filter: drop-shadow(0 0 12px var(--accent));
          align-self: flex-start;
        }
        .curious-modal-title {
          font-size: 1.1rem;
          font-weight: 800;
          line-height: 1.3;
          color: #FFFFFF;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 20px var(--accent);
          margin: 0;
        }
        .curious-modal-text {
          font-size: 0.9rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.78);
          margin: 0;
        }
        .curious-modal-close {
          align-self: flex-end;
          margin-top: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 5px 16px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .curious-modal-close:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }
      `}</style>
    </>
  );
}
