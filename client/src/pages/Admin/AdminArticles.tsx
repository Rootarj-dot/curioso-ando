import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Plus, Edit, Trash2, Eye, EyeOff, Star, CalendarClock } from "lucide-react";
import { toast } from "sonner";

function isScheduledArticle(article: { status: string; publishedAt?: Date | string | null }) {
  if (article.status !== "published" || !article.publishedAt) return false;
  const publishDate = new Date(article.publishedAt);
  return !Number.isNaN(publishDate.getTime()) && publishDate.getTime() > Date.now();
}

function getArticleStatusDisplay(article: { status: string; publishedAt?: Date | string | null }) {
  if (isScheduledArticle(article)) {
    return {
      label: "Programado",
      background: "rgba(91,44,143,0.15)",
      color: "#5B2C8F",
      icon: <CalendarClock className="w-3 h-3" />,
    };
  }

  if (article.status === "published") {
    return {
      label: "Publicado",
      background: "rgba(22,163,74,0.2)",
      color: "#16a34a",
      icon: <Eye className="w-3 h-3" />,
    };
  }

  return {
    label: "Borrador",
    background: "rgba(217,119,6,0.2)",
    color: "#d97706",
    icon: <EyeOff className="w-3 h-3" />,
  };
}

export default function AdminArticles() {
  const { data: articles, refetch } = trpc.articles.adminList.useQuery();
  const deleteMutation = trpc.articles.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Artículo eliminado"); },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const updateMutation = trpc.articles.update.useMutation({
    onSuccess: () => { refetch(); },
  });

  const toggleStatus = (id: number, current: string) => {
    updateMutation.mutate({
      id,
      status: current === "published" ? "draft" : "published",
      ...(current === "draft" ? { publishedAt: new Date().toISOString() } : {}),
    });
  };

  const toggleFeatured = (id: number, current: boolean) => {
    updateMutation.mutate({ id, featured: !current });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-2xl" style={{ fontFamily: "Poppins, sans-serif" }}>Artículos</h1>
            <p style={{ color: "#6B6B6B" }}>{articles?.length ?? 0} artículos en total</p>
          </div>
          <Link
            href="/admin/nuevo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium no-underline"
            style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}
          >
            <Plus className="w-4 h-4" />
            Nuevo
          </Link>
        </div>

        <div className="ca-card overflow-hidden">
          {!articles || articles.length === 0 ? (
            <div className="p-12 text-center" style={{ color: "#6B6B6B" }}>
              <p className="text-lg font-semibold mb-2" style={{ color: "#1A1A1A" }}>Sin artículos</p>
              <p className="mb-4">Crea tu primer artículo para comenzar.</p>
              <Link href="/admin/nuevo" className="px-4 py-2 rounded-lg text-sm font-medium no-underline" style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}>
                Crear artículo
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E3DE" }}>
                    {["Título", "Categoría", "Estado", "Destacado", "Fecha", "Acciones"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold" style={{ color: "#6B6B6B" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => {
                    const statusDisplay = getArticleStatusDisplay(article);
                    return (
                    <tr key={article.id} style={{ borderBottom: "1px solid #E5E3DE" }}>
                      <td className="px-4 py-3">
                        <p className="font-medium line-clamp-1 max-w-xs" style={{ color: "#1A1A1A" }}>{article.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#5A5C5E" }}>/{article.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="ca-badge">{article.categoryName || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleStatus(article.id, article.status)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
                          style={{
                            background: statusDisplay.background,
                            color: statusDisplay.color,
                          }}
                        >
                          {statusDisplay.icon}
                          {statusDisplay.label}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleFeatured(article.id, article.featured)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: article.featured ? "#f59e0b" : "#5A5C5E" }}
                        >
                          <Star className="w-4 h-4" fill={article.featured ? "#f59e0b" : "none"} />
                        </button>
                      </td>
                      <td className="px-4 py-3" style={{ color: "#6B6B6B" }}>
                        {new Date(article.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/articulo/${article.slug}`}
                            className="p-1.5 rounded no-underline transition-colors"
                            style={{ color: "#6B6B6B" }}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/editar/${article.id}`}
                            className="p-1.5 rounded no-underline transition-colors"
                            style={{ color: "#7B4FB8" }}
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm("¿Eliminar este artículo?")) {
                                deleteMutation.mutate({ id: article.id });
                              }
                            }}
                            className="p-1.5 rounded transition-colors"
                            style={{ color: "#ef4444" }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
