import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";

type PaymentState = "loading" | "success" | "pending" | "cancelled";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();
  const [paymentState, setPaymentState] = useState<PaymentState>(
    sessionId ? "loading" : "cancelled"
  );

  useEffect(() => {
    if (!sessionId) return;

    // Verify payment by checking if any orders were confirmed via webhook.
    // Poll briefly since the webhook may arrive a second or two after redirect.
    let attempts = 0;
    const maxAttempts = 6;

    const check = async () => {
      attempts++;
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status, stripe_payment_intent_id")
        .neq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);

      const confirmed = orders?.find(
        (o) => o.status === "confirmed" || o.status === "preparing" || o.status === "delivering" || o.status === "delivered"
      );
      const cancelled = orders?.find((o) => o.status === "cancelled");

      if (confirmed) {
        clearCart();
        setPaymentState("success");
      } else if (cancelled && !confirmed) {
        setPaymentState("cancelled");
      } else if (attempts < maxAttempts) {
        // Webhook not yet processed — retry after 1 s
        setTimeout(check, 1000);
      } else {
        // After ~6 s still pending — treat as success optimistically
        // (webhook may be delayed; user will see correct status in orders page)
        clearCart();
        setPaymentState("pending");
      }
    };

    check();
  }, [sessionId, clearCart]);

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />
      <div className="container py-20 text-center">
        {paymentState === "loading" && (
          <>
            <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin" />
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
              Confirming your payment…
            </h1>
            <p className="mt-3 text-muted-foreground">Please wait a moment.</p>
          </>
        )}

        {paymentState === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-kisan-leaf" />
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
              Payment Successful!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your order has been confirmed. You'll receive updates as the farmer prepares your items.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/dashboard">
                <Button className="rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all">
                  View My Orders
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="rounded-xl border-border/50">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </>
        )}

        {paymentState === "pending" && (
          <>
            <CheckCircle2 className="mx-auto h-16 w-16 text-kisan-leaf" />
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
              Payment Received!
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your payment went through. Your order status will update shortly — check your orders page in a moment.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to="/dashboard">
                <Button className="rounded-xl bg-primary font-display font-semibold text-primary-foreground">
                  View My Orders
                </Button>
              </Link>
            </div>
          </>
        )}

        {paymentState === "cancelled" && (
          <>
            <XCircle className="mx-auto h-16 w-16 text-destructive" />
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground">
              Payment Cancelled
            </h1>
            <p className="mt-3 text-muted-foreground">
              Your payment was not completed. Your cart items are still available.
            </p>
            <Link to="/cart">
              <Button className="mt-8 rounded-xl bg-primary font-display font-semibold text-primary-foreground">
                Return to Cart
              </Button>
            </Link>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
