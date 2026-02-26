import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Generate a simple fingerprint for anonymous likes
const getFingerprint = () => {
  let fp = localStorage.getItem("user_fingerprint");
  if (!fp) {
    fp = crypto.randomUUID();
    localStorage.setItem("user_fingerprint", fp);
  }
  return fp;
};

export const useProductOptionGroups = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["product_option_groups", productId],
    queryFn: async () => {
      if (!productId) throw new Error("No product");
      const { data, error } = await supabase
        .from("product_option_groups")
        .select("*, product_option_values(*)")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
};

export const useProductRatings = (productId: string | undefined) => {
  return useQuery({
    queryKey: ["product_ratings", productId],
    queryFn: async () => {
      if (!productId) throw new Error("No product");
      const { data, error } = await supabase
        .from("product_ratings")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
};

export const useProductLikes = (productId: string | undefined) => {
  const fp = getFingerprint();
  return useQuery({
    queryKey: ["product_likes", productId],
    queryFn: async () => {
      if (!productId) throw new Error("No product");
      const { data: allLikes, error } = await supabase
        .from("product_likes")
        .select("id, fingerprint")
        .eq("product_id", productId);
      if (error) throw error;
      return {
        count: allLikes?.length ?? 0,
        liked: allLikes?.some((l) => l.fingerprint === fp) ?? false,
      };
    },
    enabled: !!productId,
  });
};

export const useToggleLike = (productId: string) => {
  const qc = useQueryClient();
  const fp = getFingerprint();
  return useMutation({
    mutationFn: async (currentlyLiked: boolean) => {
      if (currentlyLiked) {
        await supabase
          .from("product_likes")
          .delete()
          .eq("product_id", productId)
          .eq("fingerprint", fp);
      } else {
        await supabase
          .from("product_likes")
          .insert({ product_id: productId, fingerprint: fp });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product_likes", productId] });
    },
  });
};
