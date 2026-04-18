import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, Leaf, TrendingUp, Wheat, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";
import { useI18n } from "@/context/I18nContext";
import { useDbProducts } from "@/hooks/useDbProducts";
import { ProductCardSkeletonGrid } from "@/components/skeletons/ProductCardSkeleton";
import heroBg from "@/assets/hero-bg.jpg";
import ctaBg from "@/assets/cta-bg.jpg";
import heroVideoAsset from "@/assets/hero-video.mp4.asset.json";

export default function Index() {
  const { t } = useI18n();
  const { data: dbProducts = [], isLoading: productsLoading } = useDbProducts();
  const featured = dbProducts.slice(0, 8);

  const features = [
    { icon: Leaf, title: t("feat_fresh"), desc: t("feat_fresh_desc"), color: "text-kisan-leaf" },
    { icon: Shield, title: t("feat_quality"), desc: t("feat_quality_desc"), color: "text-kisan-sky" },
    { icon: Truck, title: t("feat_delivery"), desc: t("feat_delivery_desc"), color: "text-primary" },
    { icon: TrendingUp, title: t("feat_price"), desc: t("feat_price_desc"), color: "text-secondary" },
  ];

  const catNames: Record<string, string> = {
    vegetables: t("cat_vegetables"),
    fruits: t("cat_fruits"),
    dairy: t("cat_dairy"),
    grains: t("cat_grains"),
    dryfruits: t("cat_dryfruits"),
    spices: t("cat_spices"),
    pickles: t("cat_pickles"),
    jaggery: t("cat_jaggery"),
    oils: t("cat_oils"),
  };

  const categoryImages = categories.reduce<Record<string, string>>((acc, cat) => {
    acc[cat.id] = cat.image;
    return acc;
  }, {});

  const marqueeItems = [
    { img: categoryImages.grains, text: "Fresh from Farm" },
    { img: categoryImages.vegetables, text: "100% Organic" },
    { img: categoryImages.spices, text: "Premium Spices" },
    { img: categoryImages.dairy, text: "Pure Dairy" },
    { img: categoryImages.jaggery, text: "Natural Jaggery" },
    { img: categoryImages.oils, text: "Cold-Pressed Oils" },
    { img: categoryImages.fruits, text: "Seasonal Fruits" },
    { img: categoryImages.pickles, text: "Homemade Pickles" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0">
          <video autoPlay muted loop playsInline className="h-full w-full object-cover" style={{ opacity: 0.8 }}>
            <source src={heroVideoAsset.url} type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-transparent to-transparent" />

        <div className="container relative z-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary ring-1 ring-primary/20">
              <Sparkles className="h-3.5 w-3.5" /> {t("hero_badge")}
            </span>

            <h1 className="mt-8 font-display text-5xl font-bold leading-[1.1] tracking-tight text-foreground md:text-7xl drop-shadow-[0_2px_10px_hsl(var(--background)/0.8)]">
              {t("hero_title_1")}{" "}
              <span className="text-gradient-hero">{t("hero_title_2")}</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {t("hero_desc")}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/products">
                <Button size="lg" className="group h-12 rounded-xl bg-primary px-8 font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all duration-300">
                  {t("hero_shop")}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/farmer/dashboard">
                <Button size="lg" variant="outline" className="h-12 rounded-xl border-border/50 px-8 font-display font-semibold text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-300">
                  {t("hero_sell")}
                </Button>
              </Link>
            </div>

          </div>
        </div>

        {/* Scrolling marquee */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-border/30 bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-10 py-2 whitespace-nowrap animate-marquee">
            {[...Array(2)].flatMap((_, j) =>
              marqueeItems.map((item, i) => (
                <span key={`${j}-${i}`} className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
                  <img src={item.img} alt="" className="h-7 w-7 rounded-md object-contain" loading="lazy" />
                  {item.text}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-y border-border/50">
        <div className="container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {features.map((f, i) => (
            <div key={i} className="glass-card group flex items-start gap-3 rounded-xl p-4 transition-all duration-300 hover:-translate-y-1">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">{f.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container py-20">
        <div className="text-center">
          <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t("cat_subtitle")}</span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground md:text-4xl">{t("cat_title")}</h2>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-9">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${cat.id}`}
              className="glass-card group flex flex-col items-center gap-3 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-warm hover:ring-1 hover:ring-primary/30 hover:-translate-y-2"
            >
              <img src={cat.image} alt={cat.name} className="h-14 w-14 rounded-lg object-contain" width={512} height={512} loading="lazy" />
              <p className="font-display text-xs font-semibold text-foreground leading-tight">{catNames[cat.id] || cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-pattern-dots opacity-40" />
        <div className="container relative">
          <div className="flex items-end justify-between">
            <div>
              <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t("featured_subtitle")}</span>
              <h2 className="mt-2 font-display text-3xl font-bold text-foreground md:text-4xl">{t("featured_title")}</h2>
            </div>
            <Link to="/products">
              <Button variant="outline" className="group rounded-xl border-border/50 font-medium text-foreground hover:border-primary/30 hover:bg-accent transition-all">
                {t("featured_view_all")}
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          {productsLoading ? (
            <div className="mt-10">
              <ProductCardSkeletonGrid count={4} />
            </div>
          ) : featured.length === 0 ? (
            <div className="mt-10 rounded-2xl glass-card p-12 text-center">
              <Wheat className="mx-auto h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="mt-4 font-display text-lg font-medium text-foreground">No products listed yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Be the first farmer to list fresh produce on the marketplace.</p>
              <Link to="/farmer/dashboard">
                <Button className="mt-6 rounded-xl bg-primary font-display font-semibold text-primary-foreground">Start selling</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-2xl glass-card p-10 md:p-16 text-center">
          <div className="absolute inset-0">
            <img src={ctaBg} alt="" className="h-full w-full object-cover opacity-40" width={1920} height={800} loading="lazy" />
          </div>
          <div className="absolute inset-0 bg-background/30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />

          <Wheat className="relative z-10 mx-auto h-10 w-10 text-primary" />
          <h2 className="relative z-10 mt-6 font-display text-3xl font-bold text-foreground md:text-4xl">{t("cta_title")}</h2>
          <p className="relative z-10 mx-auto mt-4 max-w-lg text-muted-foreground">{t("cta_desc")}</p>
          <Link to="/farmer/dashboard">
            <Button size="lg" className="relative z-10 mt-8 h-12 rounded-xl bg-primary px-10 font-display font-semibold text-primary-foreground shadow-warm hover:shadow-glow transition-all duration-300 group">
              {t("cta_button")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
