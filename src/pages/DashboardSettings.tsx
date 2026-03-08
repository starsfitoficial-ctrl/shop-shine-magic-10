import { useState, useEffect } from "react";
import { useMyStore, useStoreCategories } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const DashboardSettings = () => {
  const { user, loading } = useAuth();
  const { data: store, refetch: refetchStore } = useMyStore();
  const { data: categories = [] } = useStoreCategories(store?.id);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  // Store fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [fixedFee, setFixedFee] = useState("0");
  const [useZone, setUseZone] = useState(false);

  // Legal
  const [refundPolicy, setRefundPolicy] = useState("");
  const [terms, setTerms] = useState("");
  const [contact, setContact] = useState("");

  // Category form
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hasProducts: boolean } | null>(null);

  useEffect(() => {
    if (store) {
      setName(store.name);
      setSlug(store.slug);
      setWhatsapp(store.whatsapp);
      setPrimaryColor(store.primary_color);
      setLogoUrl(store.logo_url || "");
      setAddress(store.address || "");
      setFixedFee(store.fixed_delivery_fee?.toString() || "0");
      setUseZone(store.use_zone_delivery ?? false);

      supabase.from("store_settings").select("*").eq("store_id", store.id).single().then(({ data }) => {
        if (data) {
          setRefundPolicy(data.refund_policy || "");
          setTerms(data.terms_of_use || "");
          setContact(data.contact_info || "");
        }
      });
    }
  }, [store]);

  const addCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!store || !newCatName.trim()) throw new Error("Nome obrigatório");
      const maxSort = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order ?? 0)) : 0;
      const { error } = await supabase.from("categories").insert({
        store_id: store.id,
        name: newCatName.trim(),
        icon: newCatIcon.trim() || "📦",
        sort_order: maxSort + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria adicionada!");
      setNewCatName("");
      setNewCatIcon("");
      queryClient.invalidateQueries({ queryKey: ["categories", store?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria excluída!");
      queryClient.invalidateQueries({ queryKey: ["categories", store?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleDeleteClick = async (catId: string, catName: string) => {
    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", catId);
    setDeleteTarget({ id: catId, name: catName, hasProducts: (count ?? 0) > 0 });
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteCategoryMutation.mutate(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;

  const handleCreateStore = async () => {
    if (!name || !slug || !whatsapp) {
      toast.error("Preencha nome, slug e WhatsApp");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("stores").insert({
        owner_id: user.id,
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        whatsapp,
        primary_color: primaryColor,
        logo_url: logoUrl || null,
        address: address || null,
        fixed_delivery_fee: parseFloat(fixedFee) || 0,
        use_zone_delivery: useZone,
      });
      if (error) throw error;
      toast.success("Loja criada com sucesso!");
      refetchStore();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const { error: storeError } = await supabase.from("stores").update({
        name,
        whatsapp,
        primary_color: primaryColor,
        logo_url: logoUrl || null,
        address: address || null,
        fixed_delivery_fee: parseFloat(fixedFee) || 0,
        use_zone_delivery: useZone,
      }).eq("id", store.id);
      if (storeError) throw storeError;

      const { error: settingsError } = await supabase.from("store_settings").update({
        refund_policy: refundPolicy,
        terms_of_use: terms,
        contact_info: contact,
      }).eq("store_id", store.id);
      if (settingsError) throw settingsError;

      toast.success("Configurações salvas!");
      refetchStore();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
          <h1 className="text-xl font-bold text-foreground">{store ? "Configurações da Loja" : "Criar Loja"}</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados da Loja</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nome da Loja *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            {!store && (
              <div><Label>Slug (URL) *</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="minha-loja" /></div>
            )}
            <div><Label>WhatsApp *</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511999999999" /></div>
            <div>
              <Label>Cor Primária</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div><Label>URL do Logo</Label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} /></div>
            <div><Label>Endereço</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          </CardContent>
        </Card>

        {store && (
          <Card>
            <CardHeader><CardTitle>Categorias</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {categories.length > 0 ? (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2">
                      <span className="flex items-center gap-2 text-sm text-foreground">
                        <span className="text-lg">{cat.icon || "📦"}</span>
                        {cat.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(cat.id, cat.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma categoria cadastrada.</p>
              )}

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Nome</Label>
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Eletrônicos"
                  />
                </div>
                <div className="w-20">
                  <Label>Ícone</Label>
                  <Input
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    placeholder="🛍️"
                  />
                </div>
                <Button
                  onClick={() => addCategoryMutation.mutate()}
                  disabled={!newCatName.trim() || addCategoryMutation.isPending}
                  size="default"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Taxas de Entrega</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch checked={useZone} onCheckedChange={setUseZone} />
              <Label>Usar taxa por bairro</Label>
            </div>
            {!useZone && (
              <div><Label>Taxa fixa (R$)</Label><Input type="number" step="0.01" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} /></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Páginas Legais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Política de Reembolso</Label><Textarea value={refundPolicy} onChange={(e) => setRefundPolicy(e.target.value)} rows={4} /></div>
            <div><Label>Termos de Uso</Label><Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} /></div>
            <div><Label>Contato</Label><Textarea value={contact} onChange={(e) => setContact(e.target.value)} rows={4} /></div>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={store ? handleSave : handleCreateStore} disabled={saving}>
          {saving ? "Salvando..." : store ? "Salvar Configurações" : "Criar Loja"}
        </Button>
      </main>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.hasProducts
                ? "⚠️ Existem produtos vinculados a esta categoria. Eles ficarão sem categoria após a exclusão. Deseja continuar?"
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardSettings;
