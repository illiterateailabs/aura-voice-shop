
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Star, ShoppingCart } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { Button } from '../components/ui/button';

const ProductCompare = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getProductById } = useProductStore();
  const { addItem } = useCartStore();
  const [compareProducts, setCompareProducts] = useState<any[]>([]);

  useEffect(() => {
    const productIds = searchParams.get('products')?.split(',') || [];
    const products = productIds.map(id => getProductById(id)).filter(Boolean);
    setCompareProducts(products);
  }, [searchParams, getProductById]);

  const removeProduct = (productId: string) => {
    const updatedIds = compareProducts
      .filter(p => p.id !== productId)
      .map(p => p.id);
    
    if (updatedIds.length === 0) {
      navigate('/products');
    } else {
      navigate(`/compare?products=${updatedIds.join(',')}`);
    }
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

  if (compareProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Products to Compare</h1>
          <Button onClick={() => navigate('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
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
          <div>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center text-purple-600 hover:text-purple-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Compare Products</h1>
            <p className="text-gray-600 mt-2">Comparing {compareProducts.length} products</p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Product Images & Names */}
              <thead>
                <tr className="border-b">
                  <th className="text-left p-6 font-medium text-gray-900 w-48">Product</th>
                  {compareProducts.map((product) => (
                    <th key={product.id} className="p-6 text-center min-w-64">
                      <div className="relative">
                        <button
                          onClick={() => removeProduct(product.id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                        <p className="text-sm text-gray-600">{product.brand}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Price */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-6 font-medium text-gray-900">Price</td>
                  {compareProducts.map((product) => (
                    <td key={product.id} className="p-6 text-center">
                      <div className="space-y-1">
                        <div className="text-xl font-bold text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.originalPrice && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(product.originalPrice)}
                          </div>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Rating */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-6 font-medium text-gray-900">Rating</td>
                  {compareProducts.map((product) => (
                    <td key={product.id} className="p-6 text-center">
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        {renderStars(product.rating)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {product.rating} ({product.reviews} reviews)
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-6 font-medium text-gray-900">Category</td>
                  {compareProducts.map((product) => (
                    <td key={product.id} className="p-6 text-center">
                      <span className="bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded-full">
                        {product.category}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Colors */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-6 font-medium text-gray-900">Colors</td>
                  {compareProducts.map((product) => (
                    <td key={product.id} className="p-6 text-center">
                      {product.colors.length > 0 ? (
                        <div className="flex justify-center space-x-1">
                          {product.colors.slice(0, 4).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{
                                backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' :
                                               color.toLowerCase() === 'black' ? '#000000' :
                                               color.toLowerCase() === 'red' ? '#ef4444' :
                                               color.toLowerCase() === 'blue' ? '#3b82f6' :
                                               color.toLowerCase() === 'green' ? '#10b981' :
                                               color.toLowerCase() === 'yellow' ? '#f59e0b' :
                                               color.toLowerCase() === 'purple' ? '#8b5cf6' :
                                               color.toLowerCase() === 'gray' ? '#6b7280' :
                                               '#9ca3af'
                              }}
                              title={color}
                            />
                          ))}
                          {product.colors.length > 4 && (
                            <span className="text-xs text-gray-500">+{product.colors.length - 4}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Stock */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-6 font-medium text-gray-900">Availability</td>
                  {compareProducts.map((product) => (
                    <td key={product.id} className="p-6 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">
                          {product.inStock ? `${product.stock} in stock` : 'Out of stock'}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="p-6 font-medium text-gray-900">Actions</td>
                  {compareProducts.map((product) => (
                    <td key={product.id} className="p-6 text-center">
                      <div className="space-y-2">
                        <Button
                          onClick={() => addItem(product)}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={!product.inStock}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="w-full"
                        >
                          View Details
                        </Button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCompare;
