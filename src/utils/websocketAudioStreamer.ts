/**
 * WebSocket Audio Streamer
 * 
 * Handles real-time streaming of audio data to a backend server via WebSocket
 * with support for:
 * - Connection management and automatic reconnection
 * - Audio chunk queuing and transmission
 * - Server response handling for transcripts and NLU results
 * - Backpressure handling to avoid overwhelming the server
 * - Event-based architecture for real-time updates
 */

// Types for server responses
export interface TranscriptResponse {
  type: 'transcript';
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface NLUResponse {
  type: 'nlu';
  intent: string;
  entities: Record<string, any>;
  parameters?: Record<string, any>;
  final_transcript: string;
  confirmation_speech: string;
}

export interface ErrorResponse {
  type: 'error';
  message: string;
  code?: string;
}

export type ServerResponse = TranscriptResponse | NLUResponse | ErrorResponse;

// Types for streamer events
export type AudioStreamerEventType = 
  | 'open' 
  | 'close' 
  | 'error' 
  | 'transcript' 
  | 'nlu' 
  | 'backpressure'
  | 'reconnecting'
  | 'reconnected';

export interface AudioStreamerEvent {
  type: AudioStreamerEventType;
  timestamp: number;
  data?: any;
}

export type AudioStreamerEventListener = (event: AudioStreamerEvent) => void;

// Configuration options
export interface AudioStreamerConfig {
  // WebSocket server URL
  serverUrl: string;
  
  // Authentication token (if required)
  authToken?: string;
  
  // Maximum number of reconnection attempts
  maxReconnectAttempts: number;
  
  // Base delay in ms for reconnection (will be multiplied by 2^attempt)
  reconnectBaseDelay: number;
  
  // Maximum delay in ms for reconnection
  maxReconnectDelay: number;
  
  // Maximum size of the audio chunk queue
  maxQueueSize: number;
  
  // Whether to automatically reconnect on connection close
  autoReconnect: boolean;
  
  // Ping interval in ms (to keep connection alive)
  pingInterval: number;
  
  // Timeout in ms to wait for pong response
  pongTimeout: number;
  
  // Headers to include in the WebSocket connection
  headers?: Record<string, string>;
}

// Default configuration
export const DEFAULT_STREAMER_CONFIG: AudioStreamerConfig = {
  serverUrl: 'wss://api.example.com/voice',
  maxReconnectAttempts: 5,
  reconnectBaseDelay: 1000,
  maxReconnectDelay: 30000,
  maxQueueSize: 100,
  autoReconnect: true,
  pingInterval: 30000,
  pongTimeout: 5000
};

/**
 * WebSocket Audio Streamer class
 * Manages WebSocket connection and audio streaming to backend
 */
export class WebSocketAudioStreamer {
  private config: AudioStreamerConfig;
  private eventListeners: Map<AudioStreamerEventType, AudioStreamerEventListener[]> = new Map();
  
  // WebSocket connection
  private socket: WebSocket | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: number | null = null;
  private pingTimer: number | null = null;
  private pongTimer: number | null = null;
  
  // Audio chunk queue
  private audioQueue: Blob[] = [];
  private isProcessingQueue: boolean = false;
  private backpressure: boolean = false;
  
  // Session management
  private sessionId: string | null = null;
  
  /**
   * Create a new WebSocket Audio Streamer
   */
  constructor(config: Partial<AudioStreamerConfig> = {}) {
    this.config = { ...DEFAULT_STREAMER_CONFIG, ...config };
  }
  
  /**
   * Connect to the WebSocket server
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected || this.isConnecting) {
      return this.isConnected;
    }
    
    this.isConnecting = true;
    
    try {
      await this.establishConnection();
      return true;
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      this.emitEvent('error', { message: 'Connection failed', error });
      
      if (this.config.autoReconnect) {
        this.scheduleReconnect();
      }
      
      return false;
    } finally {
      this.isConnecting = false;
    }
  }
  
  /**
   * Establish WebSocket connection
   */
  private establishConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        const url = new URL(this.config.serverUrl);
        
        // Add auth token as query parameter if provided
        if (this.config.authToken) {
          url.searchParams.append('token', this.config.authToken);
        }
        
        this.socket = new WebSocket(url.toString());
        
        // Set up event handlers
        this.socket.onopen = () => {
          this.handleConnectionOpen();
          resolve();
        };
        
        this.socket.onclose = (event) => {
          this.handleConnectionClose(event);
          if (!this.isConnected) {
            reject(new Error(`WebSocket connection closed: ${event.code} ${event.reason}`));
          }
        };
        
        this.socket.onerror = (event) => {
          this.handleConnectionError(event);
          if (!this.isConnected) {
            reject(new Error('WebSocket connection error'));
          }
        };
        
