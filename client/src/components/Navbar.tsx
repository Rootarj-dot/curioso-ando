import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Menu, X, Search, User } from "lucide-react";

const CATEGORIES = [
  { name: "Noticias", slug: "noticias" },
  { name: "Entretenimiento", slug: "entretenimiento" },
  { name: "Geek", slug: "geek" },
  { name: "Tecnología", slug: "tecnologia" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: "#1C1C1D", borderBottom: "1px solid #3B3D3E" }}>
      {/* Top bar */}
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl" style={{ fontFamily: "Poppins, sans-serif" }}>
              Curioso Ando
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors no-underline"
                style={{
                  color: location === `/categoria/${cat.slug}` ? "#FFFFFF" : "#A0A0A0",
                  background: location === `/categoria/${cat.slug}` ? "#2B037D" : "transparent",
                }}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
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
                <User className="w-4 h-4" />
                Ingresar
              </a>
            )}
            <button
              className="md:hidden p-2 rounded-md"
              style={{ color: "#FFFFFF" }}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden" style={{ backgroundColor: "#1C1C1D", borderTop: "1px solid #3B3D3E" }}>
          <div className="container py-3 flex flex-col gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                className="px-4 py-2.5 rounded-md text-sm font-medium no-underline"
                style={{ color: "#FFFFFF" }}
                onClick={() => setMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
            <div className="border-t mt-2 pt-2" style={{ borderColor: "#3B3D3E" }}>
              {isAuthenticated ? (
                <Link
                  href="/admin"
                  className="px-4 py-2.5 rounded-md text-sm font-medium no-underline flex items-center gap-2"
                  style={{ color: "#FFFFFF" }}
                  onClick={() => setMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Panel Admin
                </Link>
              ) : (
                <a
                  href={getLoginUrl()}
                  className="px-4 py-2.5 rounded-md text-sm font-medium no-underline flex items-center gap-2"
                  style={{ color: "#FFFFFF" }}
                >
                  <User className="w-4 h-4" />
                  Ingresar
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
