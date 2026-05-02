import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { LayoutDashboard, FileText, Image, Search, LogOut, Home, Plus, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/articulos", label: "Artículos", icon: FileText },
  { href: "/admin/nuevo", label: "Nuevo Artículo", icon: Plus },
  { href: "/admin/medios", label: "Medios", icon: Image },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();
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

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F8F7F4" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-bold text-2xl mb-2" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>Curioso Ando</h1>
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

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F8F7F4" }}>
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ backgroundColor: "#FFFFFF", borderRight: "1px solid #E5E3DE" }}>
        {/* Logo */}
        <div className="p-5" style={{ borderBottom: "1px solid #E5E3DE" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              <Search className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>Curioso Ando</p>
              <p className="text-xs" style={{ color: "#6B6B6B" }}>Panel Admin</p>
            </div>
          </div>
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
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "#1A1A1A" }}>{user?.name || "Usuario"}</p>
              <p className="text-xs truncate" style={{ color: "#6B6B6B" }}>{user?.role}</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg no-underline text-sm" style={{ color: "#6B6B6B" }}>
            <Home className="w-4 h-4" />
            Ver sitio
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
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
