import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Users, Shield, User, Calendar, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.users.list.useQuery();
  const [changingId, setChangingId] = useState<number | null>(null);

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Rol actualizado correctamente");
      utils.users.list.invalidate();
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

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-2xl" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
                Gestión de Usuarios
              </h1>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>
                Administra los roles y permisos de los usuarios registrados
              </p>
            </div>
          </div>
          <div className="text-sm px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F0EEE9", color: "#6B6B6B" }}>
            {users?.length ?? 0} usuario{users?.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Role Legend */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E3DE" }}>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-5 h-5" style={{ color: "#2B037D" }} />
              <span className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>Admin</span>
            </div>
            <p className="text-xs" style={{ color: "#6B6B6B" }}>
              Acceso completo: puede publicar artículos, gestionar medios, categorías y usuarios.
            </p>
          </div>
          <div className="p-4 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E3DE" }}>
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5" style={{ color: "#6B6B6B" }} />
              <span className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>Usuario</span>
            </div>
            <p className="text-xs" style={{ color: "#6B6B6B" }}>
              Solo puede ver el sitio público. Sin acceso al panel de administración.
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E3DE", backgroundColor: "#FFFFFF" }}>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm" style={{ color: "#6B6B6B" }}>Cargando usuarios...</p>
            </div>
          ) : !users || users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#C8C5BE" }} />
              <p className="font-medium" style={{ color: "#1A1A1A" }}>No hay usuarios registrados</p>
              <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>Los usuarios aparecerán aquí cuando inicien sesión.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E3DE", backgroundColor: "#F8F7F4" }}>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Usuario</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Registrado</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Último acceso</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B6B6B" }}>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: idx < users.length - 1 ? "1px solid #F0EEE9" : "none",
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
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "#9B9890" }} />
                          <span className="text-sm" style={{ color: "#4A4A4A" }}>{user.email || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "#9B9890" }} />
                          <span className="text-sm" style={{ color: "#4A4A4A" }}>{formatDate(user.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
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

        {/* Note */}
        <p className="text-xs mt-4" style={{ color: "#9B9890" }}>
          Nota: Solo los usuarios que hayan iniciado sesión al menos una vez aparecen en esta lista.
          Para dar acceso a alguien, pídele que inicie sesión con Google primero.
        </p>
      </div>
    </AdminLayout>
  );
}
