import { useParams } from "react-router-dom";
import { useStoreBySlug, useStoreSettings } from "@/hooks/useStore";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const StorePolicy = () => {
  const { storeSlug, policyType } = useParams<{ storeSlug: string; policyType: string }>();
  const { data: store } = useStoreBySlug(storeSlug);
  const { data: settings } = useStoreSettings(store?.id);

  if (!store || !settings) return null;

  const titles: Record<string, string> = {
    "politica-de-reembolso": "Política de Reembolso",
    "termos-de-uso": "Termos de Uso",
    contato: "Contato",
  };

  const content: Record<string, string | null> = {
    "politica-de-reembolso": settings.refund_policy,
    "termos-de-uso": settings.terms_of_use,
    contato: settings.contact_info,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Link to={`/${storeSlug}`} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <h1 className="mb-6 text-2xl font-bold text-foreground">{titles[policyType!] || "Página"}</h1>
        <div className="prose prose-sm max-w-none text-foreground">
          <p className="whitespace-pre-wrap">{content[policyType!] || "Conteúdo não disponível."}</p>
        </div>
      </div>
    </div>
  );
};

export default StorePolicy;
