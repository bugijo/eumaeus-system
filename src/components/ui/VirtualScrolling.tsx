import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VirtualScrollingProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualScrolling<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent
}: VirtualScrollingProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleItemsCount + overscan * 2
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Auto-scroll to top when items change significantly
  useEffect(() => {
    if (scrollElementRef.current && items.length === 0) {
      scrollElementRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length]);

  if (loading) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ height: containerHeight }}
      >
        {loadingComponent || (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">Carregando...</span>
          </div>
        )}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div 
        className={cn('flex items-center justify-center', className)}
        style={{ height: containerHeight }}
      >
        {emptyComponent || (
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Nenhum item encontrado</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook para virtual scrolling com paginação
export function useVirtualScrolling<T>({
  fetchData,
  pageSize = 50,
  initialData = []
}: {
  fetchData: (page: number, pageSize: number) => Promise<T[]>;
  pageSize?: number;
  initialData?: T[];
}) {
  const [items, setItems] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    
    loadingRef.current = true;
    setLoading(true);

    try {
      const newItems = await fetchData(page, pageSize);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }
      
      setItems(prev => [...prev, ...newItems]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchData, page, pageSize, hasMore]);

  const handleScroll = useCallback((scrollTop: number) => {
    // Load more when near bottom (80% scrolled)
    const threshold = 0.8;
    const scrollHeight = items.length * 60; // Assuming 60px item height
    const containerHeight = 400; // Assuming 400px container
    
    if (scrollTop + containerHeight >= scrollHeight * threshold) {
      loadMore();
    }
  }, [items.length, loadMore]);

  const reset = useCallback(() => {
    setItems(initialData);
    setPage(0);
    setHasMore(true);
    setLoading(false);
    loadingRef.current = false;
  }, [initialData]);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    handleScroll,
    reset
  };
}

// Componente específico para lista de pets com virtual scrolling
export const VirtualPetList: React.FC<{
  pets: any[];
  onPetClick?: (pet: any) => void;
  loading?: boolean;
}> = ({ pets, onPetClick, loading }) => {
  const renderPetItem = useCallback((pet: any, index: number) => (
    <div 
      className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => onPetClick?.(pet)}
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm font-medium text-primary">
          {pet.name?.charAt(0)?.toUpperCase() || 'P'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{pet.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {pet.species} • {pet.tutor?.name}
        </p>
      </div>
      <div className="text-xs text-muted-foreground">
        {pet.age && `${pet.age} anos`}
      </div>
    </div>
  ), [onPetClick]);

  return (
    <VirtualScrolling
      items={pets}
      itemHeight={60}
      containerHeight={400}
      renderItem={renderPetItem}
      loading={loading}
      className="border rounded-lg"
      emptyComponent={
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nenhum pet encontrado</p>
        </div>
      }
    />
  );
};

// Componente específico para lista de agendamentos com virtual scrolling
export const VirtualAppointmentList: React.FC<{
  appointments: any[];
  onAppointmentClick?: (appointment: any) => void;
  loading?: boolean;
}> = ({ appointments, onAppointmentClick, loading }) => {
  const renderAppointmentItem = useCallback((appointment: any, index: number) => (
    <div 
      className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
      onClick={() => onAppointmentClick?.(appointment)}
    >
      <div className="w-2 h-8 rounded-full bg-primary"></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {appointment.pet?.name || 'Pet não identificado'}
        </p>
        <p className="text-xs text-muted-foreground">
          {appointment.tutor?.name} • {appointment.serviceType || 'Consulta'}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-foreground">
          {appointment.appointmentTime}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(appointment.appointmentDate).toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  ), [onAppointmentClick]);

  return (
    <VirtualScrolling
      items={appointments}
      itemHeight={70}
      containerHeight={400}
      renderItem={renderAppointmentItem}
      loading={loading}
      className="border rounded-lg"
      emptyComponent={
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Nenhum agendamento encontrado</p>
        </div>
      }
    />
  );
};