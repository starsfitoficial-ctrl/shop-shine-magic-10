import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border bg-card">
            <Skeleton className="aspect-square w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
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
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => {
        const outOfStock = (product.stock ?? 0) <= 0;
        const image = product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg";

        return (
          <Link
            key={product.id}
            to={`/${storeSlug}/p/${product.slug}`}
            className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
          >
            <div className="relative aspect-square overflow-hidden bg-secondary">
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              {outOfStock && (
                <Badge variant="destructive" className="absolute right-2 top-2 text-xs">
                  Esgotado
                </Badge>
              )}
              {product.is_featured && !outOfStock && (
                <Badge className="absolute left-2 top-2 text-xs bg-accent text-accent-foreground">
                  Destaque
                </Badge>
              )}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-medium text-foreground">{product.name}</h3>
              <p className="mt-1 text-lg font-bold text-primary">
                R$ {product.price.toFixed(2)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ProductGrid;
