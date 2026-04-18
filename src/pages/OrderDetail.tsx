import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Package, Clock, CheckCircle2, Truck, XCircle, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateOrderStatus } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/EmptyState";
import { PackageX } from "lucide-react";

const STATUS_FLOW = ["pending", "confirmed", "preparing", "delivering", "delivered"] as const;

const statusIcons = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: ChefHat,
  delivering: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
} as const;

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const updateStatus = useUpdateOrderStatus();

  const { data, isLoading } = useQuery({
    queryKey: ["order-detail", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const { data: items } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.id);

      type ProductLite = { id: string; name: string; image_url: string | null; unit: string };
      const productIds = [...new Set(items?.map(i => i.product_id) || [])];
      const { data: products } = productIds.length
        ? await supabase.from("products").select("id, name, image_url, unit").in("id", productIds)
        : { data: [] as ProductLite[] };
      const pmap = new Map<string, ProductLite>(
        (products || []).map(p => [p.id, p as ProductLite] as [string, ProductLite])
      );

      const { data: farmer } = await supabase
        .from("profiles")
        .select("display_name, phone")
        .eq("user_id", order.farmer_id)
        .single();

      return {
        order,
        items: (items || []).map(i => ({ ...i, product: pmap.get(i.product_id) })),
        farmer,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SmartNavbar />
        <div className="container py-8 max-w-4xl space-y-6">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.order) {
    return (
      <div className="min-h-screen bg-background">
        <SmartNavbar />
        <div className="container py-16">
          <EmptyState
            icon={PackageX}
            title="Order not found"
            description="This order doesn't exist or you don't have access to it."
            action={{ label: "Back to dashboard", to: "/dashboard" }}
          />
        </div>
      </div>
    );
  }

  const { order, items, farmer } = data;
  const isCustomer = order.customer_id === user?.id;
  const isCancelled = order.status === "cancelled";
  const currentStep = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number]);

  const handleCancel = async () => {
    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: "cancelled" });
      toast({ title: "Order cancelled", description: "Your order has been cancelled." });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not cancel order",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />
      <div className="container py-8 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Order #{order.id.slice(0, 8)}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Placed {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`rounded-lg border-border/50 capitalize text-base px-4 py-1.5 ${
              isCancelled ? "text-destructive" : "text-primary"
            }`}
          >
            {order.status}
          </Badge>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <Card className="glass-card border-0 rounded-xl mt-6">
            <CardHeader>
              <CardTitle className="font-display text-lg">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between gap-2">
                {STATUS_FLOW.map((step, idx) => {
                  const Icon = statusIcons[step];
                  const reached = idx <= currentStep;
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                          reached
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`mt-2 text-xs font-medium capitalize text-center ${
                        reached ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        {step}
                      </span>
                      {idx < STATUS_FLOW.length - 1 && (
                        <div className="hidden" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card className="glass-card border-0 rounded-xl mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Package className="h-5 w-5 text-primary" /> Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 border-b border-border/30 pb-3 last:border-0 last:pb-0">
                <img
                  src={item.product?.image_url || "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200"}
                  alt={item.product?.name || "Product"}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-display font-semibold text-foreground">{item.product?.name || "Product"}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} × ₹{item.unit_price}/{item.product?.unit || "unit"}
                  </p>
                </div>
                <p className="font-display font-bold text-primary">
                  ₹{(item.quantity * Number(item.unit_price)).toFixed(0)}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-border/30">
              <span className="font-display font-semibold text-foreground">Total</span>
              <span className="font-display text-2xl font-bold text-primary">₹{order.total_amount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Delivery + farmer info */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Delivery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {order.delivery_address || "No address provided"}
              </p>
              {order.notes && (
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-semibold">Notes:</span> {order.notes}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <CardTitle className="font-display text-lg">Farmer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-foreground">{farmer?.display_name || "Farmer"}</p>
              {farmer?.phone && (
                <p className="text-sm text-muted-foreground mt-1">{farmer.phone}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cancel action */}
        {isCustomer && order.status === "pending" && (
          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              className="rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={handleCancel}
              disabled={updateStatus.isPending}
            >
              <XCircle className="mr-2 h-4 w-4" />
              {updateStatus.isPending ? "Cancelling…" : "Cancel order"}
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
