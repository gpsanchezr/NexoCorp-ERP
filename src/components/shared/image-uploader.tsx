"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ImageUploaderProps = {
  businessId: string;
  value: string | null;
  onChange: (imageUrl: string | null) => void;
};

export function ImageUploader({ businessId, value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    setError("");
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Usa una imagen JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("La imagen debe pesar máximo 5 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${businessId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (uploadError) {
      console.error("Error subiendo imagen del producto:", uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFile(file: File | undefined) {
    if (file) void uploadFile(file);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0]);
        }}
        className={`relative overflow-hidden rounded-xl border border-dashed p-3 transition-colors ${
          isDragging ? "border-brand-500 bg-brand-50" : "border-ink-200 bg-ink-50"
        }`}
      >
        {value ? (
          <div className="relative h-40 overflow-hidden rounded-lg bg-white">
            <img src={value} alt="Vista previa del producto" className="h-full w-full object-cover" />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 top-2 bg-white/90"
              onClick={() => onChange(null)}
              title="Quitar imagen"
              aria-label="Quitar imagen"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full flex-col items-center justify-center gap-2 py-6 text-center text-ink-500"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="h-7 w-7 animate-spin text-brand-600" /> : <UploadCloud className="h-7 w-7 text-brand-600" />}
            <span className="text-sm font-semibold">Arrastra una imagen aquí o selecciónala</span>
            <span className="text-xs text-ink-400">JPG, PNG o WebP · máximo 5 MB</span>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          <ImagePlus className="h-4 w-4" />
          {value ? "Cambiar imagen" : "Elegir imagen"}
        </Button>
        {isUploading ? <span className="text-xs text-ink-400">Subiendo...</span> : null}
      </div>
      {error ? <p className="text-xs text-danger-600">{error}</p> : null}
    </div>
  );
}
