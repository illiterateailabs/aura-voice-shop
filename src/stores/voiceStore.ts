
import { create } from 'zustand';

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  lastCommand: string;
  error: string | null;
  audioLevel: number;
  isConnected: boolean;
  currentIntent: string | null;
}

interface VoiceActions {
  setListening: (listening: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setTranscript: (transcript: string) => void;
  setConfidence: (confidence: number) => void;
  setLastCommand: (command: string) => void;
  setError: (error: string | null) => void;
  setAudioLevel: (level: number) => void;
  setConnected: (connected: boolean) => void;
  setCurrentIntent: (intent: string | null) => void;
  reset: () => void;
}

type VoiceStore = VoiceState & VoiceActions;

const initialState: VoiceState = {
  isListening: false,
  isProcessing: false,
  transcript: '',
  confidence: 0,
  lastCommand: '',
  error: null,
  audioLevel: 0,
  isConnected: false,
  currentIntent: null,
};

export const useVoiceStore = create<VoiceStore>((set) => ({
  ...initialState,
  
  setListening: (listening) => set({ isListening: listening }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setTranscript: (transcript) => set({ transcript }),
  setConfidence: (confidence) => set({ confidence }),
  setLastCommand: (command) => set({ lastCommand: command }),
  setError: (error) => set({ error }),
  setAudioLevel: (level) => set({ audioLevel: level }),
  setConnected: (connected) => set({ isConnected: connected }),
  setCurrentIntent: (intent) => set({ currentIntent: intent }),
  
  reset: () => set(initialState),
}));
