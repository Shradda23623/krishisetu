
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
