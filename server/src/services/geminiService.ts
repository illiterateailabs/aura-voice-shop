/**
 * Gemini Service
 * 
 * Handles integration with Google Gemini Live API for real-time voice processing:
 * - Establishes and manages WebSocket connections to Gemini Live API
 * - Streams audio data for real-time STT
 * - Processes NLU responses
 * - Manages sessions and reconnection
 * 
 * Based on the Google Gemini Live API documentation:
 * https://ai.google.dev/gemini-api/docs/live
 */

import { GoogleGenerativeAI, Modality, Behavior } from '@google/generative-ai';
import { EventEmitter } from 'events';
import { 
  AudioMessage, 
  NLUResponse, 
  Session, 
  SessionState,
  TokenUsage
} from '../types/voice.types';
import { COMPLETE_SYSTEM_PROMPT, RESPONSE_SCHEMA } from '../config/prompts';
import dotenv from 'dotenv';

dotenv.config();

// Configuration constants
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-live-001';
const RECONNECT_MAX_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1000;

/**
 * Events emitted by the Gemini service
 */
export enum GeminiServiceEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  TRANSCRIPT = 'transcript',
  NLU_RESPONSE = 'nlu_response',
  SESSION_EXPIRED = 'session_expired',
  AUDIO_RESPONSE = 'audio_response'
}

/**
 * Interface for transcript response from Gemini
 */
interface TranscriptResponse {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

/**
 * Service for interacting with Google Gemini Live API
 */
export class GeminiService extends EventEmitter {
  private genAI: GoogleGenerativeAI;
  private model: string;
  private sessions: Map<string, Session> = new Map();
  private geminiSessions: Map<string, any> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private isInitialized: boolean = false;

  /**
   * Create a new Gemini service
   */
  constructor() {
    super();
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    this.genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    this.model = GEMINI_MODEL;
  }

  /**
   * Initialize the Gemini service
   */
  public async initialize(): Promise<void> {
    try {
      // Verify API key and model access
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      // Simple validation check (not a full connection)
      // Just to ensure the API key and model are valid
      await model.countTokens({ contents: [{ role: 'user', parts: [{ text: 'Hello' }] }] });
      
      this.isInitialized = true;
      console.log(`Gemini service initialized with model: ${this.model}`);
    } catch (error) {
      this.isInitialized = false;
      console.error('Failed to initialize Gemini service:', error);
      throw new Error(`Failed to initialize Gemini service: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if the service is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Create a new session with Gemini
   * @param sessionId Unique session identifier
   * @param clientInfo Optional client information
   */
  public async createSession(sessionId: string, clientInfo?: { userAgent?: string; ip?: string }): Promise<Session> {
    if (!this.isInitialized) {
      throw new Error('Gemini service is not initialized');
    }
    
    try {
      // Check if session already exists
      if (this.sessions.has(sessionId)) {
        return this.sessions.get(sessionId)!;
      }
      
      // Create session object
      const session: Session = {
        id: sessionId,
        state: SessionState.INITIALIZING,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + (2 * 60 * 60 * 1000), // 2 hours expiration
        clientInfo
      };
      
      this.sessions.set(sessionId, session);
      this.reconnectAttempts.set(sessionId, 0);
      
      // Connect to Gemini Live API
      await this.connectToGemini(sessionId);
      
      // Update session state
      session.state = SessionState.ACTIVE;
      session.updatedAt = Date.now();
      this.sessions.set(sessionId, session);
      
      return session;
    } catch (error) {
      console.error(`Failed to create session ${sessionId}:`, error);
      
      // Create error session
      const errorSession: Session = {
        id: sessionId,
        state: SessionState.ERROR,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes expiration for error sessions
        clientInfo
      };
      
      this.sessions.set(sessionId, errorSession);
      
      throw new Error(`Failed to create Gemini session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Connect to Gemini Live API for a session
   * @param sessionId Session identifier
   */
  private async connectToGemini(sessionId: string): Promise<void> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      
      // Configuration for Live API
      const config = {
        responseModalities: [Modality.TEXT], // We'll use TEXT for JSON responses
        systemInstruction: COMPLETE_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json", // Request JSON responses
          temperature: 0.2, // Lower temperature for more deterministic responses
          topP: 0.8,
          topK: 40,
        },
        // Configure VAD if needed
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false, // Using server-side VAD
            startOfSpeechSensitivity: "START_SENSITIVITY_MEDIUM",
            endOfSpeechSensitivity: "END_SENSITIVITY_MEDIUM",
            prefixPaddingMs: 20,
            silenceDurationMs: 700,
          }
        },
        // Enable input transcription for debugging
        inputAudioTranscription: {},
      };
      
