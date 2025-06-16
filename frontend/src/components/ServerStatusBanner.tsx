import React, { useState, useEffect } from 'react';
import { ServerIcon, AlertTriangle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { subscribeToServerStatus, ServerStatus } from '../services/api';

interface ServerStatusBannerProps {
  className?: string;
}

const ServerStatusBanner: React.FC<ServerStatusBannerProps> = ({ className = '' }) => {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [wakingUpElapsed, setWakingUpElapsed] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToServerStatus(setServerStatus);
    return unsubscribe;
  }, []);

  // Track waking up time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (serverStatus?.isWakingUp) {
      setWakingUpElapsed(0);
      interval = setInterval(() => {
        setWakingUpElapsed(prev => prev + 1);
      }, 1000);
    } else {
      setWakingUpElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [serverStatus?.isWakingUp]);

  // Don't show banner if server is awake and no issues
  if (!serverStatus || (serverStatus.isAwake && !serverStatus.isWakingUp && serverStatus.consecutiveFailures === 0)) {
    return null;
  }

  const getStatusInfo = () => {
    if (serverStatus.isWakingUp) {
      return {
        type: 'waking' as const,
        icon: Clock,
        title: 'Server is waking up...',
        message: `The server was sleeping and is now starting up. This typically takes 30-60 seconds.`,
        timeInfo: `Elapsed: ${wakingUpElapsed}s`,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-600',
      };
    }

    if (!serverStatus.isAwake) {
      return {
        type: 'sleeping' as const,
        icon: WifiOff,
        title: 'Server appears to be sleeping',
        message: 'Our hosting service puts the server to sleep after 15 minutes of inactivity. Your next request will wake it up.',
        timeInfo: serverStatus.consecutiveFailures > 3 ? 'Multiple connection attempts failed' : '',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600',
      };
    }

    if (serverStatus.consecutiveFailures > 0) {
      return {
        type: 'issues' as const,
        icon: AlertTriangle,
        title: 'Connection issues detected',
        message: 'There may be temporary connectivity issues. We\'ll automatically retry your requests.',
        timeInfo: `${serverStatus.consecutiveFailures} failed attempts`,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600',
      };
    }

    return null;
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  const Icon = statusInfo.icon;

  return (
    <div className={`${statusInfo.bgColor} ${statusInfo.borderColor} border rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Icon className={`w-5 h-5 ${statusInfo.iconColor} ${statusInfo.type === 'waking' ? 'animate-spin' : ''}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium ${statusInfo.textColor}`}>
              {statusInfo.title}
            </h4>
            {statusInfo.timeInfo && (
              <span className={`text-xs ${statusInfo.textColor} opacity-75`}>
                {statusInfo.timeInfo}
              </span>
            )}
          </div>
          
          <p className={`text-sm ${statusInfo.textColor} opacity-90 mt-1`}>
            {statusInfo.message}
          </p>

          {/* Expandable details */}
          {(statusInfo.type === 'sleeping' || statusInfo.type === 'issues') && (
            <div className="mt-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`text-xs ${statusInfo.textColor} opacity-75 hover:opacity-100 underline focus:outline-none`}
              >
                {showDetails ? 'Hide details' : 'Why does this happen?'}
              </button>
              
              {showDetails && (
                <div className={`mt-2 text-xs ${statusInfo.textColor} opacity-80 space-y-2`}>
                  <div className="bg-white bg-opacity-50 rounded p-2">
                    <p className="font-medium mb-1">About free hosting:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Free hosting services automatically sleep servers after 15 minutes of inactivity</li>
                      <li>• First request after sleep triggers wake-up (30-60 seconds)</li>
                      <li>• This is normal behavior and your data is safe</li>
                      <li>• Subsequent requests will be fast once the server is awake</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white bg-opacity-50 rounded p-2">
                    <p className="font-medium mb-1">What we're doing:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Automatically retrying your request</li>
                      <li>• Monitoring server wake-up progress</li>
                      <li>• Will notify you when ready</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress indicator for waking up */}
          {statusInfo.type === 'waking' && (
            <div className="mt-3">
              <div className="w-full bg-amber-200 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ 
                    width: `${Math.min(100, (wakingUpElapsed / 60) * 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-amber-700 mt-1">
                {wakingUpElapsed < 30 
                  ? 'Starting up server...' 
                  : wakingUpElapsed < 45 
                  ? 'Loading application...' 
                  : wakingUpElapsed < 60 
                  ? 'Almost ready...' 
                  : 'Taking longer than usual, but still trying...'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Success state when server wakes up */}
      {serverStatus.isAwake && !serverStatus.isWakingUp && serverStatus.consecutiveFailures === 0 && (
        <div className="mt-3 flex items-center space-x-2 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Server is now online and ready!</span>
        </div>
      )}
    </div>
  );
};

export default ServerStatusBanner; 