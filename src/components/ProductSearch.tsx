
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useProductStore } from '../stores/productStore';

const ProductSearch = () => {
  const { filters, setFilters, searchProducts, categories, brands } = useProductStore();
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchProducts(searchQuery);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <select
              value={filters.brand || ''}
              onChange={(e) => setFilters({ ...filters, brand: e.target.value || undefined })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
            <input
              type="number"
              placeholder="Max price"
              value={filters.priceMax || ''}
              onChange={(e) => setFilters({ ...filters, priceMax: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(filters.category || filters.brand || filters.priceMax || filters.search) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.search && (
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              Search: {filters.search}
            </span>
          )}
          {filters.category && (
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              Category: {filters.category}
            </span>
          )}
          {filters.brand && (
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Brand: {filters.brand}
            </span>
          )}
          {filters.priceMax && (
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
              Max: ${filters.priceMax}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
