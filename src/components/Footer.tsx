import { Wheat, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "@/context/I18nContext";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="relative border-t border-border/50 bg-card">
      <div className="absolute inset-0 bg-pattern-dots opacity-30" />
      <div className="container relative py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-bold text-gradient-hero">
              <Wheat className="h-5 w-5 text-primary" /> KrishiSetu
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("footer_desc")}</p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">{t("footer_shop")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/products?category=vegetables" className="transition-colors hover:text-foreground">{t("cat_vegetables")}</Link></li>
              <li><Link to="/products?category=fruits" className="transition-colors hover:text-foreground">{t("cat_fruits")}</Link></li>
              <li><Link to="/products?category=dairy" className="transition-colors hover:text-foreground">{t("cat_dairy")}</Link></li>
              <li><Link to="/products?category=spices" className="transition-colors hover:text-foreground">{t("cat_spices")}</Link></li>
              <li><Link to="/products?category=pickles" className="transition-colors hover:text-foreground">{t("cat_pickles")}</Link></li>
              <li><Link to="/products?category=jaggery" className="transition-colors hover:text-foreground">{t("cat_jaggery")}</Link></li>
              <li><Link to="/products?category=oils" className="transition-colors hover:text-foreground">{t("cat_oils")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">{t("footer_for_farmers")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/farmer/dashboard" className="transition-colors hover:text-foreground">{t("footer_sell_on")}</Link></li>
              <li><Link to="/auth" className="transition-colors hover:text-foreground">{t("footer_farmer_login")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-primary">{t("footer_support")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-pointer transition-colors hover:text-foreground">{t("footer_help")}</span></li>
              <li><span className="cursor-pointer transition-colors hover:text-foreground">{t("footer_contact")}</span></li>
              <li><span className="cursor-pointer transition-colors hover:text-foreground">{t("footer_privacy")}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/50 pt-6 text-center">
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            © {new Date().getFullYear()} KrishiSetu · Made with <Heart className="h-3 w-3 fill-primary text-primary" /> for Indian Farmers
          </p>
        </div>
      </div>
    </footer>
  );
}
