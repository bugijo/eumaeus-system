
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Prontuario from "./pages/Prontuario";
import Configuracoes from "./pages/Configuracoes";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Pets from "./pages/Pets";
import { LoginPage } from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import MedicalHistoryPage from "./pages/MedicalHistoryPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/utils/ErrorBoundary";
import TutorListPage from "./pages/TutorListPage";
import TutorFormPage from "./pages/TutorFormPage";
import { TutorDetailPage } from "./pages/TutorDetailPage";
import ProductListPage from "./pages/ProductListPage";
import ProductFormPage from "./pages/ProductFormPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";

function App() {
  console.log('🏥 Sistema Veterinário - App carregando...');
  
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <Routes>
            {/* Rota pública de login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar o Dashboard</h2></div>}>
                  <Layout><Dashboard /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/agendamentos" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar os Agendamentos</h2></div>}>
                  <Layout><Agendamentos /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/clientes" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar os Clientes</h2></div>}>
                  <Layout><Clientes /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/tutores" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar os Tutores</h2></div>}>
                  <Layout><TutorListPage /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/tutores/novo" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar o Formulário de Tutor</h2></div>}>
                  <Layout><TutorFormPage /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/tutores/editar/:id" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar o Formulário de Tutor</h2></div>}>
                  <Layout><TutorFormPage /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/tutores/:id" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar os Detalhes do Tutor</h2></div>}>
                  <Layout><TutorDetailPage /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/prontuarios" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar os Prontuários</h2></div>}>
                  <Layout><Prontuario /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
              <Route path="/financeiro" element={<Layout><Financeiro /></Layout>} />
              <Route path="/estoque" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar o Estoque</h2></div>}>
                  <Layout><ProductListPage /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/estoque/novo" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar o Formulário de Produto</h2></div>}>
                  <Layout><ProductFormPage /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/estoque/editar/:id" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar o Formulário de Produto</h2></div>}>
                  <Layout><ProductFormPage /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/pets" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar os Pets</h2></div>}>
                  <Layout><Pets /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/prontuario/:petId" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar o Prontuário</h2></div>}>
                  <Layout><MedicalHistoryPage /></Layout>
                </ErrorBoundary>
              } />
              <Route path="/invoices/:invoiceId" element={
                <ErrorBoundary fallback={<div className="p-8 text-center"><h2 className="text-xl text-red-600">Erro ao carregar a Fatura</h2></div>}>
                  <Layout><InvoiceDetailPage /></Layout>
                </ErrorBoundary>
              } />
            </Route>
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
  );
}

export default App;
