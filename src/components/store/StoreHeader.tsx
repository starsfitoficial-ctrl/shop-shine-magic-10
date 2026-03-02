import { Link } from "react-router-dom";
import { Search, ShoppingBag, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import type { Tables } from "@/integrations/supabase/types";

interface StoreHeaderProps {
  store: Tables<"stores">;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCartOpen: () => void;
}

const StoreHeader = ({ store, searchQuery, onSearchChange, onCartOpen }: StoreHeaderProps) => {
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        {/* Logo / Name */}
        <Link to={`/${store.slug}`} className="flex items-center gap-2 flex-shrink-0">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-store text-store-foreground text-sm font-bold">
              {store.name.charAt(0)}
            </div>
          )}
          <span className="hidden font-bold text-foreground sm:block">{store.name}</span>
        </Link>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={onCartOpen}>
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                {itemCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

    </header>
  );
};

export default StoreHeader;
