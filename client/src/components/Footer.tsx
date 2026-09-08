import { Link } from "wouter";
import { Facebook, Instagram, Compass } from "lucide-react";
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
    <footer className="ca-site-footer">
      <div className="container ca-site-footer__inner">
        <div className="ca-site-footer__top">
          <div className="ca-footer-brand">
            <Link href="/" className="ca-footer-brand__title">
              <span><Compass className="w-4 h-4" aria-hidden="true" /></span>
              CURIOSEANDO <strong>ANDO</strong>
            </Link>
            <p>Historias sorprendentes, misterios e ideas que invitan a mirar más allá de lo conocido.</p>
            {activeSocialLinks.length > 0 && (
              <div className="ca-footer-socials" aria-label="Redes sociales">
                {activeSocialLinks.map(({ label, href, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="ca-footer-column">
            <h2>Explora</h2>
            <ul>
              {["noticias", "entretenimiento", "geek", "tecnologia"].map((slug) => (
                <li key={slug}>
                  <Link href={`/categoria/${slug}`}>{slug === "tecnologia" ? "Tecnología" : slug.charAt(0).toUpperCase() + slug.slice(1)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="ca-footer-column">
            <h2>Información</h2>
            <ul>
              <li><Link href="/aviso-de-privacidad">Aviso de privacidad</Link></li>
              <li><Link href="/terminos-y-condiciones">Términos y condiciones</Link></li>
              <li><Link href="/contacto">Contacto</Link></li>
            </ul>
          </div>
        </div>

        <div className="ca-site-footer__bottom">
          <p>© {year} Curioseando Ando. Todos los derechos reservados.</p>
          <p>Historias para seguir explorando.</p>
        </div>
      </div>
    </footer>
  );
}
