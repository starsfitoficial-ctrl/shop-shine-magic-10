import { useState, useEffect, useRef } from "react";
import { useMyStore, useStoreCategories } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Trash2, Plus, GripVertical, Pencil, Check, X } from "lucide-react";
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

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");

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

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, name, icon }: { id: string; name: string; icon: string }) => {
      const { error } = await supabase.from("categories").update({ name, icon }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Categoria atualizada!");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["categories", store?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async (reordered: { id: string; sort_order: number }[]) => {
      const promises = reordered.map((item) =>
        supabase.from("categories").update({ sort_order: item.sort_order }).eq("id", item.id)
      );
      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", store?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) {
      setDragIdx(null);
      return;
    }
    const reordered = [...categories];
    const [removed] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, removed);
    const updates = reordered.map((cat, idx) => ({ id: cat.id, sort_order: idx }));
    reorderMutation.mutate(updates);
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
  };

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

  const startEdit = (cat: { id: string; name: string; icon: string | null }) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || "📦");
  };

  const saveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateCategoryMutation.mutate({ id: editingId, name: editName.trim(), icon: editIcon.trim() || "📦" });
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
                  {categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      draggable={editingId !== cat.id}
                      onDragStart={() => { dragItem.current = idx; setDragIdx(idx); }}
                      onDragEnter={() => { dragOverItem.current = idx; }}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      className={`flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 transition-opacity ${dragIdx === idx ? "opacity-50" : ""}`}
                    >
                      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" />

                      {editingId === cat.id ? (
                        <>
                          <Input
                            value={editIcon}
                            onChange={(e) => setEditIcon(e.target.value)}
                            className="w-14 h-8 text-center px-1"
                          />
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 h-8"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={saveEdit} disabled={updateCategoryMutation.isPending}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-2 flex-1 text-sm text-foreground">
                            <span className="text-lg">{cat.icon || "📦"}</span>
                            {cat.name}
                          </span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => startEdit(cat)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(cat.id, cat.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