      // Create callbacks for session events
      const callbacks = {
        onopen: () => {
          console.log(`Gemini session ${sessionId} connected`);
          const session = this.sessions.get(sessionId);
          if (session) {
            session.state = SessionState.ACTIVE;
            session.updatedAt = Date.now();
            this.sessions.set(sessionId, session);
          }
          this.emit(GeminiServiceEvent.CONNECTED, { sessionId });
        },
        onmessage: (message: any) => {
          this.handleGeminiMessage(sessionId, message);
        },
        onerror: (error: any) => {
          console.error(`Gemini session ${sessionId} error:`, error);
          this.emit(GeminiServiceEvent.ERROR, { 
            sessionId, 
            error: error instanceof Error ? error.message : String(error) 
          });
          
          // Try to reconnect
          this.handleReconnection(sessionId);
        },
        onclose: (event: any) => {
          console.log(`Gemini session ${sessionId} closed:`, event?.reason || 'Unknown reason');
          
          const session = this.sessions.get(sessionId);
          if (session) {
            session.state = SessionState.CLOSED;
            session.updatedAt = Date.now();
            this.sessions.set(sessionId, session);
          }
          
          this.emit(GeminiServiceEvent.DISCONNECTED, { 
            sessionId, 
            reason: event?.reason || 'Unknown reason' 
          });
          
          // Try to reconnect if not intentionally closed
          if (event?.code !== 1000) {
            this.handleReconnection(sessionId);
          }
        }
      };
      
      // Connect to Gemini Live API
      const geminiSession = await model.startLiveSession({
        config,
        callbacks
      });
      
      // Store Gemini session
      this.geminiSessions.set(sessionId, geminiSession);
      
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts.set(sessionId, 0);
    } catch (error) {
      console.error(`Failed to connect to Gemini for session ${sessionId}:`, error);
      throw new Error(`Failed to connect to Gemini: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle messages from Gemini
   * @param sessionId Session identifier
   * @param message Message from Gemini
   */
  private handleGeminiMessage(sessionId: string, message: any): void {
    try {
      // Update session timestamp
      const session = this.sessions.get(sessionId);
      if (session) {
        session.updatedAt = Date.now();
        this.sessions.set(sessionId, session);
      }
      
      // Handle different message types
      if (message.text) {
        // Try to parse as JSON for NLU response
        try {
          const nluResponse = JSON.parse(message.text) as NLUResponse;
          this.emit(GeminiServiceEvent.NLU_RESPONSE, { sessionId, nluResponse });
        } catch (e) {
          // If not valid JSON, treat as regular text
          console.warn(`Received non-JSON text from Gemini for session ${sessionId}:`, message.text);
        }
      } else if (message.data) {
        // Handle binary data (audio response)
        this.emit(GeminiServiceEvent.AUDIO_RESPONSE, { 
          sessionId, 
          audio: {
            data: message.data,
            mimeType: "audio/pcm;rate=24000" // Gemini returns 24kHz audio
          }
        });
      } else if (message.serverContent) {
        // Handle server content
        if (message.serverContent.inputTranscription) {
          // Input transcription (what Gemini heard)
          const transcript: TranscriptResponse = {
            text: message.serverContent.inputTranscription.text,
            isFinal: true
          };
          this.emit(GeminiServiceEvent.TRANSCRIPT, { sessionId, transcript });
        }
        
        if (message.serverContent.outputTranscription) {
          // Output transcription (what Gemini is saying)
          console.log(`Output transcription for session ${sessionId}:`, 
            message.serverContent.outputTranscription.text);
        }
        
        if (message.serverContent.modelTurn) {
          // Model turn (for debugging)
          console.log(`Model turn for session ${sessionId}:`, 
            JSON.stringify(message.serverContent.modelTurn));
        }
        
        // Check for usage metadata
        if (message.usageMetadata) {
          const tokenUsage: TokenUsage = {
            promptTokens: message.usageMetadata.promptTokenCount || 0,
            completionTokens: message.usageMetadata.candidatesTokenCount || 0,
            totalTokens: message.usageMetadata.totalTokenCount || 0
          };
          console.log(`Token usage for session ${sessionId}:`, tokenUsage);
        }
      }
    } catch (error) {
      console.error(`Error handling Gemini message for session ${sessionId}:`, error);
    }
  }

  /**
   * Handle reconnection logic
   * @param sessionId Session identifier
   */
  private async handleReconnection(sessionId: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(sessionId) || 0;
    
    if (attempts >= RECONNECT_MAX_ATTEMPTS) {
      console.error(`Max reconnection attempts reached for session ${sessionId}`);
      
      // Update session state
      const session = this.sessions.get(sessionId);
      if (session) {
        session.state = SessionState.ERROR;
        session.updatedAt = Date.now();
        this.sessions.set(sessionId, session);
      }
      
      this.emit(GeminiServiceEvent.SESSION_EXPIRED, { sessionId });
      return;
    }
    
    // Exponential backoff
    const delay = RECONNECT_BASE_DELAY_MS * Math.pow(2, attempts);
    console.log(`Reconnecting to Gemini for session ${sessionId} in ${delay}ms (attempt ${attempts + 1}/${RECONNECT_MAX_ATTEMPTS})`);
    
    // Increment reconnect attempts
    this.reconnectAttempts.set(sessionId, attempts + 1);
    
    // Wait before reconnecting
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      // Try to reconnect
      await this.connectToGemini(sessionId);
    } catch (error) {
      console.error(`Failed to reconnect to Gemini for session ${sessionId}:`, error);
      
      // Continue with reconnection attempts
      this.handleReconnection(sessionId);
    }
  }

  /**
   * Stream audio data to Gemini
   * @param sessionId Session identifier
   * @param audioMessage Audio message
   */
  public async streamAudio(sessionId: string, audioMessage: AudioMessage): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Gemini service is not initialized');
    }
    
    // Check if session exists
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} does not exist`);
    }
    
