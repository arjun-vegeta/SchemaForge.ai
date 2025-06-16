import axios from 'axios';
import { GenerationResult, ApiError } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        error: error.response.data.error || 'Server Error',
        message: error.response.data.message || 'An unexpected error occurred',
        details: error.response.data.details,
      };
      throw apiError;
    } else if (error.request) {
      // Network error
      const networkError: ApiError = {
        error: 'Network Error',
        message: 'Unable to connect to the server. Please check your connection.',
      };
      throw networkError;
    } else {
      // Other error
      const unknownError: ApiError = {
        error: 'Unknown Error',
        message: error.message || 'An unexpected error occurred',
      };
      throw unknownError;
    }
  }
);

export const apiService = {
  // Health check
  async healthCheck(): Promise<{ 
    status: string; 
    message: string;
    ai?: {
      status: string;
      message: string;
    };
  }> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Generate schema from natural language description
  async generateSchema(description: string): Promise<GenerationResult> {
    const response = await apiClient.post('/schema/generate', {
      description: description.trim(),
    });
    return response.data;
  },

  // Validate a JSON schema
  async validateSchema(schema: any): Promise<{ valid: boolean; errors: any[] }> {
    const response = await apiClient.post('/schema/validate', {
      schema,
    });
    return response.data;
  },

  // Generate API endpoints from entities
  async generateApiEndpoints(entities: any): Promise<any> {
    const response = await apiClient.post('/schema/api-endpoints', {
      entities,
    });
    return response.data;
  },

  // Generate ERD diagram from entities
  async generateErdDiagram(entities: any): Promise<any> {
    const response = await apiClient.post('/schema/erd', {
      entities,
    });
    return response.data;
  },
};

// Utility functions for common operations
export const utils = {
  // Download data as file
  downloadAsFile(data: any, filename: string, type: 'json' | 'yaml' | 'text' = 'json') {
    let content: string;
    let mimeType: string;

    switch (type) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'yaml':
        // Simple YAML conversion (for basic cases)
        content = this.jsonToYaml(data);
        mimeType = 'application/x-yaml';
        break;
      case 'text':
        content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        mimeType = 'text/plain';
        break;
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Simple JSON to YAML conversion
  jsonToYaml(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    
    if (obj === null) return 'null';
    if (typeof obj === 'boolean') return obj.toString();
    if (typeof obj === 'number') return obj.toString();
    if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`;
    
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return '\n' + obj.map(item => `${spaces}- ${this.jsonToYaml(item, indent + 1).trim()}`).join('\n');
    }
    
    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      
      return '\n' + keys.map(key => {
        const value = this.jsonToYaml(obj[key], indent + 1);
        return `${spaces}${key}: ${value.startsWith('\n') ? value : value}`;
      }).join('\n');
    }
    
    return obj.toString();
  },

  // Copy text to clipboard
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  },

  // Format JSON for display
  formatJson(obj: any, minified: boolean = false): string {
    return JSON.stringify(obj, null, minified ? 0 : 2);
  },

  // Generate example data for testing
  generateExampleDescriptions(): string[] {
    return [
      "I need to store user profiles with name, email, and age, and also product details with name, price, and description",
      
      "Create a library management system with books (title, author, ISBN, publication year), authors (name, biography, birth date), users (name, email, membership date), and borrowing records (borrow date, return date)",
      
      "Build a blog platform with posts (title, content, published date), authors (name, bio, avatar), categories (name, description), and comments (content, timestamp, author)",
      
      "Design an e-commerce system with products (name, price, description, stock), customers (name, email, address), orders (order date, total), and order items (quantity, price)",
      
      "Create a task management system with projects (name, description, deadline), tasks (title, description, status, priority), users (name, email, role), and time tracking (hours, date, description)",
      
      "Build a social media platform with users (username, email, bio, avatar), posts (content, timestamp, likes), comments (content, timestamp), and friendships (status, created date)"
    ];
  },

  // Validate description before sending
  validateDescription(description: string): { valid: boolean; error?: string } {
    if (!description || description.trim().length === 0) {
      return { valid: false, error: 'Description cannot be empty' };
    }
    
    if (description.trim().length < 10) {
      return { valid: false, error: 'Description is too short. Please provide more details.' };
    }
    
    if (description.length > 5000) {
      return { valid: false, error: 'Description is too long. Please keep it under 5000 characters.' };
    }
    
    return { valid: true };
  },

  // Extract entities from description (basic keyword detection)
  extractKeywords(description: string): string[] {
    const keywords = description.toLowerCase().match(/\b\w+\b/g) || [];
    const entityKeywords = keywords.filter(word => 
      word.length > 3 && 
      !['with', 'and', 'the', 'for', 'from', 'that', 'this', 'have', 'need', 'want', 'create', 'build', 'design', 'system', 'platform', 'application'].includes(word)
    );
    
    // Remove duplicates and return
    return Array.from(new Set(entityKeywords));
  },
};

export default apiService; 