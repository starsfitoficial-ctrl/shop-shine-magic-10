import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2, Rocket } from "lucide-react";

const DEMO_STORE = {
  name: "Loja Demo Brasil",
  slug: "loja-demo-brasil",
  whatsapp: "5562999981107",
  primary_color: "#3B82F6",
  address: "Rua das Flores, 123 - Goiânia/GO",
  fixed_delivery_fee: 8.0,
  plan: "pro",
  is_demo: true,
};

const CATEGORIES = [
  { name: "Moda", icon: "🛍️", sort_order: 0 },
  { name: "Eletrônicos", icon: "📱", sort_order: 1 },
  { name: "Casa & Decoração", icon: "🏠", sort_order: 2 },
];

const PRODUCTS = [
  { name: "Bolsa Feminina", slug: "bolsa-feminina", price: 189.9, original_price: 299.9, category: "Moda", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600", description: "Bolsa feminina em couro sintético com acabamento premium. Ideal para o dia a dia.", stock: 15, is_featured: true },
  { name: "Fone Bluetooth", slug: "fone-bluetooth", price: 149.9, original_price: 249.9, category: "Eletrônicos", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", description: "Fone de ouvido sem fio com cancelamento de ruído e bateria de longa duração.", stock: 30, is_featured: true },
  { name: "Tênis Casual", slug: "tenis-casual", price: 219.9, original_price: 319.9, category: "Moda", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600", description: "Tênis casual confortável para uso diário. Design moderno e leve.", stock: 20, is_featured: false },
  { name: "Smartwatch", slug: "smartwatch", price: 299.9, original_price: 499.9, category: "Eletrônicos", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", description: "Relógio inteligente com monitor cardíaco, GPS e notificações.", stock: 10, is_featured: true },
  { name: "Luminária LED", slug: "luminaria-led", price: 89.9, original_price: 139.9, category: "Casa & Decoração", image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600", description: "Luminária de mesa LED com ajuste de intensidade e temperatura de cor.", stock: 25, is_featured: false },
  { name: "Vaso Decorativo", slug: "vaso-decorativo", price: 59.9, original_price: 99.9, category: "Casa & Decoração", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600", description: "Vaso decorativo em cerâmica artesanal. Perfeito para plantas e flores.", stock: 40, is_featured: false },
];

const AdminSeedDemo = () => {
  const { user, loading, isAdmin } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const handleSeed = async () => {
    setSeeding(true);
    try {
      // Check if store exists
      const { data: existing } = await supabase
        .from("stores")
        .select("id")
        .eq("slug", DEMO_STORE.slug)
        .maybeSingle();

      let storeId: string;

      if (existing) {
        storeId = existing.id;
        toast.info("Loja demo já existe. Recriando produtos...");
        // Clean existing products and categories
        await supabase.from("products").delete().eq("store_id", storeId);
        await supabase.from("categories").delete().eq("store_id", storeId);
      } else {
        // Create store
        const { data: store, error: storeErr } = await supabase
          .from("stores")
          .insert({ ...DEMO_STORE, owner_id: user.id })
          .select("id")
          .single();
        if (storeErr) throw storeErr;
        storeId = store.id;
      }

      // Create categories
      const { data: cats, error: catErr } = await supabase
        .from("categories")
        .insert(CATEGORIES.map((c) => ({ ...c, store_id: storeId })))
        .select("id, name");
      if (catErr) throw catErr;

      const catMap = Object.fromEntries(cats!.map((c) => [c.name, c.id]));

      // Create products
      const { error: prodErr } = await supabase.from("products").insert(
        PRODUCTS.map((p) => ({
          name: p.name,
          slug: p.slug,
          price: p.price,
          original_price: p.original_price,
          category_id: catMap[p.category],
          store_id: storeId,
          images: [p.image],
          description: p.description,
          stock: p.stock,
          is_featured: p.is_featured,
          is_active: true,
        }))
      );
      if (prodErr) throw prodErr;

      setDone(true);
      toast.success("Loja demo criada com sucesso!");
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Falha ao criar loja demo"));
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Admin
          </Link>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" /> Seed Loja Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cria a loja <strong>Loja Demo Brasil</strong> com 3 categorias e 6 produtos de demonstração.
          </p>

          {done ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Loja demo criada!</span>
              </div>
              <Link to={`/${DEMO_STORE.slug}`}>
                <Button className="w-full">Abrir Loja Demo</Button>
              </Link>
            </div>
          ) : (
            <Button onClick={handleSeed} disabled={seeding} className="w-full">
              {seeding ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando...</> : "Criar Loja Demo"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSeedDemo;
