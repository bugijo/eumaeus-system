
import React, { useState, useEffect } from 'react';
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
  Stethoscope
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
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
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Calendar, label: 'Agendamentos', path: '/agendamentos' },
    { icon: Users, label: 'Tutores', path: '/tutores' },
    { icon: Dog, label: 'Pets', path: '/pets' },
    { icon: Stethoscope, label: 'Prontuários', path: '/prontuario' },
    { icon: Archive, label: 'Estoque', path: '/estoque' },
    { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

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
    <nav className="flex-1 p-4 space-y-2">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out z-50 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        {/* Close button for mobile */}
        <div className="absolute top-4 right-4 md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Logo Section */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src="/logo.png" 
                alt="Eumaeus System Logo" 
                className="w-12 h-12 object-contain"
              />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-sm">Eumaeus System</h2>
              <p className="text-xs text-muted-foreground">{user?.name || 'Usuário'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        {navigation}

        {/* Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Hover Trigger */}
      <div 
        className="fixed left-0 top-0 w-4 h-full z-40"
        onMouseEnter={() => setSidebarOpen(true)}
      ></div>

      {/* Main Content */}
      <div className={`flex flex-col h-full transition-all duration-300 ${
        sidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        {/* Top Header */}
        <header className="bg-card border-b border-border p-4 flex items-center justify-between shadow-sm supports-[backdrop-filter]:bg-card/90 backdrop-blur">
          <div className="flex items-center space-x-4">
            {/* Menu Toggle Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 text-primary hover:bg-primary/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
              <h1 className="text-lg font-semibold text-foreground">
                Bem-vindo(a), {user?.name || 'Usuário'}! 👋
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary" />
              <Input
                placeholder="Buscar..."
                className="pl-10 w-64 border-input focus:border-primary focus:ring-primary bg-card/80 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-primary hover:bg-primary/10">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full"></span>
            </Button>

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
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
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
        <main className="flex-1 p-6 bg-background text-foreground transition-all duration-300">
          {children}
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
