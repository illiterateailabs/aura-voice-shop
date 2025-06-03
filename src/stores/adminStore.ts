
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager';
  lastLogin: Date;
}

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  recentOrders: any[];
  topProducts: any[];
  salesData: any[];
}

interface AdminState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  dashboardStats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

interface AdminActions {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchDashboardStats: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type AdminStore = AdminState & AdminActions;

const mockDashboardStats: DashboardStats = {
  totalProducts: 15,
  totalOrders: 1247,
  totalRevenue: 89450.75,
  totalCustomers: 3456,
  recentOrders: [
    { id: '1001', customer: 'John Doe', amount: 159.99, status: 'shipped', date: '2024-06-03' },
    { id: '1002', customer: 'Jane Smith', amount: 89.99, status: 'processing', date: '2024-06-03' },
    { id: '1003', customer: 'Bob Johnson', amount: 299.99, status: 'delivered', date: '2024-06-02' },
    { id: '1004', customer: 'Alice Brown', amount: 49.99, status: 'pending', date: '2024-06-02' },
    { id: '1005', customer: 'Charlie Wilson', amount: 199.99, status: 'shipped', date: '2024-06-01' },
  ],
  topProducts: [
    { name: 'Smartphone Pro Max', sales: 234, revenue: 233976.66 },
    { name: 'Wireless Bluetooth Headphones', sales: 189, revenue: 15118.11 },
    { name: 'Gaming Laptop Pro', sales: 67, revenue: 100499.33 },
    { name: 'Smart Watch Series X', sales: 156, revenue: 62398.44 },
    { name: 'Hiking Backpack Pro', sales: 89, revenue: 17799.11 },
  ],
  salesData: [
    { month: 'Jan', sales: 12500 },
    { month: 'Feb', sales: 15600 },
    { month: 'Mar', sales: 18900 },
    { month: 'Apr', sales: 22100 },
    { month: 'May', sales: 20800 },
    { month: 'Jun', sales: 25200 },
  ],
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      dashboardStats: null,
      loading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ loading: true, error: null });
        
        // Mock authentication - in real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (username === 'admin' && password === 'admin') {
          const user: AdminUser = {
            id: '1',
            username: 'admin',
            email: 'admin@aurashop.com',
            role: 'admin',
            lastLogin: new Date(),
          };
          
          set({ user, isAuthenticated: true, loading: false });
          return true;
        } else {
          set({ error: 'Invalid credentials', loading: false });
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, dashboardStats: null });
      },

      fetchDashboardStats: () => {
        set({ loading: true });
        // Mock API call
        setTimeout(() => {
          set({ dashboardStats: mockDashboardStats, loading: false });
        }, 500);
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'admin-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
