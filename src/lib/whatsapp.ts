import { CartItem } from "@/contexts/CartContext";

interface WhatsAppOrder {
  storeName: string;
  storeWhatsapp: string;
  customerName: string;
  customerPhone: string;
  deliveryType: "delivery" | "pickup";
  address?: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderUrl?: string;
}

export function generateWhatsAppMessage(order: WhatsAppOrder): string {
  const itemsText = order.items
    .map((item) => `- ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`)
    .join("\n");

  const deliveryText = order.deliveryType === "delivery" 
    ? order.address || "Endereço não informado"
    : "Retirada no local";

  const message = `🛍️ *NOVO PEDIDO - ${order.storeName}*
------------------------------
👤 *CLIENTE:* ${order.customerName}
📞 *FONE:* ${order.customerPhone}
📍 *ENTREGA:* ${deliveryText}

📦 *ITENS:*
${itemsText}

💰 *SUBTOTAL:* R$ ${order.subtotal.toFixed(2)}
🚚 *TAXA:* R$ ${order.deliveryFee.toFixed(2)}
✅ *TOTAL:* R$ ${order.total.toFixed(2)}
💳 *PAGAMENTO:* ${order.paymentMethod}
------------------------------`;

  return message;
}

export function openWhatsApp(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const encoded = encodeURIComponent(message);
  window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${encoded}`, "_blank");
}
