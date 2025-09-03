import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import {
  DashboardCardSkeleton,
  TableSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageSkeleton,
  LoadingSpinner,
  LoadingWithText
} from '../loading-states';

describe('Loading States Components', () => {
  describe('DashboardCardSkeleton', () => {
    it('deve renderizar skeleton do card do dashboard', () => {
      render(<DashboardCardSkeleton />);
      
      const cardContainer = document.querySelector('.p-6.bg-card.rounded-lg.border');
      expect(cardContainer).toBeInTheDocument();
    });
  });

  describe('TableSkeleton', () => {
    it('deve renderizar skeleton da tabela com valores padrão', () => {
      render(<TableSkeleton />);
      
      const tableContainer = document.querySelector('.border.border-border.rounded-lg');
      expect(tableContainer).toBeInTheDocument();
      
      // Verificar se tem header
      const header = document.querySelector('[class*="bg-muted"]');
      expect(header).toBeInTheDocument();
    });

    it('deve renderizar skeleton da tabela com props customizadas', () => {
      render(<TableSkeleton rows={3} cols={2} />);
      
      // Verificar se tem o número correto de linhas (3 + 1 header)
      const rows = document.querySelectorAll('.p-4.border-b');
      expect(rows).toHaveLength(4); // 3 rows + 1 header
    });
  });

  describe('FormSkeleton', () => {
    it('deve renderizar skeleton do formulário', () => {
      render(<FormSkeleton />);
      
      const formContainer = document.querySelector('.space-y-6');
      expect(formContainer).toBeInTheDocument();
      
      // Verificar se tem campos de input
      const inputs = document.querySelectorAll('.h-10.w-full');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe('ListSkeleton', () => {
    it('deve renderizar skeleton da lista com valores padrão', () => {
      render(<ListSkeleton />);
      
      const listItems = document.querySelectorAll('.flex.items-center.space-x-4.p-4');
      expect(listItems).toHaveLength(6); // valor padrão
    });

    it('deve renderizar skeleton da lista com número customizado de itens', () => {
      render(<ListSkeleton items={3} />);
      
      const listItems = document.querySelectorAll('.flex.items-center.space-x-4.p-4');
      expect(listItems).toHaveLength(3);
    });
  });

  describe('PageSkeleton', () => {
    it('deve renderizar skeleton da página completa', () => {
      render(<PageSkeleton />);
      
      const pageContainer = document.querySelector('.space-y-6');
      expect(pageContainer).toBeInTheDocument();
      
      // Verificar se tem cards de stats (4 cards)
      const statsCards = document.querySelectorAll('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4 .p-6');
      expect(statsCards).toHaveLength(4);
    });
  });

  describe('LoadingSpinner', () => {
    it('deve renderizar spinner com tamanho padrão', () => {
      render(<LoadingSpinner />);
      
      const spinner = document.querySelector('.animate-spin.rounded-full.border-2');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('h-6', 'w-6'); // tamanho md
    });

    it('deve renderizar spinner com tamanho pequeno', () => {
      render(<LoadingSpinner size="sm" />);
      
      const spinner = document.querySelector('.animate-spin.rounded-full.border-2');
      expect(spinner).toHaveClass('h-4', 'w-4');
    });

    it('deve renderizar spinner com tamanho grande', () => {
      render(<LoadingSpinner size="lg" />);
      
      const spinner = document.querySelector('.animate-spin.rounded-full.border-2');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });
  });

  describe('LoadingWithText', () => {
    it('deve renderizar loading com texto padrão', () => {
      render(<LoadingWithText />);
      
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
      
      const spinner = document.querySelector('.animate-spin.rounded-full.border-2');
      expect(spinner).toBeInTheDocument();
    });

    it('deve renderizar loading com texto customizado', () => {
      render(<LoadingWithText text="Salvando dados..." />);
      
      expect(screen.getByText('Salvando dados...')).toBeInTheDocument();
    });

    it('deve renderizar loading com tamanho customizado', () => {
      render(<LoadingWithText size="lg" />);
      
      const spinner = document.querySelector('.animate-spin.rounded-full.border-2');
      expect(spinner).toHaveClass('h-8', 'w-8');
    });
  });

  describe('Acessibilidade', () => {
    it('componentes de loading devem ter estrutura adequada', () => {
      render(<LoadingWithText text="Carregando dados" />);
      
      // Verificar se o texto está presente para leitores de tela
      expect(screen.getByText('Carregando dados')).toBeInTheDocument();
    });

    it('skeleton deve ter classes de animação adequadas', () => {
      render(<DashboardCardSkeleton />);
      
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsividade', () => {
    it('PageSkeleton deve ter classes responsivas', () => {
      render(<PageSkeleton />);
      
      const responsiveGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(responsiveGrid).toBeInTheDocument();
      
      const responsiveLayout = document.querySelector('.grid.grid-cols-1.lg\\:grid-cols-3');
      expect(responsiveLayout).toBeInTheDocument();
    });
  });
});