-- =============================================================================
-- KrishiSetu — full schema migration (concatenated from supabase/migrations/)
-- Run this ONCE in a fresh Supabase project's SQL Editor to recreate all tables,
-- triggers, RLS policies, functions, and the product-images storage bucket.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- FILE: 20260410171833_b146dfc3-9a0a-4490-98ab-2811bc098dd4.sql
-- ---------------------------------------------------------------------------

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('farmer', 'customer');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
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

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles RLS policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-create profile and default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ---------------------------------------------------------------------------
-- FILE: 20260412082902_d96585ec-93b0-4f78-8ad0-f2169a3e2f8e.sql
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision,
ADD COLUMN delivery_radius_km double precision DEFAULT 10;


-- ---------------------------------------------------------------------------
-- FILE: 20260413052543_fb06626e-70cf-46dc-bf1f-561fc4b2e631.sql
-- ---------------------------------------------------------------------------

-- Order status enum
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled');

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  image_url TEXT,
  price NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Farmers can view all own products" ON public.products
  FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = farmer_id AND public.has_role(auth.uid(), 'farmer'));

CREATE POLICY "Farmers can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = farmer_id AND public.has_role(auth.uid(), 'farmer'));

CREATE POLICY "Farmers can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = farmer_id AND public.has_role(auth.uid(), 'farmer'));

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_farmer ON public.products(farmer_id);
CREATE INDEX idx_products_category ON public.products(category);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  farmer_id UUID NOT NULL,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_address TEXT,
  delivery_lat DOUBLE PRECISION,
  delivery_lng DOUBLE PRECISION,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Farmers can view orders for them" ON public.orders
  FOR SELECT USING (auth.uid() = farmer_id);

CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id AND public.has_role(auth.uid(), 'customer'));

CREATE POLICY "Farmers can update order status" ON public.orders
  FOR UPDATE USING (auth.uid() = farmer_id);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_farmer ON public.orders(farmer_id);

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items for their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.customer_id = auth.uid() OR orders.farmer_id = auth.uid()))
  );

CREATE POLICY "Customers can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
  );

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  farmer_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id),
  order_id UUID REFERENCES public.orders(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Customers can create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = customer_id AND public.has_role(auth.uid(), 'customer'));

CREATE POLICY "Customers can update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Customers can delete own reviews" ON public.reviews
  FOR DELETE USING (auth.uid() = customer_id);

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_reviews_farmer ON public.reviews(farmer_id);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;


-- ---------------------------------------------------------------------------
-- FILE: 20260414081001_1ee5921d-4b86-49bf-8a2d-33984be41504.sql
-- ---------------------------------------------------------------------------

-- Stock reduction function + trigger
CREATE OR REPLACE FUNCTION public.reduce_stock_on_confirm()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    UPDATE public.products p
    SET stock_quantity = p.stock_quantity - oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_order_confirmed ON public.orders;
CREATE TRIGGER on_order_confirmed
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.reduce_stock_on_confirm();

-- Product images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Farmers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'farmer')
);

CREATE POLICY "Farmers can update own product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Farmers can delete own product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- ---------------------------------------------------------------------------
-- FILE: 20260416063021_17f0f86f-99b5-4268-894e-45f6a1b4001c.sql
-- ---------------------------------------------------------------------------

-- Validate stock before inserting order items
CREATE OR REPLACE FUNCTION public.validate_stock_before_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  available integer;
  pending_reserved integer;
BEGIN
  SELECT stock_quantity INTO available FROM public.products WHERE id = NEW.product_id;
  IF available IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Count quantity already reserved in pending orders (not yet confirmed/cancelled)
  SELECT COALESCE(SUM(oi.quantity), 0) INTO pending_reserved
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  WHERE oi.product_id = NEW.product_id
    AND o.status = 'pending';

  IF (available - pending_reserved) < NEW.quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %', NEW.product_id, (available - pending_reserved), NEW.quantity;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_stock_before_order_item
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_stock_before_order_item();

-- Function to cancel stale pending orders (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_stale_pending_orders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cancelled_count integer;
BEGIN
  UPDATE public.orders
  SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending'
    AND created_at < now() - interval '1 hour';
  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  RETURN cancelled_count;
END;
$$;


-- ---------------------------------------------------------------------------
-- FILE: 20260417063325_f28f1a78-814d-4163-b904-4b94022c79b3.sql
-- ---------------------------------------------------------------------------
-- Attach missing triggers (functions exist but triggers were not created)

-- Trigger: validate stock before inserting order item
DROP TRIGGER IF EXISTS check_stock_before_order_item ON public.order_items;
CREATE TRIGGER check_stock_before_order_item
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_stock_before_order_item();

-- Trigger: reduce stock when order is confirmed
DROP TRIGGER IF EXISTS reduce_stock_on_order_confirm ON public.orders;
CREATE TRIGGER reduce_stock_on_order_confirm
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.reduce_stock_on_confirm();

-- Trigger: updated_at on orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: updated_at on products
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: updated_at on reviews
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: handle new user signup (create profile + role)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Enable extensions for scheduled cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
