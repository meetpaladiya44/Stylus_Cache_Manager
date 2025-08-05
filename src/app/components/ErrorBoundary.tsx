"use client";

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorDisplayProps {
  error?: string | null;
  onRetry?: () => void;
  onReset?: () => void;
  showDetails?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onReset,
  showDetails = false,
  className = ""
}) => {
  const [showFullError, setShowFullError] = React.useState(false);

  if (!error) return null;

  return (
    <div className={`bg-red-900/20 border border-red-500/30 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Something went wrong
          </h3>
          
          <p className="text-red-200 mb-4">
            {error.length > 100 && !showFullError 
              ? `${error.substring(0, 100)}...` 
              : error
            }
          </p>

          {error.length > 100 && (
            <button
              onClick={() => setShowFullError(!showFullError)}
              className="text-red-400 hover:text-red-300 text-sm underline mb-4"
            >
              {showFullError ? 'Show less' : 'Show more'}
            </button>
          )}

          <div className="flex flex-wrap gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
            
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-gray-300 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <Home className="w-4 h-4" />
                Reset
              </button>
            )}

            {showDetails && (
              <button
                onClick={() => {
                  console.error('Error details:', error);
                  // You could also open a modal with more details here
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-gray-400 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                <Bug className="w-4 h-4" />
                Debug Info
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;