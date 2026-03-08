import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyStore } from "@/hooks/useStore";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { BarChart3, Package, ShoppingBag, MousePointerClick, Settings, LogOut, Plus, Shield, Zap, Loader2, TrendingUp, ExternalLink } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "outline" },
  confirmed: { label: "Confirmado", variant: "default" },
  preparing: { label: "Preparando", variant: "secondary" },
  delivering: { label: "Entregando", variant: "secondary" },
  completed: { label: "Concluído", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

const Dashboard = () => {
  const { user, loading, signOut, isStoreOwner, isAdmin } = useAuth();
  const { data: store, isLoading: storeLoading } = useMyStore();
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const { data: clickStats } = useQuery({
    queryKey: ["click_stats", store?.id],
    queryFn: async () => {
      if (!store) return [];
      const { data } = await supabase
        .from("click_events")
        .select("click_type, created_at")
        .eq("store_id", store.id)
        .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());
      return data ?? [];
    },
    enabled: !!store,
  });

  const { data: products } = useQuery({
    queryKey: ["dashboard_products", store?.id],
    queryFn: async () => {
      if (!store) return [];
      const { data } = await supabase.from("products").select("id, is_active").eq("store_id", store.id);
      return data ?? [];
    },
    enabled: !!store,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ["recent_orders", store?.id],
    queryFn: async () => {
      if (!store) return [];
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
    enabled: !!store,
  });

  if (loading || storeLoading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;

  if (!store) return <CreateStorePrompt />;

  const now = Date.now();
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thisWeek = clickStats?.filter((c) => c.created_at >= oneWeekAgo) ?? [];
  const prevWeek = clickStats?.filter((c) => c.created_at < oneWeekAgo) ?? [];

  const viewClicks = thisWeek.filter((c) => c.click_type === "view_product").length;
  const whatsappClicks = thisWeek.filter((c) => c.click_type === "whatsapp_checkout").length;
  const prevViews = prevWeek.filter((c) => c.click_type === "view_product").length;
  const prevWhatsapp = prevWeek.filter((c) => c.click_type === "whatsapp_checkout").length;
  const activeProducts = products?.filter((p) => p.is_active).length ?? 0;

  const calcVariation = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };
  const viewsVar = calcVariation(viewClicks, prevViews);
  const whatsappVar = calcVariation(whatsappClicks, prevWhatsapp);

  const chartData = getChartData(thisWeek);
  const storeInitials = store.name.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/logo-header.png" alt="SysGrowth" className="h-8 w-auto" />
            <span className="hidden sm:inline text-lg font-semibold text-foreground truncate max-w-[200px]">{store.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm"><Shield className="mr-1 h-4 w-4" /> Admin</Button>
              </Link>
            )}
            <Link to="/dashboard/products" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm"><Package className="mr-1 h-4 w-4" /> Produtos</Button>
            </Link>
            <Link to="/dashboard/settings" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm"><Settings className="mr-1 h-4 w-4" /></Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {storeInitials}
            </div>
          </div>
        </div>
      </header>

      {store.plan === "free" && (
        <div className="container mx-auto px-4 pt-6">
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 text-amber-800">
              <Zap className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Você está no plano gratuito — limitado a 10 produtos</span>
            </div>
            <Button
              size="sm"
              disabled={upgradeLoading}
              onClick={async () => {
                setUpgradeLoading(true);
                try {
                  const { data, error } = await supabase.functions.invoke("create-subscription", {
                    body: { store_id: store.id, plan: "pro" },
                  });
                  if (error || !data?.paymentUrl) throw error ?? new Error("Sem URL");
                  window.open(data.paymentUrl, "_blank");
                } catch {
                  toast.error("Erro ao gerar cobrança. Tente novamente.");
                } finally {
                  setUpgradeLoading(false);
                }
              }}
            >
              {upgradeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Assinar Plano Pro
            </Button>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-blue-100 p-3">
                <MousePointerClick className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Visualizações (7d)</p>
                <p className="text-3xl font-bold text-foreground">{viewClicks}</p>
                <VariationLabel value={viewsVar} />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-green-100 p-3">
                <ShoppingBag className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp (7d)</p>
                <p className="text-3xl font-bold text-foreground">{whatsappClicks}</p>
                <VariationLabel value={whatsappVar} />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-xl bg-purple-100 p-3">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produtos Ativos</p>
                <p className="text-3xl font-bold text-foreground">{activeProducts}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link to="/dashboard/products">
            <Card className="group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-primary/10 p-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Adicionar Produto</p>
                  <p className="text-sm text-muted-foreground">Cadastrar novo item</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <a href={`/${store.slug}`} target="_blank" rel="noopener noreferrer">
            <Card className="group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-green-100 p-3">
                  <ExternalLink className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Ver Minha Loja</p>
                  <p className="text-sm text-muted-foreground">Abrir vitrine pública</p>
                </div>
              </CardContent>
            </Card>
          </a>
          <Link to="/dashboard/settings">
            <Card className="group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-xl bg-purple-100 p-3">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">Configurações</p>
                  <p className="text-sm text-muted-foreground">Ajustar sua loja</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliques (Últimos 7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" name="Visualizações" fill="hsl(217, 91%, 60%)" />
                  <Bar dataKey="whatsapp" name="WhatsApp" fill="hsl(142, 71%, 45%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-1">
                {recentOrders.map((order) => {
                  const status = statusConfig[order.status] ?? { label: order.status, variant: "outline" as const };
                  return (
                    <div key={order.id} className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <p className="font-medium text-foreground">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <div className="text-right">
                          <p className="font-bold text-foreground">R$ {order.total.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground">Nenhum pedido ainda</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

function CreateStorePrompt() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <CardTitle>Crie sua Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">Você ainda não tem uma loja. Vá para as configurações para criar uma.</p>
          <Link to="/dashboard/settings">
            <Button><Plus className="mr-2 h-4 w-4" /> Criar Loja</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function getChartData(clicks: { click_type: string; created_at: string }[]) {
  const days: Record<string, { views: number; whatsapp: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    days[key] = { views: 0, whatsapp: 0 };
  }
  clicks.forEach((c) => {
    const key = new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (days[key]) {
      if (c.click_type === "view_product") days[key].views++;
      else days[key].whatsapp++;
    }
  });
  return Object.entries(days).map(([date, data]) => ({ date, ...data }));
}

export default Dashboard;
