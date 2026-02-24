import { supabase } from "@/integrations/supabase/client";

export async function trackClick(
  storeId: string,
  clickType: "view_product" | "whatsapp_checkout",
  productId?: string
) {
  await supabase.from("click_events").insert({
    store_id: storeId,
    click_type: clickType,
    product_id: productId || null,
  });
}
