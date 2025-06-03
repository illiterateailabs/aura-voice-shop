
import React from 'react';
import Navbar from '../components/Navbar';
import ProductGrid from '../components/ProductGrid';
import VoiceInputManager from '../components/VoiceInputManager';
import VoiceFeedback from '../components/VoiceFeedback';
import { useVoiceStore } from '../stores/voiceStore';

const Products = () => {
  const { isListening } = useVoiceStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              All Products
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Discover our complete collection
            </p>
            <div className="flex justify-center items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span className="text-sm text-gray-600">
                {isListening ? 'Listening for commands...' : 'Say "search for [product]" or "filter by [category]"'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductGrid />
      </div>

      {/* Voice Components */}
      <VoiceInputManager />
      <VoiceFeedback />
    </div>
  );
};

export default Products;
