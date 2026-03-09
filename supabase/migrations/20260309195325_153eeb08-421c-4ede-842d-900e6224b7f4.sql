
CREATE TABLE public.store_banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  link text,
  title text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.store_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Banners viewable by everyone"
  ON public.store_banners FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Owners can manage banners"
  ON public.store_banners FOR INSERT
  TO public
  WITH CHECK (is_store_owner(auth.uid(), store_id));

CREATE POLICY "Owners can update banners"
  ON public.store_banners FOR UPDATE
  TO public
  USING (is_store_owner(auth.uid(), store_id));

CREATE POLICY "Owners can delete banners"
  ON public.store_banners FOR DELETE
  TO public
  USING (is_store_owner(auth.uid(), store_id));
