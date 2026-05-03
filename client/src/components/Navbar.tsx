import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Menu, X, Search, User } from "lucide-react";
import { trpc } from "@/lib/trpc";

function NavSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: results, isFetching } = trpc.articles.search.useQuery(
    { q: query },
    { enabled: query.trim().length >= 2 }
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={wrapperRef} className="relative">
      {!open ? (
        /* Collapsed: just the icon button */
        <button
          onClick={handleOpen}
          className="p-2 rounded-md transition-colors hover:bg-gray-100"
          style={{ color: "#4A4A4A" }}
          aria-label="Buscar artículos"
        >
          <Search className="w-5 h-5" />
        </button>
      ) : (
        /* Expanded: search input */
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{ background: "#F8F7F4", border: "1px solid #D0C8E8", width: 260 }}
        >
          <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#9B9B9B" }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar artículos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#1A1A1A" }}
          />
          <button onClick={handleClose} style={{ color: "#9B9B9B" }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dropdown results */}
      {open && query.trim().length >= 2 && (
        <div
          className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
          style={{ width: 320, background: "#FFFFFF", boxShadow: "0 8px 32px rgba(0,0,0,0.14)", border: "1px solid #E5E3DE" }}
        >
          {isFetching ? (
            <div className="p-4 text-sm text-center" style={{ color: "#9B9B9B" }}>Buscando...</div>
          ) : results && results.length > 0 ? (
            <ul>
              {results.map((r) => (
                <li key={r.id} style={{ borderBottom: "1px solid #F0EEE9" }}>
                  <Link
                    href={`/articulo/${r.slug}`}
                    onClick={handleClose}
                    className="flex items-center gap-3 px-4 py-3 no-underline hover:bg-gray-50 transition-colors"
                  >
                    {(r.ogImage || r.featuredImage) ? (
                      <img
                        src={r.ogImage || r.featuredImage || ""}
                        alt={r.title}
                        className="w-12 h-9 object-cover rounded-lg flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-12 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}
                      >
                        <span className="text-white text-xs font-bold">CA</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{r.title}</p>
                      {r.categoryName && (
                        <p className="text-xs mt-0.5" style={{ color: "#9B9B9B" }}>{r.categoryName}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-sm text-center" style={{ color: "#9B9B9B" }}>
              Sin resultados para "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data: categories } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E3DE" }}>
      {/* Top bar */}
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
              Curioso Ando
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors no-underline"
                style={{
                  color: location === `/categoria/${cat.slug}` ? "#FFFFFF" : "#4A4A4A",
                  background: location === `/categoria/${cat.slug}` ? "#2B037D" : "transparent",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Right side: search + auth */}
          <div className="flex items-center gap-2">
            {/* Search — desktop only */}
            <div className="hidden md:block">
              <NavSearch />
            </div>

            {isAuthenticated ? (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium no-underline"
                style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}
              >
                <User className="w-4 h-4" />
                Panel
              </Link>
            ) : (
              <a
                href={getLoginUrl()}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium no-underline"
                style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Ingresar con Google
              </a>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-md"
              style={{ color: "#1A1A1A" }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid #E5E3DE" }}>
          <div className="container py-3 flex flex-col gap-1">
            {/* Mobile search */}
            <div className="px-1 pb-2" style={{ borderBottom: "1px solid #E5E3DE" }}>
              <MobileSearch onClose={() => setMenuOpen(false)} />
            </div>
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="px-4 py-2.5 rounded-md text-sm font-medium no-underline"
                style={{ color: "#1A1A1A" }}
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <div className="border-t mt-2 pt-2" style={{ borderColor: "#E5E3DE" }}>
              {isAuthenticated ? (
                <Link
                  href="/admin"
                  className="px-4 py-2.5 rounded-md text-sm font-medium no-underline flex items-center gap-2"
                  style={{ color: "#1A1A1A" }}
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Panel Admin
                </Link>
              ) : (
                <a
                  href={getLoginUrl()}
                  className="px-4 py-2.5 rounded-md text-sm font-medium no-underline flex items-center gap-2"
                  style={{ color: "#1A1A1A" }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Ingresar con Google
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// Simple inline search for mobile menu
function MobileSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const { data: results, isFetching } = trpc.articles.search.useQuery(
    { q: query },
    { enabled: query.trim().length >= 2 }
  );

  return (
    <div>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: "#F8F7F4", border: "1px solid #E5E3DE" }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#9B9B9B" }} />
        <input
          type="text"
          placeholder="Buscar artículos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "#1A1A1A" }}
        />
        {query && (
          <button onClick={() => setQuery("")} style={{ color: "#9B9B9B" }}>
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {query.trim().length >= 2 && (
        <div className="mt-2 rounded-lg overflow-hidden" style={{ border: "1px solid #E5E3DE" }}>
          {isFetching ? (
            <p className="p-3 text-sm text-center" style={{ color: "#9B9B9B" }}>Buscando...</p>
          ) : results && results.length > 0 ? (
            results.map((r) => (
              <Link
                key={r.id}
                href={`/articulo/${r.slug}`}
                onClick={onClose}
                className="flex items-center gap-2 px-3 py-2 no-underline hover:bg-gray-50"
                style={{ borderBottom: "1px solid #F0EEE9" }}
              >
                <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{r.title}</p>
              </Link>
            ))
          ) : (
            <p className="p-3 text-sm text-center" style={{ color: "#9B9B9B" }}>Sin resultados</p>
          )}
        </div>
      )}
    </div>
  );
}
