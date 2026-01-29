'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Product } from '@/models/Product';
import { cartService } from '@/services/CartService';
import { useSession } from 'next-auth/react';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize: Load from LocalStorage OR Server
  useEffect(() => {
    if (status === 'loading') return; // Wait for session to load

    const initializeCart = async () => {
      // 1. Check if user is logged in
      const isAuth = !!session;

      if (isAuth) {
        // 2. If Auth, fetch server cart (merging local temp cart if needed)
        try {
          const localCart = JSON.parse(localStorage.getItem('cart') || '[]');

          if (localCart.length > 0) {
            // Sync local items to server
            const { items: serverItems } = await cartService.syncCart(localCart.map((i: any) => ({
              id: i.product.id,
              quantity: i.quantity
            })));
            setItems(serverItems);
            localStorage.removeItem('cart'); // Clear local after sync
          } else {
            // Just get server cart
            const { items: serverItems } = await cartService.getCart();
            setItems(serverItems);
          }
        } catch (error) {
          console.warn('Cart sync failed, using local storage:', error);
          // Fallback to local cart on error
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              setItems(JSON.parse(savedCart));
            } catch (e) {
              localStorage.removeItem('cart');
            }
          }
        }
      } else {
        // 3. If Guest, load from localStorage
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          try {
            setItems(JSON.parse(savedCart));
          } catch (e) { localStorage.removeItem('cart'); }
        }
      }
      setIsInitialized(true);
    };

    initializeCart();
  }, [session, status]); // Re-run when session changes

  // Persistence: Save to LocalStorage (Guest) OR API (Auth)
  useEffect(() => {
    if (!isInitialized) return;

    if (!session) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, isInitialized, session]);

  const addItem = async (product: Product, quantity: number = 1) => {
    // Optimistic Update
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prevItems, { product, quantity }];
    });

    // API Update if Auth
    if (session) {
      try {
        // Since we don't have the new total quantity easily accessible here without recounting, 
        // let's just calculate it or simpler: let the backend handle the increment? 
        // Our current API takes absolute quantity.
        const currentItem = items.find(i => i.product.id === product.id);
        const newQuantity = (currentItem?.quantity || 0) + quantity;
        await cartService.updateItem(product.id, newQuantity);
      } catch (e) {
        console.error('Error adding item to server cart', e);
      }
    }
  };

  const removeItem = async (productId: number) => {
    setItems(prevItems => prevItems.filter(item => item.product.id !== productId));

    if (session) {
      try {
        await cartService.removeItem(productId);
      } catch (e) { console.error(e); }
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(prevItems => prevItems.map(item => item.product.id === productId ? { ...item, quantity } : item));

    if (session) {
      try {
        await cartService.updateItem(productId, quantity);
      } catch (e) { console.error(e); }
    }
  };

  const clearCart = () => {
    setItems([]);
    if (!session) {
      localStorage.removeItem('cart');
    }
    // We might want an API endpoint to clear cart too, or just strictly handle item removal.
    // For now, let's keep it simple.
  };

  const isInCart = (productId: number) => {
    return items.some(item => item.product.id === productId);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = Number(item.product.priceWeb) > 0 ? Number(item.product.priceWeb) : Number(item.product.price);
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
