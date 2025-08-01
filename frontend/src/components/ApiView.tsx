import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Download, Globe, Code, Book, Terminal, ChevronDown } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ApiEndpoint, Entity } from '../types';
import { utils } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

interface ApiViewProps {
  apiEndpoints: ApiEndpoint;
  entities: Entity[];
}

type ViewType = 'overview' | 'openapi' | 'javascript' | 'python' | 'curl';

const ApiView: React.FC<ApiViewProps> = ({ apiEndpoints, entities }) => {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [selectedEntity, setSelectedEntity] = useState<string>(entities[0]?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const { isDarkMode } = useTheme();

  // Memoize the heavy JSON stringification
  const formattedOpenApiSpec = useMemo(() => {
    return JSON.stringify(apiEndpoints.openApiSpec, null, 2);
  }, [apiEndpoints.openApiSpec]);

  // Handle tab switching with loading state
  const handleTabSwitch = (newView: ViewType) => {
    if (newView === activeView) return;
    
    if (newView === 'openapi') {
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

  // Reset loading state when component mounts or activeView changes away from openapi
  useEffect(() => {
    if (activeView !== 'openapi') {
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
    const content = activeView === 'openapi' 
      ? formattedOpenApiSpec 
      : getCodeContent();
    const filename = `api-${activeView}-${Date.now()}.${getFileExtension()}`;
    utils.downloadAsFile(content, filename, activeView === 'openapi' ? 'json' : 'text');
  };

  const getCodeContent = () => {
    const examples = apiEndpoints.codeExamples;
    switch (activeView) {
      case 'javascript':
        return Object.entries(examples.javascript[selectedEntity] || {})
          .map(([operation, code]) => `// ${operation}\n${code}`)
          .join('\n\n');
      case 'python':
        return Object.entries(examples.python[selectedEntity] || {})
          .map(([operation, code]) => `# ${operation}\n${code}`)
          .join('\n\n');
      case 'curl':
        return Object.entries(examples.curl[selectedEntity] || {})
          .map(([operation, code]) => `# ${operation}\n${code}`)
          .join('\n\n');
      default:
        return formattedOpenApiSpec;
    }
  };

  const getFileExtension = () => {
    switch (activeView) {
      case 'openapi':
        return 'json';
      case 'javascript':
        return 'js';
      case 'python':
        return 'py';
      case 'curl':
        return 'sh';
      default:
        return 'txt';
    }
  };

  const tabs = [
    { id: 'overview' as ViewType, label: 'Overview', icon: Globe },
    { id: 'openapi' as ViewType, label: 'OpenAPI Spec', icon: Book },
    { id: 'javascript' as ViewType, label: 'JavaScript', icon: Code },
    { id: 'python' as ViewType, label: 'Python', icon: Code },
    { id: 'curl' as ViewType, label: 'cURL', icon: Terminal },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-modern">
        <div className="mb-6">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Generated API Endpoints
            </h2>
            <p className="text-secondary-600 dark:text-secondary-300 mt-1">
              Complete REST API specification with interactive documentation
            </p>
          </div>
        </div>

        {/* API Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {apiEndpoints.summary.totalEndpoints}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Endpoints
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {apiEndpoints.summary.entities.length}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Entities
            </div>
          </div>
          {/* <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {new Date(apiEndpoints.summary.generatedAt).toLocaleDateString()}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Generated
            </div>
          </div> */}
        </div>
      </div>

      {/* API Type Tabs */}
      <div className="card-modern p-0 overflow-hidden">
        <div className="border-b border-secondary-200 dark:border-secondary-700">
          <nav className="flex overflow-x-auto">
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
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.replace('JavaScript', 'JS').replace('OpenAPI Spec', 'OpenAPI')}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Loading state */}
          {isLoading && activeView === 'openapi' && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 spinner-modern" />
                <span className="text-secondary-600 dark:text-secondary-400">Loading OpenAPI specification...</span>
              </div>
            </div>
          )}

          {/* Entity selector and banner for code examples */}
          {['javascript', 'python', 'curl'].includes(activeView) && !isLoading && (
            <div className="mb-4">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between lg:space-x-6 space-y-4 lg:space-y-0">
                <div className="flex-shrink-0">
                  <label htmlFor="entity-select" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Select Entity
                  </label>
                  <div className="relative w-full sm:w-auto">
                    <select
                      id="entity-select"
                      value={selectedEntity}
                      onChange={(e) => setSelectedEntity(e.target.value)}
                      className="input-modern w-full sm:w-auto pr-8 appearance-none"
                    >
                      {entities.map((entity) => (
                        <option key={entity.name} value={entity.name}>
                          {entity.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-500 dark:text-secondary-400 pointer-events-none" />
                  </div>
                </div>
                <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-xl flex-1 lg:max-w-lg">
                  <p className="text-sm text-secondary-600 dark:text-secondary-400">
                    Ready-to-use code examples for the <strong>{selectedEntity}</strong> entity in {activeView}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Overview */}
          {activeView === 'overview' && !isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Available Endpoints</h3>
                  <div className="space-y-2">
                    {Object.entries(apiEndpoints.openApiSpec.paths).map(([path, methods]) => (
                      <div key={path} className="text-sm">
                        <code className="bg-white dark:bg-secondary-700 px-2 py-1 rounded text-xs break-all">{path}</code>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.keys(methods as any).map((method) => (
                            <span key={method} className={`text-xs px-2 py-0.5 rounded ${
                              method === 'get' ? 'bg-green-100 text-green-800' :
                              method === 'post' ? 'bg-primary-100 text-primary-800' :
                              method === 'put' ? 'bg-yellow-100 text-yellow-800' :
                              method === 'delete' ? 'bg-red-100 text-red-800' :
                              'bg-secondary-100 text-secondary-800'
                            }`}>
                              {method.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-secondary-900 dark:text-white mb-3">Entity Operations</h3>
                  <div className="space-y-3">
                    {entities.map((entity) => (
                      <div key={entity.name} className="bg-white dark:bg-secondary-700 p-3 rounded border border-secondary-200 dark:border-secondary-600">
                        <h4 className="font-medium text-secondary-900 dark:text-white">{entity.name}</h4>
                        <p className="text-xs text-secondary-600 dark:text-secondary-400 mb-2">{entity.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {['GET', 'POST', 'PUT', 'DELETE'].map((method) => (
                            <span key={method} className="text-xs bg-secondary-100 text-secondary-700 px-2 py-0.5 rounded">
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <h3 className="font-semibold text-primary-900 mb-2">API Features</h3>
                <ul className="text-sm text-primary-800 space-y-1">
                  <li>• Complete CRUD operations for all entities</li>
                  <li>• Pagination support with configurable limits</li>
                  <li>• Sorting and filtering capabilities</li>
                  <li>• Relationship endpoints for associated data</li>
                  <li>• Comprehensive error handling</li>
                  <li>• OpenAPI 3.0 compatible specification</li>
                </ul>
              </div>
            </div>
          )}

          {/* OpenAPI Specification */}
          {activeView === 'openapi' && !isLoading && (
            <div className="space-y-4">
              <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600 dark:text-secondary-400">
                  Complete OpenAPI 3.0 specification that can be imported into tools like Swagger UI, Postman, or Insomnia.
                </p>
              </div>
              <div className="relative overflow-x-auto">
                <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(formattedOpenApiSpec)}
                    className="btn-outline flex items-center space-x-1 text-sm px-3 py-1.5 shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => {
                      const filename = `openapi-spec-${Date.now()}.json`;
                      utils.downloadAsFile(formattedOpenApiSpec, filename, 'json');
                    }}
                    className="btn-primary flex items-center space-x-1 text-sm px-3 py-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
                <SyntaxHighlighter
                  language="json"
                  style={isDarkMode ? oneDark : oneLight}
                  className="text-xs sm:text-sm"
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.75rem',
                    paddingTop: '3rem',
                    background: isDarkMode ? '#1f2937' : '#f9fafb',
                  }}
                >
                  {formattedOpenApiSpec}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {/* Code Examples */}
          {['javascript', 'python', 'curl'].includes(activeView) && !isLoading && (
            <div className="relative overflow-x-auto">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => handleCopy(getCodeContent())}
                  className="btn-outline flex items-center space-x-1 text-sm px-3 py-1.5 shadow-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
              <SyntaxHighlighter
                language={activeView === 'curl' ? 'bash' : activeView}
                style={isDarkMode ? oneDark : oneLight}
                className="text-xs sm:text-sm"
                showLineNumbers
                customStyle={{
                  margin: 0,
                  borderRadius: '0.75rem',
                  paddingTop: '3rem',
                  background: isDarkMode ? '#1f2937' : '#f9fafb',
                }}
              >
                {getCodeContent()}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiView; 