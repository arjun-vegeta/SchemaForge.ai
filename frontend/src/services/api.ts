import axios from 'axios';
import { GenerationResult, ApiError } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Server status types
export interface ServerStatus {
  isAwake: boolean;
  isWakingUp: boolean;
  lastActiveTime: number;
  consecutiveFailures: number;
}

// Global server status
let serverStatus: ServerStatus = {
  isAwake: true,
  isWakingUp: false,
  lastActiveTime: Date.now(),
  consecutiveFailures: 0,
};

// Background health check
let healthCheckInterval: NodeJS.Timeout | null = null;

const startBackgroundHealthCheck = () => {
  if (healthCheckInterval) return; // Already running
  
  healthCheckInterval = setInterval(async () => {
    // Only check if server is not awake or waking up
    if (!serverStatus.isAwake || serverStatus.isWakingUp) {
      try {
        const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 10000 });
        if (response.status === 200) {
          console.log('🟢 Background health check: Server is responding');
          serverStatus.isAwake = true;
          serverStatus.isWakingUp = false;
          serverStatus.consecutiveFailures = 0;
          serverStatus.lastActiveTime = Date.now();
          notifyStatusChange();
        }
      } catch (error) {
        console.log('🔍 Background health check: Server still not responding');
      }
    }
  }, 5000); // Check every 5 seconds when server is down
};

const stopBackgroundHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
};

// Status change listeners
const statusListeners: Array<(status: ServerStatus) => void> = [];

export const subscribeToServerStatus = (listener: (status: ServerStatus) => void) => {
  statusListeners.push(listener);
  // Immediately notify with current status
  listener({ ...serverStatus });
  
  // Return unsubscribe function
  return () => {
    const index = statusListeners.indexOf(listener);
    if (index > -1) {
      statusListeners.splice(index, 1);
    }
  };
};

const notifyStatusChange = () => {
  statusListeners.forEach(listener => listener({ ...serverStatus }));
};

// Sleep detection parameters
const SLEEP_TIMEOUT = 30000; // 30 seconds to detect likely sleep
const WAKE_UP_TIMEOUT = 120000; // 2 minutes max wake-up time
const MAX_RETRIES = 8; // Maximum retry attempts during wake-up
const RETRY_DELAYS = [1000, 2000, 3000, 5000, 8000, 12000, 15000, 20000]; // Progressive delays

// Create axios instance with enhanced config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: SLEEP_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced sleep/wake detection
const detectServerSleep = (error: any): boolean => {
  // Network timeout or connection error patterns that suggest server sleep
  if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
    return true;
  }
  
  // Axios timeout
  if (error.message?.includes('timeout')) {
    return true;
  }
  
  // Connection refused or similar
  if (error.message?.includes('connect') || error.message?.includes('ECONNREFUSED')) {
    return true;
  }
  
  // 502/504 errors often indicate server starting up, but not 503 AI service overloaded
  if (error.response?.status === 502 || error.response?.status === 504) {
    return true;
  }
  
  // Don't retry on AI service overloaded (503 with specific message)
  if (error.response?.status === 503 && 
      error.response?.data?.message?.includes('AI service is currently overloaded')) {
    return false;
  }
  
  // Other 503 errors might be server sleep
  if (error.response?.status === 503) {
    return true;
  }
  
  return false;
};

// Enhanced retry with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  retryDelays: number[] = RETRY_DELAYS,
  operationName: string = 'API call'
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Success! Update server status
      if (serverStatus.isWakingUp || !serverStatus.isAwake) {
        console.log('🟢 Server is now awake and responding');
        serverStatus.isAwake = true;
        serverStatus.isWakingUp = false;
        serverStatus.consecutiveFailures = 0;
        serverStatus.lastActiveTime = Date.now();
        notifyStatusChange();
        stopBackgroundHealthCheck(); // Stop monitoring since server is responding
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      const isLikelySleep = detectServerSleep(error);
      
      console.log(`❌ ${operationName} attempt ${attempt + 1}/${maxRetries + 1} failed:`, {
        error: error.message,
        isLikelySleep,
        willRetry: attempt < maxRetries
      });
      
             // Update server status on first failure
      if (attempt === 0 && isLikelySleep) {
        serverStatus.consecutiveFailures++;
        
        if (serverStatus.isAwake) {
          console.log('😴 Server appears to be sleeping, starting wake-up process...');
          serverStatus.isAwake = false;
          serverStatus.isWakingUp = true;
          notifyStatusChange();
          startBackgroundHealthCheck(); // Start monitoring for when server comes back
        }
      }
      
      // Don't retry if it's not a sleep-related error
      if (!isLikelySleep && attempt === 0) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        console.log('💀 Max retries reached, server may be down');
        serverStatus.isWakingUp = false;
        serverStatus.consecutiveFailures = maxRetries + 1;
        notifyStatusChange();
        break;
      }
      
      // Wait before next retry
      const delay = retryDelays[attempt] || retryDelays[retryDelays.length - 1];
      console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 2}/${maxRetries + 1}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Response interceptor for enhanced error handling
apiClient.interceptors.response.use(
  (response) => {
    // Success - update server status if needed
    if (!serverStatus.isAwake || serverStatus.isWakingUp) {
      serverStatus.isAwake = true;
      serverStatus.isWakingUp = false;
      serverStatus.consecutiveFailures = 0;
      serverStatus.lastActiveTime = Date.now();
      notifyStatusChange();
    }
    return response;
  },
  (error) => {
    // Let the retry logic handle this
    throw error;
  }
);

export const apiService = {
  // Enhanced health check with retry
  async healthCheck(): Promise<{ 
    status: string; 
    message: string;
    ai?: {
      status: string;
      message: string;
    };
  }> {
    return retryWithBackoff(
      async () => {
        const response = await apiClient.get('/health');
        return response.data;
      },
      3, // Fewer retries for health check
      [1000, 3000, 5000],
      'Health check'
    );
  },

  // Generate schema with enhanced retry logic
  async generateSchema(description: string): Promise<GenerationResult> {
    return retryWithBackoff(
      async () => {
        const response = await apiClient.post('/schema/generate', {
          description: description.trim(),
        });
        return response.data;
      },
      MAX_RETRIES,
      RETRY_DELAYS,
      'Schema generation'
    );
  },

  // Validate a JSON schema with retry
  async validateSchema(schema: any): Promise<{ valid: boolean; errors: any[] }> {
    return retryWithBackoff(
      async () => {
        const response = await apiClient.post('/schema/validate', {
          schema,
        });
        return response.data;
      },
      5, // Medium retry count for validation
      [1000, 2000, 4000, 8000, 12000],
      'Schema validation'
    );
  },

  // Generate API endpoints with retry
  async generateApiEndpoints(entities: any): Promise<any> {
    return retryWithBackoff(
      async () => {
        const response = await apiClient.post('/schema/api-endpoints', {
          entities,
        });
        return response.data;
      },
      MAX_RETRIES,
      RETRY_DELAYS,
      'API endpoints generation'
    );
  },

  // Generate ERD diagram with retry
  async generateErdDiagram(entities: any): Promise<any> {
    return retryWithBackoff(
      async () => {
        const response = await apiClient.post('/schema/erd', {
          entities,
        });
        return response.data;
      },
      MAX_RETRIES,
      RETRY_DELAYS,
      'ERD diagram generation'
    );
  },

  // Get current server status
  getServerStatus(): ServerStatus {
    return { ...serverStatus };
  },

  // Manual server wake-up ping
  async pingServer(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
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

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

export default apiService; 