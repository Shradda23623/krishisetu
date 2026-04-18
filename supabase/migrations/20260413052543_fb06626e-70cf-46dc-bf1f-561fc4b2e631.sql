
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
