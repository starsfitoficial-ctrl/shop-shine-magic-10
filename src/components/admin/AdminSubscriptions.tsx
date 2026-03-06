import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DollarSign, Store, Calendar } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

const statusLabels: Record<SubscriptionStatus, string> = {
  active: "Ativa",
  inactive: "Inativa",
  trial: "Trial",
  expired: "Expirada",
};

const statusColor: Record<SubscriptionStatus, string> = {
  active: "bg-green-500/10 text-green-700 border-green-200",
  trial: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  inactive: "bg-red-500/10 text-red-700 border-red-200",
  expired: "bg-muted text-muted-foreground",
};

const AdminSubscriptions = () => {
  const queryClient = useQueryClient();

  const { data: stores, isLoading } = useQuery({
    queryKey: ["admin_stores_subs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      storeId,
      status,
      expiresAt,
    }: {
      storeId: string;
      status: SubscriptionStatus;
      expiresAt: string | null;
    }) => {
      const { error } = await supabase
        .from("stores")
        .update({
          subscription_status: status,
          subscription_expires_at: expiresAt,
        })
        .eq("id", storeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_stores_subs"] });
      toast.success("Assinatura atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar assinatura."),
  });

  const activeCount = stores?.filter((s) => s.subscription_status === "active").length ?? 0;
  const trialCount = stores?.filter((s) => s.subscription_status === "trial").length ?? 0;
  const inactiveCount = stores?.filter((s) => s.subscription_status === "inactive" || s.subscription_status === "expired").length ?? 0;

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Carregando lojas...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ativas</CardTitle>
            <Store className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trial</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{trialCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inativas / Expiradas</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{inactiveCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stores?.map((store) => (
              <StoreSubscriptionRow
                key={store.id}
                store={store}
                onUpdate={(status, expiresAt) =>
                  updateMutation.mutate({ storeId: store.id, status, expiresAt })
                }
                isPending={updateMutation.isPending}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

function StoreSubscriptionRow({
  store,
  onUpdate,
  isPending,
}: {
  store: any;
  onUpdate: (status: SubscriptionStatus, expiresAt: string | null) => void;
  isPending: boolean;
}) {
  const [status, setStatus] = useState<SubscriptionStatus>(store.subscription_status);
  const [expiresAt, setExpiresAt] = useState(
    store.subscription_expires_at
      ? new Date(store.subscription_expires_at).toISOString().split("T")[0]
      : ""
  );

  const hasChanges =
    status !== store.subscription_status ||
    (expiresAt || null) !==
      (store.subscription_expires_at
        ? new Date(store.subscription_expires_at).toISOString().split("T")[0]
        : null);

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{store.name}</p>
          <p className="text-sm text-muted-foreground">/{store.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColor[store.subscription_status as SubscriptionStatus]}>
            {statusLabels[store.subscription_status as SubscriptionStatus]}
          </Badge>
          <Link to={`/${store.slug}`} target="_blank">
            <Button variant="ghost" size="sm">Ver</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="trial">Trial</SelectItem>
              <SelectItem value="inactive">Inativa</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1">
          <Label className="text-xs">Expira em</Label>
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>
        <Button
          size="sm"
          disabled={!hasChanges || isPending}
          onClick={() =>
            onUpdate(status, expiresAt ? new Date(expiresAt).toISOString() : null)
          }
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}

export default AdminSubscriptions;
