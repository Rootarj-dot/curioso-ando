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

export interface DraftTriviaItem {
  id: number;
  pregunta: string;
  respuesta: string;
  opcionCorrecta: string;
  opcionIncorrecta: string;
  opciones?: string | null;
  opcionCorrectaIndex?: number | null;
  icono: string | null;
  color: string | null;
}

const MAX_TRIVIA_QUESTIONS = 5;
const EMPTY_OPTIONS = Array.from({ length: 5 }, () => "");

function parseTriviaOptions(item: Pick<DraftTriviaItem, "opcionCorrecta" | "opcionIncorrecta" | "opciones" | "opcionCorrectaIndex">) {
  try {
    const parsed = item.opciones ? JSON.parse(item.opciones) : null;
    if (Array.isArray(parsed)) {
      const normalized = parsed.slice(0, 5).map((option) => String(option ?? ""));
      while (normalized.length < 5) normalized.push("");
      return normalized;
    }
  } catch {
    // Fall back to legacy fields below.
  }

  return [item.opcionCorrecta || "", item.opcionIncorrecta || "", "", "", ""];
}

function normalizeCorrectIndex(value: number | null | undefined) {
  return typeof value === "number" && value >= 0 && value <= 4 ? value : 0;
}

function buildTriviaPayload(options: string[], correctIndex: number) {
  const trimmedOptions = options.map((option) => option.trim());
  const correctOption = trimmedOptions[correctIndex] || "";
  const firstIncorrect = trimmedOptions.find((option, index) => index !== correctIndex && option) || "";

  return {
    opciones: JSON.stringify(trimmedOptions),
    opcionCorrectaIndex: correctIndex,
    opcionCorrecta: correctOption,
    opcionIncorrecta: firstIncorrect,
  };
}


interface TriviaEditorProps {
  articleId?: number;
  draftItems?: DraftTriviaItem[];
  onDraftItemsChange?: (items: DraftTriviaItem[]) => void;
}

