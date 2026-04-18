import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { I18nProvider } from "@/context/I18nContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MobileBottomNav from "@/components/MobileBottomNav";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CheckoutReturn from "./pages/CheckoutReturn";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import FarmerDashboard from "./pages/FarmerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import OrderDetail from "./pages/OrderDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Offers from "./pages/Offers";
import NearbyFarmers from "./pages/NearbyFarmers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <CartProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<ProtectedRoute requiredRole="customer"><Checkout /></ProtectedRoute>} />
                  <Route path="/checkout/return" element={<CheckoutReturn />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/farmer/dashboard" element={<ProtectedRoute requiredRole="farmer"><FarmerDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute requiredRole="customer"><CustomerDashboard /></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/nearby" element={<NearbyFarmers />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <MobileBottomNav />
              </BrowserRouter>
            </CartProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
