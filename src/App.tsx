import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import CitizenApp from "./pages/CitizenApp";
import WorkerApp from "./pages/WorkerApp";
import GovernmentDashboard from "./pages/GovernmentDashboard";
import MapView from "./pages/MapView";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { LanguageProvider } from "./i18n/LanguageContext";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/map" element={<MapView />} />
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allow={["citizen", "authority"]}>
                    <CitizenApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/worker"
                element={
                  <ProtectedRoute allow={["worker", "authority"]}>
                    <WorkerApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allow={["authority"]}>
                    <GovernmentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
