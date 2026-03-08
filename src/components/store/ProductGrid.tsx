import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number | null;
  created_at?: string;
  images: string[] | null;
  stock: number | null;
  is_featured: boolean | null;
  categories: { name: string; icon: string } | null;
}

interface ProductGridProps {
  products: Product[];
  storeSlug: string;
  storeId: string;
  loading: boolean;
  hasActiveFilter?: boolean;
  onClearFilters?: () => void;
}

const ProductGrid = ({ products, storeSlug, loading, hasActiveFilter, onClearFilters }: ProductGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border/40 bg-card">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mb-4" />
        <h3 className="text-lg font-semibold text-foreground">Nenhum produto encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          {hasActiveFilter
            ? "Tente buscar por outro termo ou explore outras categorias"
            : "Esta loja ainda não tem produtos cadastrados"}
        </p>
        {hasActiveFilter && onClearFilters && (
          <Button variant="outline" className="mt-4" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
      {products.map((product) => {
        const outOfStock = (product.stock ?? 0) <= 0;
        const image = product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg";
        const hasDiscount = product.original_price && product.original_price > product.price;
        const discount = hasDiscount
          ? Math.round((1 - product.price / product.original_price!) * 100)
          : 0;
        const isNew = product.created_at
          ? Date.now() - new Date(product.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
          : false;

        return (
          <Link
            key={product.id}
            to={`/${storeSlug}/p/${product.slug}`}
            className="group overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-muted">
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              {/* Badges */}
              <div className="absolute left-2 top-2 flex flex-col gap-1">
                {hasDiscount && (
                  <span className="rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">
                    {discount}% OFF
                  </span>
                )}
                {product.is_featured && (
                  <span className="rounded-lg bg-amber-400 px-2 py-1 text-xs font-bold text-amber-900">
                    ⭐ Destaque
                  </span>
                )}
                {isNew && !outOfStock && (
                  <span className="rounded-lg bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                    Novo
                  </span>
                )}
                {outOfStock && (
                  <span className="rounded-lg bg-gray-800 px-2 py-1 text-xs font-bold text-white">
                    Esgotado
                  </span>
                )}
              </div>

              {/* Add button */}
              <button
                className={`absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-transform hover:scale-110 ${
                  outOfStock
                    ? "bg-muted-foreground/40 text-muted cursor-not-allowed"
                    : "bg-primary text-primary-foreground"
                }`}
                tabIndex={-1}
                aria-label="Adicionar à sacola"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 space-y-1">
              {product.categories && (
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
                  {product.categories.name}
                </p>
              )}
              <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{product.name}</h3>
              <div>
                {hasDiscount ? (
                  <>
                    <span className="block text-xs text-muted-foreground line-through">
                      R$ {product.original_price!.toFixed(2)}
                    </span>
                    <span className="text-lg font-extrabold text-primary">
                      R$ {product.price.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-extrabold text-primary">
                    R$ {product.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ProductGrid;
