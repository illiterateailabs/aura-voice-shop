/**
 * Voice Activity Detection (VAD) Utility
 * 
 * Provides real-time detection of speech in audio streams with:
 * - Energy-based detection with dynamic thresholds
 * - Automatic background noise adaptation
 * - Configurable speech start/end detection timeouts
 * - Event-based architecture for speech events
 */

import { calculateAudioLevel } from './audioProcessor';

// Types for VAD events
export type VADEventType = 'speechStart' | 'speechEnd' | 'audioLevel' | 'error';

export interface VADEvent {
  type: VADEventType;
  timestamp: number;
  data?: any;
}

export type VADEventListener = (event: VADEvent) => void;

// Configuration options for VAD
export interface VADConfig {
  // Energy threshold multiplier above background noise level to trigger speech
  energyThresholdMultiplier: number;
  
  // Minimum energy level to consider as speech (0-1)
  minSpeechEnergy: number;
  
  // Maximum energy level to normalize calculations (0-1)
  maxSpeechEnergy: number;
  
  // Time in ms that audio energy must exceed threshold to trigger speech start
  speechStartThresholdTime: number;
  
  // Time in ms that audio energy must be below threshold to trigger speech end
  speechEndThresholdTime: number;
  
  // Time in ms for the maximum allowed speech duration
  maxSpeechDuration: number;
  
  // How quickly the background noise level adapts (0-1, higher = faster)
  noiseAdaptationRate: number;
  
  // How often in ms to update background noise when no speech is detected
  noiseUpdateIntervalMs: number;
}

// Default VAD configuration
export const DEFAULT_VAD_CONFIG: VADConfig = {
  energyThresholdMultiplier: 2.0,
  minSpeechEnergy: 0.01,
  maxSpeechEnergy: 0.5,
  speechStartThresholdTime: 200,
  speechEndThresholdTime: 500,
  maxSpeechDuration: 15000,
  noiseAdaptationRate: 0.1,
  noiseUpdateIntervalMs: 500
};

/**
 * Voice Activity Detector class
 * Detects speech in audio streams using energy-based detection with
 * dynamic thresholds and background noise adaptation
 */
export class VoiceActivityDetector {
  private config: VADConfig;
  private eventListeners: Map<VADEventType, VADEventListener[]> = new Map();
  
  // VAD state
  private isActive: boolean = false;
  private isSpeechDetected: boolean = false;
  private backgroundNoiseLevel: number = 0.01;
  private currentThreshold: number = 0.02;
  private speechStartTime: number | null = null;
  private consecutiveFramesAboveThreshold: number = 0;
  private consecutiveFramesBelowThreshold: number = 0;
  private lastProcessTimestamp: number = 0;
  private noiseUpdateTimer: number | null = null;
  private maxSpeechTimer: number | null = null;
  
  // Audio history for noise adaptation
  private recentEnergyLevels: number[] = [];
  private readonly ENERGY_HISTORY_SIZE = 50;
  
