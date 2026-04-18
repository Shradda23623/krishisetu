
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
