import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Lightbulb, Star, FlaskConical,
  Brain, Globe, Zap, Telescope, Waves, Rocket, Palette, Leaf,
  Atom, Flame, Sparkles, BookOpen, Cpu, Heart
} from "lucide-react";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

const ICONOS_SUGERIDOS: { name: string; Icon: LucideIcon }[] = [
  { name: "Lightbulb", Icon: Lightbulb },
  { name: "Star", Icon: Star },
  { name: "FlaskConical", Icon: FlaskConical },
  { name: "Brain", Icon: Brain },
  { name: "Globe", Icon: Globe },
  { name: "Zap", Icon: Zap },
  { name: "Telescope", Icon: Telescope },
  { name: "Waves", Icon: Waves },
  { name: "Rocket", Icon: Rocket },
  { name: "Palette", Icon: Palette },
  { name: "Leaf", Icon: Leaf },
  { name: "Atom", Icon: Atom },
  { name: "Flame", Icon: Flame },
  { name: "Sparkles", Icon: Sparkles },
  { name: "BookOpen", Icon: BookOpen },
  { name: "Cpu", Icon: Cpu },
  { name: "Heart", Icon: Heart },
];

// Mapa para renderizar íconos por nombre
const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICONOS_SUGERIDOS.map(({ name, Icon }) => [name, Icon])
);

function RenderIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = ICON_MAP[name] || Lightbulb;
  return <Icon className={className} style={style} />;
}

interface FormState {
  titulo: string;
  contenido: string;
  icono: string;
  color: string;
}

const DEFAULT_FORM: FormState = { titulo: "", contenido: "", icono: "Lightbulb", color: "#7C3AED" };

