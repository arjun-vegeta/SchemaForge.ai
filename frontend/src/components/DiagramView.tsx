import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, Eye, Code, FileText } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ErdDiagram, Entity } from '../types';
import { utils } from '../services/api';
import toast from 'react-hot-toast';
import mermaid from 'mermaid';

interface DiagramViewProps {
  erdDiagram: ErdDiagram;
  entities: Entity[];
}

type DiagramType = 'mermaid' | 'plantuml' | 'textual';

const DiagramView: React.FC<DiagramViewProps> = ({ erdDiagram, entities }) => {
  const [activeType, setActiveType] = useState<DiagramType>('mermaid');
  const [isMermaidInitialized, setIsMermaidInitialized] = useState(false);
  const [mermaidSvg, setMermaidSvg] = useState<string>('');
  const [isRenderingMermaid, setIsRenderingMermaid] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Initialize Mermaid
  useEffect(() => {
    console.log('🎨 Initializing Mermaid...');
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      fontSize: 14,
      themeVariables: {
        primaryColor: '#3b82f6',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#e5e7eb',
        lineColor: '#6b7280',
        secondaryColor: '#f3f4f6',
        tertiaryColor: '#ffffff',
      },
    });
    
    setIsMermaidInitialized(true);
    console.log('🎨 Mermaid initialized');
  }, []);



  // Render Mermaid diagram as soon as data and initialization are ready
  useEffect(() => {
    const renderMermaidDiagram = async () => {
      if (!isMermaidInitialized || !erdDiagram.mermaid || mermaidSvg || isRenderingMermaid) {
        console.log('🎨 Skipping Mermaid render:', {
          initialized: isMermaidInitialized,
          hasCode: !!erdDiagram.mermaid,
          alreadyRendered: !!mermaidSvg,
          currentlyRendering: isRenderingMermaid
        });
        return;
      }

      console.log('🎨 Starting background Mermaid diagram render...');
      setIsRenderingMermaid(true);
      setRenderError(null);

      try {
        // Generate unique ID for each render to avoid conflicts
        const diagramId = `mermaid-diagram-${Date.now()}`;
        
        console.log('🎨 Rendering Mermaid with ID:', diagramId);
        
        const { svg } = await mermaid.render(diagramId, erdDiagram.mermaid);
        
        console.log('🎨 Mermaid render successful, SVG length:', svg.length);
        
        // Store the SVG in state
        setMermaidSvg(svg);
        console.log('🎨 Mermaid diagram ready and stored in state');
      } catch (error) {
        console.error('❌ Error rendering Mermaid diagram:', error);
        const errorMessage = String(error);
        setRenderError(errorMessage);
      } finally {
        setIsRenderingMermaid(false);
      }
    };

    renderMermaidDiagram();
  }, [isMermaidInitialized, erdDiagram.mermaid, mermaidSvg, isRenderingMermaid]);

  // Update the DOM when SVG is ready and ref is available
  useEffect(() => {
    if (mermaidSvg && mermaidRef.current && activeType === 'mermaid') {
      console.log('🎨 Inserting SVG into DOM element');
      mermaidRef.current.innerHTML = mermaidSvg;
    }
  }, [mermaidSvg, activeType]);

  const handleCopy = async (content: string) => {
    const success = await utils.copyToClipboard(content);
    if (success) {
      toast.success('Copied to clipboard!');
    } else {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const content = getCurrentContent();
    const filename = `erd-diagram-${Date.now()}.${getFileExtension()}`;
    utils.downloadAsFile(content, filename, 'text');
  };

  const getCurrentContent = () => {
    switch (activeType) {
      case 'mermaid':
        return erdDiagram.mermaid;
      case 'plantuml':
        return erdDiagram.plantUML;
      case 'textual':
        return erdDiagram.textual;
      default:
        return erdDiagram.mermaid;
    }
  };

  const getFileExtension = () => {
    switch (activeType) {
      case 'mermaid':
        return 'mmd';
      case 'plantuml':
        return 'puml';
      case 'textual':
        return 'txt';
      default:
        return 'txt';
    }
  };

  const tabs = [
    { id: 'mermaid' as DiagramType, label: 'Mermaid ERD', icon: Eye },
    { id: 'plantuml' as DiagramType, label: 'PlantUML', icon: Code },
    { id: 'textual' as DiagramType, label: 'Text Description', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">
              Entity Relationship Diagram
            </h2>
            <p className="text-secondary-600">
              Visual representation of your data structure and relationships
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCopy(getCurrentContent())}
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
            <span className="ml-2 text-secondary-900">{erdDiagram.metadata.totalEntities}</span>
          </div>
          <div>
            <span className="font-medium text-secondary-700">Total Relationships:</span>
            <span className="ml-2 text-secondary-900">{erdDiagram.metadata.totalRelationships}</span>
          </div>
          <div>
            <span className="font-medium text-secondary-700">Generated:</span>
            <span className="ml-2 text-secondary-900">
              {new Date(erdDiagram.metadata.generatedAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Diagram Type Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200">
        <div className="border-b border-secondary-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveType(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeType === tab.id
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
          {/* Mermaid Diagram */}
          {activeType === 'mermaid' && (
            <div className="space-y-4">
              <div className="bg-white border border-secondary-200 rounded-lg p-4 overflow-auto">
                {!mermaidSvg || isRenderingMermaid ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-secondary-500">
                        {!isMermaidInitialized ? 'Initializing diagram engine...' : 
                         isRenderingMermaid ? 'Generating diagram...' : 
                         !mermaidSvg ? 'Preparing diagram...' : 'Loading diagram...'}
                      </p>
                      {/* Debug info in development */}
                      {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 text-xs text-gray-400">
                          <div>Init: {isMermaidInitialized ? '✅' : '❌'}</div>
                          <div>Rendered: {mermaidSvg ? '✅' : '❌'}</div>
                          <div>Rendering: {isRenderingMermaid ? '✅' : '❌'}</div>
                          <div>Code: {erdDiagram.mermaid ? '✅' : '❌'}</div>
                          {renderError && <div className="text-red-500">Error: {renderError}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                ) : renderError ? (
                  <div className="text-center p-8 text-red-600">
                    <p>Error rendering diagram</p>
                    <p className="text-sm mt-2">{renderError}</p>
                  </div>
                ) : (
                  <div ref={mermaidRef} className="mermaid-container" style={{ minHeight: '200px' }} />
                )}
              </div>
              
              <details className="bg-secondary-50 border border-secondary-200 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium text-secondary-700">
                  View Mermaid Code
                </summary>
                <div className="px-4 pb-4">
                  <SyntaxHighlighter
                    language="mermaid"
                    style={oneLight}
                    className="text-sm"
                  >
                    {erdDiagram.mermaid}
                  </SyntaxHighlighter>
                </div>
              </details>
            </div>
          )}

          {/* PlantUML Code */}
          {activeType === 'plantuml' && (
            <div className="space-y-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600 mb-2">
                  Use this PlantUML code with any PlantUML renderer or IDE plugin.
                </p>
              </div>
              <SyntaxHighlighter
                language="plantuml"
                style={oneLight}
                className="text-sm"
              >
                {erdDiagram.plantUML}
              </SyntaxHighlighter>
            </div>
          )}

          {/* Textual Description */}
          {activeType === 'textual' && (
            <div className="space-y-4">
              <div className="bg-secondary-50 p-4 rounded-lg">
                <p className="text-sm text-secondary-600">
                  Human-readable description of your database schema and relationships.
                </p>
              </div>
              <pre className="bg-white border border-secondary-200 rounded-lg p-4 text-sm text-secondary-900 whitespace-pre-wrap font-mono overflow-auto">
                {erdDiagram.textual}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Entity Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Entity Summary
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => (
            <div key={entity.name} className="bg-secondary-50 rounded-lg p-4">
              <h4 className="font-medium text-secondary-900 mb-2">
                {entity.name}
              </h4>
              <p className="text-sm text-secondary-600 mb-3">
                {entity.description}
              </p>
              <div className="text-xs text-secondary-500">
                <div>Table: {entity.tableName}</div>
                <div>Fields: {entity.fields.length}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiagramView; 