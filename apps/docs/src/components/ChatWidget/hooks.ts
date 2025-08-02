/**
 * Configuration hook for the Documentation Chat Widget
 * Uses Docusaurus context for environment detection
 */

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

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

export const useChatConfig = (): ChatConfig => {
  const { siteConfig } = useDocusaurusContext();
  
  // Detect development environment
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.port === '3000');
  
  return {
    apiUrl: isDevelopment 
      ? 'http://localhost:3001'
      : '/api',
    welcomeMessage: 'Hi! I\'m your documentation assistant. Ask me anything about the docs!',
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

// Static config for cases where hooks can't be used
export const getStaticChatConfig = (): ChatConfig => {
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.port === '3000');
  
  return {
    apiUrl: isDevelopment 
      ? 'http://localhost:3001'
      : '/api',
    welcomeMessage: 'Hi! I\'m your **documentation assistant**. Ask me anything about the docs!\n\nI can help you with:\n- Code examples\n- Configuration details\n- Troubleshooting\n- Best practices\n\nTry asking: `How do I configure the API?`',
    placeholder: 'Ask about the documentation...',
    title: 'Documentation Assistant',
    subtitle: 'Ask me anything about the docs',
    maxRetries: 3,
    retryDelay: 1000,
    enableTypingIndicator: true,
    enableTimestamps: true,
    enableMetadata: true,
    position: 'bottom-right',
    theme: 'auto',
  };
};
