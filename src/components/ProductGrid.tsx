
import React, { useEffect } from 'react';
import { useProductStore } from '../stores/productStore';
import ProductCard from './ProductCard';

const ProductGrid = () => {
  const { filteredProducts, filters, loading, error } = useProductStore();

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {filters.search ? `Search: "${filters.search}"` : 
             filters.category ? `${filters.category}` : 
             'Featured Products'}
          </h2>
          <p className="text-gray-600 mt-2">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && (
        <>
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
              <p className="text-sm text-purple-600">
                💡 Try saying: "Show me all products" or "Search for electronics"
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductGrid;
