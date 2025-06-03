
import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '../stores/wishlistStore';
import { Product } from '../stores/productStore';

interface WishlistButtonProps {
  product: Product;
  className?: string;
}

const WishlistButton = ({ product, className = '' }: WishlistButtonProps) => {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <button
      onClick={toggleWishlist}
      className={`p-2 rounded-full transition-colors ${
        inWishlist
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      } ${className}`}
    >
      <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
    </button>
  );
};

export default WishlistButton;
