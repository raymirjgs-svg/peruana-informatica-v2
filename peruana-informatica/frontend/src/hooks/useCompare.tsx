'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/models/Product';
import { useToast } from './useToast';

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: number) => void;
  isInCompare: (productId: number) => boolean;
  clearCompare: () => void;
  compareCount: number;
  maxCompareItems: number;
  canAddMore: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const COMPARE_STORAGE_KEY = 'peruana_compare';
const MAX_COMPARE_ITEMS = 4; // Máximo de productos a comparar

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const toast = useToast();

  // Cargar lista de comparación desde localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCompareList(parsed);
      }
    } catch (error) {
      console.error('Error loading compare list from localStorage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Guardar lista en localStorage cuando cambie
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareList));
      } catch (error) {
        console.error('Error saving compare list to localStorage:', error);
      }
    }
  }, [compareList, isLoaded]);

  const addToCompare = (product: Product): boolean => {
    // Verificar si ya está en la lista
    if (compareList.some((item) => item.id === product.id)) {
      toast.warning('Ya está en el comparador', product.name);
      return false;
    }

    // Verificar límite máximo
    if (compareList.length >= MAX_COMPARE_ITEMS) {
      toast.warning(`Comparador lleno (máx ${MAX_COMPARE_ITEMS})`, 'Elimina un producto primero');
      return false;
    }

    setCompareList((prev) => [...prev, product]);
    toast.success('✓ Agregado al comparador', product.name);
    return true;
  };

  const removeFromCompare = (productId: number) => {
    const product = compareList.find(item => item.id === productId);
    setCompareList((prev) => prev.filter((item) => item.id !== productId));

    if (product) {
      toast.info('Eliminado del comparador', product.name);
    }
  };

  const isInCompare = (productId: number): boolean => {
    return compareList.some((item) => item.id === productId);
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const compareCount = compareList.length;
  const canAddMore = compareList.length < MAX_COMPARE_ITEMS;

  return (
    <CompareContext.Provider
      value={{
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        compareCount,
        maxCompareItems: MAX_COMPARE_ITEMS,
        canAddMore,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
