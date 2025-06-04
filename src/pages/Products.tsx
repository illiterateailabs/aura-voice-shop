import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProductStore } from '../stores/productStore';
import { Star, ShoppingCart, Search, ArrowLeft, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import WishlistButton from '../components/WishlistButton';
import { useCartStore } from '../stores/cartStore';
import { Button } from '../components/ui/button';
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import VoiceInputManager from '../components/VoiceInputManager';

const Products = () => {
  const navigate = useNavigate();
  const {
    products,
    filteredProducts,
    setFilters,
    searchProducts,
    filterProducts,
    applySort,
    loading,
    error,
    categories,
    brands,
    getProductById
  } = useProductStore();
  const { addItem } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedBrand, setSelectedBrand] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState<{ min: number | undefined; max: number | undefined }>({
    min: undefined,
    max: undefined,
  });
  const [sortOption, setSortOption] = useState<string | undefined>(undefined);

  useEffect(() => {
    filterProducts();
  }, [products, setFilters, filterProducts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchProducts(searchTerm);
  };

  const handleCategoryChange = (category: string | undefined) => {
    setSelectedCategory(category);
    setFilters({ category });
  };

  const handleBrandChange = (brand: string | undefined) => {
    setSelectedBrand(brand);
    setFilters({ brand });
  };

  const handlePriceMinChange = (min: number | undefined) => {
    setPriceRange(prev => ({ ...prev, min }));
  };

  const handlePriceMaxChange = (max: number | undefined) => {
    setPriceRange(prev => ({ ...prev, max }));
  };

  const handleApplyPriceRange = () => {
    setFilters({ priceMin: priceRange.min, priceMax: priceRange.max });
  };

  const handleSortChange = (sortBy: string) => {
    setSortOption(sortBy);
    applySort(sortBy);
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedBrand(undefined);
    setPriceRange({ min: undefined, max: undefined });
    setSearchTerm('');
    setSortOption(undefined);
    setFilters({});
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 text-yellow-400 fill-current opacity-50" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  const handleAddToCart = (product: any) => {
    addItem(product);
  };

  const handleCompare = (product: any) => {
    const existingProducts = new URLSearchParams(window.location.search).get('products')?.split(',') || [];
    const productIds = Array.from(new Set([...existingProducts, product.id])).filter(Boolean);

    if (productIds.length > 4) {
      alert('You can only compare up to 4 products.');
      return;
    }

    navigate(`/compare?products=${productIds.join(',')}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Products...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error: {error}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-purple-600 hover:text-purple-700"
          >
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-8">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Category</h2>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                    <SelectItem value={undefined}>All Categories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Filter */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand</h2>
                <Select value={selectedBrand} onValueChange={handleBrandChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                     <SelectItem value={undefined}>All Brands</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Range</h2>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min === undefined ? '' : priceRange.min.toString()}
                    onChange={(e) => handlePriceMinChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-1/2 rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max === undefined ? '' : priceRange.max.toString()}
                    onChange={(e) => handlePriceMaxChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-1/2 rounded-lg border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <Button onClick={handleApplyPriceRange} className="w-full mt-2">Apply Price Range</Button>
              </div>
            </div>

            {/* Clear Filters Button */}
            <Button variant="outline" onClick={clearFilters} className="mt-6">Clear Filters</Button>
          </div>
        )}

        {/* Sorting */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {filteredProducts.length} Products
          </p>
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price_low_to_high">Price: Low to High</SelectItem>
              <SelectItem value="price_high_to_low">Price: High to Low</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Link to={`/product/${product.id}`}>
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                </div>
              </Link>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-600">{product.brand}</span>
                  <WishlistButton product={product} />
                </div>
                <Link to={`/product/${product.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-purple-600 transition-colors duration-200">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.rating} ({product.reviews} reviews)
                  </span>
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => handleAddToCart(product)}
                    className="w-1/2 bg-purple-600 hover:bg-purple-700"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Cart
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCompare(product)}
                    className="w-1/2"
                  >
                    Compare
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <VoiceInputManager />
    </div>
  );
};

export default Products;
