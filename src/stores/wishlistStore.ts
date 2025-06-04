
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './productStore';

interface WishlistState {
  items: Product[];
  isOpen: boolean;
}

interface WishlistActions {
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  toggleItem: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: () => void;
  setWishlistOpen: (open: boolean) => void;
  clearWishlist: () => void;
}

type WishlistStore = WishlistState & WishlistActions;

const initialState: WishlistState = {
  items: [],
  isOpen: false,
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      addItem: (product) => {
        const { items } = get();
        if (!items.find(item => item.id === product.id)) {
          set({ items: [...items, product] });
        }
      },
      
      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== productId) });
      },
      
      toggleItem: (product) => {
        const { isInWishlist, addItem, removeItem } = get();
        if (isInWishlist(product.id)) {
          removeItem(product.id);
        } else {
          addItem(product);
        }
      },
      
      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(item => item.id === productId);
      },
      
      toggleWishlist: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },
      
      setWishlistOpen: (open) => {
        set({ isOpen: open });
      },
      
      clearWishlist: () => {
        set({ items: [] });
      },
    }),
    {
      name: 'aura-shop-wishlist',
    }
  )
);
