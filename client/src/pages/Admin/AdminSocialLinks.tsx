import { type ComponentType, type SVGProps, useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { trpc } from "@/lib/trpc";
import { TikTokIcon } from "@/components/TikTokIcon";
import { Check, ExternalLink, Facebook, Instagram, Link as LinkIcon, Save } from "lucide-react";

type SocialLinkKey = "facebook" | "instagram" | "tiktok";

const SOCIAL_FIELDS: Array<{
  key: SocialLinkKey;
  label: string;
  placeholder: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  helper: string;
}> = [
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://www.facebook.com/tu-pagina",
    icon: Facebook,
    helper: "URL completa de la página de Facebook.",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://www.instagram.com/tu-cuenta",
    icon: Instagram,
    helper: "URL completa del perfil de Instagram.",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://www.tiktok.com/@tu-cuenta",
    icon: TikTokIcon,
    helper: "URL completa del perfil de TikTok.",
  },
];

export default function AdminSocialLinks() {
  const utils = trpc.useUtils();
  const { data: socialLinks, isLoading } = trpc.siteConfig.getSocialLinks.useQuery();
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [saved, setSaved] = useState(false);

  const values: Record<SocialLinkKey, string> = { facebook, instagram, tiktok };
  const setters: Record<SocialLinkKey, (value: string) => void> = {
    facebook: setFacebook,
    instagram: setInstagram,
    tiktok: setTiktok,
  };

  const setSocialLinksMutation = trpc.siteConfig.setSocialLinks.useMutation({
    onSuccess: () => {
      utils.siteConfig.getSocialLinks.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  useEffect(() => {
    if (socialLinks) {
      setFacebook(socialLinks.facebook || "");
      setInstagram(socialLinks.instagram || "");
      setTiktok(socialLinks.tiktok || "");
    }
  }, [socialLinks]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSocialLinksMutation.mutate({
      facebook: facebook.trim(),
      instagram: instagram.trim(),
      tiktok: tiktok.trim(),
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="font-bold text-2xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
            Redes Sociales
          </h1>
          <p style={{ color: "#6B6B6B" }}>
            Configura las URLs que aparecerán como iconos en el footer público del sitio.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="ca-card overflow-hidden">
          <div className="flex items-center gap-2 p-4" style={{ borderBottom: "1px solid #E5E3DE" }}>
            <LinkIcon className="w-5 h-5" style={{ color: "#5B2C8F" }} />
            <h2 className="font-bold" style={{ color: "#1A1A1A" }}>URLs de perfiles sociales</h2>
          </div>

          <div className="p-4 space-y-5">
            {SOCIAL_FIELDS.map(({ key, label, placeholder, icon: Icon, helper }) => (
              <div key={key}>
                <label className="flex items-center gap-2 text-xs font-semibold mb-1" style={{ color: "#6B6B6B" }}>
                  <Icon className="w-4 h-4" />
                  {label}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={values[key]}
                    onChange={(event) => setters[key](event.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "#F8F7F4", border: "1px solid #E5E3DE", color: "#1A1A1A" }}
                  />
                  {values[key].trim() && (
                    <a
                      href={values[key].trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold no-underline transition-opacity hover:opacity-80"
                      style={{ background: "#F3F0FF", color: "#2B037D" }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Probar
                    </a>
                  )}
                </div>
                <p className="text-xs mt-1" style={{ color: "#9B9B9B" }}>{helper}</p>
              </div>
            ))}

            {setSocialLinksMutation.error && (
              <div className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(229,62,62,0.1)", color: "#e53e3e" }}>
                Revisa que las URLs estén completas y empiecen con <code>https://</code>.
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || setSocialLinksMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}
            >
              {saved ? <><Check className="w-4 h-4" /> Guardado</> : <><Save className="w-4 h-4" /> Guardar redes sociales</>}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
