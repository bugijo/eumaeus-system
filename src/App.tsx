
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Prontuario from "./pages/Prontuario";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agendamentos" element={<Agendamentos />} />
            <Route path="/clientes" element={<Clientes />} />
            {/* Placeholder routes for other pages */}
            <Route path="/pets" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-muted-foreground">Página de Pets em desenvolvimento</h2></div>} />
            <Route path="/prontuarios" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-muted-foreground">Página de Prontuários em desenvolvimento</h2></div>} />
            <Route path="/financeiro" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-muted-foreground">Página Financeiro em desenvolvimento</h2></div>} />
            <Route path="/estoque" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-muted-foreground">Página de Estoque em desenvolvimento</h2></div>} />
            <Route path="/configuracoes" element={<div className="text-center py-12"><h2 className="text-2xl font-bold text-muted-foreground">Página de Configurações em desenvolvimento</h2></div>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
