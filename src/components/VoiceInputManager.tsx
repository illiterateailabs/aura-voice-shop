import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoiceStore } from '../stores/voiceStore';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { 
  createAudioWorkletProcessorCode, 
  processAudioData,
  AudioChunkManager,
  calculateAudioLevel,
  createAudioBlob,
  SAMPLE_RATE_TARGET
} from '../utils/audioProcessor';
import { 
  VoiceActivityDetector, 
  VADEvent, 
  DEFAULT_VAD_CONFIG 
} from '../utils/voiceActivityDetection';
import { 
  WebSocketAudioStreamer,
  NLUResponse,
  TranscriptResponse,
  AudioStreamerEvent
} from '../utils/websocketAudioStreamer';

// Define the structure of a voice command
interface VoiceCommand {
  intent: string;
  entities: {
    query?: string;
    category?: string;
    item_identifier?: string;
    filter_type?: string;
    filter_value?: string | number;
    price_max?: number;
    price_min?: number;
    route?: string;
    product_id?: string;
    product_ids?: string[];
    sort_by?: string;
    sort_order?: string;
  };
  parameters?: {
    quantity?: number;
    [key: string]: any;
  };
  final_transcript: string;
  confirmation_speech: string;
}

// Configuration for the voice input manager
const VOICE_CONFIG = {
  // WebSocket endpoint for voice processing
  websocketUrl: import.meta.env.VITE_VOICE_API_URL || 'wss://api.example.com/voice',
  
  // Audio processing settings
  audioConfig: {
    sampleRate: 44100, // Browser's default sample rate
    targetSampleRate: SAMPLE_RATE_TARGET, // 16kHz for Gemini API
    frameSize: 4096, // Size of audio frames to process
    channels: 1 // Mono audio
  },
  
  // VAD settings - slightly more sensitive than defaults
  vadConfig: {
    ...DEFAULT_VAD_CONFIG,
    energyThresholdMultiplier: 1.8, // More sensitive
    speechStartThresholdTime: 150, // Faster speech detection
    speechEndThresholdTime: 700 // Allow for slightly longer pauses
  }
};

