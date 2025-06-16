import React, { useState, useCallback } from 'react';
import { Sparkles, AlertCircle, HelpCircle, Lightbulb } from 'lucide-react';
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
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-secondary-900 mb-2">
          Describe Your Data Requirements
        </h2>
        <p className="text-secondary-600">
          Use natural language to describe the data you want to manage. Our AI will automatically 
          generate JSON schemas, API endpoints, and ERD diagrams.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-2">
            Data Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., I need to store user profiles with name, email, and age, and also product details with name, price, and description..."
            className={`form-textarea h-32 ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            disabled={isLoading}
          />
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-4 text-sm">
              <span className={`${isValid ? 'text-secondary-500' : 'text-red-500'}`}>
                {characterCount}/5000 characters
              </span>
              {characterCount > 0 && characterCount < 10 && (
                <span className="text-red-500 text-xs">Too short</span>
              )}
            </div>
            
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Examples</span>
            </button>
          </div>
        </div>

        {/* Examples */}
        {showExamples && (
          <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <h4 className="text-sm font-medium text-primary-900 mb-3 flex items-center space-x-2">
              <Lightbulb className="w-4 h-4" />
              <span>Example Descriptions</span>
            </h4>
            <div className="space-y-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="block w-full text-left p-3 text-sm text-secondary-700 bg-white rounded border border-secondary-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">{error.error}</h4>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
                {error.details && (
                  <ul className="mt-2 text-xs text-red-600">
                    {error.details.map((detail, index) => (
                      <li key={index}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mb-6 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
          <h4 className="text-sm font-medium text-secondary-900 mb-2 flex items-center space-x-2">
            <HelpCircle className="w-4 h-4" />
            <span>Tips for Better Results</span>
          </h4>
          <ul className="text-sm text-secondary-600 space-y-1">
            <li>• Be specific about field names and types (e.g., "email address", "price in USD")</li>
            <li>• Mention relationships between entities (e.g., "users can have multiple orders")</li>
            <li>• Include constraints when relevant (e.g., "required fields", "unique identifiers")</li>
            <li>• Describe the purpose or context of your data</li>
          </ul>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Schema & API</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm; 