/**
 * Aura Voice Shop Server
 * 
 * Main Express server that:
 * - Sets up HTTP server with CORS for React frontend
 * - Configures WebSocket server for voice communication
 * - Handles WebSocket connections and messages
 * - Bridges client WebSocket to Gemini service
 * - Implements health check endpoint
 * - Handles graceful shutdown
 */

import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { 
  AnyClientMessage, 
  AudioMessage,
  ClientMessageType,
  EndOfSpeechMessage,
  ServerMessageType,
  SessionState,
  TextMessage
} from './types/voice.types';
import { geminiService, GeminiServiceEvent } from './services/geminiService';

// Load environment variables
dotenv.config();

// Configuration constants
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const WS_PATH = process.env.WS_PATH || '/api/voice-command';
const SESSION_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: CLIENT_ORIGIN,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    geminiServiceReady: geminiService.isReady(),
    activeSessions: geminiService.getActiveSessions().length
  };
  
  res.status(200).json(health);
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: WS_PATH
});

// Client session tracking
interface ClientSession {
  id: string;
  ws: WebSocket;
  geminiSessionId: string;
  createdAt: number;
  lastActivity: number;
  userAgent?: string;
  ip?: string;
}

const clientSessions = new Map<string, ClientSession>();

// Initialize Gemini service
async function initializeGeminiService() {
  try {
    await geminiService.initialize();
    console.log('Gemini service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Gemini service:', error);
    // Continue running the server even if Gemini service fails to initialize
    // It will attempt to initialize when the first client connects
  }
}

