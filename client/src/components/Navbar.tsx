import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Menu, X, Search, User, Compass, ArrowUpRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

function NavSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data: results, isFetching } = trpc.articles.search.useQuery({ q: query }, { enabled: query.trim().length >= 2 });

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 50);
  };
  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative">
      {!open ? (
        <button onClick={handleOpen} className="ca-nav-icon-button" aria-label="Buscar artículos"><Search className="w-[18px] h-[18px]" /></button>
      ) : (
        <div className="ca-nav-search-field">
          <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
          <input ref={inputRef} type="search" placeholder="Buscar historias..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar artículos" />
          <button onClick={handleClose} aria-label="Cerrar búsqueda"><X className="w-4 h-4" /></button>
        </div>
      )}

      {open && query.trim().length >= 2 && (
        <div className="ca-search-results">
          {isFetching ? <div className="ca-search-status">Buscando historias...</div> : results && results.length > 0 ? (
            <ul>{results.map((result) => (
              <li key={result.id}>
                <Link href={`/articulo/${result.slug}`} onClick={handleClose} className="ca-search-result">
                  {(result.ogImage || result.featuredImage) ? <img src={result.ogImage || result.featuredImage || ""} alt="" className="ca-search-result__image" loading="lazy" /> : <span className="ca-search-result__placeholder">CA</span>}
                  <span className="min-w-0 flex-1"><span className="ca-search-result__title">{result.title}</span>{result.categoryName && <span className="ca-search-result__category">{result.categoryName}</span>}</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            ))}</ul>
          ) : <div className="ca-search-status">Sin resultados para “{query}”.</div>}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { data: categories } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });

  return (
    <header className="ca-site-header">
      <div className="container">
        <div className="ca-site-header__bar">
          <Link href="/" className="ca-site-brand" aria-label="Ir al inicio de Curioseando Ando">
            <span className="ca-site-brand__mark"><Compass className="w-4 h-4" /></span>
            <span className="ca-site-brand__name">Curioseando Ando</span>
          </Link>

          <nav className="ca-main-navigation" aria-label="Categorías principales">
            {(categories ?? []).map((category) => (
              <Link key={category.slug} href={`/categoria/${category.slug}`} className={`ca-main-navigation__link${location === `/categoria/${category.slug}` ? " is-active" : ""}`}>
                {category.name}
              </Link>
            ))}
          </nav>

          <div className="ca-site-actions">
            {user?.role === "admin" && user.accessStatus !== "blocked" && (
              <Link href="/admin" className="ca-panel-link"><User className="w-4 h-4" aria-hidden="true" /><span>Panel</span></Link>
            )}
            <button className="ca-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="ca-mobile-menu">
          <div className="container ca-mobile-menu__inner">
            <MobileSearch onClose={() => setMenuOpen(false)} />
            <nav aria-label="Categorías móviles" className="ca-mobile-menu__links">
              {(categories ?? []).map((category) => (
                <Link key={category.slug} href={`/categoria/${category.slug}`} className="ca-mobile-menu__link" onClick={() => setMenuOpen(false)}>
                  {category.name}<ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              ))}
            </nav>
            {user?.role === "admin" && user.accessStatus !== "blocked" && (
              <Link href="/admin" className="ca-mobile-panel-link" onClick={() => setMenuOpen(false)}><User className="w-4 h-4" aria-hidden="true" /> Ir al panel administrativo</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { data: results, isFetching } = trpc.articles.search.useQuery({ q: query }, { enabled: query.trim().length >= 2 });

  return (
    <div className="ca-mobile-search">
      <div className="ca-mobile-search__field">
        <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
        <input type="search" placeholder="Buscar historias..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar artículos" />
        {query && <button onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><X className="w-4 h-4" /></button>}
      </div>
      {query.trim().length >= 2 && (
        <div className="ca-mobile-search__results">
          {isFetching ? <p>Buscando historias...</p> : results && results.length > 0 ? results.map((result) => (
            <Link key={result.id} href={`/articulo/${result.slug}`} onClick={onClose} className="ca-mobile-search__result">{result.title}</Link>
          )) : <p>Sin resultados para “{query}”.</p>}
        </div>
      )}
    </div>
  );
}
