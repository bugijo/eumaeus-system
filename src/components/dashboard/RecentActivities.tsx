import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Users, 
  CreditCard, 
  Calendar, 
  Package, 
  Stethoscope, 
  PawPrint 
} from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ActivityItem {
  id: number;
  type: string;
  description: string;
  timestamp: string;
}

interface RecentActivitiesProps {
  activities: ActivityItem[];
  isLoading: boolean;
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({
  activities,
  isLoading
}) => {
  const getActivityIcon = (type: string, description: string) => {
    switch (type) {
      case 'tutor':
        return { icon: Users, color: 'text-primary', bg: 'bg-primary/10' };
      case 'payment':
        return { icon: CreditCard, color: 'text-secondary', bg: 'bg-secondary/10' };
      case 'appointment':
        return { icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' };
      case 'stock':
        return { icon: Package, color: 'text-primary', bg: 'bg-primary/10' };
      case 'consultation':
        return { icon: Stethoscope, color: 'text-primary', bg: 'bg-primary/10' };
      default: {
        // Fallback baseado na descrição
        if (description.includes('pet') || description.includes('animal')) {
          return { icon: PawPrint, color: 'text-secondary', bg: 'bg-secondary/10' };
        }
        return { icon: Activity, color: 'text-primary', bg: 'bg-primary/10' };
      }
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60));
    if (minutes < 60) {
      return `há ${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `há ${hours}h`;
    }
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
  };

  return (
    <Card className="bg-card rounded-lg shadow-md">
      <CardHeader className="p-4 border-b border-border">
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-primary" />
            Feed de Atividades
          </div>
          <Badge variant="outline" className="text-xs">
            Tempo real
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : activities && activities.length > 0 ? (
            activities.map((activity) => {
              const { icon: IconComponent, color, bg } = getActivityIcon(activity.type, activity.description);
              
              return (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gradient-to-r from-muted/20 to-muted/5 hover:from-muted/30 hover:to-muted/10 transition-all duration-200 border border-transparent hover:border-primary/10"
                >
                  <div className={`p-2 rounded-lg ${bg} flex-shrink-0`}>
                    <IconComponent className={`h-4 w-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString('pt-BR')} às {new Date(activity.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/30"></div>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Nenhuma atividade recente</p>
              <p className="text-sm">As atividades da clínica aparecerão aqui em tempo real</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};