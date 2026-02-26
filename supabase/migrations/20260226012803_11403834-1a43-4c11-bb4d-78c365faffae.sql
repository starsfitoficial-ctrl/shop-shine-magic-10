
-- Product option groups (e.g., "Tamanho", "Cor")
CREATE TABLE public.product_option_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product option values (e.g., "P", "M", "G")
CREATE TABLE public.product_option_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  option_group_id UUID NOT NULL REFERENCES public.product_option_groups(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  price_modifier NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product ratings
CREATE TABLE public.product_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product likes
CREATE TABLE public.product_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, fingerprint)
);

-- RLS policies
ALTER TABLE public.product_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

-- Option groups: everyone can read, owners can manage
CREATE POLICY "Option groups viewable by everyone" ON public.product_option_groups FOR SELECT USING (true);
CREATE POLICY "Owners can manage option groups" ON public.product_option_groups FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.products p JOIN public.stores s ON s.id = p.store_id WHERE p.id = product_id AND s.owner_id = auth.uid())
);
CREATE POLICY "Owners can update option groups" ON public.product_option_groups FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.products p JOIN public.stores s ON s.id = p.store_id WHERE p.id = product_id AND s.owner_id = auth.uid())
);
CREATE POLICY "Owners can delete option groups" ON public.product_option_groups FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.products p JOIN public.stores s ON s.id = p.store_id WHERE p.id = product_id AND s.owner_id = auth.uid())
);

-- Option values: everyone can read, owners can manage
CREATE POLICY "Option values viewable by everyone" ON public.product_option_values FOR SELECT USING (true);
CREATE POLICY "Owners can manage option values" ON public.product_option_values FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.product_option_groups og JOIN public.products p ON p.id = og.product_id JOIN public.stores s ON s.id = p.store_id WHERE og.id = option_group_id AND s.owner_id = auth.uid())
);
CREATE POLICY "Owners can update option values" ON public.product_option_values FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.product_option_groups og JOIN public.products p ON p.id = og.product_id JOIN public.stores s ON s.id = p.store_id WHERE og.id = option_group_id AND s.owner_id = auth.uid())
);
CREATE POLICY "Owners can delete option values" ON public.product_option_values FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.product_option_groups og JOIN public.products p ON p.id = og.product_id JOIN public.stores s ON s.id = p.store_id WHERE og.id = option_group_id AND s.owner_id = auth.uid())
);

-- Ratings: everyone can read, anyone can insert
CREATE POLICY "Ratings viewable by everyone" ON public.product_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can create ratings" ON public.product_ratings FOR INSERT WITH CHECK (true);

-- Likes: everyone can read, anyone can insert/delete
CREATE POLICY "Likes viewable by everyone" ON public.product_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can toggle likes" ON public.product_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove likes" ON public.product_likes FOR DELETE USING (true);