export function TriviaEditor({ articleId, draftItems = [], onDraftItemsChange }: TriviaEditorProps) {
  const utils = trpc.useUtils();
  const isDraftMode = !articleId;
  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [opciones, setOpciones] = useState<string[]>(EMPTY_OPTIONS);
  const [opcionCorrectaIndex, setOpcionCorrectaIndex] = useState(0);
  const [icono, setIcono] = useState("HelpCircle");
  const [color, setColor] = useState("#7C3AED");

  const { data: persistedTriviaList = [] } = trpc.trivia.listByArticle.useQuery(
    { articleId: articleId ?? 0 },
    { enabled: !isDraftMode }
  );
  const triviaList: DraftTriviaItem[] = isDraftMode ? draftItems : persistedTriviaList;
  const questionCount = triviaList.length;
  const hasReachedQuestionLimit = questionCount >= MAX_TRIVIA_QUESTIONS;

  const createMutation = trpc.trivia.create.useMutation({
    onSuccess: () => {
      toast.success("Pregunta creada");
      if (articleId) utils.trivia.listByArticle.invalidate({ articleId });
      resetForm();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const updateMutation = trpc.trivia.update.useMutation({
    onSuccess: () => {
      toast.success("Pregunta actualizada");
      if (articleId) utils.trivia.listByArticle.invalidate({ articleId });
      resetForm();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const deleteMutation = trpc.trivia.delete.useMutation({
    onSuccess: () => {
      toast.success("Pregunta eliminada");
      if (articleId) utils.trivia.listByArticle.invalidate({ articleId });
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const resetForm = () => {
    setPregunta("");
    setRespuesta("");
    setOpciones(EMPTY_OPTIONS);
    setOpcionCorrectaIndex(0);
    setIcono("HelpCircle");
    setColor("#7C3AED");
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: DraftTriviaItem) => {
    setEditingId(item.id);
    setPregunta(item.pregunta);
    setRespuesta(item.respuesta);
    setOpciones(parseTriviaOptions(item));
    setOpcionCorrectaIndex(normalizeCorrectIndex(item.opcionCorrectaIndex));
    setIcono(item.icono || "HelpCircle");
    setColor(item.color || "#7C3AED");
    setShowForm(true);
  };

  const updateOption = (index: number, value: string) => {
    setOpciones((current) => current.map((option, optionIndex) => (optionIndex === index ? value : option)));
  };

  const handleSubmit = () => {
    const trimmedOptions = opciones.map((option) => option.trim());
    const hasFiveOptions = trimmedOptions.every(Boolean);
    const correctIndex = normalizeCorrectIndex(opcionCorrectaIndex);

    if (!pregunta.trim() || !respuesta.trim() || !hasFiveOptions) {
      toast.error("Completa la pregunta, la respuesta y las 5 opciones");
      return;
    }

    const payload = buildTriviaPayload(trimmedOptions, correctIndex);

    if (!editingId && hasReachedQuestionLimit) {
      toast.error("Solo puedes agregar hasta 5 preguntas trivia por artículo");
      return;
    }

    if (isDraftMode) {
      const draftItem: DraftTriviaItem = {
        id: editingId ?? -Date.now(),
        pregunta,
        respuesta,
        ...payload,
        icono,
        color,
      };

      if (editingId) {
        onDraftItemsChange?.(draftItems.map((item) => (item.id === editingId ? draftItem : item)));
        toast.success("Pregunta actualizada");
      } else {
        onDraftItemsChange?.([...draftItems, draftItem]);
        toast.success("Pregunta agregada al borrador");
      }
      resetForm();
      return;
    }

    if (!articleId) {
      toast.error("Guarda el artículo antes de guardar preguntas trivia");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, pregunta, respuesta, ...payload, icono, color });
    } else {
      createMutation.mutate({ articleId, pregunta, respuesta, ...payload, icono, color });
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
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
            {questionCount}/{MAX_TRIVIA_QUESTIONS}
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="mt-3 flex flex-col gap-3">
          {/* Lista de preguntas existentes */}
          {triviaList.map((item, itemIndex) => (
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
                    <p className="text-[11px] font-semibold text-purple-600 mb-0.5">Pregunta {itemIndex + 1}</p>
                    <p className="text-xs font-semibold text-foreground line-clamp-2">{item.pregunta}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      ✓ {item.opcionCorrecta} · 5 opciones configuradas
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
                    onClick={() => {
                      if (isDraftMode) {
                        onDraftItemsChange?.(draftItems.filter((draftItem) => draftItem.id !== item.id));
                        toast.success("Pregunta eliminada");
                      } else {
                        deleteMutation.mutate({ id: item.id });
                      }
                    }}
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
                {editingId ? "Editar pregunta" : `Nueva pregunta ${Math.min(questionCount + 1, MAX_TRIVIA_QUESTIONS)} de ${MAX_TRIVIA_QUESTIONS}`}
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
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-muted-foreground block font-medium">Opciones de respuesta *</label>
                  <span className="text-[11px] text-green-600 font-medium">Marca la correcta</span>
                </div>
                {opciones.map((option, index) => {
                  const isCorrect = opcionCorrectaIndex === index;
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOpcionCorrectaIndex(index)}
                        className={`w-8 h-8 rounded-full border text-xs font-bold transition-colors ${
                          isCorrect
                            ? "bg-green-600 border-green-600 text-white"
                            : "bg-background border-border text-muted-foreground hover:border-green-400"
                        }`}
                        aria-label={`Marcar opción ${index + 1} como correcta`}
                        title="Marcar como correcta"
                      >
                        {isCorrect ? "✓" : index + 1}
                      </button>
                      <input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Opción ${index + 1}`}
                        className={`w-full text-sm border rounded px-2 py-1.5 bg-background focus:outline-none focus:ring-1 ${
                          isCorrect
                            ? "border-green-300 focus:ring-green-500"
                            : "border-border focus:ring-purple-500"
                        }`}
                      />
                    </div>
                  );
                })}
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
          ) : hasReachedQuestionLimit ? (
            <div className="text-xs text-green-700 border border-green-200 rounded-lg p-2 bg-green-50 text-center font-medium">
              Ya configuraste las 5 preguntas trivia permitidas para este artículo.
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700 border border-dashed border-purple-300 rounded-lg p-2 hover:bg-purple-50 transition-colors w-full justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar pregunta trivia ({questionCount}/{MAX_TRIVIA_QUESTIONS})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
