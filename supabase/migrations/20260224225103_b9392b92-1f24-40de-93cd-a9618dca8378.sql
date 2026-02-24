
-- =============================================
-- FASE 1: SCHEMA COMPLETO DO SAAS MULTI-TENANT
-- =============================================

-- 1. Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'store_owner');
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled');
CREATE TYPE public.delivery_type AS ENUM ('delivery', 'pickup');
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'trial', 'expired');
CREATE TYPE public.click_type AS ENUM ('view_product', 'whatsapp_checkout');

-- =============================================
-- TABELAS
-- =============================================

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Stores
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#3B82F6',
  whatsapp TEXT NOT NULL,
  address TEXT,
  fixed_delivery_fee NUMERIC(10,2) DEFAULT 0,
  use_zone_delivery BOOLEAN DEFAULT false,
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  subscription_expires_at TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Store Settings
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
  refund_policy TEXT DEFAULT 'Política de reembolso padrão. Entre em contato conosco para mais informações.',
  terms_of_use TEXT DEFAULT 'Termos de uso padrão. Ao utilizar nosso serviço, você concorda com estes termos.',
  contact_info TEXT DEFAULT 'Entre em contato conosco pelo WhatsApp.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  sku TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, slug)
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  delivery_type delivery_type NOT NULL DEFAULT 'delivery',
  address TEXT,
  payment_method TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Click Events
CREATE TABLE public.click_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  click_type click_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Delivery Zones
CREATE TABLE public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- STORAGE
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('store-assets', 'store-assets', true);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_stores_owner ON public.stores(owner_id);
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_products_slug ON public.products(store_id, slug);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_categories_store ON public.categories(store_id);
CREATE INDEX idx_orders_store ON public.orders(store_id);
CREATE INDEX idx_click_events_store ON public.click_events(store_id);
CREATE INDEX idx_click_events_type ON public.click_events(click_type);
CREATE INDEX idx_delivery_zones_store ON public.delivery_zones(store_id);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_store_owner(_user_id UUID, _store_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.store_settings (store_id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.owner_id, 'store_owner')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_store_created
  AFTER INSERT ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_store();

-- =============================================
-- TRIGGERS updated_at
-- =============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- STORES
CREATE POLICY "Stores viewable by everyone" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Owners can insert stores" ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update own store" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all stores" ON public.stores FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- STORE SETTINGS
CREATE POLICY "Store settings viewable by everyone" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Owners can update store settings" ON public.store_settings FOR UPDATE USING (public.is_store_owner(auth.uid(), store_id));

-- CATEGORIES
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Owners can manage categories" ON public.categories FOR INSERT WITH CHECK (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Owners can update categories" ON public.categories FOR UPDATE USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Owners can delete categories" ON public.categories FOR DELETE USING (public.is_store_owner(auth.uid(), store_id));

-- PRODUCTS
CREATE POLICY "Products viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Owners can manage products" ON public.products FOR INSERT WITH CHECK (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Owners can update products" ON public.products FOR UPDATE USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Owners can delete products" ON public.products FOR DELETE USING (public.is_store_owner(auth.uid(), store_id));

-- ORDERS
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view store orders" ON public.orders FOR SELECT USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Owners can update store orders" ON public.orders FOR UPDATE USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- CLICK EVENTS
CREATE POLICY "Anyone can create click events" ON public.click_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view store clicks" ON public.click_events FOR SELECT USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Admins can view all clicks" ON public.click_events FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- DELIVERY ZONES
CREATE POLICY "Delivery zones viewable by everyone" ON public.delivery_zones FOR SELECT USING (true);
CREATE POLICY "Owners can manage delivery zones" ON public.delivery_zones FOR INSERT WITH CHECK (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Owners can update delivery zones" ON public.delivery_zones FOR UPDATE USING (public.is_store_owner(auth.uid(), store_id));
CREATE POLICY "Owners can delete delivery zones" ON public.delivery_zones FOR DELETE USING (public.is_store_owner(auth.uid(), store_id));

-- STORAGE POLICIES
CREATE POLICY "Store assets are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'store-assets');
CREATE POLICY "Authenticated users can upload store assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update store assets" ON storage.objects FOR UPDATE USING (bucket_id = 'store-assets' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete store assets" ON storage.objects FOR DELETE USING (bucket_id = 'store-assets' AND auth.role() = 'authenticated');
