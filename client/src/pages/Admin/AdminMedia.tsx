import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { AdminLayout } from "./AdminLayout";
import { Upload, Trash2, Copy, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
}

export default function AdminMedia() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { data: mediaList, refetch } = trpc.media.list.useQuery();
  const uploadMutation = trpc.media.upload.useMutation({
    onSuccess: () => { refetch(); toast.success("Imagen subida"); },
    onError: (e) => toast.error("Error: " + e.message),
  });
  const deleteMutation = trpc.media.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Imagen eliminada"); },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        if (file.size > 16 * 1024 * 1024) { toast.error(`${file.name} supera 16MB`); continue; }
        const base64 = await fileToBase64(file);
        const dims = await getImageDimensions(file);
        await uploadMutation.mutateAsync({
          filename: file.name.replace(/\s+/g, "-"),
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          base64,
          ...dims,
        });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copiada");
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-bold text-2xl" style={{ fontFamily: "Poppins, sans-serif" }}>Galería de Medios</h1>
            <p style={{ color: "#A0A0A0" }}>{mediaList?.length ?? 0} imágenes</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #2B037D, #5B2C8F)", color: "#FFFFFF" }}
          >
            <Upload className="w-4 h-4" />
            {uploading ? "Subiendo..." : "Subir imágenes"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </div>

        {!mediaList || mediaList.length === 0 ? (
          <div
            className="rounded-xl flex flex-col items-center justify-center py-20 cursor-pointer"
            style={{ backgroundColor: "#2E3032", border: "2px dashed #3B3D3E" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-16 h-16 mb-4 opacity-20 text-white" />
            <p className="text-white font-semibold mb-1">Sin imágenes</p>
            <p style={{ color: "#A0A0A0" }}>Haz clic para subir tu primera imagen</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mediaList.map((item) => (
              <div key={item.id} className="group relative rounded-xl overflow-hidden ca-card" style={{ aspectRatio: "1" }}>
                <img src={item.url} alt={item.originalName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.7)" }}>
                  <button onClick={() => copyUrl(item.url)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "#2B037D", color: "#FFFFFF" }}>
                    <Copy className="w-3.5 h-3.5" /> Copiar URL
                  </button>
                  <button onClick={() => { if (confirm("¿Eliminar?")) deleteMutation.mutate({ id: item.id }); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.8)", color: "#D0D0D0" }}>
                  {item.originalName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
