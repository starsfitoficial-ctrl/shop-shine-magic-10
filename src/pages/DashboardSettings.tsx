import { useState, useEffect } from "react";
import { useMyStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from "sonner";

const DashboardSettings = () => {
  const { user, loading } = useAuth();
  const { data: store, refetch: refetchStore } = useMyStore();
  const [saving, setSaving] = useState(false);

  // Store fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [logoUrl, setLogoUrl] = useState("");
  const [address, setAddress] = useState("");
  const [fixedFee, setFixedFee] = useState("0");
  const [useZone, setUseZone] = useState(false);

  // Legal
  const [refundPolicy, setRefundPolicy] = useState("");
  const [terms, setTerms] = useState("");
  const [contact, setContact] = useState("");

  useEffect(() => {
    if (store) {
      setName(store.name);
      setSlug(store.slug);
      setWhatsapp(store.whatsapp);
      setPrimaryColor(store.primary_color);
      setLogoUrl(store.logo_url || "");
      setAddress(store.address || "");
      setFixedFee(store.fixed_delivery_fee?.toString() || "0");
      setUseZone(store.use_zone_delivery ?? false);

      // Fetch settings
      supabase.from("store_settings").select("*").eq("store_id", store.id).single().then(({ data }) => {
        if (data) {
          setRefundPolicy(data.refund_policy || "");
          setTerms(data.terms_of_use || "");
          setContact(data.contact_info || "");
        }
      });
    }
  }, [store]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;

  const handleCreateStore = async () => {
    if (!name || !slug || !whatsapp) {
      toast.error("Preencha nome, slug e WhatsApp");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("stores").insert({
        owner_id: user.id,
        name,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, ""),
        whatsapp,
        primary_color: primaryColor,
        logo_url: logoUrl || null,
        address: address || null,
        fixed_delivery_fee: parseFloat(fixedFee) || 0,
        use_zone_delivery: useZone,
      });
      if (error) throw error;
      toast.success("Loja criada com sucesso!");
      refetchStore();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const { error: storeError } = await supabase.from("stores").update({
        name,
        whatsapp,
        primary_color: primaryColor,
        logo_url: logoUrl || null,
        address: address || null,
        fixed_delivery_fee: parseFloat(fixedFee) || 0,
        use_zone_delivery: useZone,
      }).eq("id", store.id);
      if (storeError) throw storeError;

      const { error: settingsError } = await supabase.from("store_settings").update({
        refund_policy: refundPolicy,
        terms_of_use: terms,
        contact_info: contact,
      }).eq("store_id", store.id);
      if (settingsError) throw settingsError;

      toast.success("Configurações salvas!");
      refetchStore();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Link to="/dashboard"><ArrowLeft className="h-5 w-5 text-muted-foreground" /></Link>
          <h1 className="text-xl font-bold text-foreground">{store ? "Configurações da Loja" : "Criar Loja"}</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-6 space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados da Loja</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nome da Loja *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            {!store && (
              <div><Label>Slug (URL) *</Label><Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="minha-loja" /></div>
            )}
            <div><Label>WhatsApp *</Label><Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="5511999999999" /></div>
            <div>
              <Label>Cor Primária</Label>
              <div className="flex gap-2 items-center">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 rounded cursor-pointer" />
                <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div><Label>URL do Logo</Label><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} /></div>
            <div><Label>Endereço</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Taxas de Entrega</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch checked={useZone} onCheckedChange={setUseZone} />
              <Label>Usar taxa por bairro</Label>
            </div>
            {!useZone && (
              <div><Label>Taxa fixa (R$)</Label><Input type="number" step="0.01" value={fixedFee} onChange={(e) => setFixedFee(e.target.value)} /></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Páginas Legais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Política de Reembolso</Label><Textarea value={refundPolicy} onChange={(e) => setRefundPolicy(e.target.value)} rows={4} /></div>
            <div><Label>Termos de Uso</Label><Textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={4} /></div>
            <div><Label>Contato</Label><Textarea value={contact} onChange={(e) => setContact(e.target.value)} rows={4} /></div>
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" onClick={store ? handleSave : handleCreateStore} disabled={saving}>
          {saving ? "Salvando..." : store ? "Salvar Configurações" : "Criar Loja"}
        </Button>
      </main>
    </div>
  );
};

export default DashboardSettings;
