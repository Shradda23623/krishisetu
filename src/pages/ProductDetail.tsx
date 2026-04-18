import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, MapPin, ShoppingCart, Minus, Plus, Leaf, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/I18nContext";
import { useTranslatedProduct } from "@/hooks/useTranslatedProduct";
import { useDbProducts } from "@/hooks/useDbProducts";
import { isOrderable } from "@/lib/productUtils";
import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";
import ProductReviews from "@/components/ProductReviews";
import { useState, useMemo } from "react";

export default function ProductDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  const { data: dbProducts = [] } = useDbProducts();

  const product: Product | undefined = useMemo(() => {
    return dbProducts.find(p => p.id === id);
  }, [dbProducts, id]);

  const tp = useTranslatedProduct(product);

  if (!product || !tp) {
    return (
      <div className="min-h-screen bg-background">
        <SmartNavbar />
        <div className="container py-20 text-center">
          <p className="font-display text-lg text-muted-foreground">{t("product_not_found")}</p>
          <Link to="/products"><Button className="mt-4 rounded-xl">{t("product_back")}</Button></Link>
        </div>
      </div>
    );
  }

  const catNames: Record<string, string> = {
    vegetables: t("cat_vegetables"), fruits: t("cat_fruits"), dairy: t("cat_dairy"),
    grains: t("cat_grains"), dryfruits: t("cat_dryfruits"), spices: t("cat_spices"),
    pickles: t("cat_pickles"), jaggery: t("cat_jaggery"), oils: t("cat_oils"),
  };

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />
      <div className="container py-8">
        <Link to="/products" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> {t("product_back")}
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl glass-card">
            <img src={product.images[0]} alt={tp.translatedName} className="h-full w-full object-cover" style={{ maxHeight: 500 }} />
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-lg border-border/50 bg-muted/50 text-muted-foreground">{catNames[product.category] || product.category}</Badge>
              {product.organic && <Badge className="rounded-lg border-0 bg-kisan-leaf/90 text-primary-foreground"><Leaf className="mr-1 h-3 w-3" /> {t("product_organic")}</Badge>}
            </div>

            <h1 className="mt-4 font-display text-3xl font-bold text-foreground md:text-4xl">{tp.translatedName}</h1>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              {product.rating > 0 && (
                <>
                  <span className="flex items-center gap-1 text-secondary"><Star className="h-4 w-4 fill-current" /> {product.rating}</span>
                  <span>({product.reviews} {t("product_reviews")})</span>
                </>
              )}
              {tp.translatedLocation && (
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4 text-primary/70" /> {tp.translatedLocation}</span>
              )}
            </div>

            <div className="mt-6">
              <span className="font-display text-4xl font-bold text-primary">₹{product.price}</span>
              <span className="text-lg text-muted-foreground">/{product.unit}</span>
            </div>

            <p className="mt-4 leading-relaxed text-muted-foreground">{tp.translatedDescription}</p>

            <div className="mt-6 glass-card rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground">👨‍🌾 {t("product_sold_by")} {tp.translatedFarmerName}</p>
              <p className="text-xs text-muted-foreground">{tp.translatedLocation}</p>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center rounded-xl glass-card">
                <Button variant="ghost" size="icon" className="rounded-l-xl" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-4 w-4" /></Button>
                <span className="w-12 text-center font-display font-semibold">{qty}</span>
                <Button variant="ghost" size="icon" className="rounded-r-xl" onClick={() => setQty(qty + 1)}><Plus className="h-4 w-4" /></Button>
              </div>
              <Button
                size="lg"
                disabled={!isOrderable(product.id)}
                className="flex-1 h-12 rounded-xl bg-primary font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all disabled:opacity-50"
                onClick={() => isOrderable(product.id) && addToCart(product, qty)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {isOrderable(product.id)
                  ? `${t("product_add_cart")} — ₹${product.price * qty}`
                  : "Demo product — not for sale"}
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" />
              <span>{t("product_free_delivery")}</span>
            </div>
          </div>
        </div>

        {isOrderable(product.id) && <ProductReviews productId={product.id} />}
      </div>
      <Footer />
    </div>
  );
}
