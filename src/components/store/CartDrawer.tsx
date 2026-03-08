import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  store: Tables<"stores">;
}

const CartDrawer = ({ open, onClose, store }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate(`/${store.slug}/checkout`);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Sacola ({itemCount})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center gap-3">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/40" />
            <h3 className="text-lg font-semibold text-foreground">Sua sacola está vazia</h3>
            <p className="text-sm text-muted-foreground">Adicione produtos para continuar</p>
            <Button variant="outline" className="mt-2" onClick={onClose}>Ver Produtos</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-md border object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm text-primary font-semibold">R$ {item.price.toFixed(2)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Fazer meu Pedido
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