export default function AdminDatosCuriosos() {
  const utils = trpc.useUtils();
  const { data: datos, isLoading } = trpc.datosCuriosos.listAll.useQuery();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const createMutation = trpc.datosCuriosos.create.useMutation({
    onSuccess: () => {
      utils.datosCuriosos.listAll.invalidate();
      utils.datosCuriosos.listActivos.invalidate();
      toast.success("Dato curioso creado");
      setShowForm(false);
      setForm(DEFAULT_FORM);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateMutation = trpc.datosCuriosos.update.useMutation({
    onSuccess: () => {
      utils.datosCuriosos.listAll.invalidate();
      utils.datosCuriosos.listActivos.invalidate();
      toast.success("Dato curioso actualizado");
      setShowForm(false);
      setEditId(null);
      setForm(DEFAULT_FORM);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const deleteMutation = trpc.datosCuriosos.delete.useMutation({
    onSuccess: () => {
      utils.datosCuriosos.listAll.invalidate();
      utils.datosCuriosos.listActivos.invalidate();
      toast.success("Dato curioso eliminado");
      setDeleteId(null);
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const toggleActivoMutation = trpc.datosCuriosos.update.useMutation({
    onSuccess: () => {
      utils.datosCuriosos.listAll.invalidate();
      utils.datosCuriosos.listActivos.invalidate();
    },
  });

  function openCreate() {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEdit(d: NonNullable<typeof datos>[0]) {
    setEditId(d.id);
    setForm({ titulo: d.titulo, contenido: d.contenido, icono: d.icono || "💡", color: d.color || "#7C3AED" });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.titulo.trim() || !form.contenido.trim()) {
      toast.error("Completa título y contenido");
      return;
    }
    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif", color: "#1A1A1A" }}>
              Datos Curiosos
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>
              Aparecen en el sidebar de los artículos como tarjetas interactivas.
            </p>
          </div>
          <Button onClick={openCreate} style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo dato
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-4 text-center" style={{ background: "#fff", border: "1px solid #E5E3DE" }}>
            <p className="text-2xl font-bold" style={{ color: "#2B037D" }}>{datos?.length ?? 0}</p>
            <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>Total</p>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: "#fff", border: "1px solid #E5E3DE" }}>
            <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>{datos?.filter(d => d.activo).length ?? 0}</p>
            <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>Activos</p>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: "#fff", border: "1px solid #E5E3DE" }}>
            <p className="text-2xl font-bold" style={{ color: "#9B9B9B" }}>{datos?.filter(d => !d.activo).length ?? 0}</p>
            <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>Inactivos</p>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "#E5E3DE" }} />
            ))}
          </div>
        ) : !datos?.length ? (
          <div className="text-center py-16 rounded-xl" style={{ background: "#fff", border: "1px solid #E5E3DE" }}>
            <Lightbulb className="w-12 h-12 mx-auto mb-3" style={{ color: "#C4B5FD" }} />
            <p className="font-semibold" style={{ color: "#1A1A1A" }}>No hay datos curiosos todavía</p>
            <p className="text-sm mt-1 mb-4" style={{ color: "#6B6B6B" }}>Agrega el primero para que aparezca en el sidebar de los artículos.</p>
            <Button onClick={openCreate} style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}>
              <Plus className="w-4 h-4 mr-2" /> Crear dato curioso
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {datos.map((d) => (
              <div
                key={d.id}
                className="flex items-start gap-4 rounded-xl p-4 transition-shadow hover:shadow-sm"
                style={{ background: "#fff", border: "1px solid #E5E3DE", opacity: d.activo ? 1 : 0.6 }}
              >
                {/* Icono */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${d.color}22`, border: `2px solid ${d.color}44` }}
                >
                  <RenderIcon name={d.icono || "Lightbulb"} className="w-6 h-6" style={{ color: d.color || "#7C3AED" }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm" style={{ color: "#1A1A1A" }}>{d.titulo}</p>
                    {!d.activo && (
                      <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                    )}
                  </div>
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "#6B6B6B" }}>{d.contenido}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    title={d.activo ? "Desactivar" : "Activar"}
                    onClick={() => toggleActivoMutation.mutate({ id: d.id, activo: !d.activo })}
                    className="h-8 w-8 p-0"
                  >
                    {d.activo ? <Eye className="w-4 h-4" style={{ color: "#16A34A" }} /> : <EyeOff className="w-4 h-4" style={{ color: "#9B9B9B" }} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(d)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-4 h-4" style={{ color: "#7C3AED" }} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(d.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: "#DC2626" }} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) { setEditId(null); setForm(DEFAULT_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Poppins, sans-serif" }}>
              {editId !== null ? "Editar dato curioso" : "Nuevo dato curioso"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preview */}
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{ background: `${form.color}15`, border: `1px solid ${form.color}40` }}
            >
              <RenderIcon name={form.icono} className="w-6 h-6" style={{ color: form.color }} />
              <div>
                <p className="font-bold text-sm" style={{ color: form.color }}>{form.titulo || "Título del dato"}</p>
                <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>{form.contenido || "El contenido aparecerá aquí..."}</p>
              </div>
            </div>

            {/* Icono */}
            <div>
              <Label className="text-xs font-semibold mb-2 block">Ícono</Label>
              <div className="flex flex-wrap gap-2">
                {ICONOS_SUGERIDOS.map(({ name, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icono: name }))}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      background: form.icono === name ? `${form.color}30` : "#F3F4F6",
                      border: form.icono === name ? `2px solid ${form.color}` : "2px solid transparent",
                    }}
                    title={name}
                  >
                    <Icon className="w-5 h-5" style={{ color: form.icono === name ? form.color : "#6B6B6B" }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <Label className="text-xs font-semibold mb-2 block">Color de acento</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                />
                <Input
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  placeholder="#7C3AED"
                  className="flex-1 font-mono text-sm"
                />
                {/* Presets */}
                {["#7C3AED", "#2563EB", "#DC2626", "#16A34A", "#D97706", "#DB2777"].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full border-2 flex-shrink-0"
                    style={{ background: c, borderColor: form.color === c ? "#1A1A1A" : "transparent" }}
                  />
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <Label className="text-xs font-semibold mb-1 block">Título *</Label>
              <Input
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                placeholder="¿Sabías que...?"
                maxLength={255}
              />
            </div>

            {/* Contenido */}
            <div>
              <Label className="text-xs font-semibold mb-1 block">Contenido *</Label>
              <Textarea
                value={form.contenido}
                onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
                placeholder="El dato curioso completo que verá el lector..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}
            >
              {isPending ? "Guardando..." : editId !== null ? "Guardar cambios" : "Crear dato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar dato curioso?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId !== null && deleteMutation.mutate({ id: deleteId })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
