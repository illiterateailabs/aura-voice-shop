
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from './cartStore';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  paymentMethod: string;
  trackingNumber?: string;
  date: Date;
  estimatedDelivery?: Date;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
}

interface OrderActions {
  createOrder: (items: CartItem[], shippingAddress: Order['shippingAddress'], paymentMethod: string) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  getOrderById: (orderId: string) => Order | undefined;
  setCurrentOrder: (order: Order | null) => void;
  setLoading: (loading: boolean) => void;
}

type OrderStore = OrderState & OrderActions;

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      currentOrder: null,
      loading: false,

      createOrder: (items, shippingAddress, paymentMethod) => {
        const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const newOrder: Order = {
          id: `ORD-${Date.now()}`,
          items,
          total,
          status: 'pending',
          shippingAddress,
          paymentMethod,
          date: new Date(),
          estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        };
        
        set((state) => ({ 
          orders: [...state.orders, newOrder],
          currentOrder: newOrder 
        }));
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map(order =>
            order.id === orderId ? { ...order, status } : order
          ),
        }));
      },

      getOrderById: (orderId) => {
        const { orders } = get();
        return orders.find(order => order.id === orderId);
      },

      setCurrentOrder: (order) => set({ currentOrder: order }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'aura-orders',
    }
  )
);
