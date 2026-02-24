import { useParams } from "react-router-dom";
import { useStoreBySlug, useProductBySlug } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import { trackClick } from "@/lib/trackClick";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";

const ProductPage = () => {
  const { storeSlug, productSlug } = useParams<{ storeSlug: string; productSlug: string }>();
  const { data: store } = useStoreBySlug(storeSlug);
  const { data: product, isLoading } = useProductBySlug(store?.id, productSlug);
  const { addItem, setStoreSlug } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (store && product) {
      trackClick(store.id, "view_product", product.id);
      if (storeSlug) setStoreSlug(storeSlug);
    }
  }, [store, product, storeSlug, setStoreSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-4xl">
          <Skeleton className="mb-4 h-8 w-32" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || !store) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Produto não encontrado</p>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : ["/placeholder.svg"];
  const outOfStock = (product.stock ?? 0) <= 0;
  const availability = outOfStock
    ? "https://schema.org/OutOfStock"
    : "https://schema.org/InStock";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: images,
    sku: product.sku || product.id,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "BRL",
      availability,
      url: `${window.location.origin}/${storeSlug}/p/${product.slug}`,
    },
  };

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0],
      slug: product.slug,
    });
    toast.success("Produto adicionado à sacola!");
  };

  return (
    <>
      <Helmet>
        <title>{`${product.name} - ${store.name}`}</title>
        <meta name="description" content={product.description || product.name} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description || product.name} />
        <meta property="og:image" content={images[0]} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <Link to={`/${storeSlug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar para {store.name}
          </Link>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Images */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-card">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
                {outOfStock && (
                  <Badge variant="destructive" className="absolute right-2 top-2">
                    Esgotado
                  </Badge>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                        i === selectedImage ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-4">
              {product.categories && (
                <p className="text-sm text-muted-foreground">
                  {(product.categories as any).icon} {(product.categories as any).name}
                </p>
              )}
              <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
              <p className="text-3xl font-extrabold text-primary">
                R$ {product.price.toFixed(2)}
              </p>
              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}
              {product.sku && (
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
              )}
              <Button
                size="lg"
                className="w-full text-lg"
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                {outOfStock ? "Produto Esgotado" : "Adicionar à Sacola"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductPage;
