import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { getTranslatedProduct } from "@/i18n/productTranslations";
import { useCreateOrder } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { isOrderable } from "@/lib/productUtils";
import { supabase } from "@/integrations/supabase/client";
import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { t, language } = useI18n();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createOrder = useCreateOrder();
  const [notes, setNotes] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const deliveryFee = totalPrice > 500 ? 0 : 40;
  const grandTotal = totalPrice + deliveryFee;

  // Group items by farmer
  const itemsByFarmer = items.reduce((acc, item) => {
    const fid = item.product.farmerId;
    if (!acc[fid]) acc[fid] = [];
    acc[fid].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const handleCheckout = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to place an order.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (role !== "customer") {
      toast({ title: "Customer only", description: "Only customers can place orders.", variant: "destructive" });
      return;
    }

    // Filter out demo (non-UUID) items that can't be ordered
    const orderableItems = items.filter(i => isOrderable(i.product.id));
    if (orderableItems.length === 0) {
      toast({
        title: "No purchasable items",
        description: "Your cart only contains demo products. Browse listings from real farmers to place an order.",
        variant: "destructive",
      });
      return;
    }
    if (orderableItems.length !== items.length) {
      toast({
        title: "Some items skipped",
        description: "Demo products were removed from this order.",
      });
    }

    setCheckingOut(true);
    try {
      // Fetch delivery address from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("address, latitude, longitude")
        .eq("user_id", user.id)
        .maybeSingle();

      const orderableByFarmer = orderableItems.reduce((acc, item) => {
        const fid = item.product.farmerId;
        if (!acc[fid]) acc[fid] = [];
        acc[fid].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      // Create one order per farmer
      const orderIds: string[] = [];
      for (const [farmerId, farmerItems] of Object.entries(orderableByFarmer)) {
        const farmerTotal = farmerItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
        const order = await createOrder.mutateAsync({
          customer_id: user.id,
          farmer_id: farmerId,
          total_amount: farmerTotal,
          notes: notes || undefined,
          delivery_address: profile?.address || undefined,
          delivery_lat: profile?.latitude ?? undefined,
          delivery_lng: profile?.longitude ?? undefined,
          items: farmerItems.map(i => ({
            product_id: i.product.id,
            quantity: i.quantity,
            unit_price: i.product.price,
          })),
        });
        orderIds.push(order.id);
      }

      // Navigate to checkout (don't clear cart yet — clear on payment success)
      navigate(`/checkout?orders=${orderIds.join(",")}&deliveryFee=${deliveryFee}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Could not place order", description: message, variant: "destructive" });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SmartNavbar />
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold text-foreground">{t("cart_title")}</h1>

        {items.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={ShoppingBag}
              title={t("cart_empty")}
              description="Discover fresh produce from local farmers and add items to your cart."
              action={{ label: t("cart_continue"), to: "/products" }}
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {items.map(item => {
                const tp = getTranslatedProduct(item.product.id, language);
                const name = tp?.name || item.product.name;
                const farmerName = tp?.farmerName || item.product.farmerName;
                const location = tp?.location || item.product.location;
                return (
                  <div key={item.product.id} className="glass-card flex gap-4 rounded-xl p-4">
                    <img src={item.product.images[0]} alt={name} className="h-24 w-24 rounded-lg object-cover" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link to={`/products/${item.product.id}`} className="font-display font-semibold text-foreground hover:text-primary transition-colors">
                          {name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{farmerName} · {location}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-lg glass-card">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-display font-bold text-primary">₹{item.product.price * item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="h-fit glass-card rounded-xl p-6">
              <h3 className="font-display text-lg font-semibold text-foreground">{t("cart_summary")}</h3>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>{t("cart_subtotal")}</span><span>₹{totalPrice}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>{t("cart_delivery")}</span><span>{deliveryFee === 0 ? t("cart_free") : `₹${deliveryFee}`}</span></div>
                <div className="border-t border-border/50 pt-2 flex justify-between font-display font-bold text-primary text-base">
                  <span>{t("cart_total")}</span><span>₹{grandTotal}</span>
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">Order notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions…"
                  className="mt-1 rounded-xl border-border/50 bg-muted/30"
                  rows={2}
                />
              </div>
              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="mt-4 w-full h-12 rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all"
                size="lg"
              >
                {checkingOut ? "Processing…" : `Pay ₹${grandTotal}`}
              </Button>
              <Button variant="ghost" className="mt-2 w-full text-muted-foreground hover:text-destructive" onClick={clearCart}>
                {t("cart_clear")}
              </Button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
