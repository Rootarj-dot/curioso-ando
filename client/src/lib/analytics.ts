/**
 * Analytics & AdSense initialization
 *
 * Configuration (add to your .env file):
 *   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX      ← your Google Analytics 4 ID
 *   VITE_ADSENSE_PUBLISHER_ID=ca-pub-XXXXX   ← your AdSense Publisher ID
 *
 * Both are optional — if not set, the scripts are simply not loaded.
 */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function loadScript(src: string, attrs: Record<string, string> = {}): void {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

/** Initialize Google Analytics 4 */
export function initGA(): void {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!gaId || !gaId.startsWith("G-")) return;

  loadScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", gaId, { anonymize_ip: true });
}

/** Track a page view (call on route changes) */
export function trackPageView(path: string): void {
  if (typeof window.gtag !== "function") return;
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (!gaId) return;
  window.gtag("config", gaId, { page_path: path });
}

/** Initialize Google AdSense */
export function initAdSense(): void {
  const pubId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID as string | undefined;
  if (!pubId || !pubId.startsWith("ca-pub-")) return;

  loadScript(
    `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`,
    { crossorigin: "anonymous" }
  );
}