  /**
   * Create a new Voice Activity Detector
   */
  constructor(config: Partial<VADConfig> = {}) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...config };
    this.initializeNoiseLevel();
  }
  
  /**
   * Initialize the background noise level
   */
  private initializeNoiseLevel(): void {
    this.backgroundNoiseLevel = this.config.minSpeechEnergy;
    this.updateThreshold();
  }
  
  /**
   * Start the VAD
   */
  public start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.startNoiseUpdateTimer();
    
    // Reset speech detection state
    this.isSpeechDetected = false;
    this.speechStartTime = null;
    this.consecutiveFramesAboveThreshold = 0;
    this.consecutiveFramesBelowThreshold = 0;
  }
  
  /**
   * Stop the VAD
   */
  public stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.stopNoiseUpdateTimer();
    this.stopMaxSpeechTimer();
    
    // If speech was in progress, emit speechEnd event
    if (this.isSpeechDetected) {
      this.endSpeech();
    }
  }
  
  /**
   * Reset the VAD state
   */
  public reset(): void {
    this.stop();
    this.initializeNoiseLevel();
    this.recentEnergyLevels = [];
    this.start();
  }
  
  /**
   * Process an audio frame for speech detection
   */
  public processAudioFrame(audioData: Float32Array | Int16Array): void {
    if (!this.isActive) return;
    
    const now = Date.now();
    this.lastProcessTimestamp = now;
    
    // Calculate energy level of the audio frame
    const energyLevel = calculateAudioLevel(audioData);
    
    // Update recent energy levels history
    this.updateEnergyHistory(energyLevel);
    
    // Emit audio level event
    this.emitEvent('audioLevel', { level: energyLevel, threshold: this.currentThreshold });
    
    // Check if energy level exceeds threshold
    if (energyLevel >= this.currentThreshold) {
      this.handleEnergyAboveThreshold(energyLevel, now);
    } else {
      this.handleEnergyBelowThreshold(energyLevel, now);
    }
  }
  
  /**
   * Handle audio frame with energy above threshold
   */
  private handleEnergyAboveThreshold(energyLevel: number, timestamp: number): void {
    this.consecutiveFramesAboveThreshold++;
    this.consecutiveFramesBelowThreshold = 0;
    
    // Check if we've exceeded the speech start threshold time
    if (!this.isSpeechDetected && 
        this.consecutiveFramesAboveThreshold * 20 >= this.config.speechStartThresholdTime) {
      this.startSpeech(timestamp);
    }
  }
  
  /**
   * Handle audio frame with energy below threshold
   */
  private handleEnergyBelowThreshold(energyLevel: number, timestamp: number): void {
    this.consecutiveFramesAboveThreshold = 0;
    
    if (this.isSpeechDetected) {
      this.consecutiveFramesBelowThreshold++;
      
      // Check if we've exceeded the speech end threshold time
      if (this.consecutiveFramesBelowThreshold * 20 >= this.config.speechEndThresholdTime) {
        this.endSpeech();
      }
    } else {
      // If not in speech, this might be background noise - adapt to it
      this.adaptToBackgroundNoise(energyLevel);
    }
  }
  
  /**
   * Start speech detection
   */
  private startSpeech(timestamp: number): void {
    if (this.isSpeechDetected) return;
    
    this.isSpeechDetected = true;
    this.speechStartTime = timestamp;
    this.consecutiveFramesBelowThreshold = 0;
    
    // Start timer for maximum speech duration
    this.startMaxSpeechTimer();
    
    // Emit speech start event
    this.emitEvent('speechStart', { timestamp });
  }
  
  /**
   * End speech detection
   */
  private endSpeech(): void {
    if (!this.isSpeechDetected) return;
    
    this.isSpeechDetected = false;
    const duration = this.speechStartTime ? Date.now() - this.speechStartTime : 0;
    this.speechStartTime = null;
    
    // Stop max speech timer
    this.stopMaxSpeechTimer();
    
    // Emit speech end event
    this.emitEvent('speechEnd', { duration });
    
    // After speech ends, adapt threshold more aggressively
    this.updateThreshold();
  }
  
  /**
   * Start timer for maximum speech duration
   */
  private startMaxSpeechTimer(): void {
    this.stopMaxSpeechTimer();
    
    this.maxSpeechTimer = window.setTimeout(() => {
      if (this.isSpeechDetected) {
        this.endSpeech();
      }
    }, this.config.maxSpeechDuration);
  }
  
  /**
   * Stop timer for maximum speech duration
   */
  private stopMaxSpeechTimer(): void {
    if (this.maxSpeechTimer !== null) {
      clearTimeout(this.maxSpeechTimer);
      this.maxSpeechTimer = null;
    }
  }
  
  /**
   * Start timer for periodic noise level updates
   */
  private startNoiseUpdateTimer(): void {
    this.stopNoiseUpdateTimer();
    
    this.noiseUpdateTimer = window.setInterval(() => {
      if (!this.isSpeechDetected) {
        this.updateBackgroundNoiseLevel();
      }
    }, this.config.noiseUpdateIntervalMs);
  }
  
  /**
   * Stop timer for periodic noise level updates
   */
  private stopNoiseUpdateTimer(): void {
    if (this.noiseUpdateTimer !== null) {
      clearInterval(this.noiseUpdateTimer);
      this.noiseUpdateTimer = null;
    }
  }
  
  /**
   * Update energy level history
   */
  private updateEnergyHistory(energyLevel: number): void {
    this.recentEnergyLevels.push(energyLevel);
    
    if (this.recentEnergyLevels.length > this.ENERGY_HISTORY_SIZE) {
      this.recentEnergyLevels.shift();
    }
  }
  
  /**
   * Adapt to background noise level
   */
  private adaptToBackgroundNoise(energyLevel: number): void {
    // Only adapt if we're not in speech detection mode
    if (!this.isSpeechDetected) {
      // Slowly adapt background noise level towards current energy
      this.backgroundNoiseLevel = 
        (1 - this.config.noiseAdaptationRate) * this.backgroundNoiseLevel + 
        this.config.noiseAdaptationRate * energyLevel;
      
      // Ensure background noise level stays above minimum
      this.backgroundNoiseLevel = Math.max(
        this.config.minSpeechEnergy,
        this.backgroundNoiseLevel
      );
      
      this.updateThreshold();
    }
  }
  
  /**
   * Update background noise level based on recent energy history
   */
  private updateBackgroundNoiseLevel(): void {
    if (this.recentEnergyLevels.length === 0 || this.isSpeechDetected) return;
    
    // Sort energy levels and take the 30th percentile as background noise
    // This helps ignore occasional spikes
    const sortedLevels = [...this.recentEnergyLevels].sort((a, b) => a - b);
    const percentileIndex = Math.floor(sortedLevels.length * 0.3);
    const percentileValue = sortedLevels[percentileIndex];
    
    // Adapt background noise level
    this.backgroundNoiseLevel = 
      (1 - this.config.noiseAdaptationRate) * this.backgroundNoiseLevel + 
      this.config.noiseAdaptationRate * percentileValue;
    
    // Ensure background noise level stays above minimum
    this.backgroundNoiseLevel = Math.max(
      this.config.minSpeechEnergy,
      this.backgroundNoiseLevel
    );
    
    this.updateThreshold();
  }
  
  /**
   * Update the current threshold based on background noise level
   */
  private updateThreshold(): void {
    this.currentThreshold = Math.min(
      this.config.maxSpeechEnergy,
      this.backgroundNoiseLevel * this.config.energyThresholdMultiplier
    );
  }
  
  /**
   * Get current VAD state
   */
  public getState(): {
    isActive: boolean;
    isSpeechDetected: boolean;
    backgroundNoiseLevel: number;
    currentThreshold: number;
  } {
    return {
      isActive: this.isActive,
      isSpeechDetected: this.isSpeechDetected,
      backgroundNoiseLevel: this.backgroundNoiseLevel,
      currentThreshold: this.currentThreshold
    };
  }
  
  /**
   * Add event listener
   */
  public addEventListener(eventType: VADEventType, listener: VADEventListener): void {
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
  public removeEventListener(eventType: VADEventType, listener: VADEventListener): void {
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
  private emitEvent(type: VADEventType, data?: any): void {
    if (!this.eventListeners.has(type)) return;
    
    const event: VADEvent = {
      type,
      timestamp: Date.now(),
      data
    };
    
    const listeners = this.eventListeners.get(type)!;
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in VAD event listener:', error);
      }
    }
  }
}
