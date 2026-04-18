import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import SmartNavbar from "@/components/SmartNavbar";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const orderIdsParam = searchParams.get("orders");
  const orderIds = orderIdsParam ? orderIdsParam.split(",") : [];
  const deliveryFee = Number(searchParams.get("deliveryFee") || "0");

  if (orderIds.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SmartNavbar />
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">No orders to process.</p>
          <Link to="/cart">
            <Button className="mt-4 rounded-xl bg-primary">Return to Cart</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SmartNavbar />
      <div className="container py-8">
        <Link to="/cart" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Cart
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-foreground">Complete Payment</h1>
        <p className="mt-2 text-muted-foreground">Enter your payment details below to confirm your order.</p>
        <div className="mt-8 max-w-2xl">
          <StripeEmbeddedCheckout
            orderIds={orderIds}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            deliveryFee={deliveryFee}
          />
        </div>
      </div>
    </div>
  );
}
