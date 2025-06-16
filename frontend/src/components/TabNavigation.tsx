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
      description: 'JSON Schema & Entity definitions',
      enabled: hasData,
    },
    {
      id: 'api' as TabType,
      label: 'API',
      icon: Globe,
      description: 'REST API endpoints & documentation',
      enabled: hasData,
    },
    {
      id: 'diagram' as TabType,
      label: 'Diagram',
      icon: Network,
      description: 'Entity Relationship Diagram',
      enabled: hasData,
    },
    {
      id: 'export' as TabType,
      label: 'Export',
      icon: Download,
      description: 'Download & export options',
      enabled: hasData,
    },
  ];

  return (
    <nav className="bg-white rounded-lg shadow-sm border border-secondary-200 p-1">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isEnabled = tab.enabled;

          return (
            <button
              key={tab.id}
              onClick={() => isEnabled && onTabChange(tab.id)}
              disabled={!isEnabled}
              className={`flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap min-w-0 flex-1 sm:flex-initial ${
                isActive && isEnabled
                  ? 'bg-primary-600 text-white shadow-sm'
                  : !isEnabled
                  ? 'text-secondary-400 cursor-not-allowed'
                  : 'text-secondary-700 hover:text-secondary-900 hover:bg-secondary-50'
              }`}
              title={tab.description}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${
                isActive && isEnabled
                  ? 'text-white'
                  : !isEnabled
                  ? 'text-secondary-300'
                  : 'text-secondary-500'
              }`} />
              <div className="flex flex-col items-start min-w-0">
                <span className="truncate">{tab.label}</span>
                <span className={`text-xs truncate ${
                  isActive && isEnabled
                    ? 'text-primary-100'
                    : !isEnabled
                    ? 'text-secondary-300'
                    : 'text-secondary-500'
                }`}>
                  {tab.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TabNavigation; 