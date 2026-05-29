import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
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
  const { user } = useAuth();
  const { data: categories } = trpc.categories.list.useQuery(undefined, { staleTime: 60_000 });

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E3DE" }}>
      {/* Top bar */}
      <div className="container">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
            </div>
            <span className="font-bold text-lg md:text-xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
              Curioseando Ando
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

            {user?.role === 'admin' && user.accessStatus !== 'blocked' && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium no-underline"
                style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}
              >
                <User className="w-4 h-4" />
                Panel
              </Link>
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
          <div className="container py-4 flex flex-col gap-1">
            {/* Mobile search */}
            <div className="px-1 pb-2" style={{ borderBottom: "1px solid #E5E3DE" }}>
              <MobileSearch onClose={() => setMenuOpen(false)} />
            </div>
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="px-4 py-3 rounded-md text-sm font-medium no-underline flex items-center"
                style={{ color: "#1A1A1A", minHeight: "44px" }}
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <div className="border-t mt-2 pt-2" style={{ borderColor: "#E5E3DE" }}>
              {user?.role === 'admin' && user.accessStatus !== 'blocked' && (
                <Link
                  href="/admin"
                  className="px-4 py-2.5 rounded-md text-sm font-medium no-underline flex items-center gap-2"
                  style={{ color: "#1A1A1A" }}
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Panel Admin
                </Link>
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
