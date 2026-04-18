import { Link } from "react-router-dom";
import { Star, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useI18n } from "@/context/I18nContext";
import { useTranslatedProduct } from "@/hooks/useTranslatedProduct";
import { isOrderable } from "@/lib/productUtils";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useCart();
  const { t } = useI18n();
  const tp = useTranslatedProduct(product);
  const orderable = isOrderable(product.id);

  return (
    <div className="glass-card group rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={product.images[0]}
            alt={tp.translatedName}
            className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
          {product.organic && (
            <Badge className="absolute left-3 top-3 border-0 bg-kisan-leaf/90 text-primary-foreground backdrop-blur-sm shadow-lg">
              🌿 {t("product_organic")}
            </Badge>
          )}
          {!orderable && (
            <Badge className="absolute right-3 top-3 border-0 bg-muted/90 text-muted-foreground backdrop-blur-sm shadow-lg">
              Demo
            </Badge>
          )}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-display text-sm font-bold leading-tight text-foreground drop-shadow-lg">
              {tp.translatedName}
            </h3>
          </div>
        </div>
      </Link>
      <div className="p-4 relative z-10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 text-primary/70" />
            <span className="truncate">{tp.translatedLocation}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Star className="h-3 w-3 fill-secondary text-secondary" />
            <span className="font-semibold text-secondary">{product.rating}</span>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="font-display text-xl font-bold text-primary">₹{product.price}</span>
            <span className="text-xs text-muted-foreground">/{product.unit}</span>
          </div>
          <Button
            size="sm"
            disabled={!orderable}
            onClick={(e) => { e.preventDefault(); if (orderable) addToCart(product); }}
            aria-label={orderable ? `Add ${tp.translatedName} to cart` : `${tp.translatedName} — demo product, not available for purchase`}
            title={orderable ? "Add to cart" : "Demo product — not available for purchase"}
            className="h-9 w-9 rounded-full bg-primary p-0 text-primary-foreground shadow-warm hover:shadow-glow hover:bg-primary/90 transition-all disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
