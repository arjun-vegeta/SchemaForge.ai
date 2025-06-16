import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, Eye, Code, FileText, FileImage, FilePlus, Globe } from 'lucide-react';
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
  const [showExportMenu, setShowExportMenu] = useState(false);
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

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu && !(event.target as Element).closest('.relative')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

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

  // Export Mermaid diagram in different formats
  const exportMermaidDiagram = async (format: 'svg' | 'png' | 'pdf' | 'html') => {
    if (!mermaidSvg || activeType !== 'mermaid') {
      toast.error('Mermaid diagram not ready for export');
      return;
    }

    const timestamp = Date.now();
    const baseFilename = `erd-diagram-${timestamp}`;

    try {
      switch (format) {
        case 'svg':
          // Export SVG directly
          const blob = new Blob([mermaidSvg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${baseFilename}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('SVG exported successfully!');
          break;

        case 'png':
          // Convert SVG to PNG using canvas
          await exportSvgToPng(mermaidSvg, `${baseFilename}.png`);
          break;

        case 'pdf':
          // Convert SVG to PDF
          await exportSvgToPdf(mermaidSvg, `${baseFilename}.pdf`);
          break;

        case 'html':
          // Export as standalone HTML
          const htmlContent = createStandaloneHtml(mermaidSvg, erdDiagram.mermaid);
          utils.downloadAsFile(htmlContent, `${baseFilename}.html`, 'text');
          toast.success('HTML exported successfully!');
          break;

        default:
          toast.error('Unsupported export format');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
    
    setShowExportMenu(false);
  };

  const exportSvgToPng = async (svgString: string, filename: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // First, get the actual SVG dimensions by parsing it
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      
      if (!svgElement) {
        reject(new Error('Invalid SVG'));
        return;
      }

      // Get SVG viewBox or width/height
      const viewBox = svgElement.getAttribute('viewBox');
      let svgWidth: number, svgHeight: number;
      
      if (viewBox) {
        const [, , width, height] = viewBox.split(' ').map(Number);
        svgWidth = width;
        svgHeight = height;
      } else {
        svgWidth = parseFloat(svgElement.getAttribute('width') || '800');
        svgHeight = parseFloat(svgElement.getAttribute('height') || '600');
      }

      // High-quality settings
      const scale = 4; // 4x scale for ultra-high quality
      const padding = 60;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      
      // Set canvas size for high-DPI
      canvas.width = (svgWidth + padding) * scale;
      canvas.height = (svgHeight + padding) * scale;

      if (ctx) {
        // Disable smoothing for crisp text
        ctx.imageSmoothingEnabled = false;
        
        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create high-quality image from SVG
        const img = new Image();
        img.onload = () => {
          // Draw image at high resolution
          ctx.drawImage(
            img,
            padding * scale / 2,
            padding * scale / 2,
            svgWidth * scale,
            svgHeight * scale
          );

          // Convert to blob with maximum quality
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast.success('Ultra high-quality PNG exported successfully!');
              resolve();
            } else {
              reject(new Error('Failed to create PNG blob'));
            }
          }, 'image/png', 1.0); // 1.0 is maximum quality (0-1 range)
        };

        img.onerror = () => reject(new Error('Failed to load SVG'));

        // Convert SVG to data URL with high quality
        const svgData = encodeURIComponent(svgString);
        img.src = `data:image/svg+xml;charset=utf-8,${svgData}`;
      }
    });
  };

  const exportSvgToPdf = async (svgString: string, filename: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Parse SVG to get actual dimensions
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      
      if (!svgElement) {
        reject(new Error('Invalid SVG'));
        return;
      }

      // Get SVG dimensions
      const viewBox = svgElement.getAttribute('viewBox');
      let svgWidth: number, svgHeight: number;
      
      if (viewBox) {
        const [, , width, height] = viewBox.split(' ').map(Number);
        svgWidth = width;
        svgHeight = height;
      } else {
        svgWidth = parseFloat(svgElement.getAttribute('width') || '800');
        svgHeight = parseFloat(svgElement.getAttribute('height') || '600');
      }

      // Ultra high-quality settings for PDF
      const scale = 6; // Even higher scale for PDF print quality
      const padding = 80;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: false });
      
      canvas.width = (svgWidth + padding) * scale;
      canvas.height = (svgHeight + padding) * scale;

      if (ctx) {
        // Disable smoothing for crisp lines and text
        ctx.imageSmoothingEnabled = false;
        
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const img = new Image();
        img.onload = () => {
          // Draw at ultra-high resolution
          ctx.drawImage(
            img,
            padding * scale / 2,
            padding * scale / 2,
            svgWidth * scale,
            svgHeight * scale
          );

          // Convert canvas to data URL with maximum quality
          const imageDataUrl = canvas.toDataURL('image/png', 1.0);
          
          // Create PDF using browser's built-in PDF generation
          const pdfWindow = window.open('', '_blank');
          if (pdfWindow) {
            pdfWindow.document.write(`
              <!DOCTYPE html>
              <html>
              <head>
                <title>ERD Diagram - ${new Date().toLocaleDateString()}</title>
                <style>
                  body {
                    margin: 0;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    background: white;
                  }
                  .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #3b82f6;
                    padding-bottom: 20px;
                  }
                  .header h1 {
                    color: #1f2937;
                    margin: 0;
                    font-size: 24px;
                  }
                  .header p {
                    color: #6b7280;
                    margin: 5px 0 0 0;
                  }
                  .diagram {
                    text-align: center;
                    page-break-inside: avoid;
                  }
                  .diagram img {
                    max-width: 100%;
                    height: auto;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                  }
                  .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #6b7280;
                    border-top: 1px solid #e5e7eb;
                    padding-top: 20px;
                  }
                  @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>Entity Relationship Diagram</h1>
                  <p>Generated by SchemaForge AI on ${new Date().toLocaleDateString()}</p>
                </div>
                <div class="diagram">
                  <img src="${imageDataUrl}" alt="ERD Diagram" />
                </div>
                <div class="footer">
                  <p>Generated with SchemaForge AI - Transform natural language into structured data schemas</p>
                </div>
                <script>
                  window.onload = function() {
                    window.print();
                    window.onafterprint = function() {
                      window.close();
                    };
                  };
                </script>
              </body>
              </html>
            `);
            pdfWindow.document.close();
            
            toast.success('PDF export initiated - use your browser\'s print dialog to save as PDF');
            resolve();
          } else {
            // Fallback: download as high-quality PNG with PDF naming
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success('PDF export as high-quality image (print to PDF for full PDF functionality)');
                resolve();
              } else {
                reject(new Error('Failed to create PDF'));
              }
            }, 'image/png', 1.0);
          }
        };

        img.onerror = () => reject(new Error('Failed to load SVG for PDF'));

        // Convert SVG to data URL with high quality
        const svgData = encodeURIComponent(svgString);
        img.src = `data:image/svg+xml;charset=utf-8,${svgData}`;
      }
    });
  };

  const createStandaloneHtml = (svgString: string, mermaidCode: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ERD Diagram - Generated by SchemaForge AI</title>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #1f2937;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2rem;
            font-weight: 700;
        }
        .header p {
            margin: 8px 0 0 0;
            opacity: 0.9;
        }
        .diagram-container {
            padding: 40px;
            text-align: center;
            background: white;
        }
        .diagram-container svg {
            max-width: 100%;
            height: auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;
        }
        .footer {
            padding: 20px;
            text-align: center;
            background: #f8fafc;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.875rem;
        }
        .code-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
        }
        .code-section h3 {
            margin: 0 0 15px 0;
            color: #374151;
        }
        .code-block {
            background: #1f2937;
            color: #f3f4f6;
            padding: 16px;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
            overflow-x: auto;
            white-space: pre;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Entity Relationship Diagram</h1>
            <p>Generated by SchemaForge AI on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="diagram-container">
            ${svgString}
            
            <div class="code-section">
                <h3>Mermaid Source Code</h3>
                <div class="code-block">${mermaidCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated with SchemaForge AI - Transform natural language into structured data schemas</p>
        </div>
    </div>
</body>
</html>`;
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
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-900">
              Entity Relationship Diagram
            </h2>
            <p className="text-sm sm:text-base text-secondary-600">
              Visual representation of your data structure and relationships
            </p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => handleCopy(getCurrentContent())}
              className="btn-outline flex items-center space-x-2 flex-1 sm:flex-none justify-center"
            >
              <Copy className="w-4 h-4" />
              <span>Copy</span>
            </button>
            
            {activeType === 'mermaid' && mermaidSvg ? (
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="btn-primary flex items-center space-x-2 flex-1 sm:flex-none justify-center"
                >
                  <FileImage className="w-4 h-4" />
                  <span className="hidden sm:inline">Export</span>
                  <span className="sm:hidden">Export</span>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 z-50">
                    <div className="py-2">
                      <button
                        onClick={() => exportMermaidDiagram('svg')}
                        className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                      >
                        <FileImage className="w-4 h-4" />
                        <span>Export as SVG</span>
                      </button>
                      <button
                        onClick={() => exportMermaidDiagram('png')}
                        className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                      >
                        <FileImage className="w-4 h-4" />
                        <span>Export as PNG</span>
                      </button>
                      <button
                        onClick={() => exportMermaidDiagram('pdf')}
                        className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                      >
                        <FilePlus className="w-4 h-4" />
                        <span>Export as PDF</span>
                      </button>
                      <button
                        onClick={() => exportMermaidDiagram('html')}
                        className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 flex items-center space-x-2"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Export as HTML</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleDownload}
                className="btn-primary flex items-center space-x-2 flex-1 sm:flex-none justify-center"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-secondary-50 p-4 rounded-lg">
          <div>
            <span className="font-medium text-secondary-700">Total Entities:</span>
            <span className="ml-2 text-secondary-900">{erdDiagram.metadata.totalEntities}</span>
          </div>
          <div>
            <span className="font-medium text-secondary-700">Total Relationships:</span>
            <span className="ml-2 text-secondary-900">{erdDiagram.metadata.totalRelationships}</span>
          </div>
          <div className="sm:col-span-2 md:col-span-1">
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
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveType(tab.id)}
                  className={`flex items-center space-x-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeType === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-secondary-500 hover:text-secondary-700 hover:border-secondary-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.replace('Mermaid ERD', 'Mermaid').replace('Text Description', 'Text')}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {/* Mermaid Diagram */}
          {activeType === 'mermaid' && (
            <div className="space-y-4">
              <div className="bg-white border border-secondary-200 rounded-lg p-4 overflow-auto">
                {!mermaidSvg || isRenderingMermaid ? (
                  <div className="flex items-center justify-center h-48 sm:h-64">
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
                <div className="px-4 pb-4 overflow-x-auto">
                  <SyntaxHighlighter
                    language="mermaid"
                    style={oneLight}
                    className="text-xs sm:text-sm"
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                    }}
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
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  language="plantuml"
                  style={oneLight}
                  className="text-xs sm:text-sm"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0.5rem',
                  }}
                >
                  {erdDiagram.plantUML}
                </SyntaxHighlighter>
              </div>
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
              <div className="overflow-x-auto">
                <pre className="bg-white border border-secondary-200 rounded-lg p-4 text-xs sm:text-sm text-secondary-900 whitespace-pre-wrap font-mono">
                  {erdDiagram.textual}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Entity Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4">
          Entity Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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