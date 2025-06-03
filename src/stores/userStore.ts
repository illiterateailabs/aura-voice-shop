
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  preferences: {
    notifications: boolean;
    newsletter: boolean;
    theme: 'light' | 'dark';
  };
  addresses: {
    id: string;
    type: 'home' | 'work' | 'other';
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }[];
}

interface UserState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface UserActions {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  addAddress: (address: Omit<UserProfile['addresses'][0], 'id'>) => void;
  setLoading: (loading: boolean) => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      login: async (email, password) => {
        set({ loading: true });
        // Mock authentication
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (email === 'user@demo.com' && password === 'demo') {
          const user: UserProfile = {
            id: 'user1',
            email: 'user@demo.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1 234 567 8900',
            preferences: {
              notifications: true,
              newsletter: true,
              theme: 'light',
            },
            addresses: [
              {
                id: 'addr1',
                type: 'home',
                name: 'Home Address',
                address: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zipCode: '94105',
                isDefault: true,
              },
            ],
          };
          
          set({ user, isAuthenticated: true, loading: false });
          return true;
        }
        
        set({ loading: false });
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      addAddress: (address) => {
        const { user } = get();
        if (user) {
          const newAddress = { ...address, id: Date.now().toString() };
          set({
            user: {
              ...user,
              addresses: [...user.addresses, newAddress],
            },
          });
        }
      },

      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'aura-user',
    }
  )
);
