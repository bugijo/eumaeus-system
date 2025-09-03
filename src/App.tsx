
import React, { useEffect, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { logger } from "./utils/logger";
// import { webVitalsMonitor } from "./utils/webVitals"; // Temporariamente comentado

// Lazy loading das páginas principais para melhor performance
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Agendamentos = React.lazy(() => import("./pages/Agendamentos"));
const Prontuario = React.lazy(() => import("./pages/Prontuario"));
const ProntuarioPet = React.lazy(() => import("./pages/ProntuarioPet"));
const Configuracoes = React.lazy(() => import("./pages/Configuracoes"));
const Financeiro = React.lazy(() => import("./pages/Financeiro"));
const Estoque = React.lazy(() => import("./pages/Estoque"));
const Pets = React.lazy(() => import("./pages/Pets"));
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const MedicalHistoryPage = React.lazy(() => import("./pages/MedicalHistoryPage"));
const TutorListPage = React.lazy(() => import("./pages/TutorListPage"));
const TutorFormPage = React.lazy(() => import("./pages/TutorFormPage"));
const TutorDetailPage = React.lazy(() => import("./pages/TutorDetailPage"));
const ProductListPage = React.lazy(() => import("./pages/ProductListPage"));
const ProductFormPage = React.lazy(() => import("./pages/ProductFormPage"));
const InvoiceDetailPage = React.lazy(() => import("./pages/InvoiceDetailPage"));
const MedicalRecordPage = React.lazy(() => import("./pages/MedicalRecordPage"));
const ReceitaPrintPage = React.lazy(() => import("./pages/ReceitaPrintPage"));

// Componente de loading otimizado para Suspense
const PageLoader = () => {
  const [showLoader, setShowLoader] = React.useState(false);
  
  React.useEffect(() => {
    // Mostrar loader apenas se demorar mais que 100ms
    const timer = setTimeout(() => setShowLoader(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  if (!showLoader) return null;
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4 animate-in fade-in duration-200">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Carregando página...</p>
          <p className="text-xs text-muted-foreground mt-1">Quase pronto...</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  console.log('🏥 Sistema Veterinário - App carregando...');
  useEffect(() => {
    // Log de inicialização
    console.log('🚀 [Eumaeus] Sistema básico inicializado');
  }, []);
  
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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
