import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { FileText, Image, Plus, Eye, Edit } from "lucide-react";

export default function AdminDashboard() {
  const { data: articles } = trpc.articles.adminList.useQuery();
  const { data: media } = trpc.media.list.useQuery();

  const published = articles?.filter((a) => a.status === "published").length ?? 0;
  const drafts = articles?.filter((a) => a.status === "draft").length ?? 0;
  const total = articles?.length ?? 0;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-white font-bold text-2xl" style={{ fontFamily: "Poppins, sans-serif" }}>
            Dashboard
          </h1>
          <p style={{ color: "#6B6B6B" }}>Bienvenido al panel de administración de Curioso Ando.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total artículos", value: total, icon: FileText, color: "#2B037D" },
            { label: "Publicados", value: published, icon: Eye, color: "#16a34a" },
            { label: "Borradores", value: drafts, icon: Edit, color: "#d97706" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="ca-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: color }}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm" style={{ color: "#6B6B6B" }}>{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/admin/nuevo"
            className="ca-card p-5 flex items-center gap-4 no-underline group transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)" }}>
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold">Nuevo Artículo</p>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>Crear y publicar contenido</p>
            </div>
          </Link>
          <Link
            href="/admin/medios"
            className="ca-card p-5 flex items-center gap-4 no-underline group transition-all hover:-translate-y-1"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3D0FA0, #5B2C8F)" }}>
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white font-bold">Galería de Medios</p>
              <p className="text-sm" style={{ color: "#6B6B6B" }}>{media?.length ?? 0} imágenes subidas</p>
            </div>
          </Link>
        </div>

        {/* Recent articles */}
        <div className="ca-card overflow-hidden">
          <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #E5E3DE" }}>
            <h2 className="text-white font-bold">Artículos Recientes</h2>
            <Link href="/admin/articulos" className="text-sm no-underline" style={{ color: "#7B4FB8" }}>
              Ver todos
            </Link>
          </div>
          <div>
            {!articles || articles.length === 0 ? (
              <div className="p-8 text-center" style={{ color: "#6B6B6B" }}>
                <p>No hay artículos aún.</p>
              </div>
            ) : (
              articles.slice(0, 5).map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-4 p-4 transition-colors"
                  style={{ borderBottom: "1px solid #E5E3DE" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{article.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#6B6B6B" }}>
                      {article.categoryName || "Sin categoría"} ·{" "}
                      {new Date(article.createdAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      background: article.status === "published" ? "rgba(22,163,74,0.2)" : "rgba(217,119,6,0.2)",
                      color: article.status === "published" ? "#16a34a" : "#d97706",
                    }}
                  >
                    {article.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                  <Link href={`/admin/editar/${article.id}`} className="p-1.5 rounded no-underline" style={{ color: "#6B6B6B" }}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
