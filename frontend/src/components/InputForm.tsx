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
    <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-4 sm:p-6">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 mb-2">
          Describe Your Data Requirements
        </h2>
        <p className="text-sm sm:text-base text-secondary-600">
          Use natural language to describe the data you want to manage. Our AI will automatically 
          generate JSON schemas, API endpoints, and ERD diagrams.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: I need to manage a library system with books, authors, and members..."
            className="form-textarea min-h-[150px] sm:min-h-[200px] text-sm sm:text-base"
            disabled={isLoading}
          />
          <div className="absolute bottom-2 right-2 text-xs text-secondary-500">
            {characterCount}/5000
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center space-x-2 text-sm text-secondary-600 hover:text-secondary-900"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showExamples ? 'Hide Examples' : 'Show Examples'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className={`btn-primary flex-1 sm:flex-none flex items-center justify-center space-x-2 ${
                (!isValid || isLoading) && 'opacity-50 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Schema</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showExamples && (
          <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <h4 className="text-sm font-medium text-primary-900 mb-3 flex items-center space-x-2">
              <Lightbulb className="w-4 h-4" />
              <span>Example Descriptions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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
        <div className="mt-4 p-4 bg-secondary-50 rounded-lg border border-secondary-200">
          <h4 className="text-sm font-medium text-secondary-900 mb-2">Tips for Better Results</h4>
          <ul className="text-sm text-secondary-600 space-y-1">
            <li>• Be specific about entity relationships and attributes</li>
            <li>• Mention any validation rules or constraints</li>
            <li>• Include any special requirements for data types</li>
            <li>• Specify if you need any specific API endpoints</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default InputForm; 