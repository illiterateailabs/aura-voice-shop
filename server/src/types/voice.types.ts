/**
 * Voice API Types
 * 
 * Type definitions for the Aura Voice Shop voice processing system:
 * - WebSocket message types
 * - NLU response structure
 * - Audio metadata
 * - Session management
 * - Client/Server communication interfaces
 */

// ==============================
// Client Message Types
// ==============================

/**
 * Types of messages sent from client to server
 */
export enum ClientMessageType {
  SETUP = 'setup',
  AUDIO = 'audio',
  TEXT = 'text',
  END_OF_SPEECH = 'end_of_speech',
  PING = 'ping',
  END_SESSION = 'end_session',
  COMMAND = 'command'
}

/**
 * Types of messages sent from server to client
 */
export enum ServerMessageType {
  TRANSCRIPT = 'transcript',
  NLU = 'nlu',
  ERROR = 'error',
  PONG = 'pong',
  BACKPRESSURE = 'backpressure',
  SESSION = 'session',
  AUDIO = 'audio'
}

// ==============================
// Audio Processing Types
// ==============================

/**
 * Audio format metadata
 */
export interface AudioMetadata {
  format: 'pcm';
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
}

/**
 * Audio chunk with metadata
 */
export interface AudioChunk {
  data: ArrayBuffer | string; // Binary data or base64 encoded
  metadata: AudioMetadata;
  timestamp: number;
}

// ==============================
// NLU Intent & Entity Types
// ==============================

/**
 * All possible intents as defined in the PRD
 */
export enum IntentType {
  NAVIGATE = 'navigate',
  SEARCH = 'search',
  FILTER_ADD = 'filter_add',
  SORT = 'sort',
  SELECT_ITEM = 'select_item',
  PRODUCT_DETAILS_MORE = 'product_details_more',
  PRODUCT_QUERY_VARIATIONS = 'product_query_variations',
  CART_ADD_ITEM = 'cart_add_item',
  CART_REMOVE_ITEM = 'cart_remove_item',
  CART_VIEW = 'cart_view',
  CHECKOUT_START = 'checkout_start',
  FAQ_QUERY = 'faq_query',
  CLARIFICATION_NEEDED = 'clarification_needed'
}

/**
 * Entity types that can be extracted from voice commands
 */
export interface Entities {
  // Navigation entities
  target_page?: string;
  category?: string;
  
  // Search entities
  query?: string;
  color?: string;
  product_type?: string;
  gender?: string;
  
  // Filter entities
  filter_type?: string;
  filter_value?: string | number;
  price_max?: number;
  price_min?: number;
  
  // Item selection entities
  item_identifier?: string;
  product_id?: string;
  product_ids?: string[];
  
  // Sorting entities
  sort_by?: string;
  sort_order?: 'ascending' | 'descending';
  
  // FAQ entities
  query_topic?: string;
  
  // Additional entities
  [key: string]: any;
}

/**
 * Additional parameters for intent execution
 */
export interface Parameters {
  quantity?: number;
  sort_order?: 'asc' | 'desc';
  [key: string]: any;
}

/**
 * Complete NLU response structure
 */
export interface NLUResponse {
  intent: IntentType | string;
  entities: Entities;
  parameters?: Parameters;
  final_transcript: string;
  confirmation_speech: string;
  confidence_score_nlu?: number;
}

// ==============================
// Client Message Interfaces
// ==============================

/**
 * Base interface for all client messages
 */
export interface ClientMessage {
  type: ClientMessageType;
  timestamp: number;
  sessionId?: string;
}

/**
 * Setup message to initialize the session
 */
export interface SetupMessage extends ClientMessage {
  type: ClientMessageType.SETUP;
  model: string;
  systemInstruction?: string;
  config?: {
    responseModalities?: ('TEXT' | 'AUDIO')[];
    inputAudioTranscription?: Record<string, any>;
    outputAudioTranscription?: Record<string, any>;
    speechConfig?: {
      voiceConfig?: {
        prebuiltVoiceConfig?: {
          voiceName?: string;
        };
      };
      languageCode?: string;
    };
    realtimeInputConfig?: {
      automaticActivityDetection?: {
        disabled?: boolean;
        startOfSpeechSensitivity?: string;
        endOfSpeechSensitivity?: string;
        prefixPaddingMs?: number;
        silenceDurationMs?: number;
      };
    };
  };
}

/**
 * Audio message with PCM data
 */
