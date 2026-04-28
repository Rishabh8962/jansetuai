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
import NotFound from "./pages/NotFound";
import Classify from "./pages/Classify";
import { LanguageProvider } from "./i18n/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Classify />} />
            <Route path="/portals" element={<Index />} />
            <Route path="/citizen" element={<CitizenApp />} />
            <Route path="/worker" element={<WorkerApp />} />
            <Route path="/dashboard" element={<GovernmentDashboard />} />
            <Route path="/map" element={<MapView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
