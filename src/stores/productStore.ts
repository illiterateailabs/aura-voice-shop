
import { create } from 'zustand';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  image: string;
  category: string;
  brand: string;
  rating: number;
  reviews: number;
  colors: string[];
  sizes: string[];
  inStock: boolean;
  featured: boolean;
}

export interface ProductFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  color?: string;
  inStock?: boolean;
  search?: string;
}

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  selectedProduct: Product | null;
  filters: ProductFilters;
  loading: boolean;
  error: string | null;
}

interface ProductActions {
  setProducts: (products: Product[]) => void;
  setSelectedProduct: (product: Product | null) => void;
  setFilters: (filters: ProductFilters) => void;
  searchProducts: (query: string) => void;
  filterProducts: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getProductById: (id: string) => Product | undefined;
}

type ProductStore = ProductState & ProductActions;

// Mock product data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 79.99,
    originalPrice: 99.99,
    description: 'Premium wireless headphones with noise cancellation and 30-hour battery life.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
    brand: 'AudioTech',
    rating: 4.8,
    reviews: 1247,
    colors: ['Black', 'White', 'Blue'],
    sizes: [],
    inStock: true,
    featured: true,
  },
  {
    id: '2',
    name: 'Smartphone Pro Max',
    price: 999.99,
    description: 'Latest flagship smartphone with advanced camera system and 5G connectivity.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    category: 'Electronics',
    brand: 'TechCorp',
    rating: 4.9,
    reviews: 2156,
    colors: ['Midnight', 'Silver', 'Gold'],
    sizes: ['128GB', '256GB', '512GB'],
    inStock: true,
    featured: true,
  },
  {
    id: '3',
    name: 'Running Shoes Ultra',
    price: 129.99,
    originalPrice: 159.99,
    description: 'Professional running shoes with advanced cushioning and breathable mesh.',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    category: 'Clothing',
    brand: 'SportMax',
    rating: 4.7,
    reviews: 892,
    colors: ['Red', 'Black', 'White', 'Blue'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    inStock: true,
    featured: false,
  },
  {
    id: '4',
    name: 'Smart Watch Series X',
    price: 399.99,
    description: 'Advanced smartwatch with health monitoring, GPS, and cellular connectivity.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    category: 'Electronics',
    brand: 'WatchTech',
    rating: 4.6,
    reviews: 1543,
    colors: ['Space Gray', 'Silver', 'Gold'],
    sizes: ['40mm', '44mm'],
    inStock: true,
    featured: true,
  },
  {
    id: '5',
    name: 'Designer Leather Jacket',
    price: 299.99,
    originalPrice: 399.99,
    description: 'Premium leather jacket with modern fit and classic styling.',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    category: 'Clothing',
    brand: 'FashionHouse',
    rating: 4.8,
    reviews: 456,
    colors: ['Black', 'Brown'],
    sizes: ['S', 'M', 'L', 'XL'],
    inStock: true,
    featured: false,
  },
  {
    id: '6',
    name: 'Gaming Laptop Pro',
    price: 1499.99,
    description: 'High-performance gaming laptop with RTX graphics and RGB keyboard.',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
    category: 'Electronics',
    brand: 'GameTech',
    rating: 4.9,
    reviews: 743,
    colors: ['Black'],
    sizes: ['16GB RAM', '32GB RAM'],
    inStock: true,
    featured: true,
  },
];

const initialState: ProductState = {
  products: mockProducts,
  filteredProducts: mockProducts,
  selectedProduct: null,
  filters: {},
  loading: false,
  error: null,
};

export const useProductStore = create<ProductStore>((set, get) => ({
  ...initialState,
  
  setProducts: (products) => set({ products, filteredProducts: products }),
  
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  
  setFilters: (filters) => {
    set({ filters });
    get().filterProducts();
  },
  
  searchProducts: (query) => {
    const filters = { ...get().filters, search: query };
    set({ filters });
    get().filterProducts();
  },
  
  filterProducts: () => {
    const { products, filters } = get();
    let filtered = [...products];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.category) {
      filtered = filtered.filter(
        (product) => product.category.toLowerCase() === filters.category?.toLowerCase()
      );
    }
    
    if (filters.brand) {
      filtered = filtered.filter(
        (product) => product.brand.toLowerCase() === filters.brand?.toLowerCase()
      );
    }
    
    if (filters.color) {
      filtered = filtered.filter((product) =>
        product.colors.some((color) => color.toLowerCase() === filters.color?.toLowerCase())
      );
    }
    
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter((product) => product.price >= filters.priceMin!);
    }
    
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter((product) => product.price <= filters.priceMax!);
    }
    
    if (filters.inStock) {
      filtered = filtered.filter((product) => product.inStock);
    }
    
    set({ filteredProducts: filtered });
  },
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  getProductById: (id) => get().products.find((product) => product.id === id),
}));
