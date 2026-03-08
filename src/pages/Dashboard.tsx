import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyStore } from "@/hooks/useStore";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { BarChart3, Package, ShoppingBag, MousePointerClick, Settings, LogOut, Plus, Shield, Zap, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, loading, signOut, isStoreOwner, isAdmin } = useAuth();
  const { data: store, isLoading: storeLoading } = useMyStore();

  const { data: clickStats } = useQuery({
    queryKey: ["click_stats", store?.id],
    queryFn: async () => {
      if (!store) return [];
      const { data } = await supabase
        .from("click_events")
        .select("click_type, created_at")
        .eq("store_id", store.id)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
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

  // If no store, show create store form
  if (!store) return <CreateStorePrompt />;

  const viewClicks = clickStats?.filter((c) => c.click_type === "view_product").length ?? 0;
  const whatsappClicks = clickStats?.filter((c) => c.click_type === "whatsapp_checkout").length ?? 0;
  const activeProducts = products?.filter((p) => p.is_active).length ?? 0;

  // Group clicks by day for chart
  const chartData = getChartData(clickStats ?? []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-foreground">Painel - {store.name}</h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm"><Shield className="mr-1 h-4 w-4" /> Admin</Button>
              </Link>
            )}
            <Link to={`/${store.slug}`} target="_blank">
              <Button variant="outline" size="sm">Ver Loja</Button>
            </Link>
            <Link to="/dashboard/products">
              <Button variant="outline" size="sm"><Package className="mr-1 h-4 w-4" /> Produtos</Button>
            </Link>
            <Link to="/dashboard/settings">
              <Button variant="outline" size="sm"><Settings className="mr-1 h-4 w-4" /> Configurações</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Visualizações (7d)</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{viewClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">WhatsApp (7d)</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{whatsappClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produtos Ativos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeProducts}</p>
            </CardContent>
          </Card>
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
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium text-foreground">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">R$ {order.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                ))}
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
