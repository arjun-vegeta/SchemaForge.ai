import axios from 'axios';
import { GenerationResult } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Create axios instance with basic config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple retry function for failed requests
const retryRequest = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on AI service overloaded (503 with specific message)
      if (error.response?.status === 503 && 
          error.response?.data?.message?.includes('AI service is currently overloaded')) {
        throw error;
      }
      
      // Don't retry on client errors (4xx) or successful server responses
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry (only for network errors or 5xx server errors)
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  
  throw lastError;
};

// API service object
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
    return retryRequest(async () => {
      const response = await apiClient.get('/health');
      return response.data;
    });
  },

  // Generate schema with retry
  async generateSchema(description: string): Promise<GenerationResult> {
    return retryRequest(async () => {
      const response = await apiClient.post('/schema/generate', {
        description: description.trim(),
      });
      return response.data;
    });
  },

  // Validate a JSON schema with retry
  async validateSchema(schema: any): Promise<{ valid: boolean; errors: any[] }> {
    return retryRequest(async () => {
      const response = await apiClient.post('/schema/validate', {
        schema,
      });
      return response.data;
    });
  },

  // Generate API endpoints with retry
  async generateApiEndpoints(entities: any): Promise<any> {
    return retryRequest(async () => {
      const response = await apiClient.post('/schema/api-endpoints', {
        entities,
      });
      return response.data;
    });
  },

  // Generate ERD diagram with retry
  async generateErdDiagram(entities: any): Promise<any> {
    return retryRequest(async () => {
      const response = await apiClient.post('/schema/erd', {
        entities,
      });
      return response.data;
    });
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
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      } catch (fallbackError) {
        console.error('Failed to copy to clipboard:', fallbackError);
        return false;
      }
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
      
      "I need an elearning portal where students can register to courses, teachers can accept or reject, and the portal has learning streaks for each student",
      
      "I want to build a simple healthcare system management app where doctors can write prescriptions, patients can book slots, and doctors can accept or reject them",
      
      "Design an e-commerce system with products (name, price, description, stock), customers (name, email, address), orders (order date, total), and order items (quantity, price)",
      
      "Create a task management system with projects (name, description, deadline), tasks (title, description, status, priority), users (name, email, role), and time tracking (hours, date, description)",
      
      "I want to create a simple restaurant app where customers can place orders, chefs can see the orders and mark them as ready, and managers can track daily sales"
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

  // Extract keywords from description
  extractKeywords(description: string): string[] {
    const words = description.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => word.length > 3);
    return Array.from(new Set(keywords));
  },

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

export default apiService; 