        this.socket.onmessage = (event) => {
          this.handleServerMessage(event);
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Handle WebSocket connection open
   */
  private handleConnectionOpen(): void {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Start ping interval to keep connection alive
    this.startPingInterval();
    
    // Process any queued audio chunks
    this.processQueue();
    
    // Emit open event
    this.emitEvent('open');
    
    // If this was a reconnection, emit reconnected event
    if (this.reconnectAttempts > 0) {
      this.emitEvent('reconnected');
    }
  }
  
  /**
   * Handle WebSocket connection close
   */
  private handleConnectionClose(event: CloseEvent): void {
    this.isConnected = false;
    this.stopPingInterval();
    
    // Emit close event
    this.emitEvent('close', { code: event.code, reason: event.reason });
    
    // Attempt to reconnect if auto-reconnect is enabled
    if (this.config.autoReconnect && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket connection error
   */
  private handleConnectionError(event: Event): void {
    // Emit error event
    this.emitEvent('error', { message: 'WebSocket error', event });
  }
  
  /**
   * Schedule reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emitEvent('error', { 
        message: 'Maximum reconnection attempts reached', 
        attempts: this.reconnectAttempts 
      });
      return;
    }
    
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.config.maxReconnectDelay
    );
    
    // Emit reconnecting event
    this.emitEvent('reconnecting', { 
      attempt: this.reconnectAttempts, 
      delay, 
      maxAttempts: this.config.maxReconnectAttempts 
    });
    
    // Schedule reconnection
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
  
  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    this.pingTimer = window.setInterval(() => {
      this.sendPing();
    }, this.config.pingInterval);
  }
  
  /**
   * Stop ping interval
   */
  private stopPingInterval(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    
    if (this.pongTimer !== null) {
      clearTimeout(this.pongTimer);
      this.pongTimer = null;
    }
  }
  
  /**
   * Send ping message to server
   */
  private sendPing(): void {
    if (!this.isConnected || !this.socket) return;
    
    try {
      // Send ping message
      this.socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      
      // Set timeout for pong response
      if (this.pongTimer !== null) {
        clearTimeout(this.pongTimer);
      }
      
      this.pongTimer = window.setTimeout(() => {
        this.pongTimer = null;
        
        // If no pong received, consider connection dead and reconnect
        if (this.isConnected) {
          console.warn('No pong received, reconnecting...');
          this.disconnect();
          
          if (this.config.autoReconnect) {
            this.scheduleReconnect();
          }
        }
      }, this.config.pongTimeout);
    } catch (error) {
      console.error('Failed to send ping:', error);
    }
  }
  
  /**
   * Handle server messages
   */
  private handleServerMessage(event: MessageEvent): void {
    try {
      // Handle binary messages (unlikely in this application)
      if (event.data instanceof Blob) {
        console.warn('Received binary message from server, not supported');
        return;
      }
      
      // Parse JSON response
      const response = JSON.parse(event.data);
      
      // Handle pong response
      if (response.type === 'pong') {
        if (this.pongTimer !== null) {
          clearTimeout(this.pongTimer);
          this.pongTimer = null;
        }
        return;
      }
      
      // Handle backpressure signal
      if (response.type === 'backpressure') {
        this.backpressure = response.active === true;
        this.emitEvent('backpressure', { active: this.backpressure });
        
        // If backpressure is resolved, process queue
        if (!this.backpressure) {
          this.processQueue();
        }
        return;
      }
      
      // Handle session ID
      if (response.type === 'session' && response.sessionId) {
        this.sessionId = response.sessionId;
        return;
      }
      
      // Handle transcript response
      if (response.type === 'transcript') {
        const transcriptResponse: TranscriptResponse = {
          type: 'transcript',
          text: response.text,
          isFinal: response.isFinal === true,
          confidence: response.confidence
        };
        
        this.emitEvent('transcript', transcriptResponse);
        return;
      }
      
      // Handle NLU response
      if (response.type === 'nlu') {
        const nluResponse: NLUResponse = {
          type: 'nlu',
          intent: response.intent,
          entities: response.entities || {},
          parameters: response.parameters || {},
          final_transcript: response.final_transcript || '',
          confirmation_speech: response.confirmation_speech || ''
        };
        
        this.emitEvent('nlu', nluResponse);
        return;
      }
      
      // Handle error response
      if (response.type === 'error') {
        const errorResponse: ErrorResponse = {
          type: 'error',
          message: response.message || 'Unknown error',
          code: response.code
        };
        
        this.emitEvent('error', errorResponse);
        return;
      }
      
      console.warn('Unknown message type from server:', response);
    } catch (error) {
      console.error('Failed to parse server message:', error);
    }
  }
  
  /**
   * Send audio chunk to server
   */
  public sendAudioChunk(audioBlob: Blob): boolean {
    // If not connected, queue the chunk
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return this.queueAudioChunk(audioBlob);
    }
    
    // If backpressure is active, queue the chunk
    if (this.backpressure) {
      return this.queueAudioChunk(audioBlob);
    }
    
    try {
      // Create message with metadata
      const metadata = {
        type: 'audio',
        timestamp: Date.now(),
        sessionId: this.sessionId,
        format: 'pcm',
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16
      };
      
      // Send metadata as JSON
      this.socket.send(JSON.stringify(metadata));
      
      // Send audio blob
      this.socket.send(audioBlob);
      
      return true;
    } catch (error) {
      console.error('Failed to send audio chunk:', error);
      
      // Queue the chunk if send failed
      return this.queueAudioChunk(audioBlob);
    }
  }
  
  /**
   * Queue audio chunk for later transmission
   */
  private queueAudioChunk(audioBlob: Blob): boolean {
    // Check if queue is full
    if (this.audioQueue.length >= this.config.maxQueueSize) {
      // Remove oldest chunk if queue is full
      this.audioQueue.shift();
    }
    
    // Add chunk to queue
    this.audioQueue.push(audioBlob);
    
    // Process queue if possible
    if (this.isConnected && !this.backpressure && !this.isProcessingQueue) {
      this.processQueue();
    }
    
    return true;
  }
  
  /**
   * Process queued audio chunks
   */
  private async processQueue(): Promise<void> {
    if (
      !this.isConnected || 
      !this.socket || 
      this.socket.readyState !== WebSocket.OPEN || 
      this.backpressure || 
      this.isProcessingQueue || 
      this.audioQueue.length === 0
    ) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      // Process chunks in order
      while (
        this.isConnected && 
        this.socket && 
        this.socket.readyState === WebSocket.OPEN && 
        !this.backpressure && 
        this.audioQueue.length > 0
      ) {
        const chunk = this.audioQueue.shift()!;
        
        // Create message with metadata
        const metadata = {
          type: 'audio',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          format: 'pcm',
          sampleRate: 16000,
          channels: 1,
          bitsPerSample: 16,
          queued: true
        };
        
        // Send metadata as JSON
        this.socket.send(JSON.stringify(metadata));
        
        // Send audio blob
        this.socket.send(chunk);
        
        // Small delay to avoid overwhelming the socket
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    } catch (error) {
      console.error('Failed to process audio queue:', error);
    } finally {
      this.isProcessingQueue = false;
    }
  }
  
  /**
   * Send command to server
   */
  public sendCommand(command: string, params: Record<string, any> = {}): boolean {
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return false;
    }
    
    try {
      const message = {
        type: 'command',
        command,
        params,
        timestamp: Date.now(),
        sessionId: this.sessionId
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send command:', error);
      return false;
    }
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.stopPingInterval();
    
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      // Send end session message if connected
      if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.send(JSON.stringify({ 
            type: 'end_session',
            sessionId: this.sessionId,
            timestamp: Date.now()
          }));
        } catch (error) {
          console.error('Failed to send end session message:', error);
        }
      }
      
      // Close socket
      try {
        this.socket.close(1000, 'Client disconnected');
      } catch (error) {
        console.error('Failed to close WebSocket:', error);
      }
      
      this.socket = null;
    }
    
