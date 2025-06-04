
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
  isNewArrival?: boolean;
  productType?: string;
  gender?: string;
  size?: string;
}

interface ProductState {
  products: Product[];
  filteredProducts: Product[];
  selectedProduct: Product | null;
  filters: ProductFilters;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
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
  applySort: (sortBy: string, order?: 'asc' | 'desc') => void;
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

// Complete mock product data with 15 essential items
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Apple AirPods Pro',
    price: 249.99,
    originalPrice: 279.99,
    description: 'Active Noise Cancellation wireless earbuds with spatial audio.',
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400',
    category: 'Electronics',
    brand: 'Apple',
    rating: 4.8,
    reviews: 15247,
    colors: ['White'],
    sizes: [],
    inStock: true,
    featured: true,
    stock: 156,
    sku: 'APP-001',
    tags: ['wireless', 'earbuds', 'noise-cancelling'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '2',
    name: 'iPhone 15 Pro',
    price: 999.99,
    description: 'Latest iPhone with titanium design and advanced camera system.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    category: 'Electronics',
    brand: 'Apple',
    rating: 4.9,
    reviews: 8956,
    colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
    sizes: ['128GB', '256GB', '512GB', '1TB'],
    inStock: true,
    featured: true,
    stock: 89,
    sku: 'IP15P-002',
    tags: ['smartphone', '5G', 'camera', 'titanium'],
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '3',
    name: 'MacBook Air M3',
    price: 1299.99,
    description: 'Ultra-thin laptop with M3 chip and all-day battery life.',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
    category: 'Electronics',
    brand: 'Apple',
    rating: 4.9,
    reviews: 3743,
    colors: ['Silver', 'Space Gray', 'Starlight', 'Midnight'],
    sizes: ['8GB RAM', '16GB RAM', '24GB RAM'],
    inStock: true,
    featured: true,
    stock: 43,
    sku: 'MBA-M3-003',
    tags: ['laptop', 'M3', 'ultrabook'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '4',
    name: 'Nike Air Force 1',
    price: 90.00,
    description: 'Classic basketball shoes that never go out of style.',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    category: 'Footwear',
    brand: 'Nike',
    rating: 4.7,
    reviews: 5621,
    colors: ['White', 'Black', 'Red'],
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
    inStock: true,
    featured: true,
    stock: 234,
    sku: 'AF1-004',
    tags: ['sneakers', 'basketball', 'classic'],
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '5',
    name: 'Levi\'s 501 Original Jeans',
    price: 59.99,
    originalPrice: 79.99,
    description: 'The original straight fit jeans since 1873.',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    category: 'Clothing',
    brand: 'Levi\'s',
    rating: 4.6,
    reviews: 2134,
    colors: ['Dark Blue', 'Light Blue', 'Black'],
    sizes: ['28', '30', '32', '34', '36', '38'],
    inStock: true,
    featured: false,
    stock: 167,
    sku: 'L501-005',
    tags: ['jeans', 'denim', 'classic'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '6',
    name: 'Sony WH-1000XM5',
    price: 399.99,
    description: 'Industry-leading noise canceling wireless headphones.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
    brand: 'Sony',
    rating: 4.8,
    reviews: 4567,
    colors: ['Black', 'Silver'],
    sizes: [],
    inStock: true,
    featured: true,
    stock: 78,
    sku: 'WH1000XM5-006',
    tags: ['headphones', 'noise-cancelling', 'wireless'],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '7',
    name: 'Adidas Ultraboost 22',
    price: 180.00,
    description: 'Premium running shoes with boost technology.',
    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400',
    category: 'Footwear',
    brand: 'Adidas',
    rating: 4.7,
    reviews: 3421,
    colors: ['White', 'Black', 'Blue', 'Pink'],
    sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11'],
    inStock: true,
    featured: false,
    stock: 156,
    sku: 'UB22-007',
    tags: ['running', 'boost', 'athletic'],
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '8',
    name: 'Ray-Ban Aviator Classic',
    price: 154.00,
    description: 'Iconic aviator sunglasses with crystal lenses.',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
    category: 'Accessories',
    brand: 'Ray-Ban',
    rating: 4.8,
    reviews: 6789,
    colors: ['Gold', 'Silver', 'Black'],
    sizes: ['Medium', 'Large'],
    inStock: true,
    featured: true,
    stock: 98,
    sku: 'RB-AV-008',
    tags: ['sunglasses', 'aviator', 'classic'],
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '9',
    name: 'Nintendo Switch OLED',
    price: 349.99,
    description: 'Handheld gaming console with vibrant OLED screen.',
    image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400',
    category: 'Electronics',
    brand: 'Nintendo',
    rating: 4.9,
    reviews: 5432,
    colors: ['Neon Blue/Red', 'White'],
    sizes: [],
    inStock: true,
    featured: true,
    stock: 67,
    sku: 'NSW-OLED-009',
    tags: ['gaming', 'console', 'portable'],
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '10',
    name: 'The North Face Puffer Jacket',
    price: 199.99,
    description: 'Warm and lightweight down jacket for outdoor adventures.',
    image: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400',
    category: 'Clothing',
    brand: 'The North Face',
    rating: 4.6,
    reviews: 2876,
    colors: ['Black', 'Navy', 'Red', 'Green'],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    inStock: true,
    featured: false,
    stock: 134,
    sku: 'TNF-PJ-010',
    tags: ['jacket', 'outdoor', 'winter'],
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '11',
    name: 'Apple Watch Series 9',
    price: 399.99,
    description: 'Advanced smartwatch with health monitoring and fitness tracking.',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
    category: 'Electronics',
    brand: 'Apple',
    rating: 4.8,
    reviews: 7654,
    colors: ['Silver', 'Gold', 'Space Gray'],
    sizes: ['41mm', '45mm'],
    inStock: true,
    featured: true,
    stock: 87,
    sku: 'AWS9-011',
    tags: ['smartwatch', 'fitness', 'health'],
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '12',
    name: 'Instant Pot Duo 7-in-1',
    price: 79.99,
    originalPrice: 99.99,
    description: 'Multi-use pressure cooker that replaces 7 kitchen appliances.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    category: 'Home & Kitchen',
    brand: 'Instant Pot',
    rating: 4.7,
    reviews: 12345,
    colors: ['Black', 'Silver'],
    sizes: ['6 Quart', '8 Quart'],
    inStock: true,
    featured: false,
    stock: 156,
    sku: 'IP-DUO-012',
    tags: ['kitchen', 'pressure-cooker', 'appliance'],
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '13',
    name: 'Dyson V15 Detect',
    price: 549.99,
    description: 'Cordless vacuum with laser dust detection technology.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    category: 'Home & Kitchen',
    brand: 'Dyson',
    rating: 4.8,
    reviews: 3987,
    colors: ['Yellow', 'Purple'],
    sizes: [],
    inStock: true,
    featured: true,
    stock: 45,
    sku: 'DV15-013',
    tags: ['vacuum', 'cordless', 'cleaning'],
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '14',
    name: 'Samsung 65" 4K Smart TV',
    price: 899.99,
    originalPrice: 1199.99,
    description: 'Ultra HD Smart TV with HDR and built-in streaming apps.',
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    category: 'Electronics',
    brand: 'Samsung',
    rating: 4.6,
    reviews: 2156,
    colors: ['Black'],
    sizes: ['55"', '65"', '75"'],
    inStock: true,
    featured: true,
    stock: 23,
    sku: 'SAM-TV65-014',
    tags: ['TV', '4K', 'smart-tv'],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: '15',
    name: 'YETI Rambler Tumbler',
    price: 35.00,
    description: 'Insulated stainless steel tumbler that keeps drinks hot or cold.',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
    category: 'Accessories',
    brand: 'YETI',
    rating: 4.9,
    reviews: 8765,
    colors: ['Black', 'White', 'Navy', 'Pink', 'Seafoam'],
    sizes: ['20oz', '30oz'],
    inStock: true,
    featured: false,
    stock: 345,
    sku: 'YR-TUM-015',
    tags: ['tumbler', 'insulated', 'drinkware'],
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-06-01'),
  },
];

export const useProductStore = create<ProductStore>((set, get) => ({
  products: mockProducts,
  filteredProducts: mockProducts,
  selectedProduct: null,
  filters: {},
  sortBy: null,
  sortOrder: 'asc',
  loading: false,
  error: null,
  categories: Array.from(new Set(mockProducts.map(p => p.category))),
  brands: Array.from(new Set(mockProducts.map(p => p.brand))),

  setProducts: (products) => {
    set({ products, filteredProducts: products });
  },

  setSelectedProduct: (product) => {
    set({ selectedProduct: product });
  },

  setFilters: (filters) => {
    const newFilters = { ...get().filters, ...filters };
    set({ filters: newFilters });
    get().filterProducts();
  },

  searchProducts: (query) => {
    const { products } = get();
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.brand.toLowerCase().includes(query.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
    set({ filteredProducts: filtered, filters: { ...get().filters, search: query } });
  },

  filterProducts: () => {
    const { products, filters } = get();
    let filtered = [...products];

    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    if (filters.brand) {
      filtered = filtered.filter(product => product.brand === filters.brand);
    }

    if (filters.color) {
      filtered = filtered.filter(product => 
        product.colors.some(color => color.toLowerCase().includes(filters.color!.toLowerCase()))
      );
    }

    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.priceMin!);
    }

    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.priceMax!);
    }

    if (filters.inStock !== undefined) {
      filtered = filtered.filter(product => product.inStock === filters.inStock);
    }

    if (filters.search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.search!.toLowerCase()) ||
        product.brand.toLowerCase().includes(filters.search!.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(filters.search!.toLowerCase()))
      );
    }

