import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_OPTIONS = [
  "HelpCircle", "Lightbulb", "Star", "Rocket", "Brain", "Globe", "Zap",
  "FlaskConical", "Telescope", "Cpu", "BookOpen", "Heart", "Sparkles",
  "Leaf", "Flame", "Snowflake", "Music", "Camera", "Trophy",
];

const COLOR_OPTIONS = [
  "#7C3AED", "#2563EB", "#DC2626", "#16A34A", "#D97706", "#DB2777",
  "#0891B2", "#7C3AED", "#4F46E5", "#059669",
];

function LucideIconComponent({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[name];
  if (!Icon) return <HelpCircle className={className} />;
  return <Icon className={className} />;
}

interface TriviaItem {
  id: number;
  articleId: number;
  pregunta: string;
  respuesta: string;
  opcionCorrecta: string;
  opcionIncorrecta: string;
  icono: string | null;
  color: string | null;
}

interface TriviaEditorProps {
  articleId: number;
}

export function TriviaEditor({ articleId }: TriviaEditorProps) {
  const utils = trpc.useUtils();
  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [opcionCorrecta, setOpcionCorrecta] = useState("");
  const [opcionIncorrecta, setOpcionIncorrecta] = useState("");
  const [icono, setIcono] = useState("HelpCircle");
  const [color, setColor] = useState("#7C3AED");

  const { data: triviaList = [] } = trpc.trivia.listByArticle.useQuery({ articleId });

  const createMutation = trpc.trivia.create.useMutation({
    onSuccess: () => {
      toast.success("Pregunta creada");
      utils.trivia.listByArticle.invalidate({ articleId });
      resetForm();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateMutation = trpc.trivia.update.useMutation({
    onSuccess: () => {
      toast.success("Pregunta actualizada");
      utils.trivia.listByArticle.invalidate({ articleId });
      resetForm();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const deleteMutation = trpc.trivia.delete.useMutation({
    onSuccess: () => {
      toast.success("Pregunta eliminada");
      utils.trivia.listByArticle.invalidate({ articleId });
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const resetForm = () => {
    setPregunta("");
    setRespuesta("");
    setOpcionCorrecta("");
    setOpcionIncorrecta("");
    setIcono("HelpCircle");
    setColor("#7C3AED");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: TriviaItem) => {
    setEditingId(item.id);
    setPregunta(item.pregunta);
    setRespuesta(item.respuesta);
    setOpcionCorrecta(item.opcionCorrecta);
    setOpcionIncorrecta(item.opcionIncorrecta);
    setIcono(item.icono || "HelpCircle");
    setColor(item.color || "#7C3AED");
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!pregunta.trim() || !respuesta.trim() || !opcionCorrecta.trim() || !opcionIncorrecta.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, pregunta, respuesta, opcionCorrecta, opcionIncorrecta, icono, color });
    } else {
      createMutation.mutate({ articleId, pregunta, respuesta, opcionCorrecta, opcionIncorrecta, icono, color });
    }
  };

  return (
    <div className="ca-card p-4">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-sm">Preguntas Trivia</h3>
          {triviaList.length > 0 && (
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {triviaList.length}
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="mt-3 flex flex-col gap-3">
          {/* Lista de preguntas existentes */}
          {triviaList.map((item) => (
            <div key={item.id} className="border border-border rounded-lg p-3 bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: item.color || "#7C3AED" }}
                  >
                    <LucideIconComponent name={item.icono || "HelpCircle"} className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground line-clamp-2">{item.pregunta}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      ✓ {item.opcionCorrecta} &nbsp;✗ {item.opcionIncorrecta}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate({ id: item.id })}
                    className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Formulario de nueva pregunta */}
          {showForm ? (
            <div className="border border-purple-200 rounded-lg p-3 bg-purple-50/50 flex flex-col gap-3">
              <p className="text-xs font-semibold text-purple-700">
                {editingId ? "Editar pregunta" : "Nueva pregunta"}
              </p>

              {/* Icono y color */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Ícono</label>
                  <div className="flex flex-wrap gap-1">
                    {ICON_OPTIONS.map((name) => (
                      <button
                        key={name}
                        onClick={() => setIcono(name)}
                        className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                          icono === name ? "bg-purple-600 text-white" : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                        title={name}
                      >
                        <LucideIconComponent name={name} className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Color</label>
                  <div className="flex flex-wrap gap-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          color === c ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Pregunta */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Pregunta *</label>
                <textarea
                  value={pregunta}
                  onChange={(e) => setPregunta(e.target.value)}
                  placeholder="¿Cuál es la capital de Francia?"
                  rows={2}
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Respuesta */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Respuesta (se mostrará oculta) *</label>
                <textarea
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                  placeholder="La capital de Francia es París, conocida como la Ciudad de la Luz..."
                  rows={2}
                  className="w-full text-sm border border-border rounded px-2 py-1.5 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Opciones */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-green-600 mb-1 block font-medium">✓ Opción correcta *</label>
                  <input
                    value={opcionCorrecta}
                    onChange={(e) => setOpcionCorrecta(e.target.value)}
                    placeholder="París"
                    className="w-full text-sm border border-green-200 rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-red-500 mb-1 block font-medium">✗ Opción incorrecta *</label>
                  <input
                    value={opcionIncorrecta}
                    onChange={(e) => setOpcionIncorrecta(e.target.value)}
                    placeholder="Madrid"
                    className="w-full text-sm border border-red-200 rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={resetForm}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> {editingId ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700 border border-dashed border-purple-300 rounded-lg p-2 hover:bg-purple-50 transition-colors w-full justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar pregunta trivia
            </button>
          )}
        </div>
      )}
    </div>
  );
}
