import { Link } from "wouter";
import { Facebook, Instagram, Search } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { TikTokIcon } from "@/components/TikTokIcon";

export function Footer() {
  const year = new Date().getFullYear();
  const { data: socialLinks } = trpc.siteConfig.getSocialLinks.useQuery();
  const activeSocialLinks = [
    { label: "Facebook", href: socialLinks?.facebook, icon: Facebook },
    { label: "Instagram", href: socialLinks?.instagram, icon: Instagram },
    { label: "TikTok", href: socialLinks?.tiktok, icon: TikTokIcon },
  ].filter((item) => item.href && item.href.trim().length > 0);

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
              <span className="font-bold text-lg" style={{ fontFamily: "Poppins, sans-serif", color: "#FFFFFF" }}>Curioseando Ando</span>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              Datos raros, curiosos y sorprendentes. Aprende, ríe y di "¡no lo sabía!".
            </p>
            {activeSocialLinks.length > 0 && (
              <div className="flex items-center gap-3 mt-5" aria-label="Redes sociales">
                {activeSocialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:-translate-y-0.5 hover:bg-white/20"
                    style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "#FFFFFF" }}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
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
              <li><Link href="/aviso-de-privacidad" className="text-sm no-underline transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.75)" }}>Aviso de Privacidad</Link></li>
              <li><Link href="/contacto" className="text-sm no-underline transition-opacity hover:opacity-100" style={{ color: "rgba(255,255,255,0.75)" }}>Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            © {year} Curioseando Ando. Todos los derechos reservados.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Hecho con curiosidad infinita
          </p>
        </div>
      </div>
    </footer>
  );
}
