
import React from 'react';
import { X, ShoppingCart, Heart } from 'lucide-react';
import { Product } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addItem } = useCartStore();

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    addItem(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Quick View</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">{product.brand}</p>
                <h3 className="text-2xl font-bold">{product.name}</h3>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-purple-600">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-500 line-through">${product.originalPrice}</span>
                )}
              </div>
              
              <p className="text-gray-600">{product.description}</p>
              
              {product.colors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Colors</h4>
                  <div className="flex space-x-2">
                    {product.colors.map((color) => (
                      <div
                        key={color}
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
