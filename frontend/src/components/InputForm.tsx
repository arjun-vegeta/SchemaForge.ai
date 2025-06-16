import React, { useState, useCallback } from 'react';
import { Sparkles, AlertCircle, HelpCircle, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showTips, setShowTips] = useState(true);

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Describe Your Data Requirements
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          Use natural language to describe your data model. Our AI will generate JSON schemas, 
          API endpoints, and database diagrams automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: I need to manage an e-commerce platform with products, customers, orders..."
            className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 min-h-[180px] sm:min-h-[220px]"
            disabled={isLoading}
          />
          <div className={`absolute bottom-3 right-3 text-xs px-2 py-1 rounded-full ${
            characterCount > 5000 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {characterCount}/5000
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center space-x-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showExamples ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Hide Examples</span>
              </>
            ) : (
              <>
                <HelpCircle className="w-4 h-4" />
                <span>Show Examples</span>
              </>
            )}
          </button>

          <button
            type="submit"
            disabled={!isValid || isLoading}
            className={`w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
              (!isValid || isLoading) ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
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

        {showExamples && (
          <div className="mt-4 p-5 bg-blue-50 rounded-xl border border-blue-200">
            <h4 className="text-base font-medium text-blue-900 mb-4 flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <span>Example Descriptions</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examples.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleExampleClick(example)}
                  className="block w-full text-left p-4 text-sm text-gray-700 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 shadow-xs"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-5 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-base font-medium text-red-800">{error.error}</h4>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
                {error.details && (
                  <ul className="mt-2 text-sm text-red-600 space-y-1">
                    {error.details.map((detail, index) => (
                      <li key={index}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-3"
          >
            {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>Tips for Better Results</span>
          </button>
          
          {showTips && (
            <div className="p-6 bg-gray-50 rounded-xl border border-gray-200">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm text-gray-700">
                <li className="flex items-start space-x-4">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span>Be specific about field names and types <br></br> (e.g., "email address", "price in USD")</span>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <span>Mention relationships between entities <br></br> (e.g., "users can have multiple orders")</span>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <span>Include constraints when relevant <br></br> (e.g., "required fields", "unique identifiers")</span>
                </li>
                <li className="flex items-start space-x-4">
                  <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">4</span>
                  </div>
                  <span>Describe the purpose or context of your data</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default InputForm;