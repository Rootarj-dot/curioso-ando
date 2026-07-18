import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  useEffect(() => {
    document.title = "Contacto | Curioseando Ando";
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", "Contacta con Curioseando Ando. Envíanos tus sugerencias, preguntas o comentarios sobre nuestro contenido.");
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simular envío de formulario
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("¡Mensaje enviado! Nos pondremos en contacto pronto.");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      toast.error("Error al enviar el mensaje. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Contacto
          </p>
          <h1 style={{ color: "#FFFFFF", fontFamily: "Poppins, sans-serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
            Ponte en Contacto
          </h1>
          <p style={{ color: "#C4B5FD", marginTop: "0.75rem", fontSize: "0.9rem" }}>
            Nos encantaría escuchar tus sugerencias, preguntas y comentarios
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "2rem", boxShadow: "0 2px 20px rgba(43,3,125,0.07)" }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(124, 58, 237, 0.1)" }}>
                  <MessageSquare className="w-5 h-5" style={{ color: "#7C3AED" }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#2B037D", margin: 0, marginBottom: "0.25rem" }}>
                    Envía tu Mensaje
                  </h3>
                  <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
                    Usa el formulario para contactarnos directamente
                  </p>
                </div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "2rem", boxShadow: "0 2px 20px rgba(43,3,125,0.07)" }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(124, 58, 237, 0.1)" }}>
                  <Mail className="w-5 h-5" style={{ color: "#7C3AED" }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#2B037D", margin: 0, marginBottom: "0.25rem" }}>
                    Email
                  </h3>
                  <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
                    contacto@curioseandoando.com
                  </p>
                </div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "2rem", boxShadow: "0 2px 20px rgba(43,3,125,0.07)" }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(124, 58, 237, 0.1)" }}>
                  <MapPin className="w-5 h-5" style={{ color: "#7C3AED" }} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, color: "#2B037D", margin: 0, marginBottom: "0.25rem" }}>
                    Redes Sociales
                  </h3>
                  <p style={{ color: "#666", fontSize: "0.9rem", margin: 0 }}>
                    Síguenos en nuestras redes para actualizaciones
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "2.5rem", boxShadow: "0 2px 20px rgba(43,3,125,0.07)" }}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B037D", marginBottom: "0.5rem" }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "0.5rem",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B037D", marginBottom: "0.5rem" }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "0.5rem",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#2B037D", marginBottom: "0.5rem" }}>
                  Mensaje *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tu mensaje aquí..."
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #E5E7EB",
                    borderRadius: "0.5rem",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    resize: "vertical",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#7C3AED")}
                  onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: isSubmitting ? "#D1D5DB" : "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  fontFamily: "Poppins, sans-serif"
                }}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.transform = "translateY(-2px)")}
                onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.transform = "translateY(0)")}
              >
                {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
