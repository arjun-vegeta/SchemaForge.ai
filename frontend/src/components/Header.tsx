import React, { useState } from 'react';
import { RotateCcw, Database, Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, hasData }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleReset = () => {
    onReset();
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/80 dark:bg-secondary-900/80 backdrop-blur-modern border-b border-secondary-200 dark:border-secondary-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 sm:w-10 sm:h-10 w-12 h-12 bg-gradient-accent rounded-xl shadow-sm">
                <Database className=" sm:w-5 sm:h-5 w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-secondary-900 dark:text-white">
                SchemaForge<span className="text-gradient">.ai</span>
              </h1>
              <p className="text-xs text-secondary-500 dark:text-secondary-400 -mt-0.5">
                <span className="block sm:inline">AI-powered schema generator.</span>
                <span className="block sm:inline"> <a href="https://github.com/arjun-vegeta" target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-600 transition-colors">Made by Arjun R</a></span>
              </p>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {hasData && (
              <button
                onClick={onReset}
                className="btn-ghost flex items-center text-sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </button>
            )}
            
            <button
              onClick={toggleDarkMode}
              className="btn-ghost"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <div className="text-xs text-secondary-400 dark:text-secondary-500 ml-2">
              v1.0.0
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-all duration-200"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-all duration-200"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-secondary-200 dark:border-secondary-700 animate-slide-up">
            <div className="px-4 py-4 space-y-3">
              {hasData && (
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-3 w-full text-left px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:text-secondary-900 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Data</span>
                </button>
              )}
              <div className="text-xs text-secondary-400 dark:text-secondary-500 px-3 py-2 border-t border-secondary-200 dark:border-secondary-700">
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