import React, { useState, useEffect } from 'react';
import { Loader2, Brain, FileText, Globe, Network, Wifi, AlertTriangle } from 'lucide-react';
import { subscribeToServerStatus, ServerStatus } from '../services/api';

interface LoadingOverlayProps {
  stage: 'parsing' | 'schema' | 'api' | 'diagram' | 'complete' | null;
  progress: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ stage, progress }) => {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToServerStatus(setServerStatus);
    return unsubscribe;
  }, []);

  const getStageInfo = (currentStage: string | null) => {
    // If server is waking up, show that status instead
    if (serverStatus?.isWakingUp) {
      return {
        icon: Wifi,
        title: 'Server is waking up...',
        description: 'The server was sleeping and is now starting up. This may take up to 60 seconds.',
        color: 'text-amber-500',
      };
    }

    // If server appears to be sleeping, show that status
    if (serverStatus && !serverStatus.isAwake) {
      return {
        icon: AlertTriangle,
        title: 'Connecting to server...',
        description: 'The server may be sleeping. Attempting to wake it up...',
        color: 'text-orange-500',
      };
    }
    switch (currentStage) {
      case 'parsing':
        return {
          icon: Brain,
          title: 'Parsing Natural Language',
          description: 'AI is analyzing your requirements...',
          color: 'text-blue-500',
        };
      case 'schema':
        return {
          icon: FileText,
          title: 'Generating JSON Schema',
          description: 'Creating structured data definitions...',
          color: 'text-green-500',
        };
      case 'api':
        return {
          icon: Globe,
          title: 'Building API Endpoints',
          description: 'Generating REST API specifications...',
          color: 'text-purple-500',
        };
      case 'diagram':
        return {
          icon: Network,
          title: 'Creating ERD Diagram',
          description: 'Building entity relationship diagram...',
          color: 'text-orange-500',
        };
      case 'complete':
        return {
          icon: FileText,
          title: 'Complete!',
          description: 'All components generated successfully.',
          color: 'text-green-500',
        };
      default:
        return {
          icon: Loader2,
          title: 'Processing...',
          description: 'Please wait while we generate your schema.',
          color: 'text-primary-500',
        };
    }
  };

  const stageInfo = getStageInfo(stage);
  const Icon = stageInfo.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Icon className={`w-16 h-16 ${stageInfo.color} ${stage !== 'complete' ? 'animate-spin' : ''}`} />
              {stage !== 'complete' && (
                <div className="absolute inset-0 w-16 h-16 border-4 border-secondary-200 border-t-primary-500 rounded-full animate-spin" />
              )}
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">
            {stageInfo.title}
          </h3>
          
          <p className="text-secondary-600 mb-6">
            {stageInfo.description}
          </p>
          
          <div className="w-full bg-secondary-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                serverStatus?.isWakingUp ? 'bg-amber-500' : 
                serverStatus && !serverStatus.isAwake ? 'bg-orange-500' : 
                'bg-primary-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="text-sm text-secondary-500">
            {serverStatus?.isWakingUp 
              ? 'Waking up server...' 
              : serverStatus && !serverStatus.isAwake 
              ? 'Connecting to server...' 
              : `${progress}% complete`}
          </div>

          {/* Additional server status info */}
          {(serverStatus?.isWakingUp || (serverStatus && !serverStatus.isAwake)) && (
            <div className="mt-3 text-xs text-secondary-400 bg-secondary-50 rounded p-2">
              <p>
                💡 <strong>Free hosting tip:</strong> Our server sleeps after 15 minutes of inactivity 
                to save resources. The first request wakes it up, which takes about 30-60 seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay; 