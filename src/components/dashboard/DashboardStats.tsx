import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardCardSkeleton } from '@/components/ui/SkeletonLoader';
import { useDashboardProcessor } from '@/hooks/useWebWorker';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface StatItem {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  positive: boolean;
  isStatic: boolean;
  borderColor: string;
  bgColor: string;
  iconColor: string;
}

interface DashboardStatsProps {
  stats: StatItem[];
  isLoading: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <DashboardCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.positive ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="bg-card rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-3 rounded-xl bg-primary/10 shadow-sm">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground mb-2">
                {!stat.isStatic && isLoading ? (
                  <LoadingSpinner />
                ) : (
                  stat.value
                )}
              </div>
              <div className="flex items-center text-xs">
                <TrendIcon className={`h-3 w-3 mr-1 ${stat.positive ? 'text-secondary' : 'text-primary'}`} />
                <span className={stat.positive ? 'text-secondary' : 'text-primary'}>{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};