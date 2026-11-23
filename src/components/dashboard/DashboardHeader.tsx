import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, PackagePlus, ShoppingCart, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const QUICK_ACTIONS = [
  { to: '/agendamentos', label: 'Agendar', icon: CalendarPlus },
  { to: '/caixa', label: 'Abrir caixa', icon: ShoppingCart },
  { to: '/tutores/novo', label: 'Novo tutor', icon: UserPlus },
  { to: '/estoque/novo', label: 'Novo produto', icon: PackagePlus },
];

const greeting = (hour: number) => (hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite');

export const DashboardHeader: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const now = new Date();
  const firstName = user?.name?.split(' ')[0];
  const today = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm capitalize text-muted-foreground">{today}</p>
        <h1 className="text-2xl font-bold text-foreground">{greeting(now.getHours())}{firstName ? `, ${firstName}` : ''}</h1>
      </div>
      <nav aria-label="Ações rápidas" className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex items-center justify-center gap-2 rounded-lg border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary">
            <Icon className="h-4 w-4" aria-hidden />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
