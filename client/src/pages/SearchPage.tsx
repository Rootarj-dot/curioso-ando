import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArticleCard } from "@/components/ArticleCard";
import { Search as SearchIcon } from "lucide-react";
import { useSeoMeta } from "@/hooks/useSeoMeta";

function queryFromLocation(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q")?.trim() || "";
}

export default function SearchPage() {
  const [location, navigate] = useLocation();
  const [term, setTerm] = useState(queryFromLocation);
  const [draft, setDraft] = useState(term);

  // wouter's location does not carry the query string, so re-read it on change.
  useEffect(() => {
    const next = queryFromLocation();
    setTerm(next);
    setDraft(next);
    window.scrollTo(0, 0);
  }, [location]);

  const { data: results, isFetching } = trpc.articles.search.useQuery(
    { q: term, limit: 50 },
    { enabled: term.length >= 2 }
  );

  const count = results?.length ?? 0;

  useSeoMeta({
    title: term ? `Resultados para “${term}”` : "Buscar",
    description: "Busca entre las historias y datos curiosos publicados en Curioseando Ando.",
    // A results page has nothing to offer search engines.
    noIndex: true,
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    if (next.length < 2) return;
    navigate(`/buscar?q=${encodeURIComponent(next)}`);
  };

  return (
    <div className="ca-search-page min-h-screen flex flex-col">
      <Navbar />

      <section className="ca-search-hero">
        <div className="container">
          <span className="ca-eyebrow">Búsqueda</span>
          <h1 className="ca-search-hero__title">
            {term ? <>Resultados para “{term}”</> : "¿Qué te da curiosidad?"}
          </h1>

          <form onSubmit={submit} className="ca-search-form">
            <SearchIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe al menos dos letras…"
              aria-label="Buscar historias"
              autoFocus={!term}
            />
            <button type="submit">Buscar</button>
          </form>

          {term.length >= 2 && !isFetching && (
            <p className="ca-search-hero__count">
              {count === 0
                ? "Ninguna historia coincide"
                : `${count} ${count === 1 ? "historia encontrada" : "historias encontradas"}`}
            </p>
          )}
        </div>
      </section>

      <main className="flex-1">
        <div className="container py-8 md:py-10">
          {term.length < 2 ? (
            <p className="ca-search-empty">
              Escribe una palabra y te muestro todo lo que haya sobre ella.
            </p>
          ) : isFetching ? (
            <div className="ca-category-grid grid gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="ca-category-skeleton rounded-xl animate-pulse" />
              ))}
            </div>
          ) : count > 0 ? (
            <div className="ca-category-grid grid gap-5">
              {results!.map((article) => (
                <ArticleCard key={article.id} {...article} />
              ))}
            </div>
          ) : (
            <div className="ca-category-empty rounded-xl p-12 text-center">
              <p className="text-lg font-semibold mb-2">Sin resultados para “{term}”</p>
              <p>Prueba con una palabra más corta o más general.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
