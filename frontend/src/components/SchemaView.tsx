import React, { useState, useMemo, useEffect } from 'react';
import { Copy, Download, FileText, Database, Code } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { JsonSchema, ParsedData } from '../types';
import { utils } from '../services/api';
import toast from 'react-hot-toast';

interface SchemaViewProps {
  jsonSchema: JsonSchema;
  parsedEntities: ParsedData;
}

type ViewType = 'entities' | 'schema' | 'raw';

const SchemaView: React.FC<SchemaViewProps> = ({ jsonSchema, parsedEntities }) => {
  const [activeView, setActiveView] = useState<ViewType>('entities');
  const [isLoading, setIsLoading] = useState(false);

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
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-900">
              Generated Schema
            </h2>
            <p className="text-sm sm:text-base text-secondary-600">
              Structured data definitions and entity relationships
            </p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => handleCopy(getContentForCopy())}
              className="btn-outline flex items-center space-x-2 flex-1 sm:flex-none justify-center"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={handleDownload}
              className="btn-primary flex items-center space-x-2 flex-1 sm:flex-none justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-secondary-50 p-4 rounded-lg">
          <div>
            <span className="font-medium text-secondary-700">Total Entities:</span>
            <span className="ml-2 text-secondary-900">{parsedEntities.entities.length}</span>
          </div>
          <div>
            <span className="font-medium text-secondary-700">Total Relationships:</span>
            <span className="ml-2 text-secondary-900">{parsedEntities.relationships.length}</span>
          </div>
          <div className="sm:col-span-2 md:col-span-1">
            <span className="font-medium text-secondary-700">Generated:</span>
            <span className="ml-2 text-secondary-900">
              {new Date(jsonSchema.metadata.generatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
        <div className="border-b border-secondary-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  className={`flex items-center space-x-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeView === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Loading state */}
          {isLoading && (activeView === 'schema' || activeView === 'raw') && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 spinner" />
                <span className="text-secondary-600">
                  Loading {activeView === 'schema' ? 'JSON schema' : 'raw data'}...
                </span>
              </div>
            </div>
          )}

          {/* Entities View */}
          {activeView === 'entities' && !isLoading && (
            <div className="space-y-6">
              {parsedEntities.entities.map((entity) => (
                <div key={entity.name} className="border border-secondary-200 rounded-lg p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                    <div>
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {entity.name}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        Table: {entity.tableName} • {entity.description}
                      </p>
                    </div>
                    <div className="text-xs text-secondary-500 bg-secondary-100 px-2 py-1 rounded">
                      {entity.fields.length} fields
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-secondary-200">
                            <th className="text-left py-2 px-4 font-medium text-secondary-700">Field</th>
                            <th className="text-left py-2 px-4 font-medium text-secondary-700">Type</th>
                            <th className="text-left py-2 px-4 font-medium text-secondary-700">Required</th>
                            <th className="text-left py-2 px-4 font-medium text-secondary-700 hidden sm:table-cell">Constraints</th>
                            <th className="text-left py-2 px-4 font-medium text-secondary-700 hidden md:table-cell">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entity.fields.map((field) => (
                            <tr key={field.name} className="border-b border-secondary-100">
                              <td className="py-2 px-4">
                                <code className="text-xs bg-secondary-100 px-1 py-0.5 rounded">
                                  {field.name}
                                </code>
                              </td>
                              <td className="py-2 px-4">
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                  {field.type}
                                </span>
                              </td>
                              <td className="py-2 px-4">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  field.required 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {field.required ? 'Yes' : 'No'}
                                </span>
                              </td>
                              <td className="py-2 px-4 hidden sm:table-cell">
                                {field.constraints && Object.keys(field.constraints).length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(field.constraints).map(([key, value]) => (
                                      <span key={key} className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">
                                        {key}: {String(value)}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-secondary-400">None</span>
                                )}
                              </td>
                              <td className="py-2 px-4 text-xs text-secondary-600 hidden md:table-cell">
                                {field.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile view for constraints and description */}
                  <div className="sm:hidden mt-4 space-y-2">
                    {entity.fields.map((field) => (
                      <div key={`${field.name}-mobile`} className="bg-secondary-50 p-3 rounded text-sm">
                        <div className="font-medium text-secondary-900 mb-1">{field.name}</div>
                        {field.constraints && Object.keys(field.constraints).length > 0 && (
                          <div className="mb-1">
                            <span className="text-xs text-secondary-500">Constraints: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(field.constraints).map(([key, value]) => (
                                <span key={key} className="text-xs bg-purple-100 text-purple-800 px-1 py-0.5 rounded">
                                  {key}: {String(value)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-secondary-600">{field.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Relationships */}
              {parsedEntities.relationships.length > 0 && (
                <div className="border border-secondary-200 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Relationships
                  </h3>
                  <div className="space-y-3">
                    {parsedEntities.relationships.map((rel, index) => (
                      <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-secondary-50 rounded-lg space-y-2 sm:space-y-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                          <span className="font-medium text-secondary-900">{rel.from}</span>
                          <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                            {rel.type}
                          </span>
                          <span className="font-medium text-secondary-900">{rel.to}</span>
                        </div>
                        <span className="text-sm text-secondary-600">
                          {rel.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* JSON Schema View */}
          {activeView === 'schema' && !isLoading && (
            <div className="space-y-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600">
                  Valid JSON Schema (Draft 2020-12) that can be used for validation and documentation.
                </p>
              </div>
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  language="json"
                  style={oneLight}
                  className="text-xs sm:text-sm"
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                  }}
                >
                  {formattedJsonSchema}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {/* Raw Data View */}
          {activeView === 'raw' && !isLoading && (
            <div className="space-y-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600">
                  Raw parsed data from the AI analysis, including entities and relationships.
                </p>
              </div>
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  language="json"
                  style={oneLight}
                  className="text-xs sm:text-sm"
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                  }}
                >
                  {formattedParsedEntities}
                </SyntaxHighlighter>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaView; 