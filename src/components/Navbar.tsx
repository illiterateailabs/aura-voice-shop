
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useVoiceStore } from '../stores/voiceStore';

const Navbar = () => {
  const { getItemCount, toggleCart } = useCartStore();
  const { isListening, isConnected } = useVoiceStore();
  const location = useLocation();
  const itemCount = getItemCount();

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Aura Shop</span>
          </Link>

          {/* Voice Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-100">
              <div className={`w-3 h-3 rounded-full transition-colors ${
                isListening ? 'bg-red-500 animate-pulse' : 
                isConnected ? 'bg-green-500' : 'bg-gray-400'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {isListening ? 'Listening' : isConnected ? 'Voice Ready' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className={`transition-colors ${
                isActiveRoute('/') 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/products" 
              className={`transition-colors ${
                isActiveRoute('/products') 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Products
            </Link>
            <Link 
              to="/cart" 
              className={`transition-colors ${
                isActiveRoute('/cart') 
                  ? 'text-purple-600 font-medium' 
                  : 'text-gray-700 hover:text-purple-600'
              }`}
            >
              Cart
            </Link>
          </div>

          {/* Cart Button */}
          <button
            onClick={toggleCart}
            className="relative p-2 text-gray-700 hover:text-purple-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 8H19"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
