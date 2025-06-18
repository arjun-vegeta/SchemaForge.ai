import React, { useState, useCallback } from 'react';
import { Sparkles, AlertCircle, HelpCircle, Lightbulb, ChevronDown, ChevronUp, Zap, Target, BarChart3, Brain, FileJson, Network, GitBranch, Download } from 'lucide-react';
import { ApiError } from '../types';
import { utils } from '../services/api';

interface InputFormProps {
  onGenerate: (description: string) => void;
  isLoading: boolean;
  error: ApiError | null;
}

const InputForm: React.FC<InputFormProps> = ({
  onGenerate,
  isLoading,
  error,
}) => {
  const [description, setDescription] = useState('');
  const [showExamples, setShowExamples] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const examples = utils.generateExampleDescriptions();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = utils.validateDescription(description);
    if (!validation.valid) {
      return;
    }

    onGenerate(description);
  }, [description, onGenerate]);

  const handleExampleClick = useCallback((example: string) => {
    setDescription(example);
    setShowExamples(false);
  }, []);

  const characterCount = description.length;
  const isValid = characterCount >= 10 && characterCount <= 5000;

  return (
    <div className="mt-16 max-w-4xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-secondary-900 dark:text-white">
            Transform Ideas into
            <span className="text-gradient text-4xl sm:text-5xl block mt-2">
              Database Schemas
              <Zap className="w-8 h-8 text-orange-500 inline-block ml-2 align-middle translate-y-[-3px] stroke-[3]" />
            </span>
          </h1>
          <p className="text-base text-secondary-600 dark:text-secondary-300 max-w-2xl mx-auto leading-relaxed">
            Simply describe your data requirements in natural language. Our AI will instantly generate 
            JSON schemas, API endpoints, and ERD diagrams.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <div className="card-modern card-hover">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label htmlFor="description" className="block text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-3">
              Describe Your Data Model
            </label>
            <div className="relative">
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: I need an e-commerce platform with products, customers, orders, and inventory management..."
                className="textarea-modern min-h-[160px] sm:min-h-[200px] text-base"
                disabled={isLoading}
              />
              <div className={`absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full transition-colors ${
                characterCount > 5000 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400' 
                  : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400'
              }`}>
                {characterCount}/5000
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowExamples(!showExamples)}
                className="flex items-center space-x-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Examples</span>
                {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowTips(!showTips)}
                className="flex items-center space-x-2 text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Tips</span>
                {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`btn-primary flex items-center ${
                (!isValid || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 spinner-modern mr-2" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  <span>Generate Schema</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Examples Section */}
        {showExamples && (
          <div className="mt-6 animate-slide-up">
            <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
              <h4 className="text-base font-semibold text-primary-900 dark:text-primary-100 mb-4 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                <span>Example Descriptions</span>
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleExampleClick(example)}
                    className="block w-full text-left p-4 text-sm text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        {showTips && (
          <div className="mt-6 animate-slide-up">
            <div className="p-6 bg-secondary-50 dark:bg-secondary-800/50 rounded-xl border border-secondary-200 dark:border-secondary-700">
              <h4 className="text-base font-semibold text-secondary-900 dark:text-secondary-100 mb-4">
                Tips for Better Results
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    number: '1',
                    text: 'Be specific about field names and types (e.g., "email address", "price in USD")'
                  },
                  {
                    number: '2',
                    text: 'Mention relationships between entities (e.g., "users can have multiple orders")'
                  },
                  {
                    number: '3',
                    text: 'Include constraints when relevant (e.g., "required fields", "unique identifiers")'
                  },
                  {
                    number: '4',
                    text: 'Describe the purpose or context of your data model'
                  }
                ].map((tip) => (
                  <div key={tip.number} className="flex items-start space-x-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full text-xs font-bold flex-shrink-0 mt-0.5">
                      {tip.number}
                    </div>
                    <span className="text-sm text-secondary-700 dark:text-secondary-300">
                      {tip.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 animate-slide-up">
            <div className="p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-base font-semibold text-red-800 dark:text-red-200">{error.error}</h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error.message}</p>
                  {error.details && (
                    <ul className="mt-2 text-sm text-red-600 dark:text-red-400 space-y-1">
                      {error.details.map((detail, index) => (
                        <li key={index}>• {detail}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {[
          {
            icon: Brain,
            title: 'Natural Language Processing',
            description: 'Describe your data requirements in plain English'
          },
          {
            icon: FileJson,
            title: 'JSON Schema Generation',
            description: 'Automatically generates valid JSON schemas'
          },
          {
            icon: Network,
            title: 'REST API Generation',
            description: 'Creates complete OpenAPI specifications'
          },
          {
            icon: GitBranch,
            title: 'ERP Diagram Generation',
            description: 'Visual entity relationship diagrams using Mermaid'
          },
          {
            icon: Download,
            title: 'Export Options',
            description: 'Download schemas, API specs, and diagram code'
          },
          {
            icon: Sparkles,
            title: 'AI-Powered',
            description: 'Uses Google Gemini API for intelligent parsing'
          }
        ].map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className="text-center space-y-3 p-6 rounded-xl bg-white/50 dark:bg-secondary-900/50 border border-secondary-200 dark:border-secondary-700">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl mx-auto">
                <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-secondary-900 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InputForm;