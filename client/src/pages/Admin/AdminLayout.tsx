import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { LayoutDashboard, FileText, Image, Search, LogOut, Home, Plus, Users, Tag, Lightbulb, Menu, X, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/articulos", label: "Artículos", icon: FileText },
  { href: "/admin/nuevo", label: "Nuevo Artículo", icon: Plus },
  { href: "/admin/medios", label: "Medios", icon: Image },
  { href: "/admin/categorias", label: "Categorías", icon: Tag },
  { href: "/admin/datos-curiosos", label: "Datos Curiosos", icon: Lightbulb },
  { href: "/admin/redes-sociales", label: "Redes Sociales", icon: Share2 },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F7F4" }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F7F4" }}>
        <div className="text-center px-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-bold text-2xl mb-2" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>Curioseando Ando</h1>
          <p className="mb-6" style={{ color: "#6B6B6B" }}>Debes iniciar sesión para acceder al panel.</p>
          <a
            href={getLoginUrl()}
            className="px-6 py-3 rounded-lg font-medium no-underline"
            style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin" || user.accessStatus === "blocked") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F7F4" }}>
        <div className="text-center px-4 max-w-md">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
            <Search className="w-8 h-8 text-white" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] mb-2" style={{ color: "#2B037D" }}>Error 403</p>
          <h1 className="font-bold text-2xl mb-2" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>Acceso no autorizado</h1>
          <p className="mb-6" style={{ color: "#6B6B6B" }}>Tu cuenta no tiene permisos administrativos o se encuentra restringida.</p>
          <Link
            href="/"
            className="px-6 py-3 rounded-lg font-medium no-underline inline-block"
            style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid #E5E3DE" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
            <Search className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>Curioseando Ando</p>
            <p className="text-xs" style={{ color: "#6B6B6B" }}>Panel Admin</p>
          </div>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          className="lg:hidden p-1.5 rounded-md"
          style={{ color: "#6B6B6B" }}
          onClick={() => setSidebarOpen(false)}
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 no-underline text-sm font-medium transition-colors"
              style={{
                color: active ? "#FFFFFF" : "#4A4A4A",
                background: active ? "linear-gradient(135deg, #2B037D, #5B2C8F)" : "transparent",
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3" style={{ borderTop: "1px solid #E5E3DE" }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{user?.name || "Usuario"}</p>
            <p className="text-xs truncate" style={{ color: "#6B6B6B" }}>{user?.role}</p>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg no-underline text-sm font-medium mb-1" style={{ color: "#2B037D", background: "#F3F0FF" }}>
          <Home className="w-4 h-4" />
          ← Ver sitio público
        </Link>
        <button
          onClick={() => logoutMutation.mutate()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sm transition-colors"
          style={{ color: "#ef4444" }}
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F8F7F4" }}>

      {/* ── Mobile overlay backdrop ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className="fixed top-0 left-0 h-full z-50 flex flex-col w-64 transition-transform duration-300 lg:static lg:translate-x-0 lg:flex-shrink-0"
        style={{
          backgroundColor: "#FFFFFF",
          borderRight: "1px solid #E5E3DE",
          transform: sidebarOpen ? "translateX(0)" : undefined,
        }}
      >
        {/* On mobile: hide by default via CSS class, show via JS state */}
        <div
          className="flex flex-col h-full"
          style={{ display: "flex" }}
        >
          <SidebarContent />
        </div>
      </aside>

      {/* ── Wrapper for topbar + content ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* ── Mobile top bar ── */}
        <header
          className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14"
          style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E5E3DE" }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md"
            style={{ color: "#1A1A1A" }}
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              <Search className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
              Panel Admin
            </span>
          </div>
          <Link href="/" className="no-underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#F3F0FF", color: "#2B037D" }}>
            <Home className="w-3.5 h-3.5" />
            Inicio
          </Link>
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* ── CSS: hide sidebar on mobile unless open ── */}
      <style>{`
        @media (max-width: 1023px) {
          aside.fixed {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
