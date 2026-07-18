import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { trackPageView } from "@/lib/analytics";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense, useEffect, useRef } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ArticlePage from "./pages/ArticlePage";
import CategoryPage from "./pages/CategoryPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactPage from "./pages/ContactPage";

const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminArticles = lazy(() => import("./pages/Admin/AdminArticles"));
const ArticleEditor = lazy(() => import("./pages/Admin/ArticleEditor"));
const AdminMedia = lazy(() => import("./pages/Admin/AdminMedia"));
const AdminUsers = lazy(() => import("./pages/Admin/AdminUsers"));
const AdminCategorias = lazy(() => import("./pages/Admin/AdminCategorias"));
const AdminDatosCuriosos = lazy(() => import("./pages/Admin/AdminDatosCuriosos"));
const AdminSocialLinks = lazy(() => import("./pages/Admin/AdminSocialLinks"));

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
    <Suspense fallback={null}>
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
        <Route path="/terminos-y-condiciones" component={TermsOfService} />
        <Route path="/contacto" component={ContactPage} />

        {/* 404 */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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
