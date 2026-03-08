import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigate, Link } from "react-router-dom";
import {
  Store, CheckCircle, Users, Zap, Crown, ShoppingBag,
  LogOut, ExternalLink, Database, RefreshCw,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

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

const Admin = () => {
  const { user, loading, signOut, isAdmin } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: orders } = useQuery({
    queryKey: ["admin_orders_recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const { data: totalOrders } = useQuery({
    queryKey: ["admin_orders_count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isAdmin,
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ storeId, plan }: { storeId: string; plan: string }) => {
      const updates: Record<string, unknown> = { plan };
      if (plan === "pro" || plan === "premium") {
        updates.subscription_status = "active";
      }
      if (plan === "free") {
        updates.subscription_status = "inactive";
      }
      const { error } = await supabase.from("stores").update(updates).eq("id", storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_stores"] });
      toast.success("Plano atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar plano."),
  });

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const totalStores = stores?.length ?? 0;
  const activeStores = stores?.filter((s) => s.subscription_status === "active" || s.plan !== "free").length ?? 0;
  const freeStores = stores?.filter((s) => s.plan === "free").length ?? 0;
  const proStores = stores?.filter((s) => s.plan === "pro").length ?? 0;
  const premiumStores = stores?.filter((s) => s.plan === "premium").length ?? 0;

  const getOwnerName = (ownerId: string) => {
    const p = profiles?.find((pr) => pr.user_id === ownerId);
    return p?.full_name || "—";
  };

  const getStoreName = (storeId: string) => {
    const s = stores?.find((st) => st.id === storeId);
    return s?.name || "—";
  };

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Lojas</CardTitle>
              <Store className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{totalStores}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Lojas Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{activeStores}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Plano Free</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{freeStores}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Plano Pro</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{proStores}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Plano Premium</CardTitle>
              <Crown className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{premiumStores}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Pedidos</CardTitle>
              <ShoppingBag className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{totalOrders}</p></CardContent>
          </Card>
        </div>

        {/* Stores Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lojas Cadastradas</CardTitle>
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
                {stores?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <a
                        href={`/${s.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {s.name}
                      </a>
                      <p className="text-xs text-muted-foreground">/{s.slug}</p>
                    </TableCell>
                    <TableCell className="text-sm">{getOwnerName(s.owner_id)}</TableCell>
                    <TableCell>
                      <Badge className={planBadge[s.plan] || ""}>{s.plan}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(s.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadge[s.subscription_status] || ""}>
                        {s.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {s.plan !== "pro" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            disabled={updatePlanMutation.isPending}
                            onClick={() => updatePlanMutation.mutate({ storeId: s.id, plan: "pro" })}
                          >
                            Ativar Pro
                          </Button>
                        )}
                        {s.plan !== "free" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-destructive"
                            disabled={updatePlanMutation.isPending}
                            onClick={() => updatePlanMutation.mutate({ storeId: s.id, plan: "free" })}
                          >
                            Desativar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!stores || stores.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma loja cadastrada.
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
                {orders?.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="text-sm font-medium">{getStoreName(o.store_id)}</TableCell>
                    <TableCell className="text-sm">{o.customer_name}</TableCell>
                    <TableCell className="text-sm font-medium">{formatCurrency(o.total)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                    <TableCell>
                      <Badge className={orderStatusBadge[o.status] || ""}>{o.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {(!orders || orders.length === 0) && (
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
            <a
              href={`https://supabase.com/dashboard/project/clrjoaicszgiztkkabkb`}
              target="_blank"
              rel="noopener noreferrer"
            >
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
