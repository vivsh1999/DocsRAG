/**
 * Configuration for the Documentation Chat Widget
 */

export interface ChatConfig {
  apiUrl: string;
  welcomeMessage: string;
  placeholder: string;
  title: string;
  subtitle: string;
  maxRetries: number;
  retryDelay: number;
  enableTypingIndicator: boolean;
  enableTimestamps: boolean;
  enableMetadata: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'auto' | 'light' | 'dark';
}

const getChatConfig = (): ChatConfig => {
  // Use window.location to detect development vs production
  // Default to production if window is not available (SSR)
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  return {
    apiUrl: isDevelopment 
      ? 'http://localhost:3001'
      : '/api',
    welcomeMessage: 'Hi! I\'m your **documentation assistant**. Ask me anything about the docs!\n\nI can help you with:\n- Code examples\n- Configuration details\n- Troubleshooting\n- Best practices\n\nTry asking: `How do I configure the API?`',
    placeholder: 'Ask about the documentation...',
    title: 'Documentation Assistant',
    subtitle: 'Ask me anything about the docs',
    maxRetries: 3,
    retryDelay: 1000, // ms
    enableTypingIndicator: true,
    enableTimestamps: true,
    enableMetadata: true,
    position: 'bottom-right',
    theme: 'auto',
  };
};

export default getChatConfig;
