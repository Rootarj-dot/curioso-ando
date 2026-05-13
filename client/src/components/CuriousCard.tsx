import { useState } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { HelpCircle, Eye, CheckCircle2, XCircle } from "lucide-react";

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
  // Legacy props (ignored, kept for compatibility)
  titulo?: string;
  contenido?: string;
}

type GameState = "idle" | "flipped" | "answered";
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
  const [gameState, setGameState] = useState<GameState>("idle");
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [showAnswer, setShowAnswer] = useState(false);

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
    if (gameState === "idle") {
      setIsFlipped(true);
      setGameState("flipped");
    }
  };

  const handleAnswer = (isCorrect: boolean) => {
    setAnswerResult(isCorrect ? "correct" : "incorrect");
    setGameState("answered");
    setShowAnswer(true);
  };

  const handleReset = () => {
    setIsFlipped(false);
    setGameState("idle");
    setAnswerResult(null);
    setShowAnswer(false);
  };

  return (
    <>
      <div
        className="trivia-card-wrapper"
        style={{ "--accent": accentColor } as React.CSSProperties}
      >
        <div
          className="trivia-card-inner"
          style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* ── FRENTE: Pregunta ── */}
          <div
            className="trivia-card-face trivia-card-front"
            onClick={handleFlip}
            role={gameState === "idle" ? "button" : undefined}
            tabIndex={gameState === "idle" ? 0 : undefined}
            onKeyDown={(e) => e.key === "Enter" && handleFlip()}
          >
            <div className="trivia-grid" aria-hidden="true" />
            <div className="trivia-front-content">
              <span className="trivia-icon">
                <RenderIcon name={iconName} size={28} color={accentColor} />
              </span>
              <p className="trivia-question">{pregunta}</p>
              {gameState === "idle" && (
                <span className="trivia-hint">
                  <span className="trivia-dot" />
                  Toca para responder
                </span>
              )}
            </div>
          </div>

          {/* ── REVERSO: Respuesta + Opciones ── */}
          <div className="trivia-card-face trivia-card-back">
            <div className="trivia-back-content">

              {/* Respuesta oculta */}
              <div className="trivia-answer-box">
                <div className="trivia-answer-header">
                  <span className="trivia-answer-label">Respuesta</span>
                  {gameState === "answered" && (
                    <button
                      onClick={() => setShowAnswer(!showAnswer)}
                      className="trivia-reveal-btn"
                      aria-label={showAnswer ? "Ocultar respuesta" : "Mostrar respuesta"}
                    >
                      <Eye width={12} height={12} />
                      {showAnswer ? "Ocultar" : "Revelar"}
                    </button>
                  )}
                </div>
                <p
                  className="trivia-answer-text"
                  style={{ filter: showAnswer ? "none" : "blur(5px)", userSelect: showAnswer ? "auto" : "none" }}
                >
                  {respuesta}
                </p>
                {!showAnswer && gameState === "flipped" && (
                  <p className="trivia-answer-hint">Responde primero para revelar</p>
                )}
              </div>

              {/* Opciones */}
              {gameState !== "answered" ? (
                <div className="trivia-options">
                  <p className="trivia-options-label">¿Cuál es la respuesta correcta?</p>
                  <div className="trivia-options-grid">
                    {options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleAnswer(opt.isCorrect)}
                        className="trivia-option-btn"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Feedback */
                <div
                  className="trivia-feedback"
                  style={{
                    background: answerResult === "correct" ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)",
                    borderColor: answerResult === "correct" ? "rgba(22,163,74,0.4)" : "rgba(220,38,38,0.4)",
                  }}
                >
                  <div className="trivia-feedback-row">
                    {answerResult === "correct" ? (
                      <CheckCircle2 width={18} height={18} color="#4ade80" />
                    ) : (
                      <XCircle width={18} height={18} color="#f87171" />
                    )}
                    <div>
                      <p className="trivia-feedback-title" style={{ color: answerResult === "correct" ? "#4ade80" : "#f87171" }}>
                        {answerResult === "correct" ? "¡Acertaste!" : "Incorrecto"}
                      </p>
                      {answerResult === "incorrect" && (
                        <p className="trivia-feedback-sub">
                          Correcta: <span style={{ color: "#4ade80" }}>{opcionCorrecta}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={handleReset} className="trivia-retry-btn">
                    Intentar de nuevo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .trivia-card-wrapper {
          position: relative;
          width: 100%;
          min-height: 200px;
          perspective: 1000px;
        }
        .trivia-card-inner {
          position: relative;
          width: 100%;
          min-height: 200px;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .trivia-card-face {
          position: absolute;
          top: 0; left: 0; right: 0;
          min-height: 200px;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          border-radius: 14px;
          overflow: hidden;
        }
        /* FRONT */
        .trivia-card-front {
          background: linear-gradient(135deg, #0A0018 0%, #1A0050 55%, #2B037D 100%);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(43,3,125,0.4);
          cursor: pointer;
          display: flex;
          align-items: stretch;
        }
        .trivia-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(139,92,246,0.12) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139,92,246,0.12) 1px, transparent 1px);
          background-size: 20px 20px;
          animation: triviaGridMove 8s linear infinite;
        }
        @keyframes triviaGridMove {
          0%   { background-position: 0 0; }
          100% { background-position: 20px 20px; }
        }
        .trivia-front-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          width: 100%;
        }
        .trivia-icon {
          display: flex;
          align-items: center;
          filter: drop-shadow(0 0 8px var(--accent));
        }
        .trivia-question {
          font-size: 0.78rem;
          font-weight: 700;
          line-height: 1.4;
          color: #F5F0FF;
          margin: 0;
          font-family: Poppins, sans-serif;
          text-shadow: 0 0 12px rgba(167,139,250,0.4);
        }
        .trivia-hint {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.6rem;
          color: rgba(167,139,250,0.6);
          margin-top: auto;
        }
        .trivia-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        /* BACK */
        .trivia-card-back {
          transform: rotateY(180deg);
          background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.3), 0 4px 20px rgba(0,0,0,0.5);
        }
        .trivia-back-content {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 200px;
        }
        .trivia-answer-box {
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 10px;
          padding: 10px;
          position: relative;
        }
        .trivia-answer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .trivia-answer-label {
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .trivia-reveal-btn {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.58rem;
          color: rgba(167,139,250,0.7);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }
        .trivia-reveal-btn:hover { color: var(--accent); }
        .trivia-answer-text {
          font-size: 0.68rem;
          color: rgba(245,240,255,0.85);
          line-height: 1.5;
          margin: 0;
          transition: filter 0.3s ease;
        }
        .trivia-answer-hint {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6rem;
          color: rgba(255,255,255,0.35);
          pointer-events: none;
        }
        .trivia-options { display: flex; flex-direction: column; gap: 6px; }
        .trivia-options-label {
          font-size: 0.62rem;
          color: rgba(255,255,255,0.5);
          margin: 0;
        }
        .trivia-options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        .trivia-option-btn {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 8px 6px;
          border-radius: 8px;
          color: #fff;
          background: rgba(139,92,246,0.2);
          border: 1px solid rgba(139,92,246,0.4);
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
          line-height: 1.3;
        }
        .trivia-option-btn:hover {
          background: rgba(139,92,246,0.35);
          transform: scale(1.03);
        }
        .trivia-option-btn:active { transform: scale(0.97); }
        .trivia-feedback {
          border-radius: 10px;
          padding: 10px;
          border: 1px solid;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .trivia-feedback-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .trivia-feedback-title {
          font-size: 0.8rem;
          font-weight: 800;
          margin: 0;
          font-family: Poppins, sans-serif;
        }
        .trivia-feedback-sub {
          font-size: 0.62rem;
          color: rgba(255,255,255,0.6);
          margin: 2px 0 0;
        }
        .trivia-retry-btn {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.4);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          text-align: left;
          transition: color 0.2s;
        }
        .trivia-retry-btn:hover { color: rgba(255,255,255,0.7); }
      `}</style>
    </>
  );
}