const VoiceInputManager: React.FC = () => {
  const navigate = useNavigate();
  
  // Access stores
  const {
    isListening,
    isProcessing,
    setListening,
    setProcessing,
    setTranscript,
    setConfidence,
    setError,
    setConnected,
    setAudioLevel,
    setCurrentIntent,
    setLastCommand
  } = useVoiceStore();
  
  const { 
    searchProducts, 
    setFilters, 
    filteredProducts, 
    applySort, 
    products 
  } = useProductStore();
  
  const { 
    addItem, 
    removeItem, 
    clearCart, 
    setCartOpen, 
    items: cartItems 
  } = useCartStore();
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Refs for audio processing components
  const audioChunkManagerRef = useRef<AudioChunkManager>(new AudioChunkManager());
  const vadRef = useRef<VoiceActivityDetector | null>(null);
  const streamerRef = useRef<WebSocketAudioStreamer | null>(null);
  
  // State for initialization and permissions
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // Initialize audio processing
  useEffect(() => {
    initializeAudio();
    
    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);
  
  // Initialize WebSocket when audio is ready
  useEffect(() => {
    if (isInitialized && hasPermission) {
      initializeWebSocket();
    }
    
    return () => {
      if (streamerRef.current) {
        streamerRef.current.disconnect();
      }
    };
  }, [isInitialized, hasPermission]);
  
  // Initialize audio processing components
  const initializeAudio = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      mediaStreamRef.current = stream;
      setHasPermission(true);
      
      // Create audio context
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Get actual sample rate from audio context
      const actualSampleRate = audioContext.sampleRate;
      console.log(`Audio context sample rate: ${actualSampleRate}Hz`);
      
      // Create AudioWorklet processor
      const workletCode = createAudioWorkletProcessorCode(VOICE_CONFIG.audioConfig.frameSize);
      const workletBlob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(workletBlob);
      
      // Add AudioWorklet module
      await audioContext.audioWorklet.addModule(workletUrl);
      
      // Create AudioWorklet node
      const workletNode = new AudioWorkletNode(audioContext, 'aura-audio-processor');
      audioWorkletNodeRef.current = workletNode;
      
      // Create source node from microphone stream
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;
      
      // Connect nodes: source -> worklet
      sourceNode.connect(workletNode);
      
      // Set up message handler for audio data from AudioWorklet
      workletNode.port.onmessage = handleAudioWorkletMessage;
      
      // Initialize VAD
      const vad = new VoiceActivityDetector(VOICE_CONFIG.vadConfig);
      vadRef.current = vad;
      
      // Set up VAD event handlers
      vad.addEventListener('speechStart', handleSpeechStart);
      vad.addEventListener('speechEnd', handleSpeechEnd);
      vad.addEventListener('audioLevel', handleAudioLevel);
      vad.addEventListener('error', handleVADError);
      
      // Start VAD
      vad.start();
      
      // Clean up worklet URL
      URL.revokeObjectURL(workletUrl);
      
      setIsInitialized(true);
      setConnected(true);
      console.log('Audio processing initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setError('Microphone access denied. Please enable microphone permissions.');
        setHasPermission(false);
      } else {
        setError(`Failed to initialize audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setHasPermission(null);
      }
      
      setConnected(false);
    }
  };
  
  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    try {
      // Create WebSocket streamer
      const streamer = new WebSocketAudioStreamer({
        serverUrl: VOICE_CONFIG.websocketUrl,
        autoReconnect: true
      });
      
      streamerRef.current = streamer;
      
      // Set up event handlers
      streamer.addEventListener('open', handleStreamerOpen);
      streamer.addEventListener('close', handleStreamerClose);
      streamer.addEventListener('error', handleStreamerError);
      streamer.addEventListener('transcript', handleTranscriptResponse);
      streamer.addEventListener('nlu', handleNLUResponse);
      
      // Connect to WebSocket server
      streamer.connect();
      
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setError(`Failed to connect to voice service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Clean up resources
  const cleanup = () => {
    // Stop VAD
    if (vadRef.current) {
      vadRef.current.stop();
      vadRef.current = null;
    }
    
    // Disconnect WebSocket
    if (streamerRef.current) {
      streamerRef.current.disconnect();
      streamerRef.current = null;
    }
    
    // Clean up audio nodes
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    setIsInitialized(false);
    setConnected(false);
  };
  
  // Handle audio data from AudioWorklet
  const handleAudioWorkletMessage = (event: MessageEvent) => {
    if (!event.data || event.data.eventType !== 'audio' || !event.data.audioData) {
      return;
    }
    
    const { audioData, sampleRate } = event.data;
    
    // Process audio data (resample if needed and convert to PCM)
    const processedData = processAudioData(
      audioData, 
      sampleRate, 
      VOICE_CONFIG.audioConfig.targetSampleRate
    );
    
    // Process with VAD
    if (vadRef.current) {
      vadRef.current.processAudioFrame(processedData);
    }
    
    // If speech is being captured, add to chunk manager and stream
    if (isListening && streamerRef.current) {
      audioChunkManagerRef.current.addChunk(processedData);
      
      // Create blob and send to server
      const audioBlob = createAudioBlob(processedData);
      streamerRef.current.sendAudioChunk(audioBlob);
    }
  };
  
  // Handle speech start event from VAD
  const handleSpeechStart = (event: VADEvent) => {
    if (!isListening) {
      setListening(true);
      setProcessing(true);
      setError(null);
      
      // Clear previous audio chunks
      audioChunkManagerRef.current.clear();
      
      // Reset transcript
      setInterimTranscript('');
      setTranscript('');
      
      console.log('Speech started', event.timestamp);
    }
  };
  
  // Handle speech end event from VAD
  const handleSpeechEnd = (event: VADEvent) => {
    if (isListening) {
      console.log('Speech ended', event.data?.duration);
      
      // Keep processing flag on until we get final results
      setListening(false);
      
      // If we have a streamer, send end-of-speech command
      if (streamerRef.current) {
        streamerRef.current.sendCommand('end_of_speech');
      }
    }
  };
  
  // Handle audio level updates from VAD
  const handleAudioLevel = (event: VADEvent) => {
    if (event.data?.level !== undefined) {
      setAudioLevel(event.data.level);
    }
  };
  
  // Handle VAD errors
  const handleVADError = (event: VADEvent) => {
    console.error('VAD error:', event.data);
    setError(`Voice detection error: ${event.data?.message || 'Unknown error'}`);
  };
  
  // Handle WebSocket connection open
  const handleStreamerOpen = (event: AudioStreamerEvent) => {
    console.log('Connected to voice service');
    setConnected(true);
  };
  
  // Handle WebSocket connection close
  const handleStreamerClose = (event: AudioStreamerEvent) => {
    console.log('Disconnected from voice service');
    setConnected(false);
  };
  
  // Handle WebSocket errors
  const handleStreamerError = (event: AudioStreamerEvent) => {
    console.error('WebSocket error:', event.data);
    setError(`Voice service error: ${event.data?.message || 'Connection error'}`);
    setConnected(false);
  };
  
  // Handle transcript responses from server
  const handleTranscriptResponse = (event: AudioStreamerEvent) => {
    const response = event.data as TranscriptResponse;
    
    if (response.isFinal) {
      // Final transcript
      setTranscript(response.text);
      setInterimTranscript('');
      
      if (response.confidence !== undefined) {
        setConfidence(response.confidence);
      }
    } else {
      // Interim transcript
      setInterimTranscript(response.text);
    }
  };
  
  // Handle NLU responses from server
  const handleNLUResponse = (event: AudioStreamerEvent) => {
    const response = event.data as NLUResponse;
    
    // Set final transcript and intent
    setTranscript(response.final_transcript);
    setCurrentIntent(response.intent);
    setLastCommand(response.confirmation_speech);
    
    // Process the command
    executeVoiceCommand({
      intent: response.intent,
      entities: response.entities,
      parameters: response.parameters,
      final_transcript: response.final_transcript,
      confirmation_speech: response.confirmation_speech
    });
    
    // Done processing
    setProcessing(false);
  };
  
  // Execute voice command based on NLU response
  const executeVoiceCommand = useCallback((command: VoiceCommand) => {
    try {
      console.log('Executing voice command:', command);
      
      switch (command.intent) {
        case 'navigate':
          handleNavigationCommand(command);
          break;
          
        case 'search':
          handleSearchCommand(command);
          break;
          
        case 'filter_add':
          handleFilterCommand(command);
          break;
          
        case 'sort':
          handleSortCommand(command);
          break;
          
        case 'select_item':
          handleSelectItemCommand(command);
          break;
          
        case 'product_details_more':
          // This would typically show more details on the current product
          // For now, we'll just log it
          console.log('Showing more product details');
          break;
          
        case 'product_query_variations':
          // This would typically query for product variations
          // For now, we'll just log it
          console.log('Querying product variations:', command.entities);
          break;
          
        case 'cart_add_item':
          handleCartAddCommand(command);
          break;
          
        case 'cart_remove_item':
          handleCartRemoveCommand(command);
          break;
          
        case 'cart_view':
          setCartOpen(true);
          break;
          
        case 'checkout_start':
          navigate('/checkout');
          break;
          
        case 'faq_query':
          handleFAQCommand(command);
          break;
          
        case 'clarification_needed':
          // The system needs more information
          setError(command.confirmation_speech);
          break;
          
        default:
          console.log('Unknown command intent:', command.intent);
          setError(`I don't know how to handle the command: ${command.intent}`);
      }
      
    } catch (error) {
      console.error('Failed to execute voice command:', error);
      setError(`Failed to execute voice command: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [navigate, setCartOpen, searchProducts, setFilters, applySort, addItem, removeItem, clearCart, filteredProducts, products, cartItems]);
  
  // Handle navigation commands
  const handleNavigationCommand = (command: VoiceCommand) => {
    const { target_page, category } = command.entities;
    
    if (target_page === 'homepage') {
      navigate('/');
    } else if (target_page === 'products' || target_page === 'product_listing') {
      // If category is specified, apply it as a filter
      if (category) {
        setFilters({ category });
      }
      navigate('/products');
    } else if (target_page === 'cart') {
      navigate('/cart');
    } else if (target_page === 'checkout') {
      navigate('/checkout');
    } else if (target_page === 'new_arrivals') {
      setFilters({ isNewArrival: true, category: category || undefined });
      navigate('/products');
    } else {
      // Default to homepage if target is unknown
      navigate('/');
    }
  };
  
  // Handle search commands
  const handleSearchCommand = (command: VoiceCommand) => {
    const { query, color, product_type, gender, price_max, price_min } = command.entities;
    
    // Build search filters
    const filters: Record<string, any> = {};
    
    if (color) filters.color = color;
    if (product_type) filters.productType = product_type;
    if (gender) filters.gender = gender;
    if (price_max) filters.priceMax = price_max;
    if (price_min) filters.priceMin = price_min;
    
    // Apply filters
    setFilters(filters);
    
    // Perform search if query is provided
    if (query) {
      searchProducts(query);
    }
    
    // Navigate to products page
    navigate('/products');
  };
  
  // Handle filter commands
  const handleFilterCommand = (command: VoiceCommand) => {
    const { filter_type, filter_value } = command.entities;
    
    if (!filter_type) return;
    
    // Build filter object
    const filters: Record<string, any> = {};
    
    switch (filter_type) {
      case 'brand':
        filters.brand = filter_value;
        break;
      case 'color':
        filters.color = filter_value;
        break;
      case 'price_max':
        filters.priceMax = filter_value;
        break;
      case 'price_min':
        filters.priceMin = filter_value;
        break;
      case 'category':
        filters.category = filter_value;
        break;
      case 'size':
        filters.size = filter_value;
        break;
      default:
        // For any other filter types
        filters[filter_type] = filter_value;
    }
    
    // Apply filters
    setFilters(filters);
    
    // Navigate to products page if not already there
    if (!window.location.pathname.includes('/products')) {
      navigate('/products');
    }
  };
  
  // Handle sort commands
  const handleSortCommand = (command: VoiceCommand) => {
    const { sort_by, sort_order } = command.entities;
    
    if (!sort_by) return;
    
    // Determine sort order (default to ascending)
    const order = sort_order === 'descending' ? 'desc' : 'asc';
    
    // Apply sort
    applySort(sort_by, order);
    
    // Navigate to products page if not already there
    if (!window.location.pathname.includes('/products')) {
      navigate('/products');
    }
  };
  
  // Handle select item commands
  const handleSelectItemCommand = (command: VoiceCommand) => {
    const { item_identifier } = command.entities;
    
    if (!item_identifier || filteredProducts.length === 0) return;
    
    let selectedProduct;
    
    // Determine which product to select
    if (item_identifier === 'first') {
      selectedProduct = filteredProducts[0];
    } else if (item_identifier === 'last') {
      selectedProduct = filteredProducts[filteredProducts.length - 1];
    } else if (!isNaN(Number(item_identifier))) {
      // If item_identifier is a number, use it as an index (1-based)
      const index = Number(item_identifier) - 1;
      if (index >= 0 && index < filteredProducts.length) {
        selectedProduct = filteredProducts[index];
      }
    } else {
      // Try to find product by name
      selectedProduct = filteredProducts.find(p => 
        p.name.toLowerCase().includes(item_identifier.toLowerCase())
      );
    }
    
    // Navigate to product detail if found
    if (selectedProduct) {
      navigate(`/product/${selectedProduct.id}`);
    } else {
      setError(`Could not find product ${item_identifier}`);
    }
  };
  
  // Handle cart add commands
  const handleCartAddCommand = (command: VoiceCommand) => {
    const { item_identifier } = command.entities;
    const quantity = command.parameters?.quantity || 1;
    
    if (!item_identifier) {
      // If no item specified, try to add the currently viewed product
      const productId = window.location.pathname.match(/\/product\/(.+)/)?.[1];
      
      if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
          addItem({ ...product, quantity });
          return;
        }
      }
      
      setError('Please specify which product to add to cart');
      return;
    }
    
    // Determine which product to add
    let productToAdd;
    
    if (item_identifier === 'first' && filteredProducts.length > 0) {
      productToAdd = filteredProducts[0];
    } else if (item_identifier === 'last' && filteredProducts.length > 0) {
      productToAdd = filteredProducts[filteredProducts.length - 1];
    } else if (!isNaN(Number(item_identifier))) {
      // If item_identifier is a number, use it as an index (1-based)
      const index = Number(item_identifier) - 1;
      if (index >= 0 && index < filteredProducts.length) {
        productToAdd = filteredProducts[index];
      }
    } else {
      // Try to find product by name
      productToAdd = products.find(p => 
        p.name.toLowerCase().includes(item_identifier.toLowerCase())
      );
    }
    
    // Add to cart if found
    if (productToAdd) {
      addItem({ ...productToAdd, quantity });
    } else {
      setError(`Could not find product ${item_identifier}`);
    }
  };
  
  // Handle cart remove commands
  const handleCartRemoveCommand = (command: VoiceCommand) => {
    const { item_identifier } = command.entities;
    
    if (!item_identifier || cartItems.length === 0) {
      setError('Please specify which item to remove from cart');
      return;
    }
    
    // Determine which item to remove
    let itemToRemove;
    
    if (item_identifier === 'first') {
      itemToRemove = cartItems[0];
    } else if (item_identifier === 'last') {
      itemToRemove = cartItems[cartItems.length - 1];
    } else if (!isNaN(Number(item_identifier))) {
      // If item_identifier is a number, use it as an index (1-based)
      const index = Number(item_identifier) - 1;
      if (index >= 0 && index < cartItems.length) {
        itemToRemove = cartItems[index];
      }
    } else {
      // Try to find item by name
      itemToRemove = cartItems.find(item => 
        item.name.toLowerCase().includes(item_identifier.toLowerCase())
      );
    }
    
    // Remove from cart if found
    if (itemToRemove) {
      removeItem(itemToRemove.id);
    } else {
      setError(`Could not find item ${item_identifier} in your cart`);
    }
  };
  
  // Handle FAQ commands
  const handleFAQCommand = (command: VoiceCommand) => {
    const { query_topic } = command.entities;
    
    if (!query_topic) return;
    
    // Navigate to appropriate FAQ page based on topic
    switch (query_topic) {
      case 'return_policy':
        navigate('/faq/returns');
        break;
      case 'shipping':
        navigate('/faq/shipping');
        break;
      case 'payment':
        navigate('/faq/payment');
        break;
      default:
        navigate('/faq');
    }
  };
  
  // Toggle listening state manually (for button click)
  const toggleListening = () => {
    if (!isInitialized || !hasPermission) {
      initializeAudio();
      return;
    }
    
    if (isListening) {
      // If currently listening, stop
      setListening(false);
      setProcessing(false);
      
      // If we have a streamer, send end-of-speech command
      if (streamerRef.current) {
        streamerRef.current.sendCommand('end_of_speech');
      }
      
      // Stop VAD
      if (vadRef.current) {
        vadRef.current.reset();
      }
    } else {
      // If not listening, start
      setListening(true);
      setProcessing(true);
      setError(null);
      
      // Clear previous audio chunks
      audioChunkManagerRef.current.clear();
      
      // Reset transcript
      setInterimTranscript('');
      setTranscript('');
      
      // Reset VAD
      if (vadRef.current) {
        vadRef.current.reset();
      }
    }
  };
  
  // Render microphone button with appropriate state
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2">
      {/* Transcript display */}
      {(isListening || isProcessing || interimTranscript) && (
        <div className="bg-white/90 dark:bg-gray-800/90 p-3 rounded-lg shadow-lg max-w-md mb-2 backdrop-blur-sm">
          {interimTranscript && (
            <p className="text-gray-600 dark:text-gray-400 italic">
              {interimTranscript}...
            </p>
          )}
        </div>
      )}
      
      {/* Error message */}
      {useVoiceStore().error && (
        <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-lg shadow-lg max-w-md mb-2">
          <p className="text-red-800 dark:text-red-200 text-sm">
            {useVoiceStore().error}
          </p>
        </div>
      )}
      
      {/* Microphone button */}
      <button
        onClick={toggleListening}
        disabled={!isInitialized && hasPermission === false}
        className={`w-16 h-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : isProcessing
            ? 'bg-yellow-500 hover:bg-yellow-600'
            : 'bg-purple-600 hover:bg-purple-700 hover:scale-110'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={
          !hasPermission 
            ? 'Microphone access denied' 
            : isListening 
            ? 'Listening...' 
            : isProcessing 
            ? 'Processing...' 
            : 'Click to speak'
        }
      >
        {!hasPermission ? (
          // Microphone blocked icon
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
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        ) : isProcessing && !isListening ? (
          // Processing spinner
          <svg 
            className="w-8 h-8 text-white animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          // Microphone icon
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
        )}
      </button>
      
      {/* Audio level indicator (only shown when listening) */}
      {isListening && (
        <div className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-purple-500 rounded-full opacity-70"
            style={{ 
              transform: `scale(${Math.min(1 + useVoiceStore().audioLevel * 2, 3)})`,
              transition: 'transform 100ms ease-out'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default VoiceInputManager;
