
import { useMyAccess } from '@/api/userApi';
import { canAccessPath } from '@/lib/access';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserCheck,
  PawPrint, 
  FileText, 
  DollarSign, 
  Package, 
  Settings, 
  LogOut,
  Search,
  Bell,
  User,
  Menu,
  X,
  Archive,
  Dog,
  Stethoscope,
  Workflow,
  ShoppingCart,
  HeartPulse,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { user, refreshToken, logout } = useAuthStore();
  const logoutInProgress = useRef(false);

  const handleLogout = async () => {
    if (logoutInProgress.current) return;

    logoutInProgress.current = true;
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // A sessão local sempre deve ser encerrada, mesmo se o backend estiver indisponível.
    } finally {
      logout();
      navigate('/login');
      logoutInProgress.current = false;
    }
  };

  const { data: access } = useMyAccess(user?.type !== 'tutor');
  const allNavigationItems = [
    { icon: LayoutDashboard, label: 'Início', path: '/', section: 'Dia a dia' },
    { icon: Calendar, label: 'Agendamentos', path: '/agendamentos', section: 'Dia a dia' },
    { icon: ShoppingCart, label: 'Caixa', path: '/caixa', section: 'Dia a dia' },
    { icon: Users, label: 'Tutores', path: '/tutores', section: 'Atendimento' },
    { icon: Dog, label: 'Pets', path: '/pets', section: 'Atendimento' },
    { icon: Stethoscope, label: 'Prontuários', path: '/prontuario', section: 'Atendimento' },
    { icon: HeartPulse, label: 'Internação e cirurgia', path: '/assistencia', section: 'Atendimento' },
    { icon: UserCheck, label: 'Especialistas', path: '/especialistas', section: 'Atendimento' },
    { icon: Archive, label: 'Estoque', path: '/estoque', section: 'Gestão' },
    { icon: DollarSign, label: 'Financeiro', path: '/financeiro', section: 'Gestão' },
    { icon: Workflow, label: 'Operação', path: '/operacao', section: 'Gestão' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes', section: 'Gestão' },
  ];
  // Menu mostra só o que o plano e as permissões da pessoa liberam.
  const navigationItems = allNavigationItems.filter((item) => canAccessPath(item.path, access?.permissions));
  const blocked = !canAccessPath(location.pathname, access?.permissions);

  // ===== Debug Tema (apenas dev / habilitar com ?debugTheme=1) =====
  const [showThemeDebug, setShowThemeDebug] = useState<boolean>(false);
  const [themeSnapshot, setThemeSnapshot] = useState<{
    backgroundVar?: string;
    foregroundVar?: string;
    cardVar?: string;
    cardFgVar?: string;
    bodyBg?: string;
    htmlBg?: string;
    forcedColors?: boolean;
  }>({});

  useEffect(() => {
    if (import.meta.env.DEV) {
      const qs = new URLSearchParams(location.search);
      const enabled = qs.has('debugTheme') || localStorage.getItem('debugTheme') === '1';
      setShowThemeDebug(enabled);
      try {
        const css = getComputedStyle(document.documentElement);
        setThemeSnapshot({
          backgroundVar: css.getPropertyValue('--background').trim(),
          foregroundVar: css.getPropertyValue('--foreground').trim(),
          cardVar: css.getPropertyValue('--card').trim(),
          cardFgVar: css.getPropertyValue('--card-foreground').trim(),
          bodyBg: getComputedStyle(document.body).backgroundColor,
          htmlBg: getComputedStyle(document.documentElement).backgroundColor,
          forcedColors: typeof window.matchMedia === 'function' && window.matchMedia('(forced-colors: active)').matches,
        });
      } catch (e) {
        // noop
      }
    }
  }, [location.search]);

  const navigation = (
    <div className="flex-1 overflow-y-auto p-4 space-y-1">
      {navigationItems.map((item, index) => {
        const Icon = item.icon;
        const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
        const shouldShowLabel = !sidebarCollapsed || sidebarOpen;
        const startsSection = index === 0 || navigationItems[index - 1].section !== item.section;

        return (
          <React.Fragment key={item.path}>
          {startsSection && (shouldShowLabel
            ? <p className={`px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${index === 0 ? '' : 'pt-4'}`}>{item.section}</p>
            : index > 0 && <div aria-hidden className="mx-3 my-2 border-t border-border" />)}
          <Link
            to={item.path}
            className={`flex items-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              sidebarCollapsed && !sidebarOpen 
                ? 'justify-center p-2.5 mx-2' 
                : 'space-x-3 px-3 py-2.5'
            } ${
              isActive
                ? 'bg-primary/10 text-primary font-semibold'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Navegar para ${item.label}`}
            onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
            title={sidebarCollapsed && !sidebarOpen ? item.label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            {shouldShowLabel ? (
              <span className="truncate">{item.label}</span>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
          </Link>
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        id="sidebar-navigation"
        className={`fixed left-0 top-0 h-full bg-card border-r border-border transform transition-all duration-300 ease-in-out z-50 ${
          sidebarOpen || !sidebarCollapsed ? 'translate-x-0 w-64' : '-translate-x-full w-16'
        } md:relative md:translate-x-0 ${
          sidebarCollapsed && !sidebarOpen ? 'md:w-16' : 'md:w-64'
        }`}
        onMouseEnter={() => {
          if (window.innerWidth >= 768 && sidebarCollapsed) {
            setSidebarOpen(true);
          }
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 768 && sidebarCollapsed) {
            setSidebarOpen(false);
          }
        }}
        role="navigation"
        aria-label="Menu principal de navegação"
      >
        {/* Close button for mobile */}
        <div className="absolute top-4 right-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8"
            aria-label="Ocultar menu de navegação"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        {/* Logo Section */}
        <div
          className={`p-6 border-b border-sidebar-border transition-all duration-300 ${
          sidebarCollapsed && !sidebarOpen ? 'px-3' : 'px-6'
        }`}
          role="presentation"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src="/logo.png"
                alt="Logotipo do Sistema Eumaeus"
                className="w-12 h-12 object-contain"
              />
            </div>
            {(!sidebarCollapsed || sidebarOpen) ? (
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-foreground text-sm truncate">Eumaeus</h2>
                <p className="text-xs text-muted-foreground truncate" aria-label={`Usuário logado: ${user?.name || 'Usuário'}`}>
                  {user?.name || 'Usuário'}
                </p>
              </div>
            ) : (
              <>
                <span className="sr-only">Eumaeus</span>
                <span className="sr-only" aria-label={`Usuário logado: ${user?.name || 'Usuário'}`}>
                  {user?.name || 'Usuário'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        {navigation}

        {/* Logout */}
        <footer
          className={`p-4 border-t border-sidebar-border transition-all duration-300 ${
          sidebarCollapsed && !sidebarOpen ? 'px-2' : 'px-4'
        }`}
          role="contentinfo"
        >
          <button
            onClick={handleLogout}
            className={`flex items-center rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              sidebarCollapsed && !sidebarOpen
                ? 'justify-center p-2.5'
                : 'space-x-3 px-3 py-2.5'
            }`}
            aria-label="Sair do sistema"
            title={sidebarCollapsed && !sidebarOpen ? 'Sair' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            {(!sidebarCollapsed || sidebarOpen) && <span className="truncate">Sair</span>}
          </button>
        </footer>
      </aside>



      {/* Main Content */}
      <div className="flex flex-col h-full flex-1 transition-all duration-300">
        {/* Top Header */}
        <header className="bg-card border-b border-border px-2 md:px-4 py-3 flex items-center justify-between shadow-sm supports-[backdrop-filter]:bg-card/90 backdrop-blur">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1">
            {/* Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                  setSidebarOpen(false);
                }
              }}
              className="h-8 w-8 text-primary hover:bg-primary/10"
              aria-label={sidebarOpen || !sidebarCollapsed ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              aria-expanded={sidebarOpen || !sidebarCollapsed}
              aria-controls="sidebar-navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            
            <div className="px-2 md:px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 flex-1 md:flex-none">
              <h1 className="text-sm md:text-lg font-semibold text-foreground truncate">
                Bem-vindo(a), {user?.name || 'Usuário'}! 👋
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt={user?.name || 'Usuário'} />
                    <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-white text-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">{user?.name || 'Usuário'}</p>
                  <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate('/configuracoes?aba=conta')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Minha conta</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main 
          className="flex-1 p-2 md:p-4 bg-background text-foreground transition-all duration-300 overflow-auto"
          role="main"
          aria-label="Conteúdo principal da página"
        >
          {blocked ? (
            <div className="mx-auto mt-16 max-w-md rounded-2xl border border-border bg-card p-8 text-center">
              <h1 className="text-xl font-semibold">Esta tela não faz parte do seu acesso</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Peça ao responsável pelo estabelecimento para liberar o módulo em Configurações, na aba Equipe e acessos.
              </p>
              <button type="button" onClick={() => navigate('/')} className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-transform duration-150 active:scale-[0.97]">
                Voltar ao início
              </button>
            </div>
          ) : children}
        </main>
      </div>

      {import.meta.env.DEV && showThemeDebug && (
        <div className="fixed bottom-4 right-4 z-[100] max-w-sm text-xs bg-white/90 backdrop-blur border border-border rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-foreground">Debug Tema</span>
            <button
              className="text-xs px-2 py-0.5 rounded bg-muted hover:bg-muted/80"
              onClick={() => {
                localStorage.setItem('debugTheme', '0');
                setShowThemeDebug(false);
              }}
            >
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-muted-foreground">--background</div>
              <div className="font-mono">{themeSnapshot.backgroundVar || 'n/d'}</div>
              <div className="h-4 w-full rounded mt-1" style={{ background: `hsl(${themeSnapshot.backgroundVar || '0 0% 100%'})` }} />
            </div>
            <div>
              <div className="text-muted-foreground">--card</div>
              <div className="font-mono">{themeSnapshot.cardVar || 'n/d'}</div>
              <div className="h-4 w-full rounded mt-1" style={{ background: `hsl(${themeSnapshot.cardVar || '0 0% 100%'})` }} />
            </div>
            <div>
              <div className="text-muted-foreground">Body BG</div>
              <div className="font-mono">{themeSnapshot.bodyBg || 'n/d'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">HTML BG</div>
              <div className="font-mono">{themeSnapshot.htmlBg || 'n/d'}</div>
            </div>
            <div className="col-span-2">
              <div className="text-muted-foreground">forced-colors</div>
              <div className="font-mono">{String(!!themeSnapshot.forcedColors)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
