/**
 * Audio Processor Utility
 * 
 * Provides utilities for real-time audio processing including:
 * - Float32Array to Int16Array conversion (PCM)
 * - Audio resampling to 16kHz
 * - Audio chunk management
 * - Audio level detection
 */

// Constants for audio processing
export const SAMPLE_RATE_TARGET = 16000; // 16kHz for Gemini API
export const DEFAULT_FRAME_SIZE = 4096; // Default size for audio processing frames
export const MAX_AUDIO_LEVEL = 32767; // Maximum value for 16-bit audio

/**
 * Converts Float32Array audio samples (-1.0 to 1.0) to Int16Array PCM format (-32768 to 32767)
 * Required for sending audio to Gemini API which expects 16-bit PCM
 */
export function convertToInt16PCM(float32Audio: Float32Array): Int16Array {
  const int16Audio = new Int16Array(float32Audio.length);
  
  for (let i = 0; i < float32Audio.length; i++) {
    // Convert float32 in range [-1, 1] to int16 in range [-32768, 32767]
    // Clip to avoid overflow
    const sample = Math.max(-1, Math.min(1, float32Audio[i]));
    int16Audio[i] = Math.round(sample * 32767);
  }
  
  return int16Audio;
}

/**
 * Simple linear resampler to convert audio from source sample rate to target sample rate
 * Note: For production, consider using a more sophisticated resampling library
 */
export function resampleAudio(
  audioData: Float32Array, 
  originalSampleRate: number, 
  targetSampleRate: number = SAMPLE_RATE_TARGET
): Float32Array {
  if (originalSampleRate === targetSampleRate) {
    return audioData;
  }
  
  const ratio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    // Simple linear interpolation
    const position = i * ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    
    if (index + 1 < audioData.length) {
      result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
    } else {
      result[i] = audioData[index];
    }
  }
  
  return result;
}

/**
 * Process raw audio data: resample and convert to 16-bit PCM
 */
export function processAudioData(
  rawAudio: Float32Array,
  sourceSampleRate: number,
  targetSampleRate: number = SAMPLE_RATE_TARGET
): Int16Array {
  // Step 1: Resample to target sample rate (usually 16kHz)
  const resampledAudio = resampleAudio(rawAudio, sourceSampleRate, targetSampleRate);
  
  // Step 2: Convert to 16-bit PCM
  return convertToInt16PCM(resampledAudio);
}

/**
 * Audio Chunk Manager for handling streaming audio data
 */
export class AudioChunkManager {
  private chunks: Int16Array[] = [];
  private totalSamples: number = 0;
  
  /**
   * Add a new audio chunk to the manager
   */
  addChunk(chunk: Int16Array): void {
    this.chunks.push(chunk);
    this.totalSamples += chunk.length;
  }
  
  /**
   * Get all chunks combined into a single Int16Array
   */
  getAllChunks(): Int16Array {
    if (this.chunks.length === 0) {
      return new Int16Array(0);
    }
    
    const result = new Int16Array(this.totalSamples);
    let offset = 0;
    
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }
  
  /**
   * Clear all stored chunks
   */
  clear(): void {
    this.chunks = [];
    this.totalSamples = 0;
  }
  
  /**
   * Get the total number of samples across all chunks
   */
  getTotalSamples(): number {
    return this.totalSamples;
  }
  
  /**
   * Get the total duration in seconds
   */
  getDuration(sampleRate: number): number {
    return this.totalSamples / sampleRate;
  }
}

/**
 * Calculate RMS (Root Mean Square) audio level from PCM data
 * Returns a value between 0 and 1
 */
export function calculateAudioLevel(audioData: Float32Array | Int16Array): number {
  if (audioData.length === 0) return 0;
  
  let sumSquares = 0;
  
  if (audioData instanceof Float32Array) {
    // For Float32Array: values between -1 and 1
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sumSquares / audioData.length);
    return Math.min(1, rms); // Normalize between 0 and 1
  } else {
    // For Int16Array: values between -32768 and 32767
    for (let i = 0; i < audioData.length; i++) {
      sumSquares += (audioData[i] / 32767) * (audioData[i] / 32767);
    }
    const rms = Math.sqrt(sumSquares / audioData.length);
    return Math.min(1, rms); // Normalize between 0 and 1
  }
}

/**
 * Detect if audio contains speech based on energy levels
 * Simple threshold-based VAD (Voice Activity Detection)
 * Note: For production, consider using a more sophisticated VAD library
 */
export function detectSpeech(
  audioData: Float32Array | Int16Array, 
  threshold: number = 0.01
): boolean {
  const level = calculateAudioLevel(audioData);
  return level > threshold;
}

/**
 * Create a blob from Int16Array for sending to server
 */
export function createAudioBlob(pcmData: Int16Array): Blob {
  const buffer = new ArrayBuffer(pcmData.length * 2); // 2 bytes per sample for Int16
  const view = new DataView(buffer);
  
  for (let i = 0; i < pcmData.length; i++) {
    view.setInt16(i * 2, pcmData[i], true); // true for little-endian
  }
  
  return new Blob([buffer], { type: 'audio/pcm' });
}

/**
 * Utility to create an AudioWorklet processor string
 * This returns a string containing the code for an AudioWorklet processor
 * that can be loaded using audioContext.audioWorklet.addModule(URL.createObjectURL(new Blob([code])))
 */
export function createAudioWorkletProcessorCode(frameSize: number = DEFAULT_FRAME_SIZE): string {
  return `
    class AuraAudioProcessor extends AudioWorkletProcessor {
      constructor() {
        super();
        this.frameSize = ${frameSize};
        this.buffer = new Float32Array(this.frameSize);
        this.bufferIndex = 0;
      }
      
      process(inputs, outputs, parameters) {
        const input = inputs[0][0]; // Mono input (first channel)
        
        if (!input) return true;
        
        // Copy input samples to buffer
        for (let i = 0; i < input.length; i++) {
          this.buffer[this.bufferIndex++] = input[i];
          
          // When buffer is full, send it to main thread and reset
          if (this.bufferIndex >= this.frameSize) {
            // Clone the buffer to avoid issues with shared memory
            const bufferCopy = this.buffer.slice(0);
            this.port.postMessage({
              eventType: 'audio',
              audioData: bufferCopy,
              sampleRate: sampleRate // AudioWorkletGlobalScope provides this
            });
            
            this.bufferIndex = 0;
          }
        }
        
        return true; // Keep processor alive
      }
    }
    
    registerProcessor('aura-audio-processor', AuraAudioProcessor);
  `;
}
