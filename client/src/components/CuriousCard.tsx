import { useState } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HelpCircle, CheckCircle2, XCircle } from "lucide-react";

function RenderIcon({ name, size = 28, color }: { name: string; size?: number; color?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name] || HelpCircle;
  return <Icon width={size} height={size} color={color || "currentColor"} />;
}

interface CuriousCardProps {
  id?: number;
  pregunta: string;
  respuesta: string;
  opcionCorrecta: string;
  opcionIncorrecta: string;
  icono?: string | null;
  color?: string | null;
  // Legacy props (ignored)
  titulo?: string;
  contenido?: string;
}

type AnswerResult = "correct" | "incorrect" | null;

export function CuriousCard({
  pregunta,
  respuesta,
  opcionCorrecta,
  opcionIncorrecta,
  icono,
  color,
}: CuriousCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [showModal, setShowModal] = useState(false);

  const accentColor = color || "#7C3AED";
  const iconName = icono || "HelpCircle";

  // Shuffle options once (stable per component instance)
  const [options] = useState(() => {
    const opts = [
      { label: opcionCorrecta, isCorrect: true },
      { label: opcionIncorrecta, isCorrect: false },
    ];
    return Math.random() > 0.5 ? opts : [opts[1], opts[0]];
  });

  const handleFlip = () => {
    if (!isFlipped) {
      setIsFlipped(true);
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    setAnswerResult(isCorrect ? "correct" : "incorrect");
    setAnswered(true);
    setShowModal(true);
  };

  const handleReset = () => {
    setIsFlipped(false);
    setAnswered(false);
    setAnswerResult(null);
    setShowModal(false);
  };

  return (
    <>
      {/* ── Card ── */}
      <div
        className="curious-card-wrapper"
        style={{ "--accent": accentColor } as React.CSSProperties}
      >
        <div
          className="curious-card-inner"
          style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* FRONT — Pregunta */}
          <div
            className="curious-card-front"
            onClick={handleFlip}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleFlip()}
            aria-label={`Pregunta trivia: ${pregunta}`}
          >
            <div className="curious-card-grid" aria-hidden="true" />
            <div className="curious-card-front-content">
              <span className="curious-card-icon">
                <RenderIcon name={iconName} size={32} color={accentColor} />
              </span>
              <p className="curious-card-front-title">{pregunta}</p>
              <span className="curious-card-hint">Toca para responder →</span>
            </div>
          </div>

          {/* BACK — Opciones de respuesta */}
          <div className="curious-card-back">
            <div className="curious-card-back-grid" aria-hidden="true" />
            <div className="curious-card-back-content">
              <span className="curious-card-back-icon">
                <RenderIcon name={iconName} size={18} color={accentColor} />
              </span>
              <p className="curious-card-back-question">{pregunta}</p>
              <p className="curious-card-back-label">¿Cuál es la respuesta correcta?</p>
              <div className="curious-card-options">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    className="curious-card-option-btn"
                    onClick={() => handleAnswer(opt.isCorrect)}
                    disabled={answered}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal de resultado (igual estilo que datos curiosos) ── */}
      {showModal && (
        <div
          className="curious-modal-overlay"
          onClick={() => setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Resultado"
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
              {/* Resultado */}
              <div className="curious-modal-result">
                {answerResult === "correct" ? (
                  <CheckCircle2 width={40} height={40} color="#4ade80" />
                ) : (
                  <XCircle width={40} height={40} color="#f87171" />
                )}
                <h3
                  className="curious-modal-result-title"
                  style={{ color: answerResult === "correct" ? "#4ade80" : "#f87171" }}
                >
                  {answerResult === "correct" ? "¡Acertaste!" : "¡Incorrecto!"}
                </h3>
                {answerResult === "incorrect" && (
                  <p className="curious-modal-correct-hint">
                    La respuesta correcta era: <strong style={{ color: "#4ade80" }}>{opcionCorrecta}</strong>
                  </p>
                )}
              </div>

              {/* Separador */}
              <div className="curious-modal-divider" />

              {/* Ícono + título */}
              <span className="curious-modal-icon">
                <RenderIcon name={iconName} size={44} color={accentColor} />
              </span>
              <h3 className="curious-modal-title">{pregunta}</h3>
              <p className="curious-modal-text">{respuesta}</p>

              <div className="curious-modal-actions">
                <button
                  className="curious-modal-retry"
                  onClick={handleReset}
                >
                  Intentar de nuevo
                </button>
                <button
                  className="curious-modal-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Cerrar"
                >
                  Cerrar ✕
                </button>
              </div>
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
          cursor: pointer;
          outline: none;
        }
        .curious-card-front:focus-visible {
          box-shadow: 0 0 0 3px var(--accent);
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
          width: 100%;
        }
        .curious-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
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
          align-items: flex-start;
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
          gap: 4px;
          padding: 12px;
          width: 100%;
        }
        .curious-card-back-icon {
          display: flex;
          align-items: center;
        }
        .curious-card-back-question {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--accent);
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 10px var(--accent);
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .curious-card-back-label {
          font-size: 0.6rem;
          color: rgba(245,240,255,0.5);
          margin: 0 0 4px;
        }
        .curious-card-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
        }
        .curious-card-option-btn {
          font-size: 0.62rem;
          font-weight: 600;
          padding: 7px 5px;
          border-radius: 8px;
          color: #fff;
          background: rgba(139,92,246,0.25);
          border: 1px solid rgba(139,92,246,0.5);
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
          line-height: 1.3;
          text-align: center;
        }
        .curious-card-option-btn:hover:not(:disabled) {
          background: rgba(139,92,246,0.45);
          transform: scale(1.04);
        }
        .curious-card-option-btn:active:not(:disabled) { transform: scale(0.97); }
        .curious-card-option-btn:disabled { opacity: 0.5; cursor: default; }

        /* ── Modal overlay ── */
        .curious-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.78);
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
          padding: 24px 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .curious-modal-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
        }
        .curious-modal-result-title {
          font-size: 1.3rem;
          font-weight: 800;
          font-family: Poppins, sans-serif;
          margin: 0;
        }
        .curious-modal-correct-hint {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.65);
          margin: 0;
        }
        .curious-modal-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 2px 0;
        }
        .curious-modal-icon {
          display: flex;
          align-items: center;
          filter: drop-shadow(0 0 12px var(--accent));
          align-self: flex-start;
        }
        .curious-modal-title {
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.3;
          color: #FFFFFF;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 20px var(--accent);
          margin: 0;
        }
        .curious-modal-text {
          font-size: 0.88rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.78);
          margin: 0;
        }
        .curious-modal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          gap: 8px;
        }
        .curious-modal-retry {
          font-size: 0.7rem;
          font-weight: 600;
          color: rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 5px 14px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .curious-modal-retry:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.75);
        }
        .curious-modal-close {
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
