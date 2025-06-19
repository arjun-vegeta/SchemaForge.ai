import React, { useState, useCallback, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import InputForm from './components/InputForm';
import TabNavigation from './components/TabNavigation';
import SchemaView from './components/SchemaView';
import ApiView from './components/ApiView';
import DiagramView from './components/DiagramView';
import ExportView from './components/ExportView';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorBoundary from './components/ErrorBoundary';
import ServerStatusBanner from './components/ServerStatusBanner';
import { GenerationResult, LoadingState, TabType, ApiError } from './types';
import { apiService } from './services/api';
import toast from 'react-hot-toast';
import './index.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    stage: null,
    progress: 0,
  });
  const [error, setError] = useState<ApiError | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { isDarkMode } = useTheme();

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

  // Add CSS for fixed background that works on mobile
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .app-container {
        position: relative;
        z-index: 1;
      }
      
      .app-container::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: var(--bg-image);
        background-repeat: no-repeat;
        background-position: center top;
        background-size: cover;
        z-index: -1;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Set the background image variable based on theme
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--bg-image', 
      `url('${!isDarkMode ? '/Header-background-light.svg' : '/Header-background-dark.svg'}')`
    );
  }, [isDarkMode]);

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

    } catch (err: any) {
      // Convert error to ApiError format if it's not already
      const apiError: ApiError = err.response ? {
        error: err.response.data?.error || 'Server Error',
        message: err.response.data?.message || 'An unexpected error occurred',
        details: err.response.data?.details,
      } : err.error ? err : {
        error: 'Network Error',
        message: err.message || 'Unable to connect to the server. Please check your connection.',
      };

      setError(apiError);
      toast.dismiss('generation-progress');
      
      // More specific error messages based on the error type
      if (err.message?.includes('timeout') || err.code === 'ECONNABORTED') {
        toast.error('Request timed out. The server may be starting up - please try again in a moment.');
      } else if (err.response?.status >= 500) {
        toast.error('Server error occurred. Please try again.');
      } else {
        toast.error(apiError.message || 'Failed to generate schema');
      }
      
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
    
    // If switching to input tab and we have data, trigger blur transition
    if (tab === 'input' && generationResult) {
      setIsTransitioning(true);
      // Add small delay to let animation complete before changing tab and clearing data
      setTimeout(() => {
        setActiveTab(tab);
        setGenerationResult(null);
        setError(null);
        setIsTransitioning(false);
        toast.success('Ready for new project');
      }, 300); // Match the animation duration
    } else {
      setActiveTab(tab);
    }
  }, [generationResult]);

  const handleReset = useCallback(() => {
    if (generationResult) {
      setIsTransitioning(true);
      // Add small delay to let animation complete before clearing data
      setTimeout(() => {
        setGenerationResult(null);
        setError(null);
        setActiveTab('input');
        setIsTransitioning(false);
        toast.success('Reset complete');
      }, 300); // Match the animation duration
    }
  }, [generationResult]);

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
    <div
      key={isDarkMode ? 'dark' : 'light'}
      className="min-h-screen bg-gradient-minimal transition-all duration-300 app-container"
    >
      <Header onReset={handleReset} hasData={!!generationResult} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="max-w-6xl mx-auto">
          {/* Server Status Banner */}
          <ServerStatusBanner />



          {/* Tab Navigation - Only show if data exists */}
          {generationResult && (
            <div className="mb-8">
              <TabNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
                hasData={!!generationResult}
              />
            </div>
          )}

          {/* Main Content */}
          <div className={`${
            isTransitioning 
              ? 'animate-blur-out' 
              : activeTab === 'input' && !generationResult
              ? 'animate-fade-in-slow'
              : 'animate-blur-in'
          }`}>
            {renderActiveTab()}
          </div>
        </div>
      </main>

      {/* Loading Overlay */}
      <LoadingOverlay 
        isVisible={loadingState.isLoading} 
        stage={loadingState.stage}
        progress={loadingState.progress}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            border: '1px solid var(--toast-border)',
          },
          success: {
            iconTheme: {
              primary: '#ea580c',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App; 