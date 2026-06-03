import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { trackPageView } from "@/lib/analytics";
import NotFound from "@/pages/NotFound";
import { useEffect, useRef } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminArticles from "./pages/Admin/AdminArticles";
import ArticleEditor from "./pages/Admin/ArticleEditor";
import AdminMedia from "./pages/Admin/AdminMedia";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminCategorias from "./pages/Admin/AdminCategorias";
import AdminDatosCuriosos from "./pages/Admin/AdminDatosCuriosos";
import AdminSocialLinks from "./pages/Admin/AdminSocialLinks";
import PrivacyPolicy from "./pages/PrivacyPolicy";

function AnalyticsRouteTracker() {
  const [location] = useLocation();
  const isInitialRender = useRef(true);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    trackPageView(path || location);
  }, [location]);

  return null;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/articulo/:slug" component={ArticlePage} />
      <Route path="/categoria/:slug" component={CategoryPage} />

      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/articulos" component={AdminArticles} />
      <Route path="/admin/nuevo" component={ArticleEditor} />
      <Route path="/admin/editar/:id" component={ArticleEditor} />
      <Route path="/admin/medios" component={AdminMedia} />
      <Route path="/admin/usuarios" component={AdminUsers} />
      <Route path="/admin/categorias" component={AdminCategorias} />
      <Route path="/admin/datos-curiosos" component={AdminDatosCuriosos} />
      <Route path="/admin/redes-sociales" component={AdminSocialLinks} />

      {/* Legal */}
      <Route path="/aviso-de-privacidad" component={PrivacyPolicy} />

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AnalyticsRouteTracker />
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
