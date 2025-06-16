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
      label: 'Input',
      icon: PenTool,
      description: 'Describe your data requirements',
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
    <nav className="bg-white rounded-lg shadow-sm border border-secondary-200 p-2 md:p-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2">
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
                flex flex-col items-center 
                p-2 sm:p-2 rounded-md transition-all duration-200
                ${isActive && isEnabled
                  ? 'bg-primary-600 text-white shadow-sm'
                  : !isEnabled
                  ? 'text-secondary-400 cursor-not-allowed opacity-70'
                  : 'text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50'
                }
              `}
            >
              <Icon
                className={`
                  w-4 h-4 sm:w-5 sm:h-5 mb-1
                  ${isActive && isEnabled
                    ? 'text-white'
                    : !isEnabled
                    ? 'text-secondary-300'
                    : 'text-secondary-500'
                  }
                `}
              />
              <span className="text-xs sm:text-sm font-medium truncate w-full text-center">
                {tab.label}
              </span>
              <span className={`
                hidden sm:block text-xs text-center mt-1
                ${isActive && isEnabled
                  ? 'text-primary-100'
                  : !isEnabled
                  ? 'text-secondary-300'
                  : 'text-secondary-500'
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