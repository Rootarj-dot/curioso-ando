import React, { useRef, useState, useLayoutEffect } from "react";
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
  const [showModal, setShowModal] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);

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

  const handleOpenModal = () => {
    setIsFlipped(false);
    setAnswerResult(null);
    setShowModal(true);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setAnswerResult(isCorrect ? "correct" : "incorrect");
    // Small delay so the click registers visually before flip
    setTimeout(() => setIsFlipped(true), 80);
  };

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => {
      setIsFlipped(false);
      setAnswerResult(null);
    }, 300);
  };

  const handleRetry = () => {
    setIsFlipped(false);
    setAnswerResult(null);
  };

  // Refs to measure each face height for dynamic flip container
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const [flipHeight, setFlipHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const front = frontRef.current;
    const back = backRef.current;
    if (!front || !back) return;
    const h = isFlipped ? back.scrollHeight : front.scrollHeight;
    setFlipHeight(h);
  }, [isFlipped, showModal, pregunta, respuesta, answerResult]);

  return (
    <>
      {/* ── Static card (sidebar) ── */}
      <div
        className="tc-card"
        style={{ "--tc-accent": accentColor } as React.CSSProperties}
        onClick={handleOpenModal}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleOpenModal()}
        aria-label={`Pregunta trivia: ${pregunta}`}
      >
        <div className="tc-card-grid" />
        <div className="tc-card-body">
          <span className="tc-card-icon">
            <RenderIcon name={iconName} size={30} color={accentColor} />
          </span>
          <p className="tc-card-question">{pregunta}</p>
          <span className="tc-card-hint">Toca para responder →</span>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div
          className="tc-overlay"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
        >
          {/* Modal box — click inside doesn't close */}
          <div
            className="tc-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ "--tc-accent": accentColor } as React.CSSProperties}
          >
            {/* Decorative orb + grid */}
            <div className="tc-modal-orb" />
            <div className="tc-modal-grid" />

            {/* Close button */}
            <button className="tc-modal-x" onClick={handleClose} aria-label="Cerrar">✕</button>

            {/* ── Flip container inside modal ── */}
            <div
              className="tc-flip-wrapper"
              style={{ perspective: "900px", height: flipHeight ? `${flipHeight}px` : undefined, transition: "height 0.45s ease" }}
            >
              <div
                className="tc-flip-inner"
                style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* FRONT — Opciones */}
                <div className="tc-flip-face tc-flip-front" ref={frontRef}>
                  <div className="tc-flip-front-body">
                    <div className="tc-flip-icon">
                      <RenderIcon name={iconName} size={36} color={accentColor} />
                    </div>
                    <h3 className="tc-flip-question">{pregunta}</h3>
                    <p className="tc-flip-sublabel">¿Cuál es la respuesta correcta?</p>
                    <div className="tc-flip-options">
                      {options.map((opt, i) => (
                        <button
                          key={i}
                          className="tc-flip-opt"
                          onClick={() => handleAnswer(opt.isCorrect)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* BACK — Resultado */}
                <div className="tc-flip-face tc-flip-back" ref={backRef}>
                  <div className="tc-flip-back-body">
                    {answerResult === "correct" ? (
                      <>
                        <CheckCircle2 width={52} height={52} color="#4ade80" className="tc-result-icon" />
                        <h3 className="tc-result-title" style={{ color: "#4ade80" }}>¡Acertaste!</h3>
                      </>
                    ) : (
                      <>
                        <XCircle width={52} height={52} color="#f87171" className="tc-result-icon" />
                        <h3 className="tc-result-title" style={{ color: "#f87171" }}>¡Incorrecto!</h3>
                        <p className="tc-result-hint">
                          La respuesta correcta era:{" "}
                          <strong style={{ color: "#4ade80" }}>{opcionCorrecta}</strong>
                        </p>
                      </>
                    )}

                    <div className="tc-result-divider" />

                    <span className="tc-result-icon-accent">
                      <RenderIcon name={iconName} size={28} color={accentColor} />
                    </span>
                    <p className="tc-result-answer">{respuesta}</p>

                    <div className="tc-result-actions">
                      <button className="tc-result-retry" onClick={handleRetry}>
                        Intentar de nuevo
                      </button>
                      <button className="tc-result-close" onClick={handleClose}>
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* ══════════════════════════════════════════
           STATIC CARD (sidebar)
        ══════════════════════════════════════════ */
        .tc-card {
          position: relative;
          width: 100%;
          border-radius: 14px;
          overflow: visible;
          background: linear-gradient(135deg, #0A0018 0%, #1A0050 55%, #2B037D 100%);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(43,3,125,0.4);
          cursor: pointer;
          min-height: 0;
          display: flex;
          align-items: stretch;
          justify-content: center;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .tc-card:hover {
          box-shadow: 0 0 0 1px var(--tc-accent), 0 6px 28px rgba(43,3,125,0.55);
          transform: translateY(-2px);
        }
        .tc-card:focus-visible {
          outline: 2px solid var(--tc-accent);
          outline-offset: 2px;
        }
        .tc-card-grid {
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
        .tc-card-body {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 18px 14px;
          text-align: center;
          width: 100%;
          min-height: 120px;
          justify-content: center;
        }
        .tc-card-icon {
          filter: drop-shadow(0 0 8px var(--tc-accent));
        }
        .tc-card-question {
          font-size: 0.75rem;
          font-weight: 700;
          line-height: 1.4;
          color: #F5F0FF;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 12px rgba(167,139,250,0.5);
          margin: 0;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }
        .tc-card-hint {
          font-size: 0.6rem;
          color: rgba(167,139,250,0.55);
          letter-spacing: 0.04em;
        }

        /* ══════════════════════════════════════════
           MODAL OVERLAY
        ══════════════════════════════════════════ */
        .tc-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0,0,0,0.82);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: tcFadeIn 0.22s ease;
        }
        @keyframes tcFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ══════════════════════════════════════════
           MODAL BOX
        ══════════════════════════════════════════ */
        .tc-modal {
          position: relative;
          width: 100%;
          max-width: 440px;
          border-radius: 22px;
          overflow: visible;
          background: linear-gradient(160deg, #0e0e0e 0%, #1a1a1a 45%, #242424 100%);
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow:
            0 0 0 1px var(--tc-accent),
            0 24px 64px rgba(0,0,0,0.75),
            0 0 48px rgba(43,3,125,0.3);
          animation: tcModalIn 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes tcModalIn {
          from { transform: scale(0.82) translateY(20px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        .tc-modal-orb {
          position: absolute;
          top: -70px;
          right: -70px;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--tc-accent) 0%, transparent 70%);
          opacity: 0.14;
          pointer-events: none;
        }
        .tc-modal-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }
        .tc-modal-x {
          position: absolute;
          top: 14px;
          right: 16px;
          z-index: 10;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.45);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          font-size: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .tc-modal-x:hover { background: rgba(255,255,255,0.14); color: #fff; }

        /* ══════════════════════════════════════════
           FLIP CONTAINER (inside modal)
        ══════════════════════════════════════════ */
        .tc-flip-wrapper {
          position: relative;
          width: 100%;
        }
        .tc-flip-inner {
          position: relative;
          width: 100%;
          transform-style: preserve-3d;
          transition: transform 0.65s cubic-bezier(0.4, 0.2, 0.2, 1);
          /* Height is driven by the visible face */
        }
        .tc-flip-face {
          width: 100%;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 22px;
        }
        .tc-flip-back {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          transform: rotateY(180deg);
          overflow: visible;
        }

        /* ── FRONT face content ── */
        .tc-flip-front-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px 24px 28px;
          text-align: center;
        }
        .tc-flip-icon {
          filter: drop-shadow(0 0 12px var(--tc-accent));
        }
        .tc-flip-question {
          font-size: 1.05rem;
          font-weight: 800;
          line-height: 1.35;
          color: #FFFFFF;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 20px var(--tc-accent);
          margin: 0;
        }
        .tc-flip-sublabel {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.4);
          margin: 0;
        }
        .tc-flip-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          width: 100%;
          margin-top: 4px;
        }
        .tc-flip-opt {
          font-size: 0.78rem;
          font-weight: 600;
          padding: 12px 10px;
          border-radius: 12px;
          color: #fff;
          background: rgba(139,92,246,0.2);
          border: 1px solid rgba(139,92,246,0.45);
          cursor: pointer;
          transition: transform 0.15s, background 0.15s, box-shadow 0.15s;
          line-height: 1.35;
          text-align: center;
          word-break: break-word;
        }
        .tc-flip-opt:hover {
          background: rgba(139,92,246,0.45);
          box-shadow: 0 0 14px rgba(139,92,246,0.4);
          transform: scale(1.03);
        }
        .tc-flip-opt:active { transform: scale(0.97); }

        /* ── BACK face content ── */
        .tc-flip-back-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 32px 24px 28px;
          text-align: center;
          width: 100%;
        }
        .tc-result-icon { filter: drop-shadow(0 0 12px currentColor); }
        .tc-result-title {
          font-size: 1.4rem;
          font-weight: 800;
          font-family: Poppins, sans-serif;
          margin: 0;
        }
        .tc-result-hint {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          margin: 0;
        }
        .tc-result-divider {
          width: 100%;
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 4px 0;
        }
        .tc-result-icon-accent {
          filter: drop-shadow(0 0 10px var(--tc-accent));
        }
        .tc-result-answer {
          font-size: 0.88rem;
          line-height: 1.65;
          color: rgba(255,255,255,0.78);
          margin: 0;
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: normal;
        }
        .tc-result-actions {
          display: flex;
          gap: 8px;
          margin-top: 6px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .tc-result-retry {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 6px 16px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .tc-result-retry:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); }
        .tc-result-close {
          font-size: 0.72rem;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 6px 18px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .tc-result-close:hover { background: rgba(255,255,255,0.13); color: #fff; }
      `}</style>
    </>
  );
}
