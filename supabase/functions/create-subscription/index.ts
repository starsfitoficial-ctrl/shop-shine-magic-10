import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store_id, plan } = await req.json();

    if (!store_id || !plan || !["pro", "premium"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "store_id e plan (pro|premium) são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Buscar dados da loja
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, slug, owner_id")
      .eq("id", store_id)
      .single();

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: "Loja não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar email do owner
    const { data: authUser } = await supabase.auth.admin.getUserById(store.owner_id);
    const ownerEmail = authUser?.user?.email || `${store.slug}@vitrinedigital.app`;

    const asaasApiKey = Deno.env.get("ASAAS_API_KEY")!;
    const asaasBase = "https://api.asaas.com/v3";

    // Criar cliente no Asaas
    const customerRes = await fetch(`${asaasBase}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: asaasApiKey,
      },
      body: JSON.stringify({
        name: store.name,
        email: ownerEmail,
        externalReference: store.id,
      }),
    });

    const customer = await customerRes.json();
    if (!customerRes.ok) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar cliente no gateway", details: customer }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar assinatura
    const today = new Date().toISOString().split("T")[0];
    const value = plan === "pro" ? 49.0 : 99.0;

    const subscriptionRes = await fetch(`${asaasBase}/subscriptions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: asaasApiKey,
      },
      body: JSON.stringify({
        customer: customer.id,
        billingType: "UNDEFINED",
        value,
        cycle: "MONTHLY",
        nextDueDate: today,
        description: `Plano ${plan === "pro" ? "Pro" : "Premium"} - ${store.name}`,
        externalReference: store.id,
      }),
    });

    const subscription = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar assinatura", details: subscription }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Salvar subscription_id na loja
    await supabase
      .from("stores")
      .update({ subscription_id: subscription.id })
      .eq("id", store_id);

    return new Response(
      JSON.stringify({ paymentUrl: subscription.invoiceUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro interno", message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
