import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STRIPE_PRODUCTS } from '../stripe-config';
import { supabase } from './supabase';

export interface CartItem {
  id: string;
  title: string;
  imageUrl: string;
  quantity: number;
  price: number;
  priceId: string;
  formData: Record<string, any>;
  uploadedFile?: {
    path: string;
    name: string;
    type: string;
    size: number;
  };
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: () => number;
  syncCart: () => Promise<void>;
}

// Helper to get the correct product based on quantity
const getProductForQuantity = (quantity: number) => {
  switch (quantity) {
    case 3:
      return STRIPE_PRODUCTS.STARTER_PACK_3X;
    case 2:
      return STRIPE_PRODUCTS.STARTER_PACK_2X;
    case 1:
    default:
      return STRIPE_PRODUCTS.STARTER_PACK_1X;
  }
};

// Test if localStorage is available and has space
const testStorage = () => {
  try {
    const test = 'test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// Custom storage to handle quota exceeded errors
const customStorage = {
  getItem: (name: string) => {
    try {
      const value = localStorage.getItem(name);
      if (!value) return null;
      
      const data = JSON.parse(value);
      
      // Restore full item data from minimal storage
      if (data.state?.items) {
        data.state.items = data.state.items.map((item: any) => {
          const product = getProductForQuantity(item.quantity);
          return {
            id: item.id,
            quantity: item.quantity,
            price: product.price,
            priceId: product.priceId,
            title: product.name,
            imageUrl: '',
            formData: {
              color: item.formData?.color || 'default',
              size: item.formData?.size || 'medium',
              style: item.formData?.style || 'classic'
            },
            uploadedFile: item.uploadedFile
          };
        });
      }
      
      return data;
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      return null;
    }
  },
  setItem: (name: string, value: unknown) => {
    try {
      // Only store minimal essential data
      const items = (value as any)?.state?.items || [];
      const trimmedItems = items.map((item: CartItem) => ({
        id: item.id,
        quantity: item.quantity,
        formData: {
          color: item.formData?.color,
          size: item.formData?.size,
          style: item.formData?.style
        },
        uploadedFile: item.uploadedFile ? {
          path: item.uploadedFile.path,
          name: item.uploadedFile.name
        } : undefined
      }));

      // Remove any undefined or null values to save space
      const cleanItems = trimmedItems.map(item => {
        const cleaned = { ...item };
        Object.keys(cleaned).forEach(key => {
          if (cleaned[key] === undefined || cleaned[key] === null) {
            delete cleaned[key];
          }
        });
        return cleaned;
      });

      // Keep only the last 3 items to prevent storage overflow
      const limitedItems = cleanItems.slice(-3);

      const trimmedValue = {
        state: {
          items: limitedItems
        },
        version: (value as any)?.version
      };

      // Try to store with increasingly aggressive data reduction
      const attempts = [
        () => localStorage.setItem(name, JSON.stringify(trimmedValue)),
        () => {
          // Remove uploadedFile data if present
          const noFiles = {
            ...trimmedValue,
            state: {
              items: limitedItems.map(({ uploadedFile, ...item }) => item)
            }
          };
          localStorage.setItem(name, JSON.stringify(noFiles));
        },
        () => {
          // Store absolute minimum data
          const minimal = {
            state: {
              items: limitedItems.map(item => ({
                id: item.id,
                quantity: item.quantity
              }))
            },
            version: (value as any)?.version
          };
          localStorage.setItem(name, JSON.stringify(minimal));
        }
      ];

      // Try each storage attempt until one succeeds
      for (const attempt of attempts) {
        try {
          attempt();
          return; // If successful, exit the function
        } catch (err) {
          continue; // Try next attempt if current one fails
        }
      }

      // If all attempts fail, clear storage and try one last time with minimal data
      localStorage.clear();
      localStorage.setItem(name, JSON.stringify({
        state: { items: [] },
        version: (value as any)?.version
      }));
    } catch (err) {
      console.error('Error writing to localStorage:', err);
      // Silent fail - storage will be handled by Supabase for logged-in users
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (err) {
      console.error('Error removing from localStorage:', err);
    }
  },
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: async (item) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const items = get().items;
          const existingItem = items.find((i) => i.id === item.id);
          
          let updatedItems: CartItem[];
          
          if (existingItem) {
            const newQuantity = existingItem.quantity + item.quantity;
            const product = getProductForQuantity(newQuantity);
            
            updatedItems = items.map((i) =>
              i.id === item.id
                ? { 
                    ...i, 
                    quantity: newQuantity,
                    price: product.price,
                    priceId: product.priceId,
                    uploadedFile: item.uploadedFile || i.uploadedFile
                  }
                : i
            );
          } else {
            const product = getProductForQuantity(item.quantity);
            const newItem = {
              ...item,
              price: product.price,
              priceId: product.priceId
            };
            
            // Keep only the last 3 items
            updatedItems = [...items, newItem].slice(-3);
          }

          // Update local state
          set({ items: updatedItems });

          // If user is authenticated, sync with Supabase
          if (session?.user) {
            await supabase
              .from('user_profiles')
              .upsert({
                id: session.user.id,
                cart_items: updatedItems,
                updated_at: new Date().toISOString()
              });
          }
        } catch (error) {
          console.error('Error adding item to cart:', error);
          throw error;
        }
      },
      removeItem: async (id) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const items = get().items;
          const item = items.find(i => i.id === id);
          
          if (item?.uploadedFile) {
            await supabase.storage
              .from('starter-pack-files')
              .remove([item.uploadedFile.path]);
          }
          
          const updatedItems = items.filter((item) => item.id !== id);
          
          // Update local state
          set({ items: updatedItems });

          // If user is authenticated, sync with Supabase
          if (session?.user) {
            await supabase
              .from('user_profiles')
              .upsert({
                id: session.user.id,
                cart_items: updatedItems,
                updated_at: new Date().toISOString()
              });
          }
        } catch (error) {
          console.error('Error removing item from cart:', error);
          throw error;
        }
      },
      updateQuantity: async (id, quantity) => {
        if (quantity >= 1 && quantity <= 3) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const product = getProductForQuantity(quantity);
            const updatedItems = get().items.map((item) =>
              item.id === id
                ? {
                    ...item,
                    quantity,
                    price: product.price,
                    priceId: product.priceId
                  }
                : item
            );
            
            // Update local state
            set({ items: updatedItems });

            // If user is authenticated, sync with Supabase
            if (session?.user) {
              await supabase
                .from('user_profiles')
                .upsert({
                  id: session.user.id,
                  cart_items: updatedItems,
                  updated_at: new Date().toISOString()
                });
            }
          } catch (error) {
            console.error('Error updating quantity:', error);
            throw error;
          }
        }
      },
      clearCart: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const items = get().items;
          
          // Delete all uploaded files
          for (const item of items) {
            if (item.uploadedFile) {
              await supabase.storage
                .from('starter-pack-files')
                .remove([item.uploadedFile.path]);
            }
          }
          
          // Clear local state
          set({ items: [] });

          // If user is authenticated, sync with Supabase
          if (session?.user) {
            await supabase
              .from('user_profiles')
              .upsert({
                id: session.user.id,
                cart_items: [],
                updated_at: new Date().toISOString()
              });
          }
        } catch (error) {
          console.error('Error clearing cart:', error);
          throw error;
        }
      },
      syncCart: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session?.user) return;

          const { data: profile } = await supabase
            .from('user_profiles')
            .select('cart_items')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile?.cart_items) {
            set({ items: profile.cart_items });
          }
        } catch (error) {
          console.error('Error syncing cart:', error);
        }
      },
      total: () => {
        return get().items.reduce((sum, item) => {
          const product = getProductForQuantity(item.quantity);
          return sum + product.price;
        }, 0);
      },
    }),
    {
      name: 'shopping-cart',
      storage: createJSONStorage(() => customStorage),
      version: 1,
      partialize: (state) => ({
        items: state.items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          formData: {
            color: item.formData?.color,
            size: item.formData?.size,
            style: item.formData?.style
          },
          uploadedFile: item.uploadedFile ? {
            path: item.uploadedFile.path,
            name: item.uploadedFile.name
          } : undefined
        }))
      })
    }
  )
);