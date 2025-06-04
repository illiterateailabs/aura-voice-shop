import React from 'react';
import { Link } from 'react-router-dom';
import VoiceInputManager from '../components/VoiceInputManager';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8">
          Welcome to Aura Voice Shop
        </h1>
        <p className="text-lg text-gray-600 mb-12">
          Experience the future of shopping with voice commands.
        </p>
        <div className="space-x-4">
          <Link
            to="/products"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-300"
          >
            Start Shopping
          </Link>
          <Link
            to="/cart"
            className="bg-white hover:bg-gray-100 text-purple-800 font-bold py-3 px-6 rounded-full transition-colors duration-300 border border-purple-600"
          >
            View Cart
          </Link>
        </div>
      </div>
      <VoiceInputManager />
    </div>
  );
};

export default Index;
