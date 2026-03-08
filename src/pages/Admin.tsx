import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navigate, Link } from "react-router-dom";
import {
  Store, CheckCircle, Users, Zap, Crown, ShoppingBag,
  LogOut, ExternalLink, Database, RefreshCw, Search,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

const planBadge: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-blue-500/10 text-blue-700 border-blue-200",
  premium: "bg-purple-500/10 text-purple-700 border-purple-200",
};

const statusBadge: Record<string, string> = {
  active: "bg-green-500/10 text-green-700 border-green-200",
  trial: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  inactive: "bg-red-500/10 text-red-700 border-red-200",
  expired: "bg-muted text-muted-foreground",
};

const orderStatusBadge: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-500/10 text-blue-700 border-blue-200",
  preparing: "bg-orange-500/10 text-orange-700 border-orange-200",
  delivering: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  completed: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const monthLabel = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

function buildMonthlyData(items: { created_at: string }[] | undefined, label: string) {
  if (!items?.length) return [];
  const map = new Map<string, number>();
  items.forEach((item) => {
    const key = item.created_at.slice(0, 7); // YYYY-MM
    map.set(key, (map.get(key) ?? 0) + 1);
  });
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  let cumulative = 0;
  return sorted.map(([month, count]) => {
    cumulative += count;
    return { month: monthLabel(month + "-01"), [label]: cumulative, novo: count };
  });
}

const Admin = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: stores } = useQuery({
    queryKey: ["admin_stores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, phone");
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const { data: allOrders } = useQuery({
    queryKey: ["admin_all_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ storeId, plan }: { storeId: string; plan: string }) => {
      const updates: Record<string, unknown> = { plan };
      if (plan === "pro" || plan === "premium") updates.subscription_status = "active";
      if (plan === "free") updates.subscription_status = "inactive";
      const { error } = await supabase.from("stores").update(updates).eq("id", storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_stores"] });
      toast.success("Plano atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar plano."),
  });

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    return stores.filter((s) => {
      const ownerName = profiles?.find((p) => p.user_id === s.owner_id)?.full_name || "";
      const matchesSearch =
        !searchTerm ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ownerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlan = planFilter === "all" || s.plan === planFilter;
      const matchesStatus = statusFilter === "all" || s.subscription_status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [stores, profiles, searchTerm, planFilter, statusFilter]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const totalStores = stores?.length ?? 0;
  const activeStores = stores?.filter((s) => s.subscription_status === "active" || s.plan !== "free").length ?? 0;
  const freeStores = stores?.filter((s) => s.plan === "free").length ?? 0;
  const proStores = stores?.filter((s) => s.plan === "pro").length ?? 0;
  const premiumStores = stores?.filter((s) => s.plan === "premium").length ?? 0;
  const totalOrders = allOrders?.length ?? 0;
  const recentOrders = allOrders?.slice(0, 10) ?? [];

  const getOwnerName = (ownerId: string) =>
    profiles?.find((pr) => pr.user_id === ownerId)?.full_name || "—";

  const getStoreName = (storeId: string) =>
    stores?.find((st) => st.id === storeId)?.name || "—";

  const storesChartData = buildMonthlyData(stores, "Lojas");
  const ordersChartData = buildMonthlyData(allOrders, "Pedidos");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <img src="/logo-header.png" className="h-8 w-auto" alt="SysGrowth" />
            <Badge className="bg-red-500/10 text-red-600 border-red-200">Admin</Badge>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1 h-4 w-4" /> Ver Site
              </Button>
            </a>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Total Lojas", value: totalStores, icon: Store, color: "text-blue-500" },
            { label: "Lojas Ativas", value: activeStores, icon: CheckCircle, color: "text-green-500" },
            { label: "Plano Free", value: freeStores, icon: Users, color: "text-muted-foreground" },
            { label: "Plano Pro", value: proStores, icon: Zap, color: "text-yellow-500" },
            { label: "Plano Premium", value: premiumStores, icon: Crown, color: "text-purple-500" },
            { label: "Total Pedidos", value: totalOrders, icon: ShoppingBag, color: "text-green-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{value}</p></CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evolução de Lojas</CardTitle>
            </CardHeader>
            <CardContent>
              {storesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={storesChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip />
                    <Line type="monotone" dataKey="Lojas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Sem dados suficientes.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pedidos por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ordersChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="novo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Sem dados suficientes.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stores Table with Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lojas Cadastradas</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, slug ou dono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos planos</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Dono</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <a href={`/${s.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                        {s.name}
                      </a>
                      <p className="text-xs text-muted-foreground">/{s.slug}</p>
                    </TableCell>
                    <TableCell className="text-sm">{getOwnerName(s.owner_id)}</TableCell>
                    <TableCell><Badge className={planBadge[s.plan] || ""}>{s.plan}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(s.created_at)}</TableCell>
                    <TableCell><Badge className={statusBadge[s.subscription_status] || ""}>{s.subscription_status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {s.plan !== "pro" && (
                          <Button size="sm" variant="outline" className="text-xs" disabled={updatePlanMutation.isPending}
                            onClick={() => updatePlanMutation.mutate({ storeId: s.id, plan: "pro" })}>
                            Ativar Pro
                          </Button>
                        )}
                        {s.plan !== "free" && (
                          <Button size="sm" variant="ghost" className="text-xs text-destructive" disabled={updatePlanMutation.isPending}
                            onClick={() => updatePlanMutation.mutate({ storeId: s.id, plan: "free" })}>
                            Desativar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStores.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {searchTerm || planFilter !== "all" || statusFilter !== "all"
                        ? "Nenhuma loja encontrada com os filtros aplicados."
                        : "Nenhuma loja cadastrada."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loja</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-sm font-medium">{getStoreName(o.store_id)}</TableCell>
                    <TableCell className="text-sm">{o.customer_name}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(o.total)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                    <TableCell><Badge className={orderStatusBadge[o.status] || ""}>{o.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum pedido encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Acesso Rápido</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/admin/seed-demo">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 p-6">
                  <RefreshCw className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Recriar Loja Demo</p>
                    <p className="text-sm text-muted-foreground">Resetar dados da loja de demonstração</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <a href={`https://supabase.com/dashboard/project/clrjoaicszgiztkkabkb`} target="_blank" rel="noopener noreferrer">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 p-6">
                  <Database className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-semibold">Ver Banco de Dados</p>
                    <p className="text-sm text-muted-foreground">Acessar painel do banco de dados</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
