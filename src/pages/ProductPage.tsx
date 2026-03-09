import { useParams } from "react-router-dom";
import { useStoreBySlug, useProductBySlug } from "@/hooks/useStore";
import { useProductOptionGroups, useProductRatings, useProductLikes, useToggleLike } from "@/hooks/useProductDetails";
import { useCart } from "@/contexts/CartContext";
import { trackClick } from "@/lib/trackClick";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ArrowLeft, Share2, Heart, Star, MessageCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import StoreFooter from "@/components/store/StoreFooter";
import { openWhatsApp } from "@/lib/whatsapp";
import CartDrawer from "@/components/store/CartDrawer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ProductPage = () => {
  const { storeSlug, productSlug } = useParams<{ storeSlug: string; productSlug: string }>();
  const { data: store } = useStoreBySlug(storeSlug);
  const { data: product, isLoading } = useProductBySlug(store?.id, productSlug);
  const { items, addItem, setStoreSlug } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [showPulse, setShowPulse] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  const { data: optionGroups } = useProductOptionGroups(product?.id);
  const { data: ratings } = useProductRatings(product?.id);
  const { data: likesData } = useProductLikes(product?.id);
  const toggleLike = useToggleLike(product?.id ?? "");

  const avgRating = ratings && ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : null;

  useEffect(() => {
    if (store && product) {
      trackClick(store.id, "view_product", product.id);
      if (storeSlug) setStoreSlug(storeSlug);
    }
  }, [store, product, storeSlug, setStoreSlug]);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 3000);
    return () => clearTimeout(timer);
  }, []);

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
  const availability = outOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock";

  // Calculate price modifier from selected options
  const priceModifier = optionGroups?.reduce((sum, group) => {
    const selectedValueId = selectedOptions[group.id];
    if (selectedValueId) {
      const value = (group as any).product_option_values?.find((v: any) => v.id === selectedValueId);
      if (value) return sum + (value.price_modifier || 0);
    }
    return sum;
  }, 0) ?? 0;

  const finalPrice = product.price + priceModifier;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: images,
    sku: product.sku || product.id,
    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating,
        reviewCount: ratings?.length,
      },
    }),
    brand: { "@type": "Brand", name: store.name },
    offers: {
      "@type": "Offer",
      price: finalPrice,
      priceCurrency: "BRL",
      availability,
      url: `${window.location.origin}/${storeSlug}/p/${product.slug}`,
      seller: { "@type": "Organization", name: store.name },
    },
  };

  const handleAddToCart = () => {
    if (outOfStock) return;
    // Check if all required options are selected
    if (optionGroups && optionGroups.length > 0) {
      const unselected = optionGroups.filter((g) => !selectedOptions[g.id]);
      if (unselected.length > 0) {
        toast.error(`Selecione: ${unselected.map((g) => g.name).join(", ")}`);
        return;
      }
    }
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: images[0],
      slug: product.slug,
    });
    toast.success("Produto adicionado à sacola!");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${storeSlug}/p/${product.slug}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  const handleLike = () => {
    if (likesData) toggleLike.mutate(likesData.liked);
  };

  return (
    <>
      <Helmet>
        <title>{`${product.name} - ${store.name}`}</title>
        <meta name="description" content={product.description || product.name} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description || product.name} />
        <meta property="og:image" content={images[0]} />
        <meta property="og:url" content={`${window.location.origin}/${storeSlug}/p/${product.slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <div className="container mx-auto max-w-4xl px-4 py-6 flex-1">
          {/* Header with back link and cart */}
          <div className="flex items-center mb-4">
            <Link to={`/${storeSlug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar para {store.name}
            </Link>
            <button onClick={() => setCartOpen(true)} className="relative ml-auto p-2">
              <ShoppingBag className="h-6 w-6 text-foreground" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {items.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>

          {/* Breadcrumb */}
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/${storeSlug}`} className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    Início
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {product.categories && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to={`/${storeSlug}?categoria=${(product.categories as any).id}`}>
                        {(product.categories as any).icon} {(product.categories as any).name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Images */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-card">
                <img src={images[selectedImage]} alt={product.name} className="h-full w-full object-cover" />
                {outOfStock && (
                  <Badge variant="destructive" className="absolute right-2 top-2">Esgotado</Badge>
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
              <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>

              {/* Rating & Actions row */}
              <div className="flex items-center gap-4">
                {avgRating && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">{avgRating}</span>
                    <span className="text-xs text-muted-foreground">({ratings?.length} avaliações)</span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Button variant="ghost" size="icon" onClick={handleShare} title="Compartilhar">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLike}
                    title="Curtir"
                    className={likesData?.liked ? "text-destructive" : ""}
                  >
                    <Heart className={`h-4 w-4 ${likesData?.liked ? "fill-current" : ""}`} />
                  </Button>
                  {likesData && likesData.count > 0 && (
                    <span className="text-xs text-muted-foreground">{likesData.count}</span>
                  )}
                </div>
              </div>

              <p className="text-3xl font-extrabold text-primary">
                R$ {finalPrice.toFixed(2)}
              </p>

              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}

              {/* Product Options */}
              {optionGroups && optionGroups.length > 0 && (
                <div className="space-y-4 border-t pt-4">
                  {optionGroups.map((group) => (
                    <div key={group.id}>
                      <p className="text-sm font-semibold text-foreground mb-2">{group.name}</p>
                      <div className="flex flex-wrap gap-2">
                        {((group as any).product_option_values || [])
                          .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                          .map((val: any) => {
                            const isSelected = selectedOptions[group.id] === val.id;
                            return (
                              <button
                                key={val.id}
                                onClick={() =>
                                  setSelectedOptions((prev) => ({ ...prev, [group.id]: val.id }))
                                }
                                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-foreground hover:border-primary"
                                }`}
                              >
                                {val.label}
                                {val.price_modifier > 0 && (
                                  <span className="ml-1 text-xs opacity-70">
                                    +R$ {Number(val.price_modifier).toFixed(2)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {product.sku && (
                <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
              )}

              {/* Informações adicionais (Frete, Garantia, Entrega) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-y py-4 my-4">
                <div className="flex flex-col items-center justify-center text-center p-3 bg-secondary/20 rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="16" height="16" x="4" y="4" rx="2" ry="2"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 14h.01"/><path d="M8 18h8"/><path d="M8 6h8"/></svg>
                  </div>
                  <span className="text-sm font-medium">Frete Grátis</span>
                  <span className="text-xs text-muted-foreground mt-1">Para sua região</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-3 bg-secondary/20 rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                  </div>
                  <span className="text-sm font-medium">Garantia</span>
                  <span className="text-xs text-muted-foreground mt-1">30 dias de cobertura</span>
                </div>
                <div className="flex flex-col items-center justify-center text-center p-3 bg-secondary/20 rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <span className="text-sm font-medium">Entrega Rápida</span>
                  <span className="text-xs text-muted-foreground mt-1">Em até 2 dias úteis</span>
                </div>
              </div>

              <Button size="lg" className="w-full text-lg" onClick={handleAddToCart} disabled={outOfStock}>
                <ShoppingBag className="mr-2 h-5 w-5" />
                {outOfStock ? "Produto Esgotado" : "Adicionar à Sacola"}
              </Button>

              {/* Ratings list */}
              {ratings && ratings.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Avaliações</h3>
                  {ratings.slice(0, 5).map((r) => (
                    <div key={r.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-foreground">{r.customer_name}</span>
                      </div>
                      {r.comment && <p className="text-xs text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Produtos Relacionados */}
          {store.products && store.products.length > 1 && (
            <div className="mt-12 border-t pt-8">
              <h2 className="text-xl font-bold text-foreground mb-6">Você também pode gostar</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {store.products
                  .filter((p: any) => p.id !== product.id && p.is_active !== false)
                  .slice(0, 4)
                  .map((relatedProduct: any) => {
                    const relatedImages = relatedProduct.images && relatedProduct.images.length > 0 ? relatedProduct.images : ["/placeholder.svg"];
                    const outOfStock = (relatedProduct.stock ?? 0) <= 0;
                    return (
                      <Link key={relatedProduct.id} to={`/${storeSlug}/p/${relatedProduct.slug}`} className="group relative rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-all">
                        <div className="aspect-square bg-muted p-4 relative">
                          <img src={relatedImages[0]} alt={relatedProduct.name} className="h-full w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105" />
                          {outOfStock && (
                            <span className="absolute top-2 left-2 bg-gray-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">ESGOTADO</span>
                          )}
                        </div>
                        <div className="p-3">
                          <h3 className="font-medium text-sm line-clamp-2 text-foreground">{relatedProduct.name}</h3>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="font-bold text-primary">R$ {relatedProduct.price.toFixed(2)}</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        <StoreFooter storeSlug={storeSlug!} storeName={store.name} />

        {/* WhatsApp floating button */}
        <div className="group fixed bottom-20 right-6 z-50 md:bottom-6">
          <div className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-3 py-1.5 text-sm text-background opacity-0 transition-opacity group-hover:opacity-100">
            Falar com a loja
          </div>
          <button
            onClick={() => openWhatsApp(store.whatsapp, "Olá! Vim pelo catálogo online e gostaria de mais informações.")}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-200 hover:bg-green-600 hover:shadow-xl"
            aria-label="Falar com a loja no WhatsApp"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} store={store} />
    </>
  );
};

export default ProductPage;
