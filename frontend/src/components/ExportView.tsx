import React, { useState } from 'react';
import { Download, FileText, Code, Database, Network, Package } from 'lucide-react';
import { GenerationResult, ExportOptions } from '../types';
import { utils } from '../services/api';
import toast from 'react-hot-toast';

interface ExportViewProps {
  generationResult: GenerationResult;
}

const ExportView: React.FC<ExportViewProps> = ({ generationResult }) => {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeComments: true,
    minified: false,
  });

  const handleDownload = (type: string, format?: string) => {
    const timestamp = Date.now();
    
    try {
      switch (type) {
        case 'schema':
          utils.downloadAsFile(
            generationResult.data.jsonSchema,
            `schema-${timestamp}.json`,
            'json'
          );
          break;
          
        case 'api':
          utils.downloadAsFile(
            generationResult.data.apiEndpoints.openApiSpec,
            `api-spec-${timestamp}.json`,
            'json'
          );
          break;
          
        case 'entities':
          utils.downloadAsFile(
            generationResult.data.parsedEntities,
            `entities-${timestamp}.json`,
            'json'
          );
          break;
          
        case 'diagram-mermaid':
          utils.downloadAsFile(
            generationResult.data.erdDiagram.mermaid,
            `erd-diagram-${timestamp}.mmd`,
            'text'
          );
          break;
          
        case 'diagram-plantuml':
          utils.downloadAsFile(
            generationResult.data.erdDiagram.plantUML,
            `erd-diagram-${timestamp}.puml`,
            'text'
          );
          break;
          
        case 'diagram-text':
          utils.downloadAsFile(
            generationResult.data.erdDiagram.textual,
            `erd-description-${timestamp}.txt`,
            'text'
          );
          break;
          
        case 'code-examples':
          const codeExamples = generationResult.data.apiEndpoints.codeExamples;
          const allExamples = {
            javascript: codeExamples.javascript,
            python: codeExamples.python,
            curl: codeExamples.curl,
          };
          utils.downloadAsFile(
            allExamples,
            `code-examples-${timestamp}.json`,
            'json'
          );
          break;
          
        case 'complete':
          utils.downloadAsFile(
            generationResult,
            `complete-schema-${timestamp}.json`,
            'json'
          );
          break;
          
        default:
          toast.error('Unknown export type');
          return;
      }
      
      toast.success('File downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const exportItems = [
    {
      id: 'schema',
      title: 'JSON Schema',
      description: 'Complete JSON Schema definition with validation rules',
      icon: FileText,
      color: 'blue',
      size: JSON.stringify(generationResult.data.jsonSchema).length,
    },
    {
      id: 'api',
      title: 'OpenAPI Specification',
      description: 'REST API documentation in OpenAPI 3.0 format',
      icon: Code,
      color: 'green',
      size: JSON.stringify(generationResult.data.apiEndpoints.openApiSpec).length,
    },
    {
      id: 'entities',
      title: 'Parsed Entities',
      description: 'Raw entity data parsed from natural language',
      icon: Database,
      color: 'purple',
      size: JSON.stringify(generationResult.data.parsedEntities).length,
    },
    {
      id: 'diagram-mermaid',
      title: 'Mermaid ERD',
      description: 'Entity relationship diagram in Mermaid format',
      icon: Network,
      color: 'orange',
      size: generationResult.data.erdDiagram.mermaid.length,
    },
    {
      id: 'diagram-plantuml',
      title: 'PlantUML ERD',
      description: 'Entity relationship diagram in PlantUML format',
      icon: Network,
      color: 'pink',
      size: generationResult.data.erdDiagram.plantUML.length,
    },
    {
      id: 'diagram-text',
      title: 'Text Description',
      description: 'Human-readable database schema description',
      icon: FileText,
      color: 'indigo',
      size: generationResult.data.erdDiagram.textual.length,
    },
    {
      id: 'code-examples',
      title: 'Code Examples',
      description: 'API usage examples in multiple languages',
      icon: Code,
      color: 'emerald',
      size: JSON.stringify(generationResult.data.apiEndpoints.codeExamples).length,
    },
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-primary-50 text-primary-700 border-primary-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      pink: 'bg-pink-50 text-pink-700 border-pink-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-modern">
        <div className="mb-6">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">
              Export & Download
            </h2>
            <p className="text-secondary-600 dark:text-secondary-300 mt-1">
              Download all generated schemas, APIs, and diagrams in various formats
            </p>
          </div>
        </div>

        {/* Generation Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {generationResult.data.parsedEntities.entities.length}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Entities
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {generationResult.data.apiEndpoints.summary.totalEndpoints}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              API Endpoints
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {generationResult.data.parsedEntities.relationships.length}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Relationships
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {new Date(generationResult.data.generatedAt).toLocaleDateString()}
            </div>
            <div className="text-sm text-secondary-600 dark:text-secondary-400">
              Generated
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="card-modern">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Export Options
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1">
            <label htmlFor="format" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
              Export Format
            </label>
            <div className="relative">
              <select
                id="format"
                value={exportOptions.format}
                onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value as any })}
                className="input-modern w-full appearance-none pr-10"
              >
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="typescript">TypeScript</option>
                <option value="sql">SQL</option>
                <option value="mongoose">Mongoose</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-secondary-500 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-2">
              Choose the output format for exported files
            </p>
          </div>
          
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-3">
              Output Options
            </label>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="includeComments"
                    checked={exportOptions.includeComments}
                    onChange={(e) => setExportOptions({ ...exportOptions, includeComments: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="includeComments" className="text-sm font-medium text-secondary-900 dark:text-white cursor-pointer">
                    Include Comments
                  </label>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Add descriptive comments to generated code and schemas
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-secondary-50 dark:bg-secondary-800/50 rounded-lg">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="minified"
                    checked={exportOptions.minified}
                    onChange={(e) => setExportOptions({ ...exportOptions, minified: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 dark:border-secondary-600 dark:bg-secondary-700 rounded"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="minified" className="text-sm font-medium text-secondary-900 dark:text-white cursor-pointer">
                    Minified Output
                  </label>
                  <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-1">
                    Remove whitespace and formatting for smaller file sizes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
        <div className="absolute -top-16 right-10 z-10">
          <button
            onClick={() => handleDownload('complete')}
            className="btn-primary flex items-center space-x-2 text-sm px-3 py-1.5 shadow-sm"
          >
            <Package className="w-4 h-4" />
            <span>Download All</span>
          </button>
        </div>
        {exportItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`border rounded-lg p-4 ${getColorClasses(item.color)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-medium truncate">{item.title}</h4>
                    <p className="text-xs opacity-75 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-75">
                  {formatBytes(item.size)}
                </span>
                <button
                  onClick={() => handleDownload(item.id)}
                  className="flex items-center space-x-1 text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-2 py-1 rounded transition-colors flex-shrink-0"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="card-modern">
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
            <h4 className="font-medium text-secondary-900 dark:text-white mb-2">Development Package</h4>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                Schema + API + Code examples for development
              </p>
            <button
              onClick={() => {
                const devPackage = {
                  schema: generationResult.data.jsonSchema,
                  api: generationResult.data.apiEndpoints.openApiSpec,
                  codeExamples: generationResult.data.apiEndpoints.codeExamples,
                };
                utils.downloadAsFile(devPackage, `dev-package-${Date.now()}.json`, 'json');
                toast.success('Development package downloaded!');
              }}
              className="btn-secondary w-full"
            >
              Download Dev Package
            </button>
          </div>
          
                      <div className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-lg">
              <h4 className="font-medium text-secondary-900 dark:text-white mb-2">Documentation Package</h4>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-3">
                ERD + Text descriptions for documentation
              </p>
            <button
              onClick={() => {
                const docPackage = {
                  mermaidDiagram: generationResult.data.erdDiagram.mermaid,
                  plantUMLDiagram: generationResult.data.erdDiagram.plantUML,
                  textDescription: generationResult.data.erdDiagram.textual,
                  entities: generationResult.data.parsedEntities.entities,
                };
                utils.downloadAsFile(docPackage, `docs-package-${Date.now()}.json`, 'json');
                toast.success('Documentation package downloaded!');
              }}
              className="btn-secondary w-full"
            >
              Download Docs Package
            </button>
          </div>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-100 mb-3">
          Usage Instructions
        </h3>
        <div className="text-sm text-primary-800 dark:text-primary-200 space-y-2">
          <p><strong>JSON Schema:</strong> Use for data validation in your application</p>
          <p><strong>OpenAPI Spec:</strong> Import into Swagger UI, Postman, or Insomnia</p>
          <p><strong>Mermaid ERD:</strong> Render in GitHub, GitLab, or Mermaid Live Editor</p>
          <p><strong>PlantUML ERD:</strong> Use with PlantUML tools or IDE plugins</p>
          <p><strong>Code Examples:</strong> Copy-paste API integration code</p>
        </div>
      </div>
    </div>
  );
};

export default ExportView; 