
import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";
// import Clientes from "./pages/Clientes"; // Removido - usando apenas Tutores
import Prontuario from "./pages/Prontuario";
import ProntuarioPet from "./pages/ProntuarioPet";
import Configuracoes from "./pages/Configuracoes";
import Financeiro from "./pages/Financeiro";
import Estoque from "./pages/Estoque";
import Pets from "./pages/Pets";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import MedicalHistoryPage from "./pages/MedicalHistoryPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import TutorListPage from "./pages/TutorListPage";
import TutorFormPage from "./pages/TutorFormPage";
import TutorDetailPage from "./pages/TutorDetailPage";
import ProductListPage from "./pages/ProductListPage";
import ProductFormPage from "./pages/ProductFormPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import MedicalRecordPage from "./pages/MedicalRecordPage";
import ReceitaPrintPage from "./pages/ReceitaPrintPage";
import { logger } from "./utils/logger";
// import { webVitalsMonitor } from "./utils/webVitals"; // Temporariamente comentado

function App() {
  console.log('🏥 Sistema Veterinário - App carregando...');
  
  useEffect(() => {
    // Inicializar sistema de logs
    logger.info('Aplicação iniciada', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Registrar métricas de performance da aplicação
    // webVitalsMonitor.recordCustomMetric('app_start', performance.now()); // Temporariamente comentado

    // Log de informações do ambiente
    logger.debug('Informações do ambiente', {
      nodeEnv: process.env.NODE_ENV,
      reactVersion: React.version,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    });

    // Diagnóstico: inspecionar variáveis de tema e cor de fundo atual
    try {
      const root = document.documentElement;
      const css = getComputedStyle(root);
      const bgVar = css.getPropertyValue('--background').trim();
      const fgVar = css.getPropertyValue('--foreground').trim();
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      logger.debug('Tema - variáveis atuais', { backgroundVar: bgVar, foregroundVar: fgVar, bodyBackgroundColor: bodyBg });
    } catch (err) {
      console.warn('Falha ao inspecionar variáveis de tema', err);
    }
  }, []);
  
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
            <Routes>
            {/* Rota pública de login */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Rotas protegidas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={
                <Layout><Dashboard /></Layout>
              } />
              <Route path="/agendamentos" element={
                <Layout><Agendamentos /></Layout>
              } />
              {/* Rota /clientes removida - usando apenas /tutores */}
              <Route path="/tutores" element={
                <Layout><TutorListPage /></Layout>
              } />
              <Route path="/tutores/novo" element={
                <Layout><TutorFormPage /></Layout>
              } />
              <Route path="/tutores/editar/:id" element={
                <Layout><TutorFormPage /></Layout>
              } />
              <Route path="/tutores/:id" element={
                <Layout><TutorDetailPage /></Layout>
              } />
              <Route path="/prontuario" element={
                <Layout><Prontuario /></Layout>
              } />
              <Route path="/prontuario/:petId" element={
                <Layout><ProntuarioPet /></Layout>
              } />
              <Route path="/configuracoes" element={<Layout><Configuracoes /></Layout>} />
              <Route path="/financeiro" element={<Layout><Financeiro /></Layout>} />
              <Route path="/estoque" element={
                <Layout><ProductListPage /></Layout>
              } />
              <Route path="/estoque/novo" element={
                <Layout><ProductFormPage /></Layout>
              } />
              <Route path="/estoque/editar/:id" element={
                <Layout><ProductFormPage /></Layout>
              } />
              <Route path="/pets" element={
                <Layout><Pets /></Layout>
              } />
              <Route path="/prontuario/:petId" element={
                <Layout><MedicalHistoryPage /></Layout>
              } />
              <Route path="/pets/:petId/prontuario" element={
                <Layout><MedicalRecordPage /></Layout>
              } />
              <Route path="/invoices/:invoiceId" element={
                <Layout><InvoiceDetailPage /></Layout>
              } />
            </Route>
            

            
            {/* Rota para impressão de receituário (sem layout) */}
            <Route path="/receita/:id/print" element={<ReceitaPrintPage />} />
            
            {/* Rota 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
