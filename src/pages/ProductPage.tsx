import { useParams, Link } from "react-router-dom";
import { useStoreBySlug, useProductBySlug, useRelatedProducts } from "@/hooks/useStore";
import { useProductOptionGroups, useProductRatings, useProductLikes, useToggleLike } from "@/hooks/useProductDetails";
import { useCart } from "@/contexts/CartContext";
import { trackClick } from "@/lib/trackClick";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag, ArrowLeft, Share2, Heart, Star,
  MessageCircle, Home, Check, X, Truck, ShieldCheck, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import StoreFooter from "@/components/store/StoreFooter";
import { openWhatsApp } from "@/lib/whatsapp";
import CartDrawer from "@/components/store/CartDrawer";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const ProductPage = () => {
  const { storeSlug, productSlug } = useParams<{ storeSlug: string; productSlug: string }>();
  const { data: store } = useStoreBySlug(storeSlug);
  const { data: product, isLoading } = useProductBySlug(store?.id, productSlug);
  const { items, addItem, setStoreSlug } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [cartOpen, setCartOpen] = useState(false);

  const { data: optionGroups } = useProductOptionGroups(product?.id);
  const { data: ratings } = useProductRatings(product?.id);
  const { data: likesData } = useProductLikes(product?.id);
  const { data: relatedProducts } = useRelatedProducts(store?.id, product?.id);
  const toggleLike = useToggleLike(product?.id ?? "");

  const avgRating =
    ratings && ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
      : null;

  useEffect(() => {
    if (store && product) {
      trackClick(store.id, "view_product", product.id);
      if (storeSlug) setStoreSlug(storeSlug);
    }
  }, [store, product, storeSlug, setStoreSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-5xl">
          <Skeleton className="mb-6 h-5 w-64" />
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-14 w-1/2" />
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

  const priceModifier =
    optionGroups?.reduce((sum, group) => {
      const selectedValueId = selectedOptions[group.id];
      if (selectedValueId) {
        const value = (group as any).product_option_values?.find((v: any) => v.id === selectedValueId);
        if (value) return sum + (value.price_modifier || 0);
      }
      return sum;
    }, 0) ?? 0;

  const finalPrice = product.price + priceModifier;
  const originalPrice = product.original_price ?? null;
  const hasDiscount = originalPrice && originalPrice > finalPrice;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : null;
  const savings = hasDiscount ? originalPrice - finalPrice : null;

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
    if (optionGroups && optionGroups.length > 0) {
      const unselected = optionGroups.filter((g) => !selectedOptions[g.id]);
      if (unselected.length > 0) {
        toast.error(`Selecione: ${unselected.map((g) => g.name).join(", ")}`);
        return;
      }
    }
    addItem({ id: product.id, name: product.name, price: finalPrice, image: images[0], slug: product.slug });
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
        {/* Top bar */}
        <div className="border-b bg-card/60 backdrop-blur sticky top-0 z-30">
          <div className="container mx-auto max-w-5xl px-4 h-14 flex items-center gap-3">
            <Link
              to={`/${storeSlug}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar para {store.name}</span>
              <span className="sm:hidden">Voltar</span>
            </Link>
            <div className="flex-1" />
            <button onClick={() => setCartOpen(true)} className="relative p-2">
              <ShoppingBag className="h-5 w-5 text-foreground" />
              {items.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {items.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 py-6 flex-1">
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
                <BreadcrumbPage className="max-w-[180px] truncate">{product.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Main 2-column layout */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* ── LEFT: Images ── */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-2xl border shadow-sm bg-card">
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="h-full w-full object-cover transition-opacity duration-200"
                />
                {outOfStock && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-sm px-4 py-1.5">Esgotado</Badge>
                  </div>
                )}
                {hasDiscount && (
                  <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground font-bold text-sm px-2.5 py-1">
                    -{discountPercent}% OFF
                  </Badge>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === selectedImage ? "border-primary" : "border-transparent hover:border-border"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── RIGHT: Info ── */}
            <div className="space-y-5">
              {/* Category + title */}
              <div>
                {product.categories && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {(product.categories as any).icon} {(product.categories as any).name}
                  </p>
                )}
                <h1 className="text-2xl font-bold text-foreground leading-tight">{product.name}</h1>
              </div>

              {/* Ratings + likes row */}
              <div className="flex items-center gap-3 flex-wrap">
                {avgRating ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.round(Number(avgRating))
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold">{avgRating}</span>
                    <span className="text-xs text-muted-foreground">({ratings?.length} avaliações)</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Sem avaliações ainda</span>
                )}
                {likesData && likesData.count > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3.5 w-3.5 fill-destructive text-destructive" />
                    {likesData.count} curtidas
                  </div>
                )}
              </div>

              {/* Price block */}
              <div className="rounded-xl bg-muted/50 border p-4 space-y-1">
                {hasDiscount && (
                  <p className="text-sm text-muted-foreground line-through">
                    R$ {originalPrice!.toFixed(2)}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-3xl font-extrabold text-primary">
                    R$ {finalPrice.toFixed(2)}
                  </p>
                  {discountPercent && (
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-bold">
                      -{discountPercent}% OFF
                    </Badge>
                  )}
                </div>
                {savings && (
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    ✓ Você economiza R$ {savings.toFixed(2)}
                  </p>
                )}
              </div>

              {/* Product Options */}
              {optionGroups && optionGroups.length > 0 && (
                <div className="space-y-4">
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
                                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
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

              {/* Stock indicator */}
              <div className="flex items-center gap-2">
                {outOfStock ? (
                  <>
                    <X className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Produto esgotado</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Em estoque
                      {(product.stock ?? 0) <= 5 && product.stock! > 0 && (
                        <span className="text-muted-foreground font-normal"> — últimas {product.stock} unidades</span>
                      )}
                    </span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 text-base font-semibold"
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  {outOfStock ? "Esgotado" : "Adicionar à Sacola"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleShare}
                  title="Compartilhar"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleLike}
                  title="Curtir"
                  className={likesData?.liked ? "text-destructive border-destructive/40" : ""}
                >
                  <Heart className={`h-5 w-5 ${likesData?.liked ? "fill-current" : ""}`} />
                </Button>
              </div>
            </div>
          </div>

          {/* ── Sobre este produto ── */}
          {(product.description || product.sku) && (
            <div className="mt-10 border-t pt-8">
              <h2 className="text-lg font-bold text-foreground mb-3">Sobre este produto</h2>
              {product.description && (
                <p className="text-muted-foreground leading-relaxed">{product.description}</p>
              )}
              {product.sku && (
                <p className="mt-4 text-xs text-muted-foreground">Referência: {product.sku}</p>
              )}
            </div>
          )}

          {/* ── Informações de Entrega ── */}
          <div className="mt-10 border-t pt-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Informações de Entrega</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Entrega via WhatsApp</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Combine o frete direto com a loja</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Compra Segura</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Seus dados protegidos</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                  <RefreshCw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Política de Troca</p>
                  <Link
                    to={`/${storeSlug}/politica`}
                    className="text-xs text-primary hover:underline mt-0.5 block"
                  >
                    Ver política da loja
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Avaliações ── */}
          {ratings && ratings.length > 0 && (
            <div className="mt-10 border-t pt-8">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-lg font-bold text-foreground">Avaliações dos clientes</h2>
                {avgRating && (
                  <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-full px-3 py-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{avgRating}</span>
                    <span className="text-xs text-muted-foreground">/ 5</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {ratings.map((r) => (
                  <div key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">{r.customer_name}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Produtos Relacionados ── */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-10 border-t pt-8">
              <h2 className="text-lg font-bold text-foreground mb-5">Você também pode gostar</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {relatedProducts.map((rp) => {
                  const rpImages = rp.images && rp.images.length > 0 ? rp.images : ["/placeholder.svg"];
                  const rpOutOfStock = (rp.stock ?? 0) <= 0;
                  return (
                    <Link
                      key={rp.id}
                      to={`/${storeSlug}/p/${rp.slug}`}
                      className="group relative rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        <img
                          src={rpImages[0]}
                          alt={rp.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        {rpOutOfStock && (
                          <Badge variant="secondary" className="absolute top-2 left-2 text-[10px]">
                            ESGOTADO
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 text-foreground">{rp.name}</h3>
                        <p className="mt-1.5 font-bold text-primary text-sm">R$ {rp.price.toFixed(2)}</p>
                      </div>
                    </Link>
                  );
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
            onClick={() =>
              openWhatsApp(store.whatsapp, "Olá! Vim pelo catálogo online e gostaria de mais informações.")
            }
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-200 hover:bg-green-600 hover:shadow-xl"
            aria-label="Falar com a loja no WhatsApp"
          >
            <MessageCircle className="h-6 w-6" />
          </button>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} store={store} />
    </>
  );
};

export default ProductPage;
