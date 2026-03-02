import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface ProductOptionsManagerProps {
  productId: string;
}

interface OptionGroup {
  id: string;
  name: string;
  sort_order: number | null;
  product_id: string;
  created_at: string;
}

interface OptionValue {
  id: string;
  label: string;
  price_modifier: number | null;
  sort_order: number | null;
  option_group_id: string;
  created_at: string;
}

const ProductOptionsManager = ({ productId }: ProductOptionsManagerProps) => {
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const { data: groups = [] } = useQuery({
    queryKey: ["option_groups", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_option_groups")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data as OptionGroup[];
    },
  });

  const { data: allValues = [] } = useQuery({
    queryKey: ["option_values", productId],
    queryFn: async () => {
      if (groups.length === 0) return [];
      const groupIds = groups.map((g) => g.id);
      const { data, error } = await supabase
        .from("product_option_values")
        .select("*")
        .in("option_group_id", groupIds)
        .order("sort_order");
      if (error) throw error;
      return data as OptionValue[];
    },
    enabled: groups.length > 0,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["option_groups", productId] });
    queryClient.invalidateQueries({ queryKey: ["option_values", productId] });
  };

  const addGroup = useMutation({
    mutationFn: async () => {
      if (!newGroupName.trim()) return;
      const { error } = await supabase.from("product_option_groups").insert({
        product_id: productId,
        name: newGroupName.trim(),
        sort_order: groups.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewGroupName("");
      invalidate();
      toast.success("Grupo de opção criado!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteGroup = useMutation({
    mutationFn: async (groupId: string) => {
      // Delete values first, then group
      await supabase.from("product_option_values").delete().eq("option_group_id", groupId);
      const { error } = await supabase.from("product_option_groups").delete().eq("id", groupId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Grupo removido!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Opções do Produto</h3>
      </div>

      {/* Existing groups */}
      {groups.map((group) => (
        <OptionGroupCard
          key={group.id}
          group={group}
          values={allValues.filter((v) => v.option_group_id === group.id)}
          expanded={expandedGroup === group.id}
          onToggle={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
          onDelete={() => deleteGroup.mutate(group.id)}
          onChanged={invalidate}
        />
      ))}

      {/* Add new group */}
      <div className="flex gap-2">
        <Input
          placeholder="Ex: Tamanho, Cor, Sabor..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGroup.mutate())}
          className="flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => addGroup.mutate()} disabled={!newGroupName.trim()}>
          <Plus className="mr-1 h-4 w-4" /> Grupo
        </Button>
      </div>
    </div>
  );
};

function OptionGroupCard({
  group,
  values,
  expanded,
  onToggle,
  onDelete,
  onChanged,
}: {
  group: OptionGroup;
  values: OptionValue[];
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const addValue = useMutation({
    mutationFn: async () => {
      if (!newLabel.trim()) return;
      const { error } = await supabase.from("product_option_values").insert({
        option_group_id: group.id,
        label: newLabel.trim(),
        price_modifier: newPrice ? parseFloat(newPrice) : 0,
        sort_order: values.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewLabel("");
      setNewPrice("");
      onChanged();
      toast.success("Opção adicionada!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteValue = useMutation({
    mutationFn: async (valueId: string) => {
      const { error } = await supabase.from("product_option_values").delete().eq("id", valueId);
      if (error) throw error;
    },
    onSuccess: () => {
      onChanged();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-border">
      <CardHeader className="p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{group.name}</CardTitle>
            <span className="text-xs text-muted-foreground">({values.length} opções)</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-3 pt-0 space-y-2">
          {/* Existing values */}
          {values.map((v) => (
            <div key={v.id} className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
              <span className="flex-1 text-sm text-foreground">{v.label}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {(v.price_modifier ?? 0) > 0 ? `+R$ ${(v.price_modifier ?? 0).toFixed(2)}` : (v.price_modifier ?? 0) < 0 ? `-R$ ${Math.abs(v.price_modifier ?? 0).toFixed(2)}` : "—"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => deleteValue.mutate(v.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Add new value */}
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Ex: P, M, G..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue.mutate())}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="+R$"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="w-24"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue.mutate())}
            />
            <Button type="button" size="icon" variant="outline" onClick={() => addValue.mutate()} disabled={!newLabel.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default ProductOptionsManager;
