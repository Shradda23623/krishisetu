import { Link } from "react-router-dom";
import { User, Menu, Globe, X, Sun, Moon, LayoutDashboard, Package, ShoppingBag, LogOut } from "lucide-react";
import logo from "/logo-v5.png";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/context/I18nContext";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { languages } from "@/i18n/translations";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function FarmerNavbar() {
  const { t, language, setLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/farmer/dashboard", label: t("dash_overview"), icon: LayoutDashboard },
    { to: "/farmer/dashboard?tab=products", label: t("dash_products"), icon: Package },
    { to: "/farmer/dashboard?tab=orders", label: t("dash_orders"), icon: ShoppingBag },
  ];

  const currentLang = languages.find(l => l.code === language);

  return (
    <nav className="sticky top-0 z-50 glass">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/farmer/dashboard" className="group flex items-center gap-3">
          <img src={logo} alt="KrishiSetu" className="h-12 w-12 object-contain drop-shadow-lg" />
          <div>
            <span className="font-display text-2xl font-bold text-gradient-hero">KrishiSetu</span>
            <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">🧑‍🌾 Farmer</span>
          </div>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(l => (
            <Link key={l.to} to={l.to} className="relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground group">
              <l.icon className="h-4 w-4" />
              {l.label}
              <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-primary transition-all duration-300 group-hover:w-3/4" />
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-primary transition-colors">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                <Globe className="h-4 w-4" />
                <span className="hidden text-xs font-medium sm:inline">{currentLang?.nativeName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass min-w-[180px]">
              {languages.map(lang => (
                <DropdownMenuItem key={lang.code} onClick={() => setLanguage(lang.code)} className={language === lang.code ? "bg-primary/10 font-semibold text-primary" : ""}>
                  <span className="mr-2">{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">{lang.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary transition-colors">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem asChild><Link to="/farmer/dashboard">Dashboard</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive"><LogOut className="mr-2 h-4 w-4" /> Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-muted-foreground md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="overflow-hidden border-t border-border/50 glass md:hidden">
          <div className="container flex flex-col gap-1 py-4">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground">
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            ))}
            <button onClick={signOut} className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-destructive transition-all hover:bg-destructive/10">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
