import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  // Clear cart when payment succeeds
  useEffect(() => {
    if (sessionId) {
      clearCart();
    }
  }, [sessionId, clearCart]);

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />
      <div className="container py-20 text-center">
        {sessionId ? (
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
        ) : (
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
