import React, { useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import InputForm from './components/InputForm';
import TabNavigation from './components/TabNavigation';
import SchemaView from './components/SchemaView';
import ApiView from './components/ApiView';
import DiagramView from './components/DiagramView';
import ExportView from './components/ExportView';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import { GenerationResult, LoadingState, TabType, ApiError } from './types';
import { apiService } from './services/api';
import toast from 'react-hot-toast';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stage: null,
    progress: 0,
  });
  const [error, setError] = useState<ApiError | null>(null);

  // Check API status on component mount
  React.useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const health = await apiService.healthCheck();
        if (health.ai?.status === 'CONFIGURED') {
          console.log('✅ AI API Key Status: CONFIGURED');
          console.log('🚀 Full AI features available');
        } else {
          console.log('⚠️ AI API Key Status: NOT CONFIGURED');
          console.log('📝 To enable AI features:');
          console.log('   1. Get API key from: https://makersuite.google.com/app/apikey');
          console.log('   2. Add to backend/.env: GEMINI_API_KEY=your_key_here');
          console.log('   3. Restart the backend server');
          console.log('🔧 Currently using fallback parsing');
        }
      } catch (error) {
        console.error('❌ Failed to check API status:', error);
      }
    };

    checkApiStatus();
  }, []);

  const handleGenerate = useCallback(async (description: string) => {
    try {
      setError(null);
      setLoadingState({ isLoading: true, stage: 'parsing', progress: 20 });

      // Simulate progress updates
      const progressStages = [
        { stage: 'parsing' as const, progress: 20, message: 'Parsing natural language...' },
        { stage: 'schema' as const, progress: 40, message: 'Generating JSON schema...' },
        { stage: 'api' as const, progress: 60, message: 'Creating API endpoints...' },
        { stage: 'diagram' as const, progress: 80, message: 'Building ERD diagram...' },
        { stage: 'complete' as const, progress: 100, message: 'Generation complete!' },
      ];

      // Update progress with delays to show realistic loading
      const updateProgress = (index: number) => {
        if (index < progressStages.length) {
          const stage = progressStages[index];
          setLoadingState({ isLoading: true, stage: stage.stage, progress: stage.progress });
          toast.loading(stage.message, { id: 'generation-progress' });
        }
      };

      // Start generation
      updateProgress(0);

      // Call the API
      const result = await apiService.generateSchema(description);

      // Update progress through stages
      for (let i = 1; i < progressStages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateProgress(i);
      }

      // Success
      setGenerationResult(result);
      setActiveTab('schema');
      toast.dismiss('generation-progress');
      toast.success('Schema generated successfully!');

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError);
      toast.dismiss('generation-progress');
      toast.error(apiError.message || 'Failed to generate schema');
      console.error('Generation error:', apiError);
    } finally {
      setLoadingState({ isLoading: false, stage: null, progress: 0 });
    }
  }, []);

  const handleTabChange = useCallback((tab: TabType) => {
    if (tab !== 'input' && !generationResult) {
      toast.error('Please generate a schema first');
      return;
    }
    setActiveTab(tab);
  }, [generationResult]);

  const handleReset = useCallback(() => {
    setGenerationResult(null);
    setError(null);
    setActiveTab('input');
    toast.success('Reset complete');
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'input':
        return (
          <InputForm
            onGenerate={handleGenerate}
            isLoading={loadingState.isLoading}
            error={error}
          />
        );
      case 'schema':
        return generationResult ? (
          <SchemaView
            jsonSchema={generationResult.data.jsonSchema}
            parsedEntities={generationResult.data.parsedEntities}
          />
        ) : null;
      case 'api':
        return generationResult ? (
          <ApiView
            apiEndpoints={generationResult.data.apiEndpoints}
            entities={generationResult.data.parsedEntities.entities}
          />
        ) : null;
      case 'diagram':
        return generationResult ? (
          <DiagramView
            erdDiagram={generationResult.data.erdDiagram}
            entities={generationResult.data.parsedEntities.entities}
          />
        ) : null;
      case 'export':
        return generationResult ? (
          <ExportView
            generationResult={generationResult}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-secondary-50">
        <Header onReset={handleReset} hasData={!!generationResult} />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Progress indicator */}
            {loadingState.isLoading && (
              <div className="mb-6">
                <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-secondary-700">
                      {loadingState.stage && loadingState.stage.charAt(0).toUpperCase() + loadingState.stage.slice(1)}
                    </span>
                    <span className="text-sm text-secondary-500">
                      {loadingState.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-secondary-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${loadingState.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab navigation */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              hasData={!!generationResult}
            />

            {/* Main content */}
            <div className="mt-6 sm:mt-8">
              {renderActiveTab()}
            </div>

            {/* Generation summary */}
            {generationResult && (
              <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Generation Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <div className="font-medium text-primary-900">Entities</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {generationResult.data.parsedEntities.entities.length}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-medium text-green-900">API Endpoints</div>
                    <div className="text-2xl font-bold text-green-600">
                      {generationResult.data.apiEndpoints.summary.totalEndpoints}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="font-medium text-purple-900">Relationships</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {generationResult.data.parsedEntities.relationships.length}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-secondary-500">
                  Generated on {new Date(generationResult.data.generatedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Loading overlay */}
        {loadingState.isLoading && (
          <LoadingOverlay
            stage={loadingState.stage}
            progress={loadingState.progress}
          />
        )}

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App; 