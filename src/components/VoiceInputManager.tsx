
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceStore } from '../stores/voiceStore';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';

interface VoiceCommand {
  intent: string;
  entities: {
    query?: string;
    category?: string;
    item_identifier?: string;
    filter_type?: string;
    filter_value?: string | number;
    price_max?: number;
    route?: string;
  };
  final_transcript: string;
  confirmation_speech: string;
}

const VoiceInputManager = () => {
  const navigate = useNavigate();
  const {
    isListening,
    setListening,
    setProcessing,
    setTranscript,
    setError,
    setConnected,
    setAudioLevel,
    setCurrentIntent,
    setLastCommand
  } = useVoiceStore();
  
  const { searchProducts, setFilters, filteredProducts } = useProductStore();
  const { addItem, setCartOpen, clearCart } = useCartStore();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize audio
  useEffect(() => {
    initializeAudio();
    return () => cleanup();
  }, []);

  const initializeAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      streamRef.current = stream;
      
      // Create audio context for level monitoring
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      // Monitor audio levels
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAudioLevel = () => {
        if (!isInitialized) return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average / 255);
        requestAnimationFrame(updateAudioLevel);
      };
      updateAudioLevel();
      
      setConnected(true);
      setIsInitialized(true);
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setError('Microphone access denied. Please enable microphone permissions.');
      setConnected(false);
    }
  };

  const cleanup = () => {
    setIsInitialized(false);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
  };

  const startListening = async () => {
    if (!streamRef.current || !isInitialized) {
      await initializeAudio();
      return;
    }

    try {
      setListening(true);
      setError(null);
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        await processAudio(audioBlob);
      };
      
      mediaRecorder.start();
      
      // Auto-stop after 5 seconds for demo purposes
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setListening(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError('Failed to start voice recording');
      setListening(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setListening(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setProcessing(true);
    
    try {
      await simulateVoiceProcessing(audioBlob);
    } catch (error) {
      console.error('Voice processing failed:', error);
      setError('Failed to process voice command');
    } finally {
      setProcessing(false);
    }
  };

  const simulateVoiceProcessing = async (audioBlob: Blob) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Enhanced demo commands including navigation
    const demoCommands = [
      {
        intent: 'navigate',
        entities: { route: 'home' },
        final_transcript: 'Go home',
        confirmation_speech: 'Going to homepage'
      },
      {
        intent: 'navigate',
        entities: { route: 'products' },
        final_transcript: 'Show products',
        confirmation_speech: 'Showing all products'
      },
      {
        intent: 'navigate',
        entities: { route: 'cart' },
        final_transcript: 'Show cart',
        confirmation_speech: 'Opening your cart'
      },
      {
        intent: 'search',
        entities: { query: 'wireless headphones' },
        final_transcript: 'Search for wireless headphones',
        confirmation_speech: 'Searching for wireless headphones'
      },
      {
        intent: 'filter',
        entities: { category: 'electronics' },
        final_transcript: 'Show me electronics',
        confirmation_speech: 'Filtering by electronics'
      },
      {
        intent: 'cart_add_item',
        entities: { item_identifier: 'first' },
        final_transcript: 'Add first item to cart',
        confirmation_speech: 'Added first item to cart'
      },
      {
        intent: 'cart_clear',
        entities: {},
        final_transcript: 'Clear cart',
        confirmation_speech: 'Cart cleared'
      }
    ];
    
    const randomCommand = demoCommands[Math.floor(Math.random() * demoCommands.length)];
    await executeVoiceCommand(randomCommand);
  };

  const executeVoiceCommand = async (command: VoiceCommand) => {
    setTranscript(command.final_transcript);
    setCurrentIntent(command.intent);
    setLastCommand(command.confirmation_speech);
    
    try {
      switch (command.intent) {
        case 'navigate':
          if (command.entities.route === 'home') {
            navigate('/');
          } else if (command.entities.route === 'products') {
            navigate('/products');
          } else if (command.entities.route === 'cart') {
            navigate('/cart');
          }
          break;
          
        case 'search':
          if (command.entities.query) {
            searchProducts(command.entities.query);
            navigate('/products');
          }
          break;
          
        case 'filter':
          if (command.entities.category) {
            setFilters({ category: command.entities.category });
            navigate('/products');
          }
          break;
          
        case 'cart_add_item':
          if (command.entities.item_identifier === 'first' && filteredProducts.length > 0) {
            addItem(filteredProducts[0]);
          }
          break;
          
        case 'cart_view':
          setCartOpen(true);
          break;

        case 'cart_clear':
          clearCart();
          break;
          
        default:
          console.log('Unknown command intent:', command.intent);
      }
      
      // Speak confirmation (in a real app, you'd use Web Speech API)
      console.log('Voice confirmation:', command.confirmation_speech);
      
    } catch (error) {
      console.error('Failed to execute voice command:', error);
      setError('Failed to execute voice command');
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={!isInitialized}
        className={`w-16 h-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-purple-600 hover:bg-purple-700 hover:scale-110'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>
    </div>
  );
};

export default VoiceInputManager;
