import { useState, useRef } from "react";
import { useMyStore } from "@/hooks/useStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Trash2,
  Plus,
  GripVertical,
  Pencil,
  Upload,
  Loader2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Banner {
  id: string;
  store_id: string;
  image_url: string;
  link: string | null;
  title: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  created_at: string;
}

const DashboardBanners = () => {
  const { user, loading } = useAuth();
  const { data: store } = useMyStore();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["store_banners", store?.id],
    queryFn: async () => {
      if (!store) return [];
      const { data, error } = await supabase
        .from("store_banners")
        .select("*")
        .eq("store_id", store.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
    enabled: !!store,
  });

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${store!.id}/banner-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!store) return;
      setUploading(true);

      let imageUrl = editingBanner?.image_url || "";

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      if (!imageUrl) {
        throw new Error("Selecione uma imagem para o banner.");
      }

      const payload = {
        store_id: store.id,
        image_url: imageUrl,
        title: title || null,
        link: link || null,
        is_active: isActive,
        sort_order: editingBanner?.sort_order ?? banners.length,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from("store_banners")
          .update(payload)
          .eq("id", editingBanner.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("store_banners").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store_banners"] });
      toast.success(editingBanner ? "Banner atualizado!" : "Banner adicionado!");
      closeDialog();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar banner.");
    },
    onSettled: () => setUploading(false),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("store_banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store_banners"] });
      toast.success("Banner excluído!");
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir banner."),
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const idx = banners.findIndex((b) => b.id === id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= banners.length) return;

      const current = banners[idx];
      const swap = banners[swapIdx];

      await Promise.all([
        supabase.from("store_banners").update({ sort_order: swap.sort_order }).eq("id", current.id),
        supabase.from("store_banners").update({ sort_order: current.sort_order }).eq("id", swap.id),
      ]);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["store_banners"] }),
    onError: () => toast.error("Erro ao reordenar."),
  });

  const openCreate = () => {
    setEditingBanner(null);
    setTitle("");
    setLink("");
    setIsActive(true);
    setImageFile(null);
    setImagePreview("");
    setDialogOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title || "");
    setLink(banner.link || "");
    setIsActive(banner.is_active ?? true);
    setImageFile(null);
    setImagePreview(banner.image_url);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingBanner(null);
    setImageFile(null);
    setImagePreview("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 5MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-foreground">Banners Promocionais</h1>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Novo Banner
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-center">
                Nenhum banner cadastrado. Adicione banners para destacar promoções na sua vitrine.
              </p>
              <Button onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" /> Criar Primeiro Banner
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {banners.map((banner, idx) => (
              <Card key={banner.id} className="overflow-hidden">
                <div className="flex items-stretch">
                  {/* Thumbnail */}
                  <div className="w-32 md:w-48 flex-shrink-0 bg-muted">
                    <img
                      src={banner.image_url}
                      alt={banner.title || "Banner"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">
                          {banner.title || `Banner ${idx + 1}`}
                        </p>
                        {!banner.is_active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            Inativo
                          </span>
                        )}
                      </div>
                      {banner.link && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1 mt-1">
                          <ExternalLink className="h-3 w-3" /> {banner.link}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === 0}
                        onClick={() => reorderMutation.mutate({ id: banner.id, direction: "up" })}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={idx === banners.length - 1}
                        onClick={() => reorderMutation.mutate({ id: banner.id, direction: "down" })}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(banner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(banner.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image upload */}
            <div>
              <Label>Imagem do Banner</Label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {imagePreview ? (
                <div className="relative mt-2 rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Preview" className="w-full aspect-[3/1] object-cover" />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3 w-3 mr-1" /> Trocar
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full aspect-[3/1] rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para enviar (máx 5MB)</span>
                </button>
              )}
            </div>

            <div>
              <Label htmlFor="banner-title">Título (opcional)</Label>
              <Input
                id="banner-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Super Promoção de Verão"
              />
            </div>

            <div>
              <Label htmlFor="banner-link">Link (opcional)</Label>
              <Input
                id="banner-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="banner-active">Ativo na vitrine</Label>
              <Switch id="banner-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBanner ? "Salvar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O banner será removido permanentemente da sua vitrine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardBanners;
