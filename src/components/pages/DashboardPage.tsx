'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { LoadingWithText, FullPageLoading } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { useTutors, useTutorStats } from '@/api/tutorApi';
import { usePets, usePetSpeciesStats, usePetAgeStats } from '@/api/petApi';
import { useToast } from '@/hooks/useToast';
import { PAGINATION } from '@/constants';
import type { Tutor, Pet } from '@/types';

interface DashboardPageProps {
  className?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading?: boolean;
}

function StatCard({ title, value, description, icon, trend, isLoading }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2">
            {isLoading ? (
              <LoadingWithText text="Carregando..." size="sm" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecentItemsProps {
  title: string;
  items: Array<{
    id: string;
    name: string;
    subtitle: string;
    date: string;
  }>;
  isLoading?: boolean;
  onViewAll?: () => void;
}

function RecentItems({ title, items, isLoading, onViewAll }: RecentItemsProps) {
  return (
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {onViewAll && (
            <Button variant="outline" size="sm" onClick={onViewAll}>
              Ver todos
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <LoadingWithText text="Carregando..." />
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhum item encontrado
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.subtitle}</p>
                </div>
                <div className="text-sm text-gray-400">
                  {new Date(item.date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardPage({ className }: DashboardPageProps) {
  const { toast } = useToast();
  
  // Queries para estatísticas
  const {
    data: tutorsData,
    isLoading: tutorsLoading,
    isError: tutorsError,
    error: tutorsErrorData
  } = useTutors({ page: 1, limit: 5 });
  
  const {
    data: petsData,
    isLoading: petsLoading,
    isError: petsError,
    error: petsErrorData
  } = usePets({ page: 1, limit: 5 });
  
  const {
    data: tutorStats,
    isLoading: tutorStatsLoading
  } = useTutorStats();
  
  const {
    data: petSpeciesStats,
    isLoading: petSpeciesStatsLoading
  } = usePetSpeciesStats();
  
  const {
    data: petAgeStats,
    isLoading: petAgeStatsLoading
  } = usePetAgeStats();

  // Loading state
  if (tutorsLoading && petsLoading) {
    return <FullPageLoading text="Carregando dashboard..." />;
  }

  // Error state
  if (tutorsError || petsError) {
    return (
      <div className={className}>
        <ErrorDisplay
          title="Erro ao carregar dashboard"
          message="Ocorreu um erro ao carregar as informações do dashboard."
          onRetry={() => window.location.reload()}
          showDetails
          error={(tutorsErrorData || petsErrorData) as Error}
        />
      </div>
    );
  }

  const tutors = tutorsData?.data || [];
  const pets = petsData?.data || [];
  const totalTutors = tutorsData?.pagination?.total || 0;
  const totalPets = petsData?.pagination?.total || 0;

  // Preparar dados para componentes
  const recentTutors = tutors.map((tutor: Tutor) => ({
    id: tutor.id,
    name: tutor.name,
    subtitle: tutor.email,
    date: tutor.createdAt,
  }));

  const recentPets = pets.map((pet: Pet) => ({
    id: pet.id,
    name: pet.name,
    subtitle: `${pet.species} - ${pet.tutor?.name || 'Sem tutor'}`,
    date: pet.createdAt,
  }));

  // Calcular estatísticas de espécies
  const topSpecies = petSpeciesStats?.slice(0, 3) || [];
  const mostCommonSpecies = topSpecies[0];

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Visão geral do sistema veterinário
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Tutores"
          value={totalTutors}
          description="Tutores cadastrados"
          isLoading={tutorsLoading || tutorStatsLoading}
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Total de Pets"
          value={totalPets}
          description="Pets cadastrados"
          isLoading={petsLoading}
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Espécie Mais Comum"
          value={mostCommonSpecies?.species || 'N/A'}
          description={mostCommonSpecies ? `${mostCommonSpecies.count} pets` : 'Nenhum pet cadastrado'}
          isLoading={petSpeciesStatsLoading}
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        
        <StatCard
          title="Novos Este Mês"
          value={tutorStats?.newThisMonth || 0}
          description="Tutores cadastrados"
          isLoading={tutorStatsLoading}
          trend={{
            value: tutorStats?.growthPercentage || 0,
            isPositive: (tutorStats?.growthPercentage || 0) >= 0
          }}
          icon={
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Species Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição por Espécie
          </h3>
          {petSpeciesStatsLoading ? (
            <LoadingWithText text="Carregando estatísticas..." />
          ) : topSpecies.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum dado disponível
            </p>
          ) : (
            <div className="space-y-4">
              {topSpecies.map((item, index) => {
                const percentage = totalPets > 0 ? (item.count / totalPets) * 100 : 0;
                return (
                  <div key={item.species}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {item.species}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-600' : 'bg-purple-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribuição por Idade
          </h3>
          {petAgeStatsLoading ? (
            <LoadingWithText text="Carregando estatísticas..." />
          ) : !petAgeStats || Object.keys(petAgeStats).length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum dado disponível
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(petAgeStats).map(([ageGroup, count], index) => {
                const percentage = totalPets > 0 ? (count / totalPets) * 100 : 0;
                return (
                  <div key={ageGroup}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {ageGroup}
                      </span>
                      <span className="text-sm text-gray-500">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-600' :
                          index === 2 ? 'bg-purple-600' : 'bg-orange-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentItems
          title="Tutores Recentes"
          items={recentTutors}
          isLoading={tutorsLoading}
          onViewAll={() => {
            // Navigate to tutors page
            window.location.href = '/tutors';
          }}
        />
        
        <RecentItems
          title="Pets Recentes"
          items={recentPets}
          isLoading={petsLoading}
          onViewAll={() => {
            // Navigate to pets page
            window.location.href = '/pets';
          }}
        />
      </div>
    </div>
  );
}