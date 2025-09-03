import React from 'react';
import { Activity, Clock } from 'lucide-react';

export const DashboardHeader: React.FC = () => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Cockpit da Clínica</h1>
            <p className="text-muted-foreground">Visão geral e controle total da sua clínica veterinária</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Atualizado agora</span>
        </div>
      </div>
    </div>
  );
};