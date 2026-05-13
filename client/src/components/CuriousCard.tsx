import { useState } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HelpCircle, CheckCircle2, XCircle } from "lucide-react";

function RenderIcon({ name, size = 28, color }: { name: string; size?: number; color?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name] || HelpCircle;
  return <Icon width={size} height={size} color={color || "currentColor"} />;
}

export interface CuriousCardProps {
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

  const handleAnswer = (isCorrect: boolean) => {
    if (answered) return;
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
      {/* ── Card container — altura dinámica con min-height ── */}
      <div
        className="tcard-root"
        style={{ "--tc-accent": accentColor } as React.CSSProperties}
      >
        {/* FRONT */}
        {!isFlipped && (
          <div
            className="tcard-face tcard-front"
            onClick={() => setIsFlipped(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setIsFlipped(true)}
          >
            <div className="tcard-grid" />
            <div className="tcard-front-body">
              <span className="tcard-icon">
                <RenderIcon name={iconName} size={30} color={accentColor} />
              </span>
              <p className="tcard-question">{pregunta}</p>
              <span className="tcard-hint">Toca para responder →</span>
            </div>
          </div>
        )}

        {/* BACK */}
        {isFlipped && (
          <div className="tcard-face tcard-back">
            <div className="tcard-grid" />
            <div className="tcard-back-body">
              <div className="tcard-back-header">
                <RenderIcon name={iconName} size={16} color={accentColor} />
                <p className="tcard-back-question">{pregunta}</p>
              </div>
              <p className="tcard-back-label">¿Cuál es la respuesta correcta?</p>
              <div className="tcard-options">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    className="tcard-opt-btn"
                    onClick={() => handleAnswer(opt.isCorrect)}
                    disabled={answered}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal de resultado ── */}
      {showModal && (
        <div
          className="tcard-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="tcard-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ "--tc-accent": accentColor } as React.CSSProperties}
          >
            <div className="tcard-modal-orb" />
            <div className="tcard-modal-grid" />
            <div className="tcard-modal-body">
              {/* Resultado */}
              <div className="tcard-modal-result">
                {answerResult === "correct"
                  ? <CheckCircle2 width={44} height={44} color="#4ade80" />
                  : <XCircle width={44} height={44} color="#f87171" />
                }
                <h3
                  className="tcard-modal-result-title"
                  style={{ color: answerResult === "correct" ? "#4ade80" : "#f87171" }}
                >
                  {answerResult === "correct" ? "¡Acertaste!" : "¡Incorrecto!"}
                </h3>
                {answerResult === "incorrect" && (
                  <p className="tcard-modal-correct-hint">
                    La respuesta correcta era:{" "}
                    <strong style={{ color: "#4ade80" }}>{opcionCorrecta}</strong>
                  </p>
                )}
              </div>

              <div className="tcard-modal-divider" />

              {/* Respuesta completa */}
              <span className="tcard-modal-icon">
                <RenderIcon name={iconName} size={40} color={accentColor} />
              </span>
              <h3 className="tcard-modal-title">{pregunta}</h3>
              <p className="tcard-modal-text">{respuesta}</p>

              <div className="tcard-modal-actions">
                <button className="tcard-modal-retry" onClick={handleReset}>
                  Intentar de nuevo
                </button>
                <button className="tcard-modal-close" onClick={() => setShowModal(false)}>
                  Cerrar ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ── Root ── */
        .tcard-root {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
        }

        /* ── Shared face ── */
        .tcard-face {
          position: relative;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
        }
        .tcard-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px);
          background-size: 22px 22px;
          animation: tcGridMove 7s linear infinite;
          pointer-events: none;
        }
        @keyframes tcGridMove {
          0%   { background-position: 0 0; }
          100% { background-position: 22px 22px; }
        }

        /* ── FRONT ── */
        .tcard-front {
          background: linear-gradient(135deg, #0A0018 0%, #1A0050 55%, #2B037D 100%);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(43,3,125,0.4);
          cursor: pointer;
          min-height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tcard-front:focus-visible {
          outline: 2px solid var(--tc-accent);
          outline-offset: 2px;
        }
        .tcard-front-body {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 14px;
          text-align: center;
          width: 100%;
        }
        .tcard-icon {
          filter: drop-shadow(0 0 8px var(--tc-accent));
        }
        .tcard-question {
          font-size: 0.75rem;
          font-weight: 700;
          line-height: 1.4;
          color: #F5F0FF;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 12px rgba(167,139,250,0.5);
          margin: 0;
        }
        .tcard-hint {
          font-size: 0.6rem;
          color: rgba(167,139,250,0.55);
          letter-spacing: 0.04em;
        }

        /* ── BACK ── */
        .tcard-back {
          background: linear-gradient(135deg, #0A0018 0%, #1A0050 50%, #2B037D 100%);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.5), 0 0 24px rgba(139,92,246,0.2);
          min-height: 130px;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
        }
        .tcard-back-body {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 12px;
          width: 100%;
        }
        .tcard-back-header {
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }
        .tcard-back-question {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--tc-accent);
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 10px var(--tc-accent);
          margin: 0;
          line-height: 1.3;
          flex: 1;
        }
        .tcard-back-label {
          font-size: 0.6rem;
          color: rgba(245,240,255,0.5);
          margin: 0;
        }
        .tcard-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-top: 2px;
        }
        .tcard-opt-btn {
          font-size: 0.62rem;
          font-weight: 600;
          padding: 8px 6px;
          border-radius: 8px;
          color: #fff;
          background: rgba(139,92,246,0.25);
          border: 1px solid rgba(139,92,246,0.5);
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
          line-height: 1.3;
          text-align: center;
          word-break: break-word;
        }
        .tcard-opt-btn:hover:not(:disabled) {
          background: rgba(139,92,246,0.5);
          transform: scale(1.03);
        }
        .tcard-opt-btn:active:not(:disabled) { transform: scale(0.97); }
        .tcard-opt-btn:disabled { opacity: 0.5; cursor: default; }

        /* ── Modal overlay ── */
        .tcard-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.80);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: tcFadeIn 0.2s ease;
        }
        @keyframes tcFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Modal box ── */
        .tcard-modal {
          position: relative;
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(160deg, #111111 0%, #1C1C1C 40%, #2A2A2A 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow:
            0 0 0 1px var(--tc-accent),
            0 20px 60px rgba(0,0,0,0.7),
            0 0 40px rgba(43,3,125,0.3);
          animation: tcModalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes tcModalIn {
          from { transform: scale(0.85); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        .tcard-modal-orb {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 180px;
          height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--tc-accent) 0%, transparent 70%);
          opacity: 0.15;
          pointer-events: none;
        }
        .tcard-modal-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .tcard-modal-body {
          position: relative;
          z-index: 1;
          padding: 24px 24px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tcard-modal-result {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
        }
        .tcard-modal-result-title {
          font-size: 1.3rem;
          font-weight: 800;
          font-family: Poppins, sans-serif;
          margin: 0;
        }
        .tcard-modal-correct-hint {
          font-size: 0.78rem;
          color: rgba(255,255,255,0.65);
          margin: 0;
        }
        .tcard-modal-divider {
          height: 1px;
          background: rgba(255,255,255,0.08);
        }
        .tcard-modal-icon {
          filter: drop-shadow(0 0 12px var(--tc-accent));
          align-self: flex-start;
        }
        .tcard-modal-title {
          font-size: 1rem;
          font-weight: 800;
          line-height: 1.3;
          color: #FFFFFF;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 20px var(--tc-accent);
          margin: 0;
        }
        .tcard-modal-text {
          font-size: 0.88rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.78);
          margin: 0;
        }
        .tcard-modal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
          gap: 8px;
        }
        .tcard-modal-retry {
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
        .tcard-modal-retry:hover {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.75);
        }
        .tcard-modal-close {
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
        .tcard-modal-close:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }
      `}</style>
    </>
  );
}
