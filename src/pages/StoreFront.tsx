import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useStoreBySlug, useStoreProducts, useStoreCategories, useStoreBanners } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import StoreHeader from "@/components/store/StoreHeader";
import CategoryCarousel from "@/components/store/CategoryCarousel";
import ProductGrid from "@/components/store/ProductGrid";
import CartDrawer from "@/components/store/CartDrawer";
import StoreFooter from "@/components/store/StoreFooter";
import PromoBanner from "@/components/store/PromoBanner";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import { openWhatsApp } from "@/lib/whatsapp";

const StoreFront = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { data: store, isLoading: storeLoading } = useStoreBySlug(storeSlug);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [cartOpen, setCartOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const { setStoreSlug } = useCart();
  const { data: categories } = useStoreCategories(store?.id);
  const { data: products, isLoading: productsLoading } = useStoreProducts(
    store?.id,
    selectedCategory,
    searchQuery,
    sortBy === "price_asc" ? "price_asc" : sortBy === "featured" ? "featured" : undefined
  );

  useEffect(() => {
    if (store) {
      const root = document.documentElement;
      root.style.setProperty("--store-primary", hexToHsl(store.primary_color));
      root.style.setProperty("--store-primary-hex", store.primary_color);
      const hex = store.primary_color.replace('#', '');
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      root.style.setProperty("--store-primary-rgb", `${r}, ${g}, ${b}`);
      if (storeSlug) setStoreSlug(storeSlug);
    }
    return () => {
      const root = document.documentElement;
      root.style.removeProperty("--store-primary");
      root.style.removeProperty("--store-primary-hex");
      root.style.removeProperty("--store-primary-rgb");
    };
  }, [store, storeSlug, setStoreSlug]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-16 w-full" />
        <div className="container mx-auto p-4 space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Loja não encontrada</h1>
          <p className="mt-2 text-muted-foreground">Verifique o endereço e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{store.name} — Catálogo Online</title>
        <meta name="description" content={`Compre online na loja ${store.name}. Catálogo completo com checkout via WhatsApp.`} />
        <meta property="og:title" content={store.name} />
        <meta property="og:description" content={`Confira o catálogo da loja ${store.name} e faça seu pedido pelo WhatsApp.`} />
        <meta property="og:image" content={store.logo_url || '/placeholder.svg'} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta name="theme-color" content={store.primary_color || '#3B82F6'} />
      </Helmet>
      <StoreHeader
        store={store}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartOpen={() => setCartOpen(true)}
      />

      {/* Hero Banner */}
      <div
        className="w-full flex items-center px-6 md:px-12 h-32 md:h-44"
        style={{ background: `linear-gradient(135deg, var(--store-primary-hex) 0%, rgba(var(--store-primary-rgb), 0.7) 100%)` }}
      >
        <div className="container mx-auto flex items-center gap-6">
          {store.logo_url && (
            <img src={store.logo_url} alt={store.name} className="h-16 w-16 rounded-xl object-cover shadow-md border-2 border-white/30" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow">{store.name}</h1>
            <p className="text-white/80 text-sm mt-1">Bem-vindo à nossa loja!</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2">
            <span className="text-white font-bold text-sm">{products?.length ?? 0} produtos</span>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 pb-20">
        <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
        {/* Sort */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {products?.length ?? 0} produto{(products?.length ?? 0) !== 1 ? "s" : ""}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            <option value="newest">Mais Recentes</option>
            <option value="price_asc">Menor Preço</option>
            <option value="featured">Destaques</option>
          </select>
        </div>

        {/* Categories */}
        {categories && categories.length > 0 && (
          <CategoryCarousel
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}

        {/* Products */}
        <ProductGrid
          products={products ?? []}
          storeSlug={storeSlug!}
          storeId={store.id}
          loading={productsLoading}
          hasActiveFilter={!!selectedCategory || !!searchQuery}
          onClearFilters={() => { setSelectedCategory(null); setSearchQuery(""); }}
        />
        </div>
      </main>

      <StoreFooter storeSlug={storeSlug!} storeName={store.name} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} store={store} />

      {/* WhatsApp floating button */}
      <div className="group fixed bottom-20 right-6 z-50 md:bottom-6">
        <div className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-sm text-background opacity-0 transition-opacity group-hover:opacity-100">
          Falar com a loja
        </div>
        <button
          onClick={() => openWhatsApp(store.whatsapp, "Olá! Vim pelo catálogo online e gostaria de mais informações.")}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-200 hover:bg-green-600 hover:shadow-xl ${showPulse ? "animate-pulse" : ""}`}
          aria-label="Falar com a loja no WhatsApp"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "217 91% 60%";
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default StoreFront;
