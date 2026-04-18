import { useState, useEffect, useRef } from "react";
import { Package, Plus, BarChart3, ShoppingBag, AlertTriangle, TrendingUp, IndianRupee, Wheat, MapPin, Star, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/context/I18nContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import SmartNavbar from "@/components/SmartNavbar";
import GoogleMapLoader from "@/components/GoogleMapLoader";
import LocationPicker from "@/components/LocationPicker";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { useToast } from "@/hooks/use-toast";
import { useFarmerProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, type DbProduct } from "@/hooks/useDbProducts";
import { useFarmerOrders, useUpdateOrderStatus, type OrderWithItems } from "@/hooks/useOrders";
import { useFarmerReviews } from "@/hooks/useReviews";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const statusColors: Record<string, string> = {
  pending: "text-secondary",
  confirmed: "text-primary",
  preparing: "text-kisan-sky",
  delivering: "text-primary",
  delivered: "text-kisan-leaf",
  cancelled: "text-destructive",
};

export default function FarmerDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { toast } = useToast();
  const { apiKey } = useGoogleMapsKey();
  const [activeTab, setActiveTab] = useState("overview");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [deliveryRadius, setDeliveryRadius] = useState(10);
  const [savingLocation, setSavingLocation] = useState(false);

  // Product form state
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productUnit, setProductUnit] = useState("kg");
  const [productStock, setProductStock] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImageUrl, setProductImageUrl] = useState("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingProduct, setEditingProduct] = useState<DbProduct | null>(null);

  const { data: farmerProducts = [], isLoading: productsLoading } = useFarmerProducts(user?.id);
  const { data: farmerOrders = [], isLoading: ordersLoading } = useFarmerOrders(user?.id);
  const { data: farmerReviews = [] } = useFarmerReviews(user?.id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("latitude, longitude, delivery_radius_km")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setLatitude(data.latitude ?? null);
          setLongitude(data.longitude ?? null);
          setDeliveryRadius(data.delivery_radius_km ?? 10);
        }
      });
  }, [user]);

  const saveLocation = async () => {
    if (!user) return;
    setSavingLocation(true);
    const { error } = await supabase
      .from("profiles")
      .update({ latitude, longitude, delivery_radius_km: deliveryRadius })
      .eq("user_id", user.id);
    setSavingLocation(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved!", description: "Your farm location and delivery area have been updated." });
    }
  };

  const resetForm = () => {
    setProductName("");
    setProductCategory("");
    setProductPrice("");
    setProductUnit("kg");
    setProductStock("");
    setProductDescription("");
    setProductImageUrl("");
    setProductImageFile(null);
    setProductImagePreview("");
    setEditingProduct(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return;
    }
    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
    setProductImageUrl("");
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!productImageFile || !user) return productImageUrl || null;
    setUploadingImage(true);
    const ext = productImageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, productImageFile);
    setUploadingImage(false);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmitProduct = async () => {
    if (!user || !productName || !productCategory || !productPrice) {
      toast({ title: "Missing fields", description: "Please fill in name, category, and price.", variant: "destructive" });
      return;
    }

    try {
      const imageUrl = await uploadImage();

      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          name: productName,
          category: productCategory,
          price: Number(productPrice),
          unit: productUnit,
          stock_quantity: Number(productStock) || 0,
          description: productDescription || null,
          image_url: imageUrl,
        });
        toast({ title: "Updated!", description: "Product has been updated." });
      } else {
        await createProduct.mutateAsync({
          farmer_id: user.id,
          name: productName,
          category: productCategory,
          price: Number(productPrice),
          unit: productUnit,
          stock_quantity: Number(productStock) || 0,
          description: productDescription,
          image_url: imageUrl || undefined,
        });
        toast({ title: "Created!", description: "Product has been listed." });
      }
      resetForm();
      setActiveTab("products");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleEditProduct = (p: DbProduct) => {
    setEditingProduct(p);
    setProductName(p.name);
    setProductCategory(p.category);
    setProductPrice(String(p.price));
    setProductUnit(p.unit);
    setProductStock(String(p.stock_quantity));
    setProductDescription(p.description || "");
    setProductImageUrl(p.image_url || "");
    setProductImageFile(null);
    setProductImagePreview(p.image_url || "");
    setActiveTab("add");
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast({ title: "Deleted", description: "Product has been removed." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status });
      toast({ title: "Updated", description: `Order status changed to ${status}.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const activeProducts = farmerProducts.filter(p => p.is_active).length;
  const lowStockProducts = farmerProducts.filter(p => p.stock_quantity < 10).length;
  const totalEarnings = farmerOrders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + o.total_amount, 0);
  const avgRating = farmerReviews.length
    ? (farmerReviews.reduce((s, r) => s + r.rating, 0) / farmerReviews.length).toFixed(1)
    : "—";

  const stats = [
    { label: t("dash_earnings"), value: `₹${totalEarnings.toLocaleString()}`, icon: IndianRupee, trend: avgRating + " ★", color: "text-primary" },
    { label: t("dash_orders"), value: String(farmerOrders.length), icon: ShoppingBag, trend: `${farmerOrders.filter(o => o.status === "pending").length} pending`, color: "text-secondary" },
    { label: t("dash_active_products"), value: String(activeProducts), icon: Package, trend: `${farmerProducts.length} total`, color: "text-kisan-leaf" },
    { label: t("dash_low_stock"), value: String(lowStockProducts), icon: AlertTriangle, trend: lowStockProducts > 0 ? "Alert" : "OK", color: "text-destructive" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />
      <div className="container py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">{t("dash_title")}</h1>
            <p className="text-muted-foreground">{t("dash_welcome")} 👋</p>
          </div>
          <Button className="rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all" onClick={() => { resetForm(); setActiveTab("add"); }}>
            <Plus className="mr-2 h-4 w-4" /> {t("dash_add_product")}
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="glass-card border-0 rounded-xl">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                </div>
                <Badge variant="outline" className="ml-auto rounded-lg border-border/50 text-xs font-medium text-primary">{s.trend}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
          <TabsList className="rounded-xl bg-muted/50">
            <TabsTrigger value="overview" className="rounded-lg"><BarChart3 className="mr-1 h-4 w-4" /> {t("dash_overview")}</TabsTrigger>
            <TabsTrigger value="products" className="rounded-lg"><Package className="mr-1 h-4 w-4" /> {t("dash_products")}</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg"><ShoppingBag className="mr-1 h-4 w-4" /> {t("dash_orders")}</TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg"><Star className="mr-1 h-4 w-4" /> Reviews</TabsTrigger>
            <TabsTrigger value="location" className="rounded-lg"><MapPin className="mr-1 h-4 w-4" /> Location</TabsTrigger>
            <TabsTrigger value="add" className="rounded-lg"><Plus className="mr-1 h-4 w-4" /> {t("dash_add_product")}</TabsTrigger>
          </TabsList>

          {/* Overview - Recent Orders */}
          <TabsContent value="overview" className="mt-6">
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display"><TrendingUp className="h-5 w-5 text-primary" /> {t("dash_recent_orders")}</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <p className="text-muted-foreground text-center py-8">Loading orders…</p>
                ) : farmerOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No orders yet. List some products to get started!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 text-left text-muted-foreground">
                          <th className="pb-3 font-medium">{t("dash_order_id")}</th>
                          <th className="pb-3 font-medium">{t("dash_buyer")}</th>
                          <th className="pb-3 font-medium">{t("dash_product")}</th>
                          <th className="pb-3 font-medium">{t("dash_total")}</th>
                          <th className="pb-3 font-medium">{t("dash_status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {farmerOrders.slice(0, 5).map(o => (
                          <tr key={o.id} className="border-b border-border/30 last:border-0">
                            <td className="py-3 font-medium text-foreground">{o.id.slice(0, 8)}</td>
                            <td className="py-3 text-muted-foreground">{o.customer_name}</td>
                            <td className="py-3 text-muted-foreground">{o.order_items.map(i => i.product_name).join(", ")}</td>
                            <td className="py-3 font-medium text-foreground">₹{o.total_amount}</td>
                            <td className="py-3">
                              <Badge variant="outline" className={`rounded-lg border-border/50 capitalize ${statusColors[o.status] || "text-muted-foreground"}`}>
                                {o.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products tab */}
          <TabsContent value="products" className="mt-6">
            {productsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading products…</p>
            ) : farmerProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">No products yet. Add your first product!</p>
                <Button className="mt-4 rounded-xl bg-primary" onClick={() => setActiveTab("add")}>
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {farmerProducts.map(p => (
                  <Card key={p.id} className="glass-card border-0 rounded-xl overflow-hidden">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={p.image_url || "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600"}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-foreground">{p.name}</h3>
                        {!p.is_active && <Badge variant="outline" className="text-xs text-destructive">Inactive</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">₹{p.price}/{p.unit} · {p.stock_quantity} in stock</p>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 rounded-lg border-border/50" onClick={() => handleEditProduct(p)}>
                          {t("dash_edit")}
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg border-destructive/50 text-destructive" onClick={() => handleDeleteProduct(p.id)}>
                          {t("dash_delete")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders tab */}
          <TabsContent value="orders" className="mt-6">
            {ordersLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading…</p>
            ) : farmerOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet.</p>
            ) : (
              <div className="space-y-3">
                {farmerOrders.map(o => (
                  <Card key={o.id} className="glass-card border-0 rounded-xl">
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="font-display font-semibold text-foreground">{o.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {o.customer_name} — {o.order_items.map(i => `${i.product_name} (×${i.quantity})`).join(", ")}
                        </p>
                        {o.notes && <p className="text-xs text-muted-foreground mt-1">Note: {o.notes}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-primary">₹{o.total_amount}</p>
                        <Select
                          value={o.status}
                          onValueChange={(val) => handleOrderStatusChange(o.id, val as OrderStatus)}
                        >
                          <SelectTrigger className="mt-1 w-36 rounded-lg border-border/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="delivering">Delivering</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reviews tab */}
          <TabsContent value="reviews" className="mt-6">
            {farmerReviews.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No reviews yet.</p>
            ) : (
              <div className="space-y-3">
                {farmerReviews.map(r => (
                  <Card key={r.id} className="glass-card border-0 rounded-xl">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <p className="font-display font-semibold text-foreground">{r.customer_name}</p>
                        <div className="flex items-center gap-1 text-secondary">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Location tab */}
          <TabsContent value="location" className="mt-6">
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <MapPin className="h-5 w-5 text-primary" /> Farm Location & Delivery Area
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Set your farm location and delivery radius so customers nearby can find you.
                </p>
                {apiKey ? (
                  <GoogleMapLoader apiKey={apiKey}>
                    <LocationPicker
                      latitude={latitude}
                      longitude={longitude}
                      onLocationChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }}
                      showRadius
                      radiusKm={deliveryRadius}
                      onRadiusChange={setDeliveryRadius}
                    />
                  </GoogleMapLoader>
                ) : (
                  <div className="h-64 flex items-center justify-center rounded-xl bg-muted/30 text-muted-foreground">Map loading…</div>
                )}
                <Button onClick={saveLocation} disabled={savingLocation || !latitude} className="h-12 rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all">
                  {savingLocation ? "Saving…" : "Save Farm Location"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add/Edit product tab */}
          <TabsContent value="add" className="mt-6">
            <Card className="glass-card border-0 rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Wheat className="h-5 w-5 text-primary" /> {editingProduct ? "Edit Product" : t("dash_add_product")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="font-medium text-muted-foreground">{t("dash_product_name")}</Label>
                    <Input value={productName} onChange={e => setProductName(e.target.value)} placeholder={t("dash_product_name")} className="mt-1.5 h-11 rounded-xl border-border/50 bg-muted/30" />
                  </div>
                  <div>
                    <Label className="font-medium text-muted-foreground">{t("dash_category")}</Label>
                    <Select value={productCategory} onValueChange={setProductCategory}>
                      <SelectTrigger className="mt-1.5 h-11 rounded-xl border-border/50"><SelectValue placeholder={t("dash_category")} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vegetables">🥬 {t("cat_vegetables")}</SelectItem>
                        <SelectItem value="fruits">🍎 {t("cat_fruits")}</SelectItem>
                        <SelectItem value="dairy">🥛 {t("cat_dairy")}</SelectItem>
                        <SelectItem value="grains">🌾 {t("cat_grains")}</SelectItem>
                        <SelectItem value="dryfruits">🥜 {t("cat_dryfruits")}</SelectItem>
                        <SelectItem value="spices">🌶️ {t("cat_spices")}</SelectItem>
                        <SelectItem value="pickles">🫙 {t("cat_pickles")}</SelectItem>
                        <SelectItem value="jaggery">🍯 {t("cat_jaggery")}</SelectItem>
                        <SelectItem value="oils">🫒 {t("cat_oils")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-medium text-muted-foreground">{t("dash_price")}</Label>
                    <Input type="number" value={productPrice} onChange={e => setProductPrice(e.target.value)} placeholder="40" className="mt-1.5 h-11 rounded-xl border-border/50 bg-muted/30" />
                  </div>
                  <div>
                    <Label className="font-medium text-muted-foreground">{t("dash_unit")}</Label>
                    <Select value={productUnit} onValueChange={setProductUnit}>
                      <SelectTrigger className="mt-1.5 h-11 rounded-xl border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Per kg</SelectItem>
                        <SelectItem value="litre">Per litre</SelectItem>
                        <SelectItem value="dozen">Per dozen</SelectItem>
                        <SelectItem value="bunch">Per bunch</SelectItem>
                        <SelectItem value="piece">Per piece</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="font-medium text-muted-foreground">{t("dash_available_qty")}</Label>
                    <Input type="number" value={productStock} onChange={e => setProductStock(e.target.value)} placeholder="100" className="mt-1.5 h-11 rounded-xl border-border/50 bg-muted/30" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="font-medium text-muted-foreground">Product Image</Label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1.5 flex h-32 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 bg-muted/30 hover:border-primary/50 transition-colors"
                    >
                      {productImagePreview ? (
                        <img src={productImagePreview} alt="Preview" className="h-full rounded-lg object-contain p-1" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Upload className="mx-auto h-8 w-8 mb-1" />
                          <p className="text-sm">Click to upload image (max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="font-medium text-muted-foreground">{t("dash_description")}</Label>
                  <Textarea value={productDescription} onChange={e => setProductDescription(e.target.value)} placeholder={t("dash_description")} className="mt-1.5 rounded-xl border-border/50 bg-muted/30" rows={4} />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitProduct}
                    disabled={createProduct.isPending || updateProduct.isPending || uploadingImage}
                    className="h-12 rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all"
                    size="lg"
                  >
                    {uploadingImage ? "Uploading image…" : createProduct.isPending || updateProduct.isPending ? "Saving…" : editingProduct ? "Update Product" : t("dash_publish")}
                  </Button>
                  {editingProduct && (
                    <Button variant="outline" onClick={resetForm} className="h-12 rounded-xl">Cancel</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
