// Real DB products use UUIDs. Static demo products use simple numeric IDs ("1", "2", ...).
// Demo products cannot be ordered because they don't exist in the products table.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOrderable(productId: string): boolean {
  return UUID_RE.test(productId);
}
