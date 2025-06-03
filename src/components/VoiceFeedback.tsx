
import React from 'react';
import { useVoiceStore } from '../stores/voiceStore';

const VoiceFeedback = () => {
  const { 
    isListening, 
    isProcessing, 
    transcript, 
    error, 
    audioLevel,
    lastCommand,
    currentIntent
  } = useVoiceStore();

  if (!isListening && !isProcessing && !transcript && !error) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-white rounded-lg shadow-lg border p-4 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              error ? 'bg-red-500' :
              isProcessing ? 'bg-yellow-500 animate-pulse' :
              isListening ? 'bg-red-500 animate-pulse' :
              'bg-green-500'
            }`}></div>
            <span className="font-medium text-gray-900">
              {error ? 'Error' :
               isProcessing ? 'Processing...' :
               isListening ? 'Listening...' :
               'Voice Command'}
            </span>
          </div>
          
          {/* Audio Level Indicator */}
          {isListening && (
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-4 bg-purple-600 rounded transition-opacity ${
                    audioLevel * 5 > i ? 'opacity-100' : 'opacity-30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Error Message */}
          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600 mb-1">You said:</p>
              <p className="font-medium text-gray-900">"{transcript}"</p>
            </div>
          )}

          {/* Last Command with Intent */}
          {lastCommand && (
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-600 mb-1">
                Action taken {currentIntent && `(${currentIntent})`}:
              </p>
              <p className="font-medium text-purple-900">{lastCommand}</p>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-sm">Processing your command...</span>
            </div>
          )}

          {/* Listening State */}
          {isListening && !transcript && (
            <div className="text-gray-600 text-sm">
              <p>Speak now... (or say "stop" to cancel)</p>
              <div className="mt-2 text-xs text-gray-500">
                Try navigation: "Go home" • "Show products" • "Show cart"
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Voice Commands Help */}
        {!isListening && !isProcessing && !error && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Voice commands you can try:</p>
            <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
              <div className="font-medium text-purple-600 mb-1">Navigation:</div>
              <div>"Go home" • "Show products" • "Show cart"</div>
              <div className="font-medium text-purple-600 mb-1 mt-2">Shopping:</div>
              <div>"Search for [product]" • "Show me [category]"</div>
              <div>"Add first item to cart" • "Clear cart"</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceFeedback;
