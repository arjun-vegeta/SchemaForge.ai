import React, { useState } from 'react';
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

  const handleCopy = async (content: string) => {
    const success = await utils.copyToClipboard(content);
    if (success) {
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const content = activeView === 'raw' ? jsonSchema : parsedEntities;
    const filename = `schema-${Date.now()}.json`;
    utils.downloadAsFile(content, filename, 'json');
  };

  const tabs = [
    { id: 'entities' as ViewType, label: 'Entities', icon: Database },
    { id: 'schema' as ViewType, label: 'JSON Schema', icon: FileText },
    { id: 'raw' as ViewType, label: 'Raw Data', icon: Code },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">
              Generated Schema
            </h2>
            <p className="text-secondary-600">
              Structured data definitions and entity relationships
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(JSON.stringify(activeView === 'raw' ? jsonSchema : parsedEntities, null, 2))}
              className="btn-outline flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            <button
              onClick={handleDownload}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid md:grid-cols-3 gap-4 text-sm bg-secondary-50 p-4 rounded-lg">
          <div>
            <span className="font-medium text-secondary-700">Total Entities:</span>
            <span className="ml-2 text-secondary-900">{parsedEntities.entities.length}</span>
          </div>
          <div>
            <span className="font-medium text-secondary-700">Total Relationships:</span>
            <span className="ml-2 text-secondary-900">{parsedEntities.relationships.length}</span>
          </div>
          <div>
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
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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

        <div className="p-6">
          {/* Entities View */}
          {activeView === 'entities' && (
            <div className="space-y-6">
              {parsedEntities.entities.map((entity) => (
                <div key={entity.name} className="border border-secondary-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
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
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-secondary-200">
                          <th className="text-left py-2 font-medium text-secondary-700">Field</th>
                          <th className="text-left py-2 font-medium text-secondary-700">Type</th>
                          <th className="text-left py-2 font-medium text-secondary-700">Required</th>
                          <th className="text-left py-2 font-medium text-secondary-700">Constraints</th>
                          <th className="text-left py-2 font-medium text-secondary-700">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entity.fields.map((field) => (
                          <tr key={field.name} className="border-b border-secondary-100">
                            <td className="py-2">
                              <code className="text-xs bg-secondary-100 px-1 py-0.5 rounded">
                                {field.name}
                              </code>
                            </td>
                            <td className="py-2">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                {field.type}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                field.required 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {field.required ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="py-2">
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
                            <td className="py-2 text-xs text-secondary-600">
                              {field.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Relationships */}
              {parsedEntities.relationships.length > 0 && (
                <div className="border border-secondary-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                    Relationships
                  </h3>
                  <div className="space-y-3">
                    {parsedEntities.relationships.map((rel, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-secondary-50 rounded-lg">
                        <div className="flex items-center space-x-4">
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
          {activeView === 'schema' && (
            <div className="space-y-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600">
                  Valid JSON Schema (Draft 2020-12) that can be used for validation and documentation.
                </p>
              </div>
              <SyntaxHighlighter
                language="json"
                style={oneLight}
                className="text-sm"
                showLineNumbers
              >
                {JSON.stringify(jsonSchema, null, 2)}
              </SyntaxHighlighter>
            </div>
          )}

          {/* Raw Data View */}
          {activeView === 'raw' && (
            <div className="space-y-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600">
                  Raw parsed data from the AI analysis, including entities and relationships.
                </p>
              </div>
              <SyntaxHighlighter
                language="json"
                style={oneLight}
                className="text-sm"
                showLineNumbers
              >
                {JSON.stringify(parsedEntities, null, 2)}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaView; 