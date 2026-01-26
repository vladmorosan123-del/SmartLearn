import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import SubjectSelection from "./components/SubjectSelection";
import Dashboard from "./components/Dashboard";
import ModeleBac from "./pages/ModeleBac";
import TesteAcademii from "./pages/TesteAcademii";
import AdminPanel from "./pages/AdminPanel";
import PortofoliuFormule from "./pages/PortofoliuFormule";
import Subiect2BAC from "./pages/Subiect2BAC";
import EseuriBAC from "./pages/EseuriBAC";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/materii" element={<SubjectSelection />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/modele-bac" element={<ModeleBac />} />
              <Route path="/teste-academii" element={<TesteAcademii />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/portofoliu-formule" element={<PortofoliuFormule />} />
              <Route path="/subiect2-bac" element={<Subiect2BAC />} />
              <Route path="/eseuri-bac" element={<EseuriBAC />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AppProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
