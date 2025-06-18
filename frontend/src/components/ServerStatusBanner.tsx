import React, { useState, useEffect } from 'react';
import { X, Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { subscribeToServerStatus, ServerStatus } from '../services/api';

const ServerStatusBanner: React.FC = () => {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToServerStatus(setServerStatus);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (serverStatus) {
      // Show banner if server is waking up or sleeping
      const shouldShow = serverStatus.isWakingUp || !serverStatus.isAwake;
      setIsVisible(shouldShow && !isDismissed);
    }
  }, [serverStatus, isDismissed]);

  if (!isVisible || !serverStatus) {
    return null;
  }

  const getBannerConfig = () => {
    if (serverStatus.isWakingUp) {
      return {
        icon: Wifi,
        title: 'Server Starting Up',
        message: 'The server is waking up from sleep mode. This may take up to 60 seconds.',
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        textColor: 'text-amber-800 dark:text-amber-200',
        iconColor: 'text-amber-600 dark:text-amber-400',
      };
    } else if (!serverStatus.isAwake) {
      return {
        icon: WifiOff,
        title: 'Server Connecting',
        message: 'Attempting to connect to the server. Please wait...',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800',
        textColor: 'text-orange-800 dark:text-orange-200',
        iconColor: 'text-orange-600 dark:text-orange-400',
      };
    } else {
      return {
        icon: CheckCircle,
        title: 'Server Connected',
        message: 'Successfully connected to the server.',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-800 dark:text-green-200',
        iconColor: 'text-green-600 dark:text-green-400',
      };
    }
  };

  const config = getBannerConfig();
  const Icon = config.icon;

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-sm font-semibold ${config.textColor}`}>
                {config.title}
              </h3>
              <p className={`text-sm ${config.textColor} mt-1`}>
                {config.message}
              </p>
              
              {(serverStatus.isWakingUp || !serverStatus.isAwake) && (
                <div className={`mt-3 text-xs ${config.textColor} opacity-75`}>
                  <p>
                    💡 <strong>Note:</strong> Free hosting services sleep after inactivity. 
                    The first request wakes up the server.
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsDismissed(true)}
              className={`ml-4 ${config.textColor} hover:opacity-75 transition-opacity`}
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerStatusBanner; 