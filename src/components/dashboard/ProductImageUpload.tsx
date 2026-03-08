import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  storeId: string;
  maxImages?: number;
}

const ProductImageUpload = ({
  images,
  onImagesChange,
  storeId,
  maxImages = 5,
}: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${maxImages} imagens`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      const newUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} não é uma imagem`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} excede 5MB`);
          continue;
        }

        const ext = file.name.split(".").pop();
        const path = `${storeId}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(path);

        newUrls.push(urlData.publicUrl);
      }

      onImagesChange([...images, ...newUrls]);
      if (newUrls.length > 0) toast.success(`${newUrls.length} imagem(ns) enviada(s)`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((url, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-md border bg-muted">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          className="w-full border-dashed"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="mr-2 h-4 w-4" />
          )}
          {uploading ? "Enviando..." : `Adicionar imagens (${images.length}/${maxImages})`}
        </Button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
};

export default ProductImageUpload;
