import { useEffect } from "react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Aviso de Privacidad | Curioseando Ando";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Aviso de Privacidad de Curioseando Ando. Conoce cómo recopilamos, usamos y protegemos tu información personal.");
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = "13 de mayo de 2026";

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
            Aviso de Privacidad
          </h1>
          <p style={{ color: "#C4B5FD", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            Última actualización: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 20px rgba(43,3,125,0.07)", lineHeight: 1.8, color: "#2D2D2D", fontSize: "0.97rem" }}>

          <Section title="1. Responsable del tratamiento de datos">
            <p>
              <strong>Curioseando Ando</strong> (en adelante, "el Sitio") es responsable del tratamiento de los datos personales que se recaban a través del sitio web <strong>curioseandoando.com</strong> y sus subdominios.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              Para cualquier consulta relacionada con el tratamiento de tus datos personales, puedes contactarnos a través de los medios indicados al final de este aviso.
            </p>
          </Section>

          <Section title="2. Datos personales que recopilamos">
            <p>El Sitio puede recopilar los siguientes tipos de datos personales:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>Datos de navegación:</strong> dirección IP, tipo de navegador, sistema operativo, páginas visitadas, tiempo de permanencia y fuente de tráfico, recopilados de forma automática mediante cookies y herramientas de analítica.</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Datos de registro:</strong> nombre de usuario y dirección de correo electrónico, cuando el usuario crea una cuenta en el Sitio.</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Datos de interacción:</strong> respuestas a preguntas de trivia, preferencias de contenido y otras interacciones voluntarias con el Sitio.</li>
              <li><strong>Datos de contacto:</strong> nombre y correo electrónico, cuando el usuario nos envía un mensaje a través de formularios de contacto.</li>
            </ul>
          </Section>

          <Section title="3. Finalidad del tratamiento">
            <p>Los datos personales recopilados se utilizan para las siguientes finalidades:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}>Proveer, mantener y mejorar los servicios y contenidos del Sitio.</li>
              <li style={{ marginBottom: "0.4rem" }}>Personalizar la experiencia de navegación del usuario.</li>
              <li style={{ marginBottom: "0.4rem" }}>Analizar el uso del Sitio mediante herramientas de analítica web (Google Analytics).</li>
              <li style={{ marginBottom: "0.4rem" }}>Mostrar publicidad relevante a través de Google AdSense.</li>
              <li style={{ marginBottom: "0.4rem" }}>Responder consultas y solicitudes enviadas por los usuarios.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
          </Section>

          <Section title="4. Cookies y tecnologías de seguimiento">
            <p>
              El Sitio utiliza cookies propias y de terceros para mejorar la experiencia de navegación, analizar el tráfico y mostrar publicidad personalizada. Al continuar navegando en el Sitio, el usuario acepta el uso de cookies conforme a este aviso.
            </p>
            <p style={{ marginTop: "0.75rem" }}>Las cookies utilizadas incluyen:</p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>Cookies de sesión:</strong> necesarias para el funcionamiento del Sitio y la autenticación de usuarios.</li>
              <li style={{ marginBottom: "0.4rem" }}><strong>Google Analytics:</strong> recopila datos de navegación de forma anónima para generar estadísticas de uso. Puedes desactivarlo instalando el <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: "#7C3AED" }}>complemento de inhabilitación de Google Analytics</a>.</li>
              <li><strong>Google AdSense:</strong> utiliza cookies para mostrar anuncios relevantes basados en visitas anteriores al Sitio y a otros sitios web. Puedes gestionar tus preferencias en <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" style={{ color: "#7C3AED" }}>Configuración de anuncios de Google</a>.</li>
            </ul>
          </Section>

          <Section title="5. Compartición de datos con terceros">
            <p>
              El Sitio no vende, alquila ni cede datos personales a terceros con fines comerciales propios. Sin embargo, puede compartir datos con los siguientes proveedores de servicios bajo sus propias políticas de privacidad:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li style={{ marginBottom: "0.4rem" }}><strong>Google LLC</strong> — analítica web (Google Analytics) y publicidad (Google AdSense). <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "#7C3AED" }}>Política de privacidad de Google</a>.</li>
              <li><strong>Cloudinary</strong> — almacenamiento y entrega de imágenes y archivos multimedia.</li>
            </ul>
          </Section>

          <Section title="6. Derechos del usuario (ARCO)">
            <p>
              De conformidad con la legislación aplicable, el usuario tiene derecho a <strong>Acceder, Rectificar, Cancelar u Oponerse</strong> (derechos ARCO) al tratamiento de sus datos personales. Para ejercer estos derechos, el usuario puede contactarnos a través de los medios indicados en la sección de contacto de este aviso.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              Asimismo, el usuario puede revocar en cualquier momento el consentimiento otorgado para el tratamiento de sus datos, sin que ello afecte a la licitud del tratamiento basado en el consentimiento previo a su retirada.
            </p>
          </Section>

          <Section title="7. Seguridad de los datos">
            <p>
              El Sitio implementa medidas técnicas y organizativas razonables para proteger los datos personales contra acceso no autorizado, alteración, divulgación o destrucción. Sin embargo, ningún sistema de transmisión de datos por Internet es completamente seguro, por lo que no podemos garantizar la seguridad absoluta de la información transmitida.
            </p>
          </Section>

          <Section title="8. Retención de datos">
            <p>
              Los datos personales se conservarán durante el tiempo necesario para cumplir con las finalidades para las que fueron recopilados, o durante el tiempo exigido por la legislación aplicable. Los datos de cuentas de usuario se conservarán mientras la cuenta permanezca activa o hasta que el usuario solicite su eliminación.
            </p>
          </Section>

          <Section title="9. Menores de edad">
            <p>
              El Sitio no está dirigido a menores de 13 años y no recopila conscientemente datos personales de menores de esa edad. Si un padre o tutor tiene conocimiento de que su hijo nos ha proporcionado datos personales, puede contactarnos para solicitar su eliminación.
            </p>
          </Section>

          <Section title="10. Cambios a este aviso">
            <p>
              El Sitio se reserva el derecho de modificar este Aviso de Privacidad en cualquier momento. Los cambios serán publicados en esta página con la fecha de última actualización. Se recomienda al usuario revisar periódicamente este aviso para estar informado sobre cómo se protegen sus datos.
            </p>
          </Section>

          <Section title="11. Contacto" isLast>
            <p>
              Para cualquier consulta, solicitud o comentario relacionado con este Aviso de Privacidad o el tratamiento de tus datos personales, puedes contactarnos a través de la sección de contacto del Sitio o escribiéndonos directamente.
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