    const session = this.sessions.get(sessionId)!;
    
    // Check if session is active
    if (session.state !== SessionState.ACTIVE) {
      throw new Error(`Session ${sessionId} is not active (state: ${session.state})`);
    }
    
    // Check if Gemini session exists
    if (!this.geminiSessions.has(sessionId)) {
      throw new Error(`Gemini session for ${sessionId} does not exist`);
    }
    
    try {
      const geminiSession = this.geminiSessions.get(sessionId);
      
      // Convert base64 audio data to binary if needed
      let audioData = audioMessage.audio.data;
      if (typeof audioData === 'string') {
        // Decode base64 to binary
        const buffer = Buffer.from(audioData, 'base64');
        audioData = new Uint8Array(buffer).buffer;
      }
      
      // Stream audio to Gemini
      await geminiSession.sendAudio({
        audio: audioData,
        mimeType: audioMessage.audio.mimeType || "audio/pcm;rate=16000"
      });
      
      // Update session timestamp
      session.updatedAt = Date.now();
      this.sessions.set(sessionId, session);
    } catch (error) {
      console.error(`Failed to stream audio for session ${sessionId}:`, error);
      
      // Try to reconnect
      this.handleReconnection(sessionId);
      
      throw new Error(`Failed to stream audio: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send end of speech signal to Gemini
   * @param sessionId Session identifier
   */
  public async sendEndOfSpeech(sessionId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Gemini service is not initialized');
    }
    
    // Check if session exists
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} does not exist`);
    }
    
    // Check if Gemini session exists
    if (!this.geminiSessions.has(sessionId)) {
      throw new Error(`Gemini session for ${sessionId} does not exist`);
    }
    
    try {
      const geminiSession = this.geminiSessions.get(sessionId);
      
      // Send end of speech signal
      await geminiSession.sendEndOfSpeech();
      
      // Update session timestamp
      const session = this.sessions.get(sessionId)!;
      session.updatedAt = Date.now();
      this.sessions.set(sessionId, session);
    } catch (error) {
      console.error(`Failed to send end of speech for session ${sessionId}:`, error);
      throw new Error(`Failed to send end of speech: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send text input to Gemini
   * @param sessionId Session identifier
   * @param text Text to send
   */
  public async sendText(sessionId: string, text: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Gemini service is not initialized');
    }
    
    // Check if session exists
    if (!this.sessions.has(sessionId)) {
      throw new Error(`Session ${sessionId} does not exist`);
    }
    
    // Check if Gemini session exists
    if (!this.geminiSessions.has(sessionId)) {
      throw new Error(`Gemini session for ${sessionId} does not exist`);
    }
    
    try {
      const geminiSession = this.geminiSessions.get(sessionId);
      
      // Send text to Gemini
      await geminiSession.sendText(text);
      
      // Update session timestamp
      const session = this.sessions.get(sessionId)!;
      session.updatedAt = Date.now();
      this.sessions.set(sessionId, session);
    } catch (error) {
      console.error(`Failed to send text for session ${sessionId}:`, error);
      throw new Error(`Failed to send text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Close a session
   * @param sessionId Session identifier
   */
  public async closeSession(sessionId: string): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      return; // Session already closed or doesn't exist
    }
    
    try {
      // Close Gemini session if it exists
      if (this.geminiSessions.has(sessionId)) {
        const geminiSession = this.geminiSessions.get(sessionId);
        await geminiSession.close();
        this.geminiSessions.delete(sessionId);
      }
      
      // Update session state
      const session = this.sessions.get(sessionId)!;
      session.state = SessionState.CLOSED;
      session.updatedAt = Date.now();
      this.sessions.set(sessionId, session);
      
      console.log(`Session ${sessionId} closed`);
    } catch (error) {
      console.error(`Error closing session ${sessionId}:`, error);
    } finally {
      // Clean up reconnect attempts
      this.reconnectAttempts.delete(sessionId);
    }
  }

  /**
   * Get session by ID
   * @param sessionId Session identifier
   */
  public getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  public getActiveSessions(): Session[] {
    return Array.from(this.sessions.values())
      .filter(session => session.state === SessionState.ACTIVE);
  }

  /**
   * Clean up expired sessions
   */
  public cleanupExpiredSessions(): void {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        console.log(`Session ${sessionId} expired`);
        this.closeSession(sessionId);
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
