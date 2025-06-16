import React from 'react';
import { RotateCcw, Database, Zap } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasData }) => {
  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-secondary-900">
                Schema Generator
              </h1>
              <p className="text-sm text-secondary-500">
                AI-powered API & ERD generator
              </p>
            </div>
          </div>

          {/* Features highlight */}
          <div className="hidden md:flex items-center space-x-6 text-sm text-secondary-600">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary-500" />
              <span>Natural Language</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-green-500" />
              <span>JSON Schema</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded-sm" />
              <span>ERD Diagrams</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {hasData && (
              <button
                onClick={onReset}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
            
            <div className="text-sm text-secondary-500">
              v1.0.0
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 