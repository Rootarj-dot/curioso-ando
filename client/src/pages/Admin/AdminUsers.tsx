import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Users, Shield, User, Calendar, Mail, RefreshCw, Search, Crown, Clock } from "lucide-react";
import { toast } from "sonner";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RoleBadge({ role }: { role: string | null | undefined }) {
  if (role === "admin") {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ background: "#F0ECFF", color: "#2B037D", border: "1px solid #C4B5FD" }}
      >
        <Crown className="w-3 h-3" />
        Admin
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" }}
    >
      <User className="w-3 h-3" />
      Usuario
    </span>
  );
}

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const [changingId, setChangingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [recentLimit, setRecentLimit] = useState(10);

  // Full user list for role management
  const { data: allUsers, isLoading: loadingAll } = trpc.users.list.useQuery();

  // Recent users list
  const {
    data: recentUsers,
    isLoading: loadingRecent,
    refetch: refetchRecent,
    isFetching: fetchingRecent,
  } = trpc.users.recentList.useQuery({ limit: recentLimit }, { refetchOnWindowFocus: false });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Rol actualizado correctamente");
      utils.users.list.invalidate();
      utils.users.recentList.invalidate();
      setChangingId(null);
    },
    onError: (e) => {
      toast.error("Error: " + e.message);
      setChangingId(null);
    },
  });

  const handleRoleChange = (id: number, newRole: "user" | "admin") => {
    setChangingId(id);
    updateRoleMutation.mutate({ id, role: newRole });
  };

  const filteredAll = allUsers?.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}
            >
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                Gestión de Usuarios
              </h1>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>
                Administra roles y consulta los últimos registros
              </p>
            </div>
          </div>
          <div className="text-sm px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F0EEE9", color: "#6B6B6B" }}>
            {allUsers?.length ?? 0} usuario{allUsers?.length !== 1 ? "s" : ""} en total
          </div>
        </div>

        {/* ── Últimos usuarios registrados ── */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "#2B037D" }} />
              <h2 className="font-semibold text-base" style={{ color: "#1A1A1A" }}>
                Últimos usuarios registrados
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: "#6B6B6B" }}>Mostrar:</span>
              {[5, 10, 20, 50].map((n) => (
                <button
                  key={n}
                  onClick={() => setRecentLimit(n)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: recentLimit === n ? "linear-gradient(135deg, #2B037D, #5B2C8F)" : "#F3F4F6",
                    color: recentLimit === n ? "#FFFFFF" : "#4A4A4A",
                  }}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => refetchRecent()}
                disabled={fetchingRecent}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                style={{ background: "#F3F0FF", color: "#2B037D" }}
              >
                <RefreshCw className={`w-3 h-3 ${fetchingRecent ? "animate-spin" : ""}`} />
                Actualizar
              </button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E3DE", backgroundColor: "#FFFFFF" }}>
            {loadingRecent ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-2" />
                <p className="text-sm" style={{ color: "#6B6B6B" }}>Cargando...</p>
              </div>
            ) : !recentUsers || recentUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-10 h-10 mx-auto mb-2" style={{ color: "#D1D5DB" }} />
                <p className="text-sm" style={{ color: "#6B6B6B" }}>No hay usuarios registrados aún</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E3DE", backgroundColor: "#F9F8F6" }}>
                      <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "#6B6B6B" }}>#</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "#6B6B6B" }}>Usuario</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs hidden md:table-cell" style={{ color: "#6B6B6B" }}>Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs" style={{ color: "#6B6B6B" }}>Rol</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs hidden sm:table-cell" style={{ color: "#6B6B6B" }}>Fecha de registro</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs hidden lg:table-cell" style={{ color: "#6B6B6B" }}>Último acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className="transition-colors"
                        style={{ borderBottom: "1px solid #F3F4F6" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFAF9")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td className="px-4 py-3 text-xs" style={{ color: "#9CA3AF" }}>{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}
                            >
                              {user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="font-medium truncate" style={{ color: "#1A1A1A" }}>
                              {user.name || "Sin nombre"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell" style={{ color: "#6B6B6B" }}>
                          {user.email || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs" style={{ color: "#6B6B6B" }}>
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs" style={{ color: "#6B6B6B" }}>
                          {formatDateTime(user.lastSignedIn)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ── Gestión de roles ── */}
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: "#2B037D" }} />
              <h2 className="font-semibold text-base" style={{ color: "#1A1A1A" }}>
                Gestión de roles
              </h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#9CA3AF" }} />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-4 py-1.5 rounded-lg text-sm border outline-none"
                style={{ border: "1px solid #E5E3DE", color: "#1A1A1A", backgroundColor: "#FFFFFF" }}
              />
            </div>
          </div>

          {/* Role Legend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E3DE" }}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4" style={{ color: "#2B037D" }} />
                <span className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>Admin</span>
              </div>
              <p className="text-xs" style={{ color: "#6B6B6B" }}>
                Acceso completo: puede publicar artículos, gestionar medios, categorías y usuarios.
              </p>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E3DE" }}>
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4" style={{ color: "#6B6B6B" }} />
                <span className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>Usuario</span>
              </div>
              <p className="text-xs" style={{ color: "#6B6B6B" }}>
                Solo puede ver el sitio público. Sin acceso al panel de administración.
              </p>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E3DE", backgroundColor: "#FFFFFF" }}>
            {loadingAll ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
                <p className="text-sm" style={{ color: "#6B6B6B" }}>Cargando usuarios...</p>
              </div>
            ) : !filteredAll || filteredAll.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#C8C5BE" }} />
                <p className="font-medium" style={{ color: "#1A1A1A" }}>
                  {search ? "No se encontraron usuarios" : "No hay usuarios registrados"}
                </p>
                <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>
                  Los usuarios aparecerán aquí cuando inicien sesión.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E3DE", backgroundColor: "#F8F7F4" }}>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Usuario</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden md:table-cell" style={{ color: "#6B6B6B" }}>Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: "#6B6B6B" }}>Registrado</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider hidden lg:table-cell" style={{ color: "#6B6B6B" }}>Último acceso</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAll.map((user, idx) => (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: idx < filteredAll.length - 1 ? "1px solid #F0EEE9" : "none",
                        }}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                              style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}
                            >
                              {user.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{user.name || "Sin nombre"}</p>
                              <p className="text-xs" style={{ color: "#9B9890" }}>{user.loginMethod || "google"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "#9B9890" }} />
                            <span className="text-sm" style={{ color: "#4A4A4A" }}>{user.email || "—"}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "#9B9890" }} />
                            <span className="text-sm" style={{ color: "#4A4A4A" }}>{formatDate(user.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-sm" style={{ color: "#4A4A4A" }}>{formatDate(user.lastSignedIn)}</span>
                        </td>
                        <td className="px-5 py-4">
                          {changingId === user.id ? (
                            <div className="flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#5B2C8F" }} />
                              <span className="text-xs" style={{ color: "#6B6B6B" }}>Actualizando...</span>
                            </div>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as "user" | "admin")}
                              className="text-sm px-3 py-1.5 rounded-lg border font-medium"
                              style={{
                                borderColor: user.role === "admin" ? "#2B037D" : "#E5E3DE",
                                backgroundColor: user.role === "admin" ? "#F0ECFF" : "#F8F7F4",
                                color: user.role === "admin" ? "#2B037D" : "#4A4A4A",
                                outline: "none",
                              }}
                            >
                              <option value="user">Usuario</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs mt-3" style={{ color: "#9B9890" }}>
            Nota: Solo los usuarios que hayan iniciado sesión al menos una vez aparecen en esta lista.
            Para dar acceso a alguien, pídele que inicie sesión con Google primero.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
