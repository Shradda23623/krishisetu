import { NavLink } from "react-router-dom";
import { Home, Store, ShoppingCart, MapPin, User } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const items = [
  { to: "/", icon: Home, label: "Home", end: true },
  { to: "/products", icon: Store, label: "Shop" },
  { to: "/nearby", icon: MapPin, label: "Nearby" },
  { to: "/cart", icon: ShoppingCart, label: "Cart", showBadge: true },
];

export default function MobileBottomNav() {
  const { totalItems } = useCart();
  const { user, role } = useAuth();

  // Hide for farmers — they have their own dashboard navigation
  if (role === "farmer") return null;

  const accountTo = user ? "/dashboard" : "/auth";

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 glass md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {items.map(item => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              aria-label={item.label}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
              {item.showBadge && totalItems > 0 && (
                <span
                  aria-label={`${totalItems} items in cart`}
                  className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground"
                >
                  {totalItems}
                </span>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex-1">
          <NavLink
            to={accountTo}
            aria-label={user ? "My Account" : "Sign in"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            <User className="h-5 w-5" aria-hidden="true" />
            <span>{user ? "Account" : "Sign in"}</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
