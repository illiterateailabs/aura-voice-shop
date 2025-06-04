
import React from 'react';
import { X, Heart, ShoppingCart } from 'lucide-react';
import { useWishlistStore } from '../stores/wishlistStore';
import { useCartStore } from '../stores/cartStore';

const WishlistView = () => {
  const { items, isOpen, toggleWishlist, removeItem } = useWishlistStore();
  const { addItem } = useCartStore();

  if (!isOpen) return null;

  const handleAddToCart = (product: any) => {
    addItem(product);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">My Wishlist</h2>
          <button
            onClick={toggleWishlist}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-96">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your wishlist is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((product) => (
                <div key={product.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-purple-600 font-semibold">${product.price}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WishlistView;
