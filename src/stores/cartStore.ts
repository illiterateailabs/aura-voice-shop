
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './productStore';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  total: number;
  wishlistItems: Product[];
}

interface CartActions {
  addItem: (product: Product, options?: { color?: string; size?: string }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  calculateTotal: () => void;
  getItemCount: () => number;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

type CartStore = CartState & CartActions;

const initialState: CartState = {
  items: [],
  isOpen: false,
  total: 0,
  wishlistItems: [],
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addItem: (product, options = {}) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedColor === options.color &&
            item.selectedSize === options.size
        );
        
        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += 1;
          set({ items: updatedItems });
        } else {
          const newItem: CartItem = {
            product,
            quantity: 1,
            selectedColor: options.color,
            selectedSize: options.size,
          };
          set({ items: [...items, newItem] });
        }
        
        get().calculateTotal();
      },
      
      removeItem: (productId) => {
        const { items } = get();
        const updatedItems = items.filter((item) => item.product.id !== productId);
        set({ items: updatedItems });
        get().calculateTotal();
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        const { items } = get();
        const updatedItems = items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
        set({ items: updatedItems });
        get().calculateTotal();
      },
      
      clearCart: () => {
        set({ items: [], total: 0 });
      },
      
      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },
      
      setCartOpen: (open) => {
        set({ isOpen: open });
      },
      
      calculateTotal: () => {
        const { items } = get();
        const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        set({ total });
      },
      
      getItemCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      toggleItem: (product) => {
        const { wishlistItems } = get();
        const isInWishlist = wishlistItems.some(item => item.id === product.id);
        
        if (isInWishlist) {
          set({ 
            wishlistItems: wishlistItems.filter(item => item.id !== product.id) 
          });
        } else {
          set({ 
            wishlistItems: [...wishlistItems, product] 
          });
        }
      },

      isInWishlist: (productId) => {
        const { wishlistItems } = get();
        return wishlistItems.some(item => item.id === productId);
      },
    }),
    {
      name: 'aura-shop-cart',
    }
  )
);
