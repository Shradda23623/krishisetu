import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Sparkles, X, PackageOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories, Category } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import SmartNavbar from "@/components/SmartNavbar";
import Footer from "@/components/Footer";
import EmptyState from "@/components/EmptyState";
import { ProductCardSkeletonGrid } from "@/components/skeletons/ProductCardSkeleton";
import { useI18n } from "@/context/I18nContext";
import { useDbProducts } from "@/hooks/useDbProducts";
import productsBg from "@/assets/products-bg.jpg";

type SortKey = "newest" | "price_asc" | "price_desc" | "rating";

export default function Products() {
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const activeCategory = searchParams.get("category") as Category | null;

  const { data: dbProducts = [], isLoading } = useDbProducts(activeCategory || undefined);

  const catNames: Record<string, string> = {
    vegetables: t("cat_vegetables"), fruits: t("cat_fruits"), dairy: t("cat_dairy"),
    grains: t("cat_grains"), dryfruits: t("cat_dryfruits"), spices: t("cat_spices"),
    pickles: t("cat_pickles"), jaggery: t("cat_jaggery"), oils: t("cat_oils"),
  };

  const allProducts = useMemo(() => dbProducts, [dbProducts]);

  const filtered = useMemo(() => {
    let list = allProducts;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.farmerName.toLowerCase().includes(q)
      );
    }

    const min = minPrice ? Number(minPrice) : null;
    const max = maxPrice ? Number(maxPrice) : null;
    if (min !== null) list = list.filter(p => p.price >= min);
    if (max !== null) list = list.filter(p => p.price <= max);

    if (organicOnly) list = list.filter(p => p.organic);

    const sorted = [...list];
    if (sort === "price_asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") sorted.sort((a, b) => b.price - a.price);
    else if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    return sorted;
  }, [allProducts, search, minPrice, maxPrice, organicOnly, sort]);

  const setCategory = (cat: Category | null) => {
    if (cat) setSearchParams({ category: cat });
    else setSearchParams({});
  };

  const activeFilterCount =
    (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (organicOnly ? 1 : 0);

  const clearFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setOrganicOnly(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SmartNavbar />

      <div className="relative border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0">
          <img src={productsBg} alt="" className="h-full w-full object-cover opacity-15" width={1920} height={800} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />

        <div className="container relative py-10">
          <div>
            <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">{t("products_subtitle")}</span>
            <h1 className="mt-2 font-display text-4xl font-bold text-foreground">{t("products_title")}</h1>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("products_search")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-11 rounded-xl border-border/50 bg-muted/50 pl-11 font-medium placeholder:text-muted-foreground/60 focus:ring-primary/30"
              />
            </div>

            <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
              <SelectTrigger className="h-11 w-[170px] rounded-xl border-border/50 bg-muted/50 font-medium">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 gap-2 rounded-xl border-border/50 hover:bg-accent hover:border-primary/30 transition-all">
                  <SlidersHorizontal className="h-4 w-4" /> {t("products_filters")}
                  {activeFilterCount > 0 && (
                    <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 rounded-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold">Filters</h3>
                    {activeFilterCount > 0 && (
                      <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
                        <X className="h-3 w-3" /> Clear
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price (₹)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Min"
                        value={minPrice}
                        onChange={e => setMinPrice(e.target.value)}
                        className="h-9 rounded-lg"
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={e => setMaxPrice(e.target.value)}
                        className="h-9 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
                    <Label htmlFor="organic" className="cursor-pointer">Organic only</Label>
                    <Switch id="organic" checked={organicOnly} onCheckedChange={setOrganicOnly} />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                !activeCategory
                  ? "bg-primary text-primary-foreground shadow-warm"
                  : "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Sparkles className="mr-1 inline h-3 w-3" /> {t("cat_all")}
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-warm"
                    : "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <img src={cat.image} alt="" className="inline-block h-5 w-5 rounded object-contain" /> {catNames[cat.id] || cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="container py-8" id="main">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground">{filtered.length}</span> {t("products_found")}
        </p>
        {isLoading ? (
          <div className="mt-6">
            <ProductCardSkeletonGrid count={8} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        ) : (
          <div className="py-16">
            <EmptyState
              icon={PackageOpen}
              title={t("products_none")}
              description={
                activeFilterCount > 0 || search
                  ? "Try adjusting your filters or search."
                  : t("products_none_sub")
              }
              action={
                activeFilterCount > 0 || search
                  ? { label: "Clear filters", onClick: () => { clearFilters(); setSearch(""); } }
                  : { label: "Become a farmer", to: "/farmer/dashboard" }
              }
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
