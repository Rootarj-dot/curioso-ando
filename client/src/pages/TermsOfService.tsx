import { useEffect } from "react";
import { Link } from "wouter";

export default function TermsOfService() {
  useEffect(() => {
    document.title = "Términos y Condiciones | Curioseando Ando";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Términos y Condiciones de Curioseando Ando. Lee nuestros términos de uso, limitaciones de responsabilidad y políticas de contenido.");
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = "18 de julio de 2026";

  return (
    <div className="min-h-screen" style={{ background: "#F8F7FF" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0D0020 0%, #2B037D 60%, #5B2C8F 100%)", padding: "3rem 0 2.5rem" }}>
        <div className="container" style={{ maxWidth: 860, margin: "0 auto", padding: "0 1.5rem" }}>
          <Link href="/" className="no-underline inline-flex items-center gap-2 mb-4" style={{ color: "#C4B5FD", fontSize: "0.85rem", fontWeight: 600, transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#C4B5FD")}
          >
            <span style={{ fontSize: "1rem" }}>←</span> Volver al inicio
          </Link>
          <p style={{ color: "#A78BFA", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Legal
          </p>
          <h1 style={{ color: "#FFFFFF", fontFamily: "Poppins, sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
            Términos y Condiciones
          </h1>
          <p style={{ color: "#C4B5FD", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            Última actualización: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 20px rgba(43,3,125,0.07)", lineHeight: 1.8, color: "#2D2D2D", fontSize: "0.97rem" }}>

          <Section title="1. Aceptación de los Términos">
            <p>
              Al acceder y utilizar el sitio web <strong>curioseandoando.com</strong> (en adelante, "el Sitio"), el usuario acepta estar vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, por favor no utilices el Sitio.
            </p>
          </Section>

          <Section title="2. Descripción del Servicio">
            <p>
              Curioseando Ando es un blog de contenido informativo y de entretenimiento que ofrece artículos sobre noticias, datos curiosos, entretenimiento, tecnología y otros temas de interés general. El Sitio también incluye preguntas de trivia interactivas para entretenimiento del usuario.
            </p>
          </Section>

          <Section title="3. Uso Permitido">
            <p>El usuario acepta utilizar el Sitio únicamente para propósitos legales y de acuerdo con estos Términos. Específicamente, el usuario se compromete a:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}>No reproducir, duplicar, copiar, vender, revender o explotar ninguna parte del Sitio sin permiso explícito.</li>
              <li style={{ marginBottom: "0.4rem" }}>No acceder al Sitio mediante medios automatizados (bots, scrapers, etc.) sin autorización.</li>
              <li style={{ marginBottom: "0.4rem" }}>No transmitir virus, malware, código malicioso o cualquier material que pueda dañar el Sitio.</li>
              <li style={{ marginBottom: "0.4rem" }}>No interferir con la funcionalidad o seguridad del Sitio.</li>
              <li>No utilizar el Sitio para actividades ilegales o que violen derechos de terceros.</li>
            </ul>
          </Section>

          <Section title="4. Propiedad Intelectual">
            <p>
              Todo el contenido del Sitio, incluyendo textos, imágenes, gráficos, logos, videos y código, es propiedad de Curioseando Ando o de sus proveedores de contenido y está protegido por leyes de derechos de autor internacionales.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              El usuario tiene permiso para ver y descargar contenido para uso personal y no comercial. Cualquier otra reproducción o distribución requiere permiso escrito previo.
            </p>
          </Section>

          <Section title="5. Limitación de Responsabilidad">
            <p>
              El Sitio se proporciona "tal como está" sin garantías de ningún tipo. Curioseando Ando no garantiza que el contenido sea exacto, completo, oportuno o libre de errores. El usuario utiliza el Sitio bajo su propio riesgo.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              En la máxima medida permitida por la ley, Curioseando Ando no será responsable por daños directos, indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de usar el Sitio.
            </p>
          </Section>

          <Section title="6. Contenido Generado por el Usuario">
            <p>
              Si el Sitio permite a los usuarios enviar comentarios, respuestas o contenido, el usuario otorga a Curioseando Ando una licencia no exclusiva, libre de regalías y perpetua para usar, reproducir, modificar y distribuir dicho contenido.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              El usuario es responsable de todo contenido que envíe y garantiza que tiene derecho a otorgar esta licencia.
            </p>
          </Section>

          <Section title="7. Enlaces a Terceros">
            <p>
              El Sitio puede contener enlaces a sitios web de terceros. Curioseando Ando no es responsable por el contenido, precisión o prácticas de privacidad de sitios externos. El acceso a sitios de terceros está bajo tu propio riesgo.
            </p>
          </Section>

          <Section title="8. Publicidad y Contenido Patrocinado">
            <p>
              El Sitio puede mostrar publicidad de Google AdSense, Metricool y otros proveedores de publicidad. Estos anunciantes pueden recopilar datos sobre tu actividad de navegación. Consulta sus políticas de privacidad para más información.
            </p>
          </Section>

          <Section title="9. Modificaciones del Sitio">
            <p>
              Curioseando Ando se reserva el derecho de modificar, suspender o discontinuar el Sitio o cualquier parte del mismo en cualquier momento, con o sin previo aviso.
            </p>
          </Section>

          <Section title="10. Terminación">
            <p>
              Curioseando Ando puede terminar o suspender el acceso de un usuario al Sitio en cualquier momento, por cualquier razón, incluyendo violaciones de estos Términos.
            </p>
          </Section>

          <Section title="11. Ley Aplicable">
            <p>
              Estos Términos y Condiciones se rigen por las leyes aplicables en la jurisdicción donde opera Curioseando Ando. Cualquier disputa será resuelta en los tribunales competentes de esa jurisdicción.
            </p>
          </Section>

          <Section title="12. Contacto" isLast>
            <p>
              Para preguntas sobre estos Términos y Condiciones, por favor contacta a través de la página de contacto del Sitio.
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children, isLast = false }: { title: string; children: React.ReactNode; isLast?: boolean }) {
  return (
    <section style={{ marginBottom: isLast ? 0 : "2rem", paddingBottom: isLast ? 0 : "2rem", borderBottom: isLast ? "none" : "1px solid #EDE9FE" }}>
      <h2 style={{ fontFamily: "Poppins, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "#2B037D", marginBottom: "0.75rem", marginTop: 0 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}
