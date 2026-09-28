import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { LayoutDashboard, FileText, Image, LogOut, Home, Plus, Users, Tag, Lightbulb, Menu, X, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

/** Grouped so the sidebar reads as three short lists instead of one long one. */
const NAV_GROUPS = [
  {
    label: "General",
    items: [{ href: "/admin", label: "Resumen", icon: LayoutDashboard }],
  },
  {
    label: "Contenido",
    items: [
      { href: "/admin/nuevo", label: "Nuevo artículo", icon: Plus },
      { href: "/admin/articulos", label: "Artículos", icon: FileText },
      { href: "/admin/medios", label: "Medios", icon: Image },
      { href: "/admin/categorias", label: "Categorías", icon: Tag },
      { href: "/admin/datos-curiosos", label: "Datos curiosos", icon: Lightbulb },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/admin/redes-sociales", label: "Redes sociales", icon: Share2 },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users },
    ],
  },
];

function Gate({ code, title, children, action }: { code?: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="ca-adm-gate">
      <div className="ca-adm-gate__inner">
        <div className="ca-adm-gate__mark">
          <img src="/logo.png" alt="" width={56} height={56} />
        </div>
        {code && <p className="ca-adm-gate__code">{code}</p>}
        <h1>{title}</h1>
        <p>{children}</p>
        {action}
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/"; },
  });

  if (loading) {
    return (
      <div className="ca-adm-gate">
        <div className="ca-adm-spinner" role="status" aria-label="Cargando" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Gate
        title="Curioseando Ando"
        action={<a href={getLoginUrl()} className="ca-adm-btn ca-adm-btn--primary">Iniciar sesión</a>}
      >
        Necesitas iniciar sesión para entrar al panel.
      </Gate>
    );
  }

  if (!user || user.role !== "admin" || user.accessStatus === "blocked") {
    return (
      <Gate
        code="Error 403"
        title="Acceso no autorizado"
        action={<Link href="/" className="ca-adm-btn ca-adm-btn--primary">Volver al inicio</Link>}
      >
        Tu cuenta no tiene permisos administrativos o está restringida.
      </Gate>
    );
  }

  return (
    <div className="ca-adm flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(23, 22, 26, 0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className="ca-adm-side lg:flex-shrink-0" data-open={sidebarOpen}>
        <div className="ca-adm-side__brand">
          <span className="ca-adm-side__mark">
            <img src="/logo.png" alt="" width={38} height={38} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="ca-adm-side__name">Curioseando Ando</span>
            <span className="ca-adm-side__role">Panel</span>
          </span>
          <button
            className="ca-adm-btn lg:hidden"
            style={{ padding: "0.35rem" }}
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X />
          </button>
        </div>

        <nav className="ca-adm-side__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <span className="ca-adm-side__group">{group.label}</span>
              {group.items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="ca-adm-link"
                  aria-current={location === href ? "page" : undefined}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon />
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="ca-adm-side__foot">
          <div className="ca-adm-who">
            <span className="ca-adm-who__avatar">{user?.name?.[0]?.toUpperCase() || "U"}</span>
            <span className="flex-1 min-w-0">
              <span className="ca-adm-who__name">{user?.name || "Usuario"}</span>
              <span className="ca-adm-who__role">{user?.role}</span>
            </span>
          </div>
          <Link href="/" className="ca-adm-btn ca-adm-btn--ghost ca-adm-btn--block" style={{ marginBottom: "0.35rem" }}>
            <Home />
            Ver el sitio
          </Link>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="ca-adm-btn ca-adm-btn--danger ca-adm-btn--block"
          >
            <LogOut />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="ca-adm-topbar lg:hidden">
          <button className="ca-adm-btn" style={{ padding: "0.4rem" }} onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
            <Menu />
          </button>
          <span className="ca-adm-side__mark" style={{ width: "1.9rem", height: "1.9rem" }}>
            <img src="/logo.png" alt="" width={30} height={30} />
          </span>
          <span className="ca-adm-side__name flex-1">Panel</span>
          <Link href="/" className="ca-adm-btn ca-adm-btn--ghost">
            <Home />
            Sitio
          </Link>
        </header>

        <main className="ca-adm-main">{children}</main>
      </div>
    </div>
  );
}
