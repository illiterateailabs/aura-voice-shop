
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import VoiceInputManager from '../components/VoiceInputManager';
import ProductGrid from '../components/ProductGrid';
import VoiceFeedback from '../components/VoiceFeedback';
import { useVoiceStore } from '../stores/voiceStore';

const Index = () => {
  const { isListening } = useVoiceStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
              Aura Shop
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 animate-fade-in">
              Voice-Powered Shopping Experience
            </p>
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className={`w-4 h-4 rounded-full ${isListening ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></div>
              <span className="text-lg">
                {isListening ? 'Listening...' : 'Ready for voice commands'}
              </span>
            </div>
            
            {/* Enhanced Voice Commands */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">🛍️ Shopping Commands</h3>
                <div className="text-sm space-y-1 opacity-80">
                  <div>"Search for wireless headphones"</div>
                  <div>"Show me electronics"</div>
                  <div>"Add first item to cart"</div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <h3 className="font-semibold mb-2">🧭 Navigation Commands</h3>
                <div className="text-sm space-y-1 opacity-80">
                  <div>"Go to products"</div>
                  <div>"Show cart"</div>
                  <div>"Go home"</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Link 
                to="/products"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Browse Products
              </Link>
              <Link 
                to="/cart"
                className="bg-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-400 transition-colors"
              >
                View Cart
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12 fill-purple-50">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
          <p className="text-lg text-gray-600">
            Explore our hand-picked selection or use voice commands to find exactly what you need
          </p>
        </div>
        <ProductGrid />
      </div>

      {/* Voice Components */}
      <VoiceInputManager />
      <VoiceFeedback />
    </div>
  );
};

export default Index;
