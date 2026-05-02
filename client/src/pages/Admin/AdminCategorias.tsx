import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Pencil, Trash2, Plus, Check, X, Tag } from "lucide-react";

export default function AdminCategorias() {
  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.categories.list.useQuery();

  const createMutation = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setNewName(""); setCreating(false); },
  });
  const updateMutation = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.list.invalidate(); setEditingId(null); setEditName(""); },
  });
  const deleteMutation = trpc.categories.delete.useMutation({
    onSuccess: () => utils.categories.list.invalidate(),
  });

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim() });
  };

  const handleEdit = (id: number, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setDeleteConfirmId(null);
  };

  const handleUpdate = () => {
    if (!editName.trim() || editingId === null) return;
    updateMutation.mutate({ id: editingId, name: editName.trim() });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate({ id });
    setDeleteConfirmId(null);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
            Categorías
          </h1>
          <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>
            Gestiona las categorías que aparecen en el navbar del sitio.
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}
          >
            <Plus className="w-4 h-4" />
            Nueva categoría
          </button>
        )}
      </div>

      {/* New category form */}
      {creating && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-4"
          style={{ background: "#fff", border: "2px solid #2B037D" }}
        >
          <Tag className="w-4 h-4 flex-shrink-0" style={{ color: "#2B037D" }} />
          <input
            autoFocus
            type="text"
            placeholder="Nombre de la categoría..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setCreating(false); setNewName(""); } }}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "#1A1A1A" }}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || createMutation.isPending}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}
          >
            <Check className="w-3.5 h-3.5" />
            Guardar
          </button>
          <button
            onClick={() => { setCreating(false); setNewName(""); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ color: "#6B6B6B" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Categories list */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: "#E5E3DE" }} />
          ))}
        </div>
      )}

      {!isLoading && categories && categories.length === 0 && (
        <div className="text-center py-16 rounded-xl" style={{ background: "#fff", border: "1px solid #E5E3DE" }}>
          <Tag className="w-10 h-10 mx-auto mb-3" style={{ color: "#E5E3DE" }} />
          <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>No hay categorías todavía</p>
          <p className="text-xs mt-1" style={{ color: "#9B9B9B" }}>Crea la primera usando el botón de arriba.</p>
        </div>
      )}

      {!isLoading && categories && categories.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E3DE" }}>
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex items-center gap-4 px-4 py-3 transition-colors"
              style={{
                background: "#fff",
                borderBottom: idx < categories.length - 1 ? "1px solid #E5E3DE" : "none",
              }}
            >
              {editingId === cat.id ? (
                /* Edit mode */
                <>
                  <Tag className="w-4 h-4 flex-shrink-0" style={{ color: "#2B037D" }} />
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(); if (e.key === "Escape") setEditingId(null); }}
                    className="flex-1 bg-transparent outline-none text-sm font-medium border-b"
                    style={{ color: "#1A1A1A", borderColor: "#2B037D" }}
                  />
                  <button
                    onClick={handleUpdate}
                    disabled={!editName.trim() || updateMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: "#6B6B6B" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : deleteConfirmId === cat.id ? (
                /* Delete confirm */
                <>
                  <Tag className="w-4 h-4 flex-shrink-0" style={{ color: "#e53e3e" }} />
                  <span className="flex-1 text-sm" style={{ color: "#e53e3e" }}>
                    ¿Eliminar <strong>{cat.name}</strong>? Los artículos de esta categoría quedarán sin categoría.
                  </span>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: "#e53e3e", color: "#fff" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{ color: "#6B6B6B" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                /* Normal row */
                <>
                  <Tag className="w-4 h-4 flex-shrink-0" style={{ color: "#2B037D" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#1A1A1A" }}>{cat.name}</p>
                    <p className="text-xs" style={{ color: "#9B9B9B" }}>/{cat.slug}</p>
                  </div>
                  <button
                    onClick={() => handleEdit(cat.id, cat.name)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Editar"
                    style={{ color: "#6B6B6B" }}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeleteConfirmId(cat.id); setEditingId(null); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Eliminar"
                    style={{ color: "#e53e3e" }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error messages */}
      {(createMutation.error || updateMutation.error || deleteMutation.error) && (
        <div className="mt-4 p-3 rounded-lg text-sm" style={{ background: "#FFF0F0", color: "#e53e3e", border: "1px solid #FFCDD2" }}>
          {createMutation.error?.message || updateMutation.error?.message || deleteMutation.error?.message}
        </div>
      )}
    </div>
  );
}
