import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, MapPin, User, ShoppingBag, Clock, CheckCircle2, Truck, Star, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SmartNavbar from "@/components/SmartNavbar";
import GoogleMapLoader from "@/components/GoogleMapLoader";
import LocationPicker from "@/components/LocationPicker";
import NearbyFarmersMap from "@/components/NearbyFarmersMap";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { useToast } from "@/hooks/use-toast";
import { useCustomerOrders, type OrderWithItems } from "@/hooks/useOrders";
import { useCreateReview } from "@/hooks/useReviews";
import EmptyState from "@/components/EmptyState";
import { OrderListSkeleton } from "@/components/skeletons/OrderRowSkeleton";

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-secondary", label: "Pending" },
  confirmed: { icon: CheckCircle2, color: "text-primary", label: "Confirmed" },
  preparing: { icon: Package, color: "text-kisan-sky", label: "Preparing" },
  delivering: { icon: Truck, color: "text-primary", label: "In Transit" },
  delivered: { icon: CheckCircle2, color: "text-kisan-leaf", label: "Delivered" },
  cancelled: { icon: XCircle, color: "text-destructive", label: "Cancelled" },
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { apiKey } = useGoogleMapsKey();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Review form
  const [reviewingOrder, setReviewingOrder] = useState<OrderWithItems | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const createReview = useCreateReview();

  const { data: orders = [], isLoading: ordersLoading } = useCustomerOrders(user?.id);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, phone, address, latitude, longitude")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setPhone(data.phone ?? "");
          setAddress(data.address ?? "");
          setLatitude(data.latitude ?? null);
          setLongitude(data.longitude ?? null);
        }
      });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone, address, latitude, longitude })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Your profile has been updated." });
    }
  };

  const submitReview = async () => {
    if (!user || !reviewingOrder) return;
    try {
      await createReview.mutateAsync({
        customer_id: user.id,
        farmer_id: reviewingOrder.farmer_id,
        order_id: reviewingOrder.id,
        product_id: reviewingOrder.order_items[0]?.product_id,
        rating: reviewRating,
        comment: reviewComment || undefined,
      });
      toast({ title: "Review submitted! ⭐", description: "Thank you for your feedback." });
      setReviewingOrder(null);
      setReviewRating(5);
      setReviewComment("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const inTransitCount = orders.filter(o => o.status === "delivering").length;

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {displayName || user?.email} 👋</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Card className="glass-card border-0 rounded-xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Orders</p>
                <p className="font-display text-2xl font-bold text-foreground">{orders.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 rounded-xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-secondary">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">In Transit</p>
                <p className="font-display text-2xl font-bold text-foreground">{inTransitCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-0 rounded-xl">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-kisan-leaf">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Delivered</p>
                <p className="font-display text-2xl font-bold text-foreground">{deliveredCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders">
          <TabsList className="rounded-xl bg-muted/50">
            <TabsTrigger value="orders" className="rounded-lg"><Package className="mr-1 h-4 w-4" /> My Orders</TabsTrigger>
            <TabsTrigger value="nearby" className="rounded-lg"><MapPin className="mr-1 h-4 w-4" /> Nearby Farmers</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg"><User className="mr-1 h-4 w-4" /> Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6 space-y-3">
            {ordersLoading ? (
              <OrderListSkeleton count={3} />
            ) : orders.length === 0 ? (
              <EmptyState
                icon={ShoppingBag}
                title="No orders yet"
                description="Browse fresh produce from local farmers and place your first order."
                action={{ label: "Start shopping", to: "/products" }}
              />
            ) : (
              orders.map(order => {
                const cfg = statusConfig[order.status] ?? statusConfig.pending;
                const StatusIcon = cfg.icon;
                return (
                  <Card key={order.id} className="glass-card border-0 rounded-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <Link to={`/orders/${order.id}`} className="flex-1 group">
                          <div className="flex items-center gap-3">
                            <p className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{order.id.slice(0, 8)}</p>
                            <Badge variant="outline" className={`rounded-lg border-border/50 ${cfg.color}`}>
                              <StatusIcon className="mr-1 h-3 w-3" /> {cfg.label}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {order.order_items.map(i => `${i.product_name} ×${i.quantity}`).join(", ")}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            From: {order.farmer_name} · {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </Link>
                        <div className="text-right ml-4">
                          <p className="font-display font-bold text-primary">₹{order.total_amount}</p>
                          {order.status === "delivered" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 rounded-lg border-border/50 text-xs"
                              onClick={() => setReviewingOrder(order)}
                            >
                              <Star className="mr-1 h-3 w-3" /> Review
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Review form inline */}
                      {reviewingOrder?.id === order.id && (
                        <div className="mt-4 border-t border-border/30 pt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Rating:</Label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(n => (
                                <button
                                  key={n}
                                  onClick={() => setReviewRating(n)}
                                  className={`transition-colors ${n <= reviewRating ? "text-secondary" : "text-muted-foreground/30"}`}
                                >
                                  <Star className="h-5 w-5 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <Textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="Write your review…"
                            rows={2}
                            className="rounded-xl border-border/50 bg-muted/30"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={submitReview}
                              disabled={createReview.isPending}
                              className="rounded-lg bg-primary text-primary-foreground"
                            >
                              {createReview.isPending ? "Submitting…" : "Submit Review"}
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setReviewingOrder(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="nearby" className="mt-6">
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <MapPin className="h-5 w-5 text-primary" /> My Location & Nearby Farmers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {apiKey ? (
                  <GoogleMapLoader apiKey={apiKey}>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Set your delivery location:</p>
                        <LocationPicker
                          latitude={latitude}
                          longitude={longitude}
                          onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
                        />
                        <Button onClick={saveProfile} disabled={saving} size="sm" className="mt-3 rounded-lg bg-primary font-display font-semibold text-primary-foreground">
                          {saving ? "Saving…" : "Save Location"}
                        </Button>
                      </div>
                      {latitude && longitude && (
                        <div>
                          <h3 className="font-display font-semibold text-foreground mb-3">Farmers delivering to you</h3>
                          <NearbyFarmersMap userLat={latitude} userLng={longitude} />
                        </div>
                      )}
                    </div>
                  </GoogleMapLoader>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Map loading…</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display"><User className="h-5 w-5 text-primary" /> Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-medium text-muted-foreground">Full Name</Label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mt-1.5 h-11 rounded-xl border-border/50 bg-muted/30" />
                  </div>
                  <div>
                    <Label className="font-medium text-muted-foreground">Email</Label>
                    <Input value={user?.email ?? ""} disabled className="mt-1.5 h-11 rounded-xl border-border/50 bg-muted/30 opacity-60" />
                  </div>
                  <div>
                    <Label className="font-medium text-muted-foreground">Phone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="mt-1.5 h-11 rounded-xl border-border/50 bg-muted/30" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-medium text-muted-foreground">Delivery Address</Label>
                    <textarea
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Enter your full delivery address..."
                      rows={3}
                      className="mt-1.5 w-full rounded-xl border border-border/50 bg-muted/30 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <Button onClick={saveProfile} disabled={saving} className="h-12 rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all">
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
