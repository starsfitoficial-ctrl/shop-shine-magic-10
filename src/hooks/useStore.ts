import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useStoreBanners = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ["store_banners", storeId],
    queryFn: async () => {
      if (!storeId) throw new Error("No store");
      const { data, error } = await supabase
        .from("store_banners" as any)
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!storeId,
  });
};

export const useStoreBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["store", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug");
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const useStoreProducts = (storeId: string | undefined, categoryId?: string | null, search?: string, sort?: string) => {
  return useQuery({
    queryKey: ["products", storeId, categoryId, search, sort],
    queryFn: async () => {
      if (!storeId) throw new Error("No store");
      let query = supabase
        .from("products")
        .select("*, categories(name, icon)")
        .eq("store_id", storeId)
        .eq("is_active", true);

      if (categoryId) query = query.eq("category_id", categoryId);
      if (search) query = query.ilike("name", `%${search}%`);
      if (sort === "price_asc") query = query.order("price", { ascending: true });
      else if (sort === "featured") query = query.order("is_featured", { ascending: false });
      else query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
};

export const useStoreCategories = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ["categories", storeId],
    queryFn: async () => {
      if (!storeId) throw new Error("No store");
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
};

export const useProductBySlug = (storeId: string | undefined, productSlug: string | undefined) => {
  return useQuery({
    queryKey: ["product", storeId, productSlug],
    queryFn: async () => {
      if (!storeId || !productSlug) throw new Error("Missing params");
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, icon)")
        .eq("store_id", storeId)
        .eq("slug", productSlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && !!productSlug,
  });
};

export const useRelatedProducts = (storeId: string | undefined, excludeProductId: string | undefined, limit: number = 4) => {
  return useQuery({
    queryKey: ["related_products", storeId, excludeProductId, limit],
    queryFn: async () => {
      if (!storeId) throw new Error("No store");
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, images, stock")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .neq("id", excludeProductId ?? "")
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!storeId && !!excludeProductId,
  });
};

export const useStoreSettings = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ["store_settings", storeId],
    queryFn: async () => {
      if (!storeId) throw new Error("No store");
      const { data, error } = await supabase
        .from("store_settings")
        .select("*")
        .eq("store_id", storeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
};

export const useDeliveryZones = (storeId: string | undefined) => {
  return useQuery({
    queryKey: ["delivery_zones", storeId],
    queryFn: async () => {
      if (!storeId) throw new Error("No store");
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .eq("store_id", storeId)
        .order("neighborhood", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });
};

export const useMyStore = () => {
  return useQuery({
    queryKey: ["my_store"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};
