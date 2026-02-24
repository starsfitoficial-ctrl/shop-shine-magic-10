import { useParams } from "react-router-dom";
import { useStoreBySlug, useStoreSettings, useDeliveryZones } from "@/hooks/useStore";
import { useCart } from "@/contexts/CartContext";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { trackClick } from "@/lib/trackClick";
import { generateWhatsAppMessage, openWhatsApp } from "@/lib/whatsapp";
import { fetchAddress } from "@/lib/viacep";
import { toast } from "sonner";

const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Nome obrigatório").max(100),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  deliveryType: z.enum(["delivery", "pickup"]),
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  complement: z.string().optional(),
  paymentMethod: z.string().min(1, "Selecione a forma de pagamento"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { data: store } = useStoreBySlug(storeSlug);
  const { data: zones } = useDeliveryZones(store?.id);
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { deliveryType: "delivery", paymentMethod: "" },
  });

  const deliveryType = watch("deliveryType");

  const handleCepBlur = async (cep: string) => {
    const result = await fetchAddress(cep);
    if (result) {
      setValue("street", result.logradouro);
      setValue("neighborhood", result.bairro);
      setValue("city", result.localidade);
      setValue("state", result.uf);
      // Check delivery zone fee
      if (store?.use_zone_delivery && zones) {
        const zone = zones.find(
          (z) => z.neighborhood.toLowerCase() === result.bairro.toLowerCase()
        );
        setDeliveryFee(zone ? zone.fee : store.fixed_delivery_fee ?? 0);
      }
    } else {
      toast.error("CEP não encontrado");
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (!store || items.length === 0) return;
    setLoading(true);

    try {
      const fee = deliveryType === "pickup" ? 0 : (store.use_zone_delivery ? deliveryFee : (store.fixed_delivery_fee ?? 0));
      const orderTotal = total + fee;
      const address = deliveryType === "delivery"
        ? `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ""} - ${data.neighborhood}, ${data.city}/${data.state} - CEP ${data.cep}`
        : undefined;

      // Save order
      await supabase.from("orders").insert({
        store_id: store.id,
        customer_name: data.name,
        customer_phone: data.phone,
        delivery_type: deliveryType as "delivery" | "pickup",
        address,
        payment_method: data.paymentMethod,
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        subtotal: total,
        delivery_fee: fee,
        total: orderTotal,
      });

      // Track click
      await trackClick(store.id, "whatsapp_checkout");

      // Generate WhatsApp message
      const message = generateWhatsAppMessage({
        storeName: store.name,
        storeWhatsapp: store.whatsapp,
        customerName: data.name,
        customerPhone: data.phone,
        deliveryType: deliveryType as "delivery" | "pickup",
        address,
        paymentMethod: data.paymentMethod,
        items,
        subtotal: total,
        deliveryFee: fee,
        total: orderTotal,
      });

      openWhatsApp(store.whatsapp, message);
      clearCart();
      toast.success("Pedido enviado com sucesso!");
    } catch (error) {
      toast.error("Erro ao finalizar pedido");
    } finally {
      setLoading(false);
    }
  };

  if (!store) return null;

  const currentFee = deliveryType === "pickup" ? 0 : (store.use_zone_delivery ? deliveryFee : (store.fixed_delivery_fee ?? 0));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Link to={`/${storeSlug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-foreground">Finalizar Pedido</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Seus Dados</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input id="phone" {...register("phone")} placeholder="(11) 99999-9999" />
                {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Entrega</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                defaultValue="delivery"
                onValueChange={(v) => setValue("deliveryType", v as "delivery" | "pickup")}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery">Delivery</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup">Retirada no Local</Label>
                </div>
              </RadioGroup>

              {deliveryType === "delivery" && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      {...register("cep")}
                      onBlur={(e) => handleCepBlur(e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="street">Rua</Label>
                      <Input id="street" {...register("street")} />
                    </div>
                    <div>
                      <Label htmlFor="number">Nº</Label>
                      <Input id="number" {...register("number")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input id="neighborhood" {...register("neighborhood")} />
                    </div>
                    <div>
                      <Label htmlFor="complement">Complemento</Label>
                      <Input id="complement" {...register("complement")} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input id="city" {...register("city")} />
                    </div>
                    <div>
                      <Label htmlFor="state">Estado</Label>
                      <Input id="state" {...register("state")} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Pagamento</CardTitle></CardHeader>
            <CardContent>
              <Select onValueChange={(v) => setValue("paymentMethod", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMethod && <p className="mt-1 text-sm text-destructive">{errors.paymentMethod.message}</p>}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>R$ {currentFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-foreground">
                  <span>Total</span>
                  <span>R$ {(total + currentFee).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full text-lg" disabled={loading || items.length === 0}>
            <MessageCircle className="mr-2 h-5 w-5" />
            {loading ? "Enviando..." : "Finalizar no WhatsApp"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