// WebSocket connection handler
wss.on('connection', async (ws, req) => {
  // Generate client session ID
  const clientId = uuidv4();
  const geminiSessionId = uuidv4();
  
  console.log(`New WebSocket connection: ${clientId}`);
  
  // Extract client info
  const userAgent = req.headers['user-agent'];
  const ip = req.socket.remoteAddress;
  
  // Create client session
  const clientSession: ClientSession = {
    id: clientId,
    ws,
    geminiSessionId,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    userAgent,
    ip
  };
  
  clientSessions.set(clientId, clientSession);
  
  // Send initial session info to client
  sendToClient(ws, {
    type: ServerMessageType.SESSION,
    timestamp: Date.now(),
    sessionId: clientId
  });
  
  // Initialize Gemini session
  try {
    // Make sure Gemini service is initialized
    if (!geminiService.isReady()) {
      await geminiService.initialize();
    }
    
    // Create Gemini session
    await geminiService.createSession(geminiSessionId, { userAgent, ip });
    
    // Set up Gemini service event listeners for this client
    setupGeminiEventListeners(clientId, geminiSessionId, ws);
    
    console.log(`Gemini session created for client ${clientId}: ${geminiSessionId}`);
  } catch (error) {
    console.error(`Failed to create Gemini session for client ${clientId}:`, error);
    
    // Send error to client
    sendToClient(ws, {
      type: ServerMessageType.ERROR,
      timestamp: Date.now(),
      sessionId: clientId,
      message: 'Failed to initialize voice service',
      code: 'GEMINI_INIT_ERROR'
    });
  }
  
  // WebSocket message handler
  ws.on('message', async (message: WebSocket.Data) => {
    try {
      // Update last activity timestamp
      clientSession.lastActivity = Date.now();
      
      // Parse message
      const clientMessage = parseClientMessage(message);
      
      if (!clientMessage) {
        console.warn(`Invalid message from client ${clientId}`);
        return;
      }
      
      // Handle message based on type
      switch (clientMessage.type) {
        case ClientMessageType.AUDIO:
          await handleAudioMessage(clientId, geminiSessionId, clientMessage as AudioMessage);
          break;
          
        case ClientMessageType.TEXT:
          await handleTextMessage(clientId, geminiSessionId, clientMessage as TextMessage);
          break;
          
        case ClientMessageType.END_OF_SPEECH:
          await handleEndOfSpeechMessage(clientId, geminiSessionId, clientMessage as EndOfSpeechMessage);
          break;
          
        case ClientMessageType.PING:
          // Respond with pong
          sendToClient(ws, {
            type: ServerMessageType.PONG,
            timestamp: Date.now(),
            sessionId: clientId
          });
          break;
          
        case ClientMessageType.END_SESSION:
          // Close Gemini session
          await geminiService.closeSession(geminiSessionId);
          break;
          
        case ClientMessageType.COMMAND:
          // Handle custom commands (not implemented in this version)
          console.log(`Command from client ${clientId}:`, clientMessage);
          break;
          
        default:
          console.warn(`Unknown message type from client ${clientId}:`, clientMessage.type);
      }
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
      
      // Send error to client
      sendToClient(ws, {
        type: ServerMessageType.ERROR,
        timestamp: Date.now(),
        sessionId: clientId,
        message: `Error processing message: ${error instanceof Error ? error.message : String(error)}`,
        code: 'MESSAGE_PROCESSING_ERROR'
      });
    }
  });
  
  // WebSocket close handler
  ws.on('close', async () => {
    console.log(`WebSocket connection closed: ${clientId}`);
    
    try {
      // Close Gemini session
      await geminiService.closeSession(geminiSessionId);
      
      // Remove client session
      clientSessions.delete(clientId);
    } catch (error) {
      console.error(`Error closing session for client ${clientId}:`, error);
    }
  });
  
  // WebSocket error handler
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

/**
 * Parse client message
 * @param message Raw WebSocket message
 * @returns Parsed client message or null if invalid
 */
function parseClientMessage(message: WebSocket.Data): AnyClientMessage | null {
  try {
    // Check if message is binary (audio data)
    if (message instanceof Buffer) {
      // This is likely binary audio data without proper metadata
      // We expect audio to be sent with metadata in a JSON message
      console.warn('Received raw binary data without metadata, ignoring');
      return null;
    }
    
    // Parse JSON message
    const parsed = JSON.parse(message.toString()) as AnyClientMessage;
    
    // Validate message has required fields
    if (!parsed.type || !parsed.timestamp) {
      console.warn('Invalid message format, missing required fields');
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse client message:', error);
    return null;
  }
}

/**
 * Handle audio message from client
 * @param clientId Client session ID
 * @param geminiSessionId Gemini session ID
 * @param message Audio message
 */
async function handleAudioMessage(clientId: string, geminiSessionId: string, message: AudioMessage): Promise<void> {
  try {
    // Stream audio to Gemini
    await geminiService.streamAudio(geminiSessionId, message);
  } catch (error) {
    console.error(`Failed to stream audio for client ${clientId}:`, error);
    
    // Get client session
    const clientSession = clientSessions.get(clientId);
    if (!clientSession) return;
    
    // Send error to client
    sendToClient(clientSession.ws, {
      type: ServerMessageType.ERROR,
      timestamp: Date.now(),
      sessionId: clientId,
      message: `Failed to process audio: ${error instanceof Error ? error.message : String(error)}`,
      code: 'AUDIO_PROCESSING_ERROR'
    });
  }
}

/**
 * Handle text message from client
 * @param clientId Client session ID
 * @param geminiSessionId Gemini session ID
 * @param message Text message
 */
async function handleTextMessage(clientId: string, geminiSessionId: string, message: TextMessage): Promise<void> {
  try {
    // Send text to Gemini
    await geminiService.sendText(geminiSessionId, message.text);
  } catch (error) {
    console.error(`Failed to send text for client ${clientId}:`, error);
    
    // Get client session
    const clientSession = clientSessions.get(clientId);
    if (!clientSession) return;
    
    // Send error to client
    sendToClient(clientSession.ws, {
      type: ServerMessageType.ERROR,
      timestamp: Date.now(),
      sessionId: clientId,
      message: `Failed to process text: ${error instanceof Error ? error.message : String(error)}`,
      code: 'TEXT_PROCESSING_ERROR'
    });
  }
}

/**
 * Handle end of speech message from client
 * @param clientId Client session ID
 * @param geminiSessionId Gemini session ID
 * @param message End of speech message
 */
async function handleEndOfSpeechMessage(clientId: string, geminiSessionId: string, message: EndOfSpeechMessage): Promise<void> {
  try {
    // Send end of speech signal to Gemini
    await geminiService.sendEndOfSpeech(geminiSessionId);
  } catch (error) {
    console.error(`Failed to send end of speech for client ${clientId}:`, error);
    
    // Get client session
    const clientSession = clientSessions.get(clientId);
    if (!clientSession) return;
    
    // Send error to client
    sendToClient(clientSession.ws, {
      type: ServerMessageType.ERROR,
      timestamp: Date.now(),
      sessionId: clientId,
      message: `Failed to process end of speech: ${error instanceof Error ? error.message : String(error)}`,
      code: 'END_OF_SPEECH_ERROR'
    });
  }
}

/**
 * Set up Gemini service event listeners for a client
 * @param clientId Client session ID
 * @param geminiSessionId Gemini session ID
 * @param ws WebSocket connection
 */
function setupGeminiEventListeners(clientId: string, geminiSessionId: string, ws: WebSocket): void {
  // Transcript event
  geminiService.on(GeminiServiceEvent.TRANSCRIPT, (event) => {
    if (event.sessionId !== geminiSessionId) return;
    
    // Send transcript to client
    sendToClient(ws, {
      type: ServerMessageType.TRANSCRIPT,
      timestamp: Date.now(),
      sessionId: clientId,
      text: event.transcript.text,
      isFinal: event.transcript.isFinal,
      confidence: event.transcript.confidence
    });
  });
  
  // NLU response event
  geminiService.on(GeminiServiceEvent.NLU_RESPONSE, (event) => {
    if (event.sessionId !== geminiSessionId) return;
    
    // Send NLU response to client
    sendToClient(ws, {
      type: ServerMessageType.NLU,
      timestamp: Date.now(),
      sessionId: clientId,
      nlu: event.nluResponse
    });
  });
  
  // Audio response event
  geminiService.on(GeminiServiceEvent.AUDIO_RESPONSE, (event) => {
    if (event.sessionId !== geminiSessionId) return;
    
    // Send audio response to client
    sendToClient(ws, {
      type: ServerMessageType.AUDIO,
      timestamp: Date.now(),
      sessionId: clientId,
      audio: event.audio
    });
  });
  
  // Error event
  geminiService.on(GeminiServiceEvent.ERROR, (event) => {
    if (event.sessionId !== geminiSessionId) return;
    
    // Send error to client
    sendToClient(ws, {
      type: ServerMessageType.ERROR,
      timestamp: Date.now(),
      sessionId: clientId,
      message: `Gemini service error: ${event.error}`,
      code: 'GEMINI_SERVICE_ERROR'
    });
  });
  
  // Session expired event
  geminiService.on(GeminiServiceEvent.SESSION_EXPIRED, (event) => {
    if (event.sessionId !== geminiSessionId) return;
    
    // Send error to client
    sendToClient(ws, {
      type: ServerMessageType.ERROR,
      timestamp: Date.now(),
      sessionId: clientId,
      message: 'Voice service session expired',
      code: 'SESSION_EXPIRED'
    });
    
    // Close WebSocket connection
    ws.close(1000, 'Session expired');
  });
}

/**
 * Send message to client
 * @param ws WebSocket connection
 * @param message Message to send
 */
function sendToClient(ws: WebSocket, message: any): void {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }
  
  try {
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Failed to send message to client:', error);
  }
}

// Periodic cleanup of expired sessions
setInterval(() => {
  try {
    geminiService.cleanupExpiredSessions();
    
    // Cleanup inactive client sessions (1 hour of inactivity)
    const now = Date.now();
    const inactivityThreshold = 60 * 60 * 1000; // 1 hour
    
    for (const [clientId, session] of clientSessions.entries()) {
      if (now - session.lastActivity > inactivityThreshold) {
        console.log(`Closing inactive client session: ${clientId}`);
        
        // Close WebSocket connection
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.close(1000, 'Session inactive');
        }
        
        // Close Gemini session
        geminiService.closeSession(session.geminiSessionId);
        
        // Remove client session
        clientSessions.delete(clientId);
      }
    }
  } catch (error) {
    console.error('Error during session cleanup:', error);
  }
}, SESSION_CLEANUP_INTERVAL);

// Start server
server.listen(PORT, async () => {
  console.log(`Aura Voice Shop server listening on port ${PORT}`);
  
  // Initialize Gemini service
  await initializeGeminiService();
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown() {
  console.log('Shutting down gracefully...');
  
  // Close all client WebSocket connections
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.close(1000, 'Server shutting down');
    }
  });
  
  // Close all Gemini sessions
  for (const [clientId, session] of clientSessions.entries()) {
    try {
      await geminiService.closeSession(session.geminiSessionId);
    } catch (error) {
      console.error(`Error closing Gemini session for client ${clientId}:`, error);
    }
  }
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force exit after timeout
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

export default app;
