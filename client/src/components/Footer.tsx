import { Link } from "wouter";
import { Search } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{ background: "linear-gradient(135deg, #2B037D 0%, #5B2C8F 60%, #8B5CF6 100%)" }}>
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <Search className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif", color: "#FFFFFF" }}>Curioso Ando</span>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              Datos raros, curiosos y sorprendentes. Aprende, ríe y di "¡no lo sabía!".
            </p>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Categorías</h4>
            <ul className="flex flex-col gap-2">
              {["noticias", "entretenimiento", "geek", "tecnologia"].map((slug) => (
                <li key={slug}>
                  <Link href={`/categoria/${slug}`} className="text-sm no-underline capitalize transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {slug === "tecnologia" ? "Tecnología" : slug.charAt(0).toUpperCase() + slug.slice(1)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>Legal</h4>
            <ul className="flex flex-col gap-2">
              <li><Link href="/privacidad" className="text-sm no-underline transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.75)" }}>Política de Privacidad</Link></li>
              <li><Link href="/cookies" className="text-sm no-underline transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.75)" }}>Política de Cookies</Link></li>
              <li><Link href="/contacto" className="text-sm no-underline transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.75)" }}>Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            © {year} Curioso Ando. Todos los derechos reservados.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Hecho con curiosidad infinita
          </p>
        </div>
      </div>
    </footer>
  );
}