export interface AudioMessage extends ClientMessage {
  type: ClientMessageType.AUDIO;
  audio: {
    data: string; // base64 encoded audio data
    mimeType: string; // e.g., "audio/pcm;rate=16000"
  };
  format?: 'pcm';
  sampleRate?: number;
  channels?: number;
  bitsPerSample?: number;
  queued?: boolean;
}

/**
 * Text message for direct text input
 */
export interface TextMessage extends ClientMessage {
  type: ClientMessageType.TEXT;
  text: string;
}

/**
 * End of speech signal
 */
export interface EndOfSpeechMessage extends ClientMessage {
  type: ClientMessageType.END_OF_SPEECH;
}

/**
 * Ping message for connection health check
 */
export interface PingMessage extends ClientMessage {
  type: ClientMessageType.PING;
}

/**
 * End session message
 */
export interface EndSessionMessage extends ClientMessage {
  type: ClientMessageType.END_SESSION;
}

/**
 * Generic command message
 */
export interface CommandMessage extends ClientMessage {
  type: ClientMessageType.COMMAND;
  command: string;
  params?: Record<string, any>;
}

// ==============================
// Server Message Interfaces
// ==============================

/**
 * Base interface for all server messages
 */
export interface ServerMessage {
  type: ServerMessageType;
  timestamp: number;
  sessionId?: string;
}

/**
 * Transcript message with speech-to-text results
 */
export interface TranscriptMessage extends ServerMessage {
  type: ServerMessageType.TRANSCRIPT;
  text: string;
  isFinal: boolean;
  confidence?: number;
}

/**
 * NLU message with intent and entity recognition
 */
export interface NLUMessage extends ServerMessage {
  type: ServerMessageType.NLU;
  nlu: NLUResponse;
}

/**
 * Error message
 */
export interface ErrorMessage extends ServerMessage {
  type: ServerMessageType.ERROR;
  message: string;
  code?: string;
  details?: any;
}

/**
 * Pong response to ping
 */
export interface PongMessage extends ServerMessage {
  type: ServerMessageType.PONG;
}

/**
 * Backpressure signal for flow control
 */
export interface BackpressureMessage extends ServerMessage {
  type: ServerMessageType.BACKPRESSURE;
  active: boolean;
}

/**
 * Session information message
 */
export interface SessionMessage extends ServerMessage {
  type: ServerMessageType.SESSION;
  sessionId: string;
  expiresAt?: number;
}

/**
 * Audio response message (for TTS)
 */
export interface AudioResponseMessage extends ServerMessage {
  type: ServerMessageType.AUDIO;
  audio: {
    data: string; // base64 encoded audio data
    mimeType: string; // e.g., "audio/pcm;rate=24000"
  };
  metadata?: {
    format: string;
    sampleRate: number;
    channels: number;
    bitsPerSample: number;
  };
}

// ==============================
// Session Management Types
// ==============================

/**
 * Session state
 */
export enum SessionState {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  IDLE = 'idle',
  ERROR = 'error',
  CLOSED = 'closed'
}

/**
 * Session information
 */
export interface Session {
  id: string;
  state: SessionState;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  clientInfo?: {
    userAgent?: string;
    ip?: string;
  };
  geminiSession?: any; // Gemini session reference
}

// ==============================
// Voice Activity Detection Types
// ==============================

/**
 * VAD configuration
 */
export interface VADConfig {
  disabled?: boolean;
  startOfSpeechSensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
  endOfSpeechSensitivity?: 'LOW' | 'MEDIUM' | 'HIGH';
  prefixPaddingMs?: number;
  silenceDurationMs?: number;
}

/**
 * VAD state
 */
export enum VADState {
  INACTIVE = 'inactive',
  LISTENING = 'listening',
  SPEECH_DETECTED = 'speech_detected',
  PROCESSING = 'processing'
}

// ==============================
// Usage and Metrics Types
// ==============================

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Session metrics
 */
export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  audioProcessed?: number; // bytes
  tokenUsage?: TokenUsage;
  requests?: number;
  errors?: number;
}

// ==============================
// Union Types for Message Handling
// ==============================

/**
 * All possible client message types
 */
export type AnyClientMessage = 
  | SetupMessage
  | AudioMessage
  | TextMessage
  | EndOfSpeechMessage
  | PingMessage
  | EndSessionMessage
  | CommandMessage;

/**
 * All possible server message types
 */
export type AnyServerMessage = 
  | TranscriptMessage
  | NLUMessage
  | ErrorMessage
  | PongMessage
  | BackpressureMessage
  | SessionMessage
  | AudioResponseMessage;