    if (filters.isNewArrival) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      filtered = filtered.filter(product => product.createdAt > oneMonthAgo);
    }

    if (filters.size) {
      filtered = filtered.filter(product => 
        product.sizes.some(size => size.toLowerCase().includes(filters.size!.toLowerCase()))
      );
    }

    // Apply sorting if set
    const { sortBy, sortOrder } = get();
    if (sortBy) {
      filtered = get().applySortToArray(filtered, sortBy, sortOrder);
    }

    set({ filteredProducts: filtered });
  },

  applySort: (sortBy, order = 'asc') => {
    const { filteredProducts } = get();
    const sortedProducts = get().applySortToArray([...filteredProducts], sortBy, order);
    set({ 
      filteredProducts: sortedProducts, 
      sortBy, 
      sortOrder: order 
    });
  },

  applySortToArray: (products, sortBy, order) => {
    return products.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'price':
        case 'price_low_to_high':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'price_high_to_low':
          aValue = a.price;
          bValue = b.price;
          order = 'desc'; // Override for this specific case
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'reviews':
          aValue = a.reviews;
          bValue = b.reviews;
          break;
        case 'newest':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          order = 'desc'; // Newest first
          break;
        case 'oldest':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          order = 'asc'; // Oldest first
          break;
        default:
          return 0;
      }

      if (order === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  getProductById: (id) => {
    return get().products.find(product => product.id === id);
  },

  addProduct: (productData) => {
    const newProduct: Product = {
      ...productData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const { products } = get();
    const updatedProducts = [...products, newProduct];
    
    set({ 
      products: updatedProducts,
      filteredProducts: updatedProducts,
      categories: Array.from(new Set(updatedProducts.map(p => p.category))),
      brands: Array.from(new Set(updatedProducts.map(p => p.brand)))
    });
  },

  updateProduct: (id, updates) => {
    const { products } = get();
    const updatedProducts = products.map(product =>
      product.id === id
        ? { ...product, ...updates, updatedAt: new Date() }
        : product
    );
    
    set({ 
      products: updatedProducts,
      filteredProducts: updatedProducts,
      categories: Array.from(new Set(updatedProducts.map(p => p.category))),
      brands: Array.from(new Set(updatedProducts.map(p => p.brand)))
    });
  },

  deleteProduct: (id) => {
    const { products } = get();
    const updatedProducts = products.filter(product => product.id !== id);
    
    set({ 
      products: updatedProducts,
      filteredProducts: updatedProducts,
      categories: Array.from(new Set(updatedProducts.map(p => p.category))),
      brands: Array.from(new Set(updatedProducts.map(p => p.brand)))
    });
  },

  getCategories: () => get().categories,

  getBrands: () => get().brands,
}));
