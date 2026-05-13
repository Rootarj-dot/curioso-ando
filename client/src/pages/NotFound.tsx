import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F8F7FF 0%, #EDE9FE 100%)" }}>
      <div style={{ textAlign: "center", padding: "2rem 1.5rem", maxWidth: 480 }}>
        <div style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(6rem, 20vw, 10rem)", fontWeight: 900, lineHeight: 1, background: "linear-gradient(135deg, #2B037D, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", marginBottom: "0.5rem" }}>
          404
        </div>
        <h1 style={{ fontFamily: "Poppins, sans-serif", fontSize: "clamp(1.3rem, 4vw, 1.8rem)", fontWeight: 700, color: "#1a1a2e", marginBottom: "0.75rem" }}>
          Página no encontrada
        </h1>
        <p style={{ color: "#6B7280", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
          La página que buscas no existe o fue movida.<br />
          Pero hay mucho más por descubrir en Curioseando Ando.
        </p>
        <Link
          href="/"
          className="no-underline inline-flex items-center gap-2"
          style={{
            background: "linear-gradient(135deg, #2B037D, #7C3AED)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "0.75rem 1.75rem",
            borderRadius: 10,
            boxShadow: "0 4px 15px rgba(43,3,125,0.3)",
          }}
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
