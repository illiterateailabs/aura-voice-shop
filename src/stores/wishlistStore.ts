
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './productStore';

interface WishlistState {
  items: Product[];
  isOpen: boolean;
}

interface WishlistActions {
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  setWishlistOpen: (open: boolean) => void;
  toggleWishlist: () => void;
}

type WishlistStore = WishlistState & WishlistActions;

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addToWishlist: (product) => {
        const { items } = get();
        if (!items.find(item => item.id === product.id)) {
          set({ items: [...items, product] });
        }
      },

      removeFromWishlist: (productId) => {
        const { items } = get();
        set({ items: items.filter(item => item.id !== productId) });
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some(item => item.id === productId);
      },

      clearWishlist: () => set({ items: [] }),
      setWishlistOpen: (open) => set({ isOpen: open }),
      toggleWishlist: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'aura-wishlist',
    }
  )
);
