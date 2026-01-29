import Maintenance from "./pages/Maintenance";

// =====================================================
// MAINTENANCE MODE - SITE BLOCKED FOR ALL VISITORS
// Set to false when ready to go live
// =====================================================
const MAINTENANCE_MODE = true;

const App = () => {
  if (MAINTENANCE_MODE) {
    return <Maintenance />;
  }

  // Full app code below - will be shown when MAINTENANCE_MODE = false
  const { Toaster } = require("@/components/ui/toaster");
  const { Toaster: Sonner } = require("@/components/ui/sonner");
  const { TooltipProvider } = require("@/components/ui/tooltip");
  const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");
  const { BrowserRouter, Routes, Route } = require("react-router-dom");
  const { AppProvider } = require("@/contexts/AppContext");
  const { AuthProvider } = require("@/contexts/AuthContext");
  const Index = require("./pages/Index").default;
  const Auth = require("./pages/Auth").default;
  const AuthProfesor = require("./pages/AuthProfesor").default;
  const SubjectSelection = require("./components/SubjectSelection").default;
  const Dashboard = require("./components/Dashboard").default;
  const ModeleBac = require("./pages/ModeleBac").default;
  const TesteAcademii = require("./pages/TesteAcademii").default;
  const AdminPanel = require("./pages/AdminPanel").default;
  const PortofoliuFormule = require("./pages/PortofoliuFormule").default;
  const Subiect2BAC = require("./pages/Subiect2BAC").default;
  const EseuriBAC = require("./pages/EseuriBAC").default;
  const NotFound = require("./pages/NotFound").default;

  const queryClient = new QueryClient();

  return (
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
                <Route path="/auth-profesor" element={<AuthProfesor />} />
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
};

export default App;
