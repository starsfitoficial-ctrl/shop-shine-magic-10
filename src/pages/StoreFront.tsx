import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStoreBySlug, useStoreProducts, useStoreCategories } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import StoreHeader from "@/components/store/StoreHeader";
import CategoryCarousel from "@/components/store/CategoryCarousel";
import ProductGrid from "@/components/store/ProductGrid";
import CartDrawer from "@/components/store/CartDrawer";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const StoreFront = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { data: store, isLoading: storeLoading } = useStoreBySlug(storeSlug);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [cartOpen, setCartOpen] = useState(false);
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
      // Apply store's primary color as CSS variable
      const root = document.documentElement;
      root.style.setProperty("--store-primary", hexToHsl(store.primary_color));
      if (storeSlug) setStoreSlug(storeSlug);
    }
    return () => {
      document.documentElement.style.removeProperty("--store-primary");
    };
  }, [store, storeSlug, setStoreSlug]);

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
    <div className="min-h-screen bg-background">
      <StoreHeader
        store={store}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartOpen={() => setCartOpen(true)}
      />
      
      <main className="container mx-auto px-4 pb-20">
        {/* Sort */}
        <div className="my-4 flex items-center justify-between">
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
        />
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} store={store} />
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