    this.isConnected = false;
    this.sessionId = null;
  }
  
  /**
   * Add event listener
   */
  public addEventListener(eventType: AudioStreamerEventType, listener: AudioStreamerEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    const listeners = this.eventListeners.get(eventType)!;
    if (!listeners.includes(listener)) {
      listeners.push(listener);
    }
  }
  
  /**
   * Remove event listener
   */
  public removeEventListener(eventType: AudioStreamerEventType, listener: AudioStreamerEventListener): void {
    if (!this.eventListeners.has(eventType)) return;
    
    const listeners = this.eventListeners.get(eventType)!;
    const index = listeners.indexOf(listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * Emit an event to all registered listeners
   */
  private emitEvent(type: AudioStreamerEventType, data?: any): void {
    if (!this.eventListeners.has(type)) return;
    
    const event: AudioStreamerEvent = {
      type,
      timestamp: Date.now(),
      data
    };
    
    const listeners = this.eventListeners.get(type)!;
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in audio streamer event listener:', error);
      }
    }
  }
  
  /**
   * Get current connection state
   */
  public getState(): {
    isConnected: boolean;
    isConnecting: boolean;
    reconnectAttempts: number;
    queueSize: number;
    backpressure: boolean;
    sessionId: string | null;
  } {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      queueSize: this.audioQueue.length,
      backpressure: this.backpressure,
      sessionId: this.sessionId
    };
  }
}
