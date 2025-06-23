import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Loader2, Brain, FileJson, Network, GitBranch, Sparkles, Clock, Server } from 'lucide-react';

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
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  // Show timeout message after 10 seconds
  useEffect(() => {
    if (!isVisible) {
      setShowTimeoutMessage(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const stages = [
    {
      id: 'parsing',
      title: 'Parsing Natural Language',
      description: 'Understanding your requirements',
      icon: Brain,
      progress: 20,
    },
    {
      id: 'schema',
      title: 'Generating JSON Schema',
      description: 'Creating data structure',
      icon: FileJson,
      progress: 40,
    },
    {
      id: 'api',
      title: 'Creating API Endpoints',
      description: 'Building REST API specification',
      icon: Network,
      progress: 60,
    },
    {
      id: 'diagram',
      title: 'Building ERD Diagram',
      description: 'Generating visual relationships',
      icon: GitBranch,
      progress: 80,
    },
    {
      id: 'complete',
      title: 'Generation Complete',
      description: 'Your schema is ready!',
      icon: Sparkles,
      progress: 100,
    },
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex(s => s.id === stage);
  };

  const currentStageIndex = getCurrentStageIndex();

  const getStageStatus = (index: number) => {
    if (currentStageIndex > index) return 'completed';
    if (currentStageIndex === index) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md">
      <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-200 dark:border-secondary-700 p-6 sm:p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-accent rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
              </div>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-secondary-900 dark:text-white">
                Generating Your Schema
              </h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                AI is working its magic...
              </p>
            </div>
          </div>

          {/* Timeout Message */}
          {showTimeoutMessage && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 animate-slide-up">
              <div className="flex items-start space-x-3">
                <Server className="w-5 h-5 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                    Taking longer than usual?
                  </h4>
                  <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                    We're using Render's free tier for hosting. The server automatically sleeps after 15 minutes of inactivity. 
                    The first request might take up to 1 minute to wake up the server. Please wait, your request is being processed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Progress Overview */}
          <div className="bg-secondary-50 dark:bg-secondary-900/50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-medium text-secondary-700 dark:text-secondary-300">
                Overall Progress
              </span>
              <span className="text-xs sm:text-sm font-bold text-primary-600 dark:text-primary-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-1.5 sm:h-2">
              <div
                className="bg-gradient-accent h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stages List */}
          <div className="relative space-y-2">
            {stages.map((stageItem, index) => {
              const status = getStageStatus(index);
              const StageIcon = stageItem.icon;

              return (
                <div
                  key={stageItem.id}
                  className={`relative flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg transition-all duration-300 ${
                    status === 'active'
                      ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 shadow-sm'
                      : status === 'completed'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-transparent'
                  }`}
                >
                  {/* Stage Icon */}
                  <div className={`relative z-10 flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    status === 'completed'
                      ? 'bg-green-500 border-green-500 text-white'
                      : status === 'active'
                      ? 'bg-primary-500 border-primary-500 text-white'
                      : 'bg-white dark:bg-secondary-800 border-secondary-300 dark:border-secondary-600 text-secondary-400 dark:text-secondary-500'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : status === 'active' ? (
                      <StageIcon className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                    ) : (
                      <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold transition-all duration-300 ${
                      status === 'completed'
                        ? 'text-green-800 dark:text-green-300'
                        : status === 'active'
                        ? 'text-primary-800 dark:text-primary-300'
                        : 'text-secondary-500 dark:text-secondary-400'
                    }`}>
                      {stageItem.title}
                    </h4>
                    <p className={`text-xs mt-0.5 transition-all duration-300 ${
                      status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : status === 'active'
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-secondary-500 dark:text-secondary-400'
                    }`}>
                      {stageItem.description}
                    </p>
                  </div>

                  {/* Loading indicator for active stage */}
                  {status === 'active' && (
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary-200 dark:border-primary-700 border-t-primary-500 dark:border-t-primary-400 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
