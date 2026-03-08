import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardProducts from "./pages/DashboardProducts";
import DashboardSettings from "./pages/DashboardSettings";
import Admin from "./pages/Admin";
import AdminSeedDemo from "./pages/AdminSeedDemo";
import StoreFront from "./pages/StoreFront";
import ProductPage from "./pages/ProductPage";
import Checkout from "./pages/Checkout";
import StorePolicy from "./pages/StorePolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/products" element={<DashboardProducts />} />
                <Route path="/dashboard/settings" element={<DashboardSettings />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/:storeSlug" element={<StoreFront />} />
                <Route path="/:storeSlug/p/:productSlug" element={<ProductPage />} />
                <Route path="/:storeSlug/checkout" element={<Checkout />} />
                <Route path="/:storeSlug/:policyType" element={<StorePolicy />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
