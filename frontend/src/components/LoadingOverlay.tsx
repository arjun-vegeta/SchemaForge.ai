import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  stage?: string | null;
  progress?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  stage,
  progress = 0,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-secondary-900/80 backdrop-blur-modern">
      <div className="bg-white dark:bg-secondary-800 rounded-2xl shadow-lg border border-secondary-200 dark:border-secondary-700 p-8 max-w-sm w-full mx-4">
        <div className="text-center space-y-6">
          {/* Loading Animation */}
          <div className="relative">
            <div className="w-16 h-16 mx-auto bg-gradient-accent rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <div className="absolute -inset-2 bg-primary-200 dark:bg-primary-800 rounded-3xl opacity-20 animate-pulse" />
          </div>

          {/* Status Text */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
              {stage ? `${stage.charAt(0).toUpperCase() + stage.slice(1)}...` : 'Processing...'}
            </h3>
            <p className="text-sm text-secondary-600 dark:text-secondary-400">
              Please wait while we generate your schema
            </p>
          </div>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-secondary-500 dark:text-secondary-400">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2">
                <div 
                  className="bg-gradient-accent h-2 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 