import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Upload, X, Check, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface MediaGalleryProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]); // strip data:...;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

export function MediaGallery({ onSelect, onClose }: MediaGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const { data: mediaList, refetch } = trpc.media.list.useQuery();
  const uploadMutation = trpc.media.upload.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Imagen subida correctamente");
    },
    onError: (err) => toast.error("Error al subir imagen: " + err.message),
  });
  const deleteMutation = trpc.media.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Imagen eliminada");
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 16 * 1024 * 1024) {
          toast.error(`${file.name} supera el límite de 16MB`);
          continue;
        }
        const base64 = await fileToBase64(file);
        const dims = await getImageDimensions(file);
        await uploadMutation.mutateAsync({
          filename: file.name.replace(/\s+/g, "-"),
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          base64,
          width: dims.width,
          height: dims.height,
        });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelect = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
    >
      <div
        className="w-full max-w-4xl rounded-xl flex flex-col"
        style={{ backgroundColor: "#F8F7F4", border: "1px solid #E5E3DE", maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid #E5E3DE" }}>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" style={{ color: "#7B4FB8" }} />
            <h2 className="text-white font-bold text-lg">Galería de Medios</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: "#6B6B6B" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid #E5E3DE" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
            style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#1A1A1A" }}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Subiendo..." : "Subir imágenes"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedUrl && (
            <button
              onClick={handleSelect}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ml-auto"
              style={{ background: "#16a34a", color: "#1A1A1A" }}
            >
              <Check className="w-4 h-4" />
              Insertar seleccionada
            </button>
          )}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!mediaList || mediaList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16" style={{ color: "#6B6B6B" }}>
              <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">No hay imágenes aún. Sube la primera.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mediaList.map((item) => (
                <div
                  key={item.id}
                  className="relative group cursor-pointer rounded-lg overflow-hidden"
                  style={{
                    border: selectedUrl === item.url ? "2px solid #5B2C8F" : "2px solid transparent",
                    backgroundColor: "#FFFFFF",
                    aspectRatio: "1",
                  }}
                  onClick={() => setSelectedUrl(selectedUrl === item.url ? null : item.url)}
                >
                  <img
                    src={item.url}
                    alt={item.originalName}
                    className="w-full h-full object-cover"
                  />
                  {selectedUrl === item.url && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(91,44,143,0.4)" }}>
                      <Check className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("¿Eliminar esta imagen?")) {
                        deleteMutation.mutate({ id: item.id });
                        if (selectedUrl === item.url) setSelectedUrl(null);
                      }
                    }}
                    className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.7)", color: "#ef4444" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.8)", color: "#3A3A3A" }}
                  >
                    {item.originalName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
