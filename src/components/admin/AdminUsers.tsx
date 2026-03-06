import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<AppRole>("store_owner");

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allRoles } = useQuery({
    queryKey: ["admin_all_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: stores } = useQuery({
    queryKey: ["admin_user_stores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("stores").select("id, name, slug, owner_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_all_roles"] });
      toast.success("Role adicionada com sucesso!");
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast.error("Usuário já possui essa role.");
      } else {
        toast.error("Erro ao adicionar role.");
      }
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_all_roles"] });
      toast.success("Role removida com sucesso!");
    },
    onError: () => toast.error("Erro ao remover role."),
  });

  const getUserRoles = (userId: string) =>
    allRoles?.filter((r) => r.user_id === userId).map((r) => r.role) ?? [];

  const getUserStore = (userId: string) =>
    stores?.find((s) => s.owner_id === userId);

  if (profilesLoading) return <div className="text-center py-8 text-muted-foreground">Carregando usuários...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{profiles?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {allRoles?.filter((r) => r.role === "admin").length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lojistas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {allRoles?.filter((r) => r.role === "store_owner").length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {profiles?.map((profile) => {
              const roles = getUserRoles(profile.user_id);
              const store = getUserStore(profile.user_id);

              return (
                <div
                  key={profile.id}
                  className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {profile.full_name || "Sem nome"}
                    </p>
                    <p className="text-sm text-muted-foreground">ID: {profile.user_id.slice(0, 8)}...</p>
                    {store && (
                      <p className="text-sm text-muted-foreground">
                        Loja: <span className="font-medium">{store.name}</span> (/{store.slug})
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <Badge
                            key={role}
                            variant={role === "admin" ? "default" : "secondary"}
                            className="gap-1"
                          >
                            {role}
                            <button
                              onClick={() =>
                                removeRoleMutation.mutate({
                                  userId: profile.user_id,
                                  role,
                                })
                              }
                              className="ml-1 hover:text-destructive"
                              title="Remover role"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem roles</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedRole}
                      onValueChange={(v) => setSelectedRole(v as AppRole)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">admin</SelectItem>
                        <SelectItem value="store_owner">store_owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addRoleMutation.mutate({
                          userId: profile.user_id,
                          role: selectedRole,
                        })
                      }
                      disabled={addRoleMutation.isPending}
                    >
                      <UserPlus className="mr-1 h-4 w-4" /> Adicionar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
