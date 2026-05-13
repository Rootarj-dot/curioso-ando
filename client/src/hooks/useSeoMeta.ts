/**
 * useSeoMeta — Dynamic SEO meta tag manager
 *
 * Sets document title, description, Open Graph, Twitter Card,
 * canonical URL, and optional JSON-LD structured data.
 *
 * Usage:
 *   useSeoMeta({
 *     title: "Mi artículo",
 *     description: "Descripción del artículo",
 *     image: "https://...",
 *     url: window.location.href,
 *     type: "article",
 *     jsonLd: { "@type": "Article", ... }
 *   });
 */

import { useEffect } from "react";

interface SeoMetaOptions {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
}

const SITE_NAME = "Curioso Ando";
const SITE_URL = "https://curiosoando.manus.space";

function setMeta(attr: string, value: string, content: string): void {
  let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string): void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function setJsonLd(data: Record<string, unknown>): () => void {
  const id = "jsonld-page";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify({ "@context": "https://schema.org", ...data });
  return () => {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
  };
}

export function useSeoMeta({
  title,
  description,
  image,
  url,
  type = "website",
  jsonLd,
  noIndex = false,
}: SeoMetaOptions): void {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const canonicalUrl = url || SITE_URL;
    const desc = description || `Datos raros, curiosos y sorprendentes. Noticias, entretenimiento, geek y tecnología en un solo lugar.`;

    // Title
    document.title = fullTitle;

    // Primary meta
    setMeta("name", "description", desc);
    setMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1");

    // Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", canonicalUrl);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", "es_ES");
    if (image) {
      setMeta("property", "og:image", image);
      setMeta("property", "og:image:width", "1200");
      setMeta("property", "og:image:height", "630");
      setMeta("property", "og:image:alt", title);
    }

    // Twitter Card
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    if (image) setMeta("name", "twitter:image", image);

    // Canonical
    setCanonical(canonicalUrl);

    // JSON-LD
    let cleanupJsonLd: (() => void) | undefined;
    if (jsonLd) {
      cleanupJsonLd = setJsonLd(jsonLd);
    }

    return () => {
      cleanupJsonLd?.();
    };
  }, [title, description, image, url, type, jsonLd, noIndex]);
}
