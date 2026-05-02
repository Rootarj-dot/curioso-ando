import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Search, X, GripVertical, Plus, Check } from "lucide-react";

interface ArticleOption {
  id: number;
  title: string;
  slug: string;
  featuredImage?: string | null;
  ogImage?: string | null;
}

interface SectionProps {
  label: string;
  selectedIds: number[];
  allArticles: ArticleOption[];
  onChange: (ids: number[]) => void;
  isLoading?: boolean;
  error?: string | null;
}

function ArticleSelector({ label, selectedIds, allArticles, onChange, isLoading, error }: SectionProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = allArticles.filter(
    (a) =>
      !selectedIds.includes(a.id) &&
      a.title.toLowerCase().includes(search.toLowerCase())
  );

  const selected = selectedIds
    .map((id) => allArticles.find((a) => a.id === id))
    .filter(Boolean) as ArticleOption[];

  const add = (id: number) => {
    onChange([...selectedIds, id]);
    setSearch("");
  };

  const remove = (id: number) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#6B6B6B" }}>
        {label}
      </p>

      {/* Selected articles */}
      <div className="space-y-1.5 mb-2">
        {selected.length === 0 && (
          <p className="text-xs italic" style={{ color: "#9B9B9B" }}>
            Sin artículos seleccionados
          </p>
        )}
        {selected.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            style={{ background: "#F0EDF8", border: "1px solid #D4C9F0" }}
          >
            <GripVertical className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9B9B9B" }} />
            {(a.featuredImage || a.ogImage) && (
              <img
                src={a.featuredImage || a.ogImage || ""}
                alt=""
                className="w-8 h-8 rounded object-cover flex-shrink-0"
              />
            )}
            <span className="text-xs flex-1 line-clamp-1" style={{ color: "#1A1A1A" }}>
              {a.title}
            </span>
            <button
              onClick={() => remove(a.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-3.5 h-3.5" style={{ color: "#7B4FB8" }} />
            </button>
          </div>
        ))}
      </div>

      {/* Add button */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{ background: "#2B037D", color: "#fff" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar artículo
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-1 w-full rounded-xl shadow-xl z-50 overflow-hidden"
            style={{ background: "#fff", border: "1px solid #E5E3DE", minWidth: 260 }}
          >
            <div className="p-2 border-b" style={{ borderColor: "#E5E3DE" }}>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "#F8F7F4" }}>
                <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9B9B9B" }} />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar artículo..."
                  className="text-xs flex-1 bg-transparent outline-none"
                  style={{ color: "#1A1A1A" }}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {isLoading && (
                <p className="text-xs text-center py-4" style={{ color: "#9B9B9B" }}>
                  Cargando artículos...
                </p>
              )}
              {error && (
                <p className="text-xs text-center py-4" style={{ color: "#e53e3e" }}>
                  Error: {error}
                </p>
              )}
              {!isLoading && !error && filtered.length === 0 && (
                <p className="text-xs text-center py-4" style={{ color: "#9B9B9B" }}>
                  {allArticles.length === 0 ? "No hay artículos publicados" : "No hay más artículos"}
                </p>
              )}
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { add(a.id); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-purple-50 transition-colors text-left"
                >
                  {(a.featuredImage || a.ogImage) && (
                    <img
                      src={a.featuredImage || a.ogImage || ""}
                      alt=""
                      className="w-8 h-8 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <span className="text-xs line-clamp-2 flex-1" style={{ color: "#1A1A1A" }}>
                    {a.title}
                  </span>
                </button>
              ))}
            </div>
            <div className="p-2 border-t" style={{ borderColor: "#E5E3DE" }}>
              <button
                onClick={() => setOpen(false)}
                className="w-full text-xs py-1 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "#6B6B6B" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SidebarArticlesPanel() {
  const { data: adminArticles, error: articlesError, isLoading: articlesLoading } = trpc.articles.adminList.useQuery();
  const { data: currentConfig } = trpc.siteConfig.getSidebarArticles.useQuery();
  const utils = trpc.useUtils();

  const saveMutation = trpc.siteConfig.setSidebarArticles.useMutation({
    onSuccess: () => {
      utils.siteConfig.getSidebarArticles.invalidate();
      utils.siteConfig.getSidebarArticleData.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const [recentIds, setRecentIds] = useState<number[]>([]);
  const [recommendedIds, setRecommendedIds] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setRecentIds(currentConfig.recentIds || []);
      setRecommendedIds(currentConfig.recommendedIds || []);
    }
  }, [currentConfig]);

  const allArticles: ArticleOption[] = (adminArticles || []).map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    featuredImage: (a as any).featuredImage ?? null,
    ogImage: (a as any).ogImage ?? null,
  }));

  const handleSave = () => {
    saveMutation.mutate({ recentIds, recommendedIds });
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#fff", border: "1px solid #E5E3DE" }}
    >
      <h3 className="font-semibold text-sm mb-4" style={{ color: "#1A1A1A", fontFamily: "Poppins, sans-serif" }}>
        Artículos en Sidebar
      </h3>
      <p className="text-xs mb-4" style={{ color: "#6B6B6B" }}>
        Estos artículos aparecerán en el sidebar de <strong>todas las notas</strong> del sitio.
      </p>

      <ArticleSelector
        label="Recientes"
        selectedIds={recentIds}
        allArticles={allArticles}
        onChange={setRecentIds}
        isLoading={articlesLoading}
        error={articlesError?.message ?? null}
      />

      <ArticleSelector
        label="Recomendados"
        selectedIds={recommendedIds}
        allArticles={allArticles}
        onChange={setRecommendedIds}
        isLoading={articlesLoading}
        error={articlesError?.message ?? null}
      />

      <button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#fff" }}
      >
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            Guardado
          </>
        ) : saveMutation.isPending ? (
          "Guardando..."
        ) : (
          "Guardar cambios"
        )}
      </button>
    </div>
  );
}
