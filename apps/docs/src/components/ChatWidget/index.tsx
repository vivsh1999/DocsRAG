import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { getStaticChatConfig } from './hooks';
import MessageRenderer from './MessageRenderer';
import styles from './styles.module.css';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  metadata?: {
    responseLength?: number;
    approach?: string;
    queryAnalysis?: {
      intent: string;
      confidence: number;
    };
  };
}

interface QueryResponse {
  response: string;
  metadata?: {
    responseLength: number;
    approach?: string;
    queryAnalysis?: {
      intent: string;
      confidence: number;
    };
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

const ChatWidget: React.FC = () => {
  const config = getStaticChatConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: config.welcomeMessage,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: text.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QueryResponse | ErrorResponse = await response.json();

      let botMessage: Message;

      if ('error' in data) {
        botMessage = {
          id: (Date.now() + 1).toString(),
          text: `Sorry, I encountered an error: ${data.error}${data.details ? ` (${data.details})` : ''}`,
          isUser: false,
          timestamp: new Date(),
        };
      } else {
        botMessage = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date(),
          metadata: data.metadata,
        };
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble connecting to the documentation service. Please try again later.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.chatWidget}>
      {/* Chat Window */}
      <div className={clsx(styles.chatWindow, { [styles.open]: isOpen })}>
        <div className={styles.chatHeader}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>💬</div>
            <div className={styles.headerText}>
              <h3>{config.title}</h3>
              <p>{config.subtitle}</p>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={toggleChat}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={clsx(styles.message, {
                [styles.userMessage]: message.isUser,
                [styles.botMessage]: !message.isUser,
              })}
            >
              <div className={styles.messageContent}>
                <MessageRenderer content={message.text} isUser={message.isUser} />
                <div className={styles.messageTime}>
                  {formatTimestamp(message.timestamp)}
                  {message.metadata?.approach && (
                    <span className={styles.approach}>
                      · {message.metadata.approach}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className={clsx(styles.message, styles.botMessage)}>
              <div className={styles.messageContent}>
                <div className={styles.loadingDots}>
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className={styles.inputForm} onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={config.placeholder}
            className={styles.messageInput}
            disabled={isLoading}
          />
          <button
            type="submit"
            className={styles.sendButton}
            disabled={isLoading || !inputValue.trim()}
            aria-label="Send message"
          >
            📤
          </button>
        </form>
      </div>

      {/* Chat Toggle Button */}
      <button
        className={clsx(styles.chatToggle, { [styles.open]: isOpen })}
        onClick={toggleChat}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default ChatWidget;
