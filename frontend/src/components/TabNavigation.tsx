import React from 'react';
import { PenTool, FileText, Globe, Network, Download } from 'lucide-react';
import { TabType } from '../types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hasData: boolean;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  hasData,
}) => {
  const tabs = [
    {
      id: 'input' as TabType,
    label: 'New Project',
      icon: PenTool,
      description: 'Create new database schema',
      enabled: true,
    },
    {
      id: 'schema' as TabType,
      label: 'Schema',
      icon: FileText,
      description: 'JSON Schema & definitions',
      enabled: hasData,
    },
    {
      id: 'api' as TabType,
      label: 'API',
      icon: Globe,
      description: 'REST API endpoints',
      enabled: hasData,
    },
    {
      id: 'diagram' as TabType,
      label: 'Diagram',
      icon: Network,
      description: 'ER Diagram',
      enabled: hasData,
    },
    {
      id: 'export' as TabType,
      label: 'Export',
      icon: Download,
      description: 'Download options',
      enabled: hasData,
    },
  ];

  return (
    <nav className="card-modern p-2">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isEnabled = tab.enabled;

          return (
            <button
              key={tab.id}
              onClick={() => isEnabled && onTabChange(tab.id)}
              disabled={!isEnabled}
              className={`
                flex flex-col items-center p-3 sm:p-4 rounded-xl transition-all duration-200 group
                ${isActive && isEnabled
                  ? 'tab-active shadow-sm'
                  : !isEnabled
                  ? 'text-secondary-400 dark:text-secondary-600 cursor-not-allowed opacity-50'
                  : 'tab-inactive hover:bg-secondary-50 dark:hover:bg-secondary-800'
                }
              `}
            >
              <Icon
                className={`
                  w-5 h-5 mb-2 transition-all duration-200
                  ${isActive && isEnabled
                    ? 'text-primary-600 dark:text-primary-400 scale-110'
                    : !isEnabled
                    ? 'text-secondary-300 dark:text-secondary-600'
                    : 'text-secondary-500 dark:text-secondary-400 group-hover:text-secondary-700 dark:group-hover:text-secondary-200'
                  }
                `}
              />
              <span className={`
                text-sm font-medium truncate w-full text-center transition-all duration-200
                ${isActive && isEnabled
                  ? 'text-primary-600 dark:text-primary-400'
                  : !isEnabled
                  ? 'text-secondary-400 dark:text-secondary-600'
                  : 'text-secondary-600 dark:text-secondary-400 group-hover:text-secondary-800 dark:group-hover:text-secondary-200'
                }
              `}>
                {tab.label}
              </span>
              <span className={`
                hidden sm:block text-xs text-center mt-1 transition-all duration-200
                ${isActive && isEnabled
                  ? 'text-primary-500 dark:text-primary-400'
                  : !isEnabled
                  ? 'text-secondary-300 dark:text-secondary-600'
                  : 'text-secondary-400 dark:text-secondary-500 group-hover:text-secondary-600 dark:group-hover:text-secondary-300'
                }
              `}>
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation;