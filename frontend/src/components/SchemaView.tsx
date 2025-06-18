import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Download, FileText, Database, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { JsonSchema, ParsedData } from '../types';
import { utils } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

interface SchemaViewProps {
  jsonSchema: JsonSchema;
  parsedEntities: ParsedData;
}

type ViewType = 'entities' | 'schema' | 'raw';

const SchemaView: React.FC<SchemaViewProps> = ({ jsonSchema, parsedEntities }) => {
  const [activeView, setActiveView] = useState<ViewType>('entities');
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useTheme();

  // Memoize the heavy JSON stringification
  const formattedJsonSchema = useMemo(() => {
    return JSON.stringify(jsonSchema, null, 2);
  }, [jsonSchema]);

  const formattedParsedEntities = useMemo(() => {
    return JSON.stringify(parsedEntities, null, 2);
  }, [parsedEntities]);

  // Handle tab switching with loading state
  const handleTabSwitch = (newView: ViewType) => {
    if (newView === activeView) return;
    
    if (newView === 'schema' || newView === 'raw') {
      setIsLoading(true);
      setActiveView(newView);
      // Use setTimeout to allow the UI to update and show the loader
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    } else {
      setActiveView(newView);
    }
  };

  // Reset loading state when component mounts or activeView changes away from heavy tabs
  useEffect(() => {
    if (activeView !== 'schema' && activeView !== 'raw') {
      setIsLoading(false);
    }
  }, [activeView]);

  const handleCopy = async (content: string) => {
    const success = await utils.copyToClipboard(content);
    if (success) {
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const content = activeView === 'raw' ? parsedEntities : 
                   activeView === 'schema' ? jsonSchema : parsedEntities;
    const filename = `schema-${Date.now()}.json`;
    utils.downloadAsFile(content, filename, 'json');
  };

  const getContentForCopy = () => {
    switch (activeView) {
      case 'schema':
        return formattedJsonSchema;
      case 'raw':
        return formattedParsedEntities;
      default:
        return formattedParsedEntities;
    }
  };

  const tabs = [
    { id: 'entities' as ViewType, label: 'Entities', icon: Database },
    { id: 'schema' as ViewType, label: 'JSON Schema', icon: FileText },
    { id: 'raw' as ViewType, label: 'Raw Data', icon: Code },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-modern">
        <div className="mb-6">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Generated Schema
            </h2>
            <p className="text-secondary-600 dark:text-secondary-300 mt-1">
              Structured data definitions and entity relationships
            </p>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {parsedEntities.entities.length}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Entities
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {parsedEntities.relationships.length}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Relationships
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {new Date(jsonSchema.metadata.generatedAt).toLocaleDateString()}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Generated
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="card-modern p-0 overflow-hidden">
        <div className="border-b border-secondary-200 dark:border-secondary-700">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                    activeView === tab.id
                      ? 'tab-active border-primary-600 dark:border-primary-400'
                      : 'tab-inactive border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Loading state */}
          {isLoading && (activeView === 'schema' || activeView === 'raw') && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 spinner-modern" />
                <span className="text-secondary-600 dark:text-secondary-400">
                  Loading {activeView === 'schema' ? 'JSON schema' : 'raw data'}...
                </span>
              </div>
            </div>
          )}

          {/* Entities View */}
          {activeView === 'entities' && !isLoading && (
            <div className="space-y-6 relative">
              <div className="absolute top-0 right-0 z-10 flex items-center space-x-2">
                
              </div>
              {parsedEntities.entities.map((entity) => (
                <div key={entity.name} className="border border-secondary-200 dark:border-secondary-700 rounded-xl p-6 bg-secondary-50/50 dark:bg-secondary-800/30">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900 dark:text-white">
                        {entity.name}
                      </h3>
                      <p className="text-sm text-secondary-600 dark:text-secondary-400">
                        Table: <code className="px-1 py-0.5 bg-secondary-200 dark:bg-secondary-700 rounded text-xs">{entity.tableName}</code> • {entity.description}
                      </p>
                    </div>
                    <div className="text-xs text-secondary-500 dark:text-secondary-400 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 px-3 py-1 rounded-full">
                      {entity.fields.length} fields
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-secondary-200 dark:border-secondary-700">
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700 dark:text-secondary-300">Field</th>
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700 dark:text-secondary-300">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700 dark:text-secondary-300">Required</th>
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700 dark:text-secondary-300 hidden sm:table-cell">Constraints</th>
                          <th className="text-left py-3 px-4 font-semibold text-secondary-700 dark:text-secondary-300 hidden md:table-cell">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entity.fields.map((field) => (
                          <tr key={field.name} className="border-b border-secondary-100 dark:border-secondary-800">
                            <td className="py-3 px-4">
                              <code className="text-xs bg-secondary-200 dark:bg-secondary-700 px-2 py-1 rounded font-mono">
                                {field.name}
                              </code>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 px-2 py-1 rounded">
                                {field.type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded ${
                                field.required 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}>
                                {field.required ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden sm:table-cell">
                              {field.constraints && Object.keys(field.constraints).length > 0 ? (
                                <div className="space-y-1">
                                  {Object.entries(field.constraints).map(([key, value]) => (
                                    <span key={key} className="inline-block text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded mr-1">
                                      {key}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-secondary-400 dark:text-secondary-600">None</span>
                              )}
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell text-secondary-600 dark:text-secondary-400">
                              {field.description || 'No description'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Schema View */}
          {activeView === 'schema' && !isLoading && (
            <div className="relative overflow-x-auto">
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(getContentForCopy())}
                  className="btn-outline flex items-center space-x-1 text-sm px-3 py-1.5 shadow-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-primary flex items-center space-x-1 text-sm px-3 py-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
              <SyntaxHighlighter
                language="json"
                style={isDarkMode ? oneDark : oneLight}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.75rem',
                  paddingTop: '3rem',
                  background: isDarkMode ? '#1f2937' : '#f9fafb',
                }}
              >
                {formattedJsonSchema}
              </SyntaxHighlighter>
            </div>
          )}

          {/* Raw View */}
          {activeView === 'raw' && !isLoading && (
            <div className="relative overflow-x-auto">
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(getContentForCopy())}
                  className="btn-outline flex items-center space-x-1 text-sm px-3 py-1.5 shadow-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="btn-primary flex items-center space-x-1 text-sm px-3 py-1.5 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
              <SyntaxHighlighter
                language="json"
                style={isDarkMode ? oneDark : oneLight}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.75rem',
                  paddingTop: '3rem',
                  background: isDarkMode ? '#1f2937' : '#f9fafb',
                }}
              >
                {formattedParsedEntities}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaView; 