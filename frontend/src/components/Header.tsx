import React, { useState } from 'react';
import { RotateCcw, Database, Zap, Menu, X, Network } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasData }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleReset = () => {
    onReset();
    setIsMobileMenuOpen(false); // Close mobile menu after reset
  };

  return (
    <header className="bg-white shadow-sm border-b border-secondary-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 bg-primary-600 rounded-lg">
              <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-secondary-900">
                SchemaForge AI
              </h1>
              <p className="text-xs mt-[-5px] sm:text-sm text-secondary-500">
                AI-powered API & ERD generator
              </p>
            </div>
          </div>

          {/* Features highlight - Desktop */}
          <div className="hidden lg:flex items-center space-x-6 text-sm text-secondary-600">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-primary-500" />
              <span>Natural Language</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-green-500" />
              <span>JSON Schema</span>
            </div>
            <div className="flex items-center space-x-2">
              <Network className="w-4 h-4 text-purple-500" />
              <span>ERD Diagrams</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {hasData && (
              <button
                onClick={onReset}
                className="hidden sm:flex items-center space-x-2 px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">Reset</span>
              </button>
            )}
            
            <div className="text-xs sm:text-sm text-secondary-500 hidden sm:block">
              v1.0.0
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-secondary-200 animate-slideIn">
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <Zap className="w-4 h-4 text-primary-500" />
                <span>Natural Language Processing</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <Database className="w-4 h-4 text-green-500" />
                <span>JSON Schema Generation</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-secondary-600">
                <div className="w-4 h-4 bg-purple-500 rounded-sm" />
                <span>ERD Diagram Creation</span>
              </div>
              {hasData && (
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors w-full text-left"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Data</span>
                </button>
              )}
              <div className="text-xs text-secondary-500 pt-2 border-t border-secondary-200">
                Version 1.0.0
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 