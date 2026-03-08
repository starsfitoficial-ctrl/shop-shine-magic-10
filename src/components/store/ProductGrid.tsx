import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

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
  const { addItem } = useCart();

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-border/40 bg-card">
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
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => {
        const outOfStock = (product.stock ?? 0) <= 0;
        const discount = product.original_price && product.original_price > product.price
          ? Math.round((1 - product.price / product.original_price) * 100)
          : null;
        const isNew = product.created_at
          ? new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          : false;
        const images = product.images?.length ? product.images : ["/placeholder.svg"];

        return (
          <Link key={product.id} to={`/${storeSlug}/p/${product.slug}`}>
            <div className="bg-card rounded-lg border border-border hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Imagem */}
              <div className="relative bg-muted" style={{ aspectRatio: '1' }}>
                <img src={images[0]} alt={product.name} className="w-full h-full object-contain p-2" />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {discount && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">{discount}% OFF</span>}
                  {isNew && !discount && <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded">NOVO</span>}
                  {product.is_featured && <span className="bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded">DESTAQUE</span>}
                  {outOfStock && <span className="bg-gray-600 text-white text-xs font-bold px-2 py-0.5 rounded">ESGOTADO</span>}
                </div>
                {/* Botão carrinho */}
                {!outOfStock && (
                  <button
                    onClick={(e) => { e.preventDefault(); addItem({ id: product.id, name: product.name, price: product.price, image: images[0], slug: product.slug }); toast.success("Adicionado!"); }}
                    className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full h-9 w-9 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                )}
              </div>
              {/* Info */}
              <div className="p-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{(product.categories as any)?.name}</p>
                <p className="text-sm font-medium text-foreground line-clamp-2 min-h-[2.5rem]">{product.name}</p>
                <div className="mt-2">
                  {discount && product.original_price && (
                    <p className="text-xs text-muted-foreground line-through">R$ {product.original_price.toFixed(2)}</p>
                  )}
                  <p className="text-lg font-bold text-primary">R$ {product.price.toFixed(2)}</p>
                  {discount && (
                    <p className="text-xs text-green-600 font-medium">Você economiza R$ {(product.original_price! - product.price).toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ProductGrid;
