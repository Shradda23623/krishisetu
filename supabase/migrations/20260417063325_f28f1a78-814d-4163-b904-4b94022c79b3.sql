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