
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
  stock: number;
  sku: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
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
  categories: string[];
  brands: string[];
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
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getCategories: () => string[];
  getBrands: () => string[];
}

type ProductStore = ProductState & ProductActions;

// Expanded mock product data
const mockProducts: Product[] = [
  // Electronics
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
    stock: 156,
    sku: 'AT-WBH-001',
    tags: ['wireless', 'headphones', 'noise-cancelling'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
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
    stock: 89,
    sku: 'TC-SPM-002',
    tags: ['smartphone', '5G', 'camera'],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '3',
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
    stock: 23,
    sku: 'GT-GLP-003',
    tags: ['gaming', 'laptop', 'RTX'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-06-01'),
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
    stock: 234,
    sku: 'WT-SWX-004',
    tags: ['smartwatch', 'health', 'GPS'],
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-06-01'),
  },
  // Clothing
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
    stock: 67,
    sku: 'FH-DLJ-005',
    tags: ['leather', 'jacket', 'designer'],
    createdAt: new Date('2024-02-14'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '6',
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
    stock: 145,
    sku: 'SM-RSU-006',
    tags: ['running', 'shoes', 'sports'],
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '7',
    name: 'Cotton T-Shirt Premium',
    price: 24.99,
    description: 'Soft organic cotton t-shirt with perfect fit and lasting comfort.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    category: 'Clothing',
    brand: 'EcoWear',
    rating: 4.5,
    reviews: 634,
    colors: ['White', 'Black', 'Gray', 'Navy', 'Red'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    featured: false,
    stock: 289,
    sku: 'EW-CTP-007',
    tags: ['cotton', 'tshirt', 'organic'],
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '8',
    name: 'Denim Jeans Classic',
    price: 89.99,
    originalPrice: 119.99,
    description: 'Classic fit denim jeans made from premium sustainable cotton.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    category: 'Clothing',
    brand: 'DenimCo',
    rating: 4.6,
    reviews: 1123,
    colors: ['Blue', 'Black', 'Light Blue'],
    sizes: ['28', '30', '32', '34', '36', '38'],
    inStock: true,
    featured: false,
    stock: 178,
    sku: 'DC-DJC-008',
    tags: ['denim', 'jeans', 'classic'],
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-06-01'),
  },
  // Home & Garden
  {
    id: '9',
    name: 'Modern Coffee Maker',
    price: 159.99,
    description: 'Programmable coffee maker with thermal carafe and auto-shut off.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    category: 'Home & Garden',
    brand: 'BrewMaster',
    rating: 4.4,
    reviews: 567,
    colors: ['Black', 'Steel'],
    sizes: ['12-cup'],
    inStock: true,
    featured: false,
    stock: 45,
    sku: 'BM-MCM-009',
    tags: ['coffee', 'kitchen', 'appliance'],
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '10',
    name: 'Indoor Plant Set',
    price: 49.99,
    description: 'Collection of 3 air-purifying plants perfect for home or office.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
    category: 'Home & Garden',
    brand: 'GreenLife',
    rating: 4.7,
    reviews: 234,
    colors: ['Green'],
    sizes: ['Small', 'Medium'],
    inStock: true,
    featured: false,
    stock: 78,
    sku: 'GL-IPS-010',
    tags: ['plants', 'indoor', 'air-purifying'],
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-06-01'),
  },
  // Books
  {
    id: '11',
    name: 'JavaScript: The Complete Guide',
    price: 39.99,
    description: 'Comprehensive guide to modern JavaScript development and best practices.',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    category: 'Books',
    brand: 'TechBooks',
    rating: 4.8,
    reviews: 891,
    colors: [],
    sizes: ['Paperback', 'Hardcover', 'eBook'],
    inStock: true,
    featured: false,
    stock: 167,
    sku: 'TB-JSCG-011',
    tags: ['javascript', 'programming', 'guide'],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '12',
    name: 'Mindfulness and Meditation',
    price: 24.99,
    description: 'A practical guide to mindfulness and meditation for modern life.',
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    category: 'Books',
    brand: 'WellnessPress',
    rating: 4.6,
    reviews: 445,
    colors: [],
    sizes: ['Paperback', 'Hardcover'],
    inStock: true,
    featured: false,
    stock: 234,
    sku: 'WP-MAM-012',
    tags: ['mindfulness', 'meditation', 'wellness'],
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-06-01'),
  },
  // Sports & Outdoors
  {
    id: '13',
    name: 'Hiking Backpack Pro',
    price: 199.99,
    description: '45L hiking backpack with hydration system and weather protection.',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    category: 'Sports & Outdoors',
    brand: 'TrailGear',
    rating: 4.9,
    reviews: 312,
    colors: ['Green', 'Blue', 'Gray'],
    sizes: ['45L'],
    inStock: true,
    featured: true,
    stock: 56,
    sku: 'TG-HBP-013',
    tags: ['hiking', 'backpack', 'outdoor'],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '14',
    name: 'Yoga Mat Premium',
    price: 79.99,
    description: 'Non-slip yoga mat with extra cushioning and eco-friendly materials.',
    image: 'https://images.unsplash.com/photo-1506629905607-bb5bd19c72a5?w=400',
    category: 'Sports & Outdoors',
    brand: 'ZenFit',
    rating: 4.7,
    reviews: 578,
    colors: ['Purple', 'Blue', 'Pink', 'Black'],
    sizes: ['6mm'],
    inStock: true,
    featured: false,
    stock: 123,
    sku: 'ZF-YMP-014',
    tags: ['yoga', 'mat', 'fitness'],
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-06-01'),
  },
  // Beauty & Personal Care
  {
    id: '15',
    name: 'Skincare Essentials Kit',
    price: 89.99,
    originalPrice: 129.99,
    description: 'Complete skincare routine with cleanser, moisturizer, and serum.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    category: 'Beauty & Personal Care',
    brand: 'GlowUp',
    rating: 4.8,
    reviews: 723,
    colors: [],
    sizes: ['Travel Size', 'Full Size'],
    inStock: true,
    featured: true,
    stock: 89,
    sku: 'GU-SEK-015',
    tags: ['skincare', 'beauty', 'essentials'],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-06-01'),
  }
];

const initialState: ProductState = {
  products: mockProducts,
  filteredProducts: mockProducts,
  selectedProduct: null,
  filters: {},
  loading: false,
  error: null,
  categories: ['Electronics', 'Clothing', 'Home & Garden', 'Books', 'Sports & Outdoors', 'Beauty & Personal Care'],
  brands: ['AudioTech', 'TechCorp', 'GameTech', 'WatchTech', 'FashionHouse', 'SportMax', 'EcoWear', 'DenimCo', 'BrewMaster', 'GreenLife', 'TechBooks', 'WellnessPress', 'TrailGear', 'ZenFit', 'GlowUp'],
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
          product.category.toLowerCase().includes(searchLower) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchLower))
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
  
  addProduct: (productData) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const products = [...get().products, newProduct];
    set({ products });
    get().filterProducts();
  },
  
  updateProduct: (id, updates) => {
    const products = get().products.map(product => 
      product.id === id 
        ? { ...product, ...updates, updatedAt: new Date() }
        : product
    );
    set({ products });
    get().filterProducts();
  },
  
  deleteProduct: (id) => {
    const products = get().products.filter(product => product.id !== id);
    set({ products });
    get().filterProducts();
  },
  
  getCategories: () => get().categories,
  getBrands: () => get().brands,
}));
