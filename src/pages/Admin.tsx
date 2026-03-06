import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navigate, Link } from "react-router-dom";
import { Store, Users, DollarSign, LogOut, BarChart3 } from "lucide-react";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminSubscriptions from "@/components/admin/AdminSubscriptions";

const Admin = () => {
  const { user, loading, signOut, isAdmin } = useAuth();

  const { data: stores } = useQuery({
    queryKey: ["admin_stores"],
    queryFn: async () => {
      const { data } = await supabase.from("stores").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const { data: totalClicks } = useQuery({
    queryKey: ["admin_clicks"],
    queryFn: async () => {
      const { data } = await supabase.from("click_events").select("id", { count: "exact" });
      return data?.length ?? 0;
    },
    enabled: isAdmin,
  });

  if (loading) return <div className="flex min-h-screen items-center justify-center">Carregando...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const activeStores = stores?.filter((s) => s.subscription_status === "active" || s.subscription_status === "trial").length ?? 0;
  const inactiveStores = (stores?.length ?? 0) - activeStores;

  const statusColor: Record<string, string> = {
    active: "bg-green-500/10 text-green-700 border-green-200",
    trial: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
    inactive: "bg-red-500/10 text-red-700 border-red-200",
    expired: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-foreground">Admin</h1>
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="outline" size="sm"><Store className="mr-1 h-4 w-4" /> Dashboard</Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview"><BarChart3 className="mr-1 h-4 w-4" /> Visão Geral</TabsTrigger>
            <TabsTrigger value="users"><Users className="mr-1 h-4 w-4" /> Usuários</TabsTrigger>
            <TabsTrigger value="subscriptions"><DollarSign className="mr-1 h-4 w-4" /> Assinaturas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Lojas Ativas</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{activeStores}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Lojas Inativas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{inactiveStores}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Cliques</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{totalClicks}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Lojas</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stores?.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border p-4">
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <p className="text-sm text-muted-foreground">/{s.slug}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusColor[s.subscription_status] || ""}>{s.subscription_status}</Badge>
                        <Link to={`/${s.slug}`} target="_blank">
                          <Button variant="outline" size="sm">Ver</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="subscriptions">
            <AdminSubscriptions />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
