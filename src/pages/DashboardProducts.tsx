import { useState } from "react";
import { useMyStore } from "@/hooks/useStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import ProductOptionsManager from "@/components/dashboard/ProductOptionsManager";
import ProductImageUpload from "@/components/dashboard/ProductImageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const DashboardProducts = () => {
  const { user, loading } = useAuth();
  const { data: store } = useMyStore();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const { data: products } = useQuery({
    queryKey: ["my_products", store?.id],
    queryFn: async () => {
      if (!store) return [];
      const { data } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!store,
  });

  const { data: categories } = useQuery({
    queryKey: ["my_categories", store?.id],
    queryFn: async () => {
      if (!store) return [];
      const { data } = await supabase.from("categories").select("*").eq("store_id", store.id).order("sort_order");
      return data ?? [];
    },
    enabled: !!store,
  });

  const toggleStock = useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase.from("products").update({ stock: stock > 0 ? 0 : 10 }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_products"] });
      toast.success("Estoque atualizado!");
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_products"] });
      toast.success("Produto removido!");
    },
  });

  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!store) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
            <h1 className="text-xl font-bold text-foreground">Produtos</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingProduct(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" /> Novo Produto</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle></DialogHeader>
              <ProductForm
                store={store}
                categories={categories ?? []}
                product={editingProduct}
                onSuccess={() => {
                  setDialogOpen(false);
                  setEditingProduct(null);
                  queryClient.invalidateQueries({ queryKey: ["my_products"] });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="space-y-3">
          {products?.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <img
                  src={p.images?.[0] || "/placeholder.svg"}
                  alt={p.name}
                  className="h-16 w-16 rounded-md border object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-sm text-primary font-semibold">R$ {p.price.toFixed(2)}</p>
                  <div className="flex gap-2 mt-1">
                    {(p.stock ?? 0) <= 0 && <Badge variant="destructive" className="text-xs">Esgotado</Badge>}
                    {p.is_featured && <Badge className="text-xs bg-accent text-accent-foreground">Destaque</Badge>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => toggleStock.mutate({ id: p.id, stock: p.stock ?? 0 })}>
                    {(p.stock ?? 0) > 0 ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(p); setDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteProduct.mutate(p.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!products || products.length === 0) && (
            <p className="py-10 text-center text-muted-foreground">Nenhum produto cadastrado</p>
          )}
        </div>
      </main>
    </div>
  );
};

function ProductForm({ store, categories, product, onSuccess }: any) {
  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [stock, setStock] = useState(product?.stock?.toString() || "10");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [isFeatured, setIsFeatured] = useState(product?.is_featured || false);
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || "");
  const [saving, setSaving] = useState(false);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!product) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        store_id: store.id,
        name,
        slug,
        description: description || null,
        price: parseFloat(price),
        sku: sku || null,
        stock: parseInt(stock) || 0,
        category_id: categoryId || null,
        is_featured: isFeatured,
        images: imageUrl ? [imageUrl] : [],
        is_active: true,
      };

      if (product) {
        const { error } = await supabase.from("products").update(data).eq("id", product.id);
        if (error) throw error;
        toast.success("Produto atualizado!");
      } else {
        const { error } = await supabase.from("products").insert(data);
        if (error) throw error;
        toast.success("Produto criado!");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><Label>Nome *</Label><Input value={name} onChange={(e) => handleNameChange(e.target.value)} required /></div>
      <div><Label>Slug *</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} required /></div>
      <div><Label>Descrição</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Preço *</Label><Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required /></div>
        <div><Label>Estoque</Label><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
      </div>
      <div><Label>SKU</Label><Input value={sku} onChange={(e) => setSku(e.target.value)} /></div>
      <div>
        <Label>Categoria</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {categories.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div><Label>URL da Imagem</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." /></div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="featured" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
        <Label htmlFor="featured">Produto Destaque</Label>
      </div>
      {product && (
        <div className="border-t border-border pt-4">
          <ProductOptionsManager productId={product.id} />
        </div>
      )}
      <Button type="submit" className="w-full" disabled={saving}>{saving ? "Salvando..." : product ? "Atualizar" : "Criar Produto"}</Button>
    </form>
  );
}

export default DashboardProducts;
