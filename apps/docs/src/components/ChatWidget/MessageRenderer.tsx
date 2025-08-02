import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import styles from './MessageRenderer.module.css';

interface MessageRendererProps {
  content: string;
  isUser: boolean;
}

// Custom components for MDX rendering
const components = {
  // Headers
  h1: (props: any) => <h1 className={styles.messageH1} {...props} />,
  h2: (props: any) => <h2 className={styles.messageH2} {...props} />,
  h3: (props: any) => <h3 className={styles.messageH3} {...props} />,
  h4: (props: any) => <h4 className={styles.messageH4} {...props} />,
  h5: (props: any) => <h5 className={styles.messageH5} {...props} />,
  h6: (props: any) => <h6 className={styles.messageH6} {...props} />,
  
  // Text formatting
  p: (props: any) => <p className={styles.messageParagraph} {...props} />,
  strong: (props: any) => <strong className={styles.messageBold} {...props} />,
  em: (props: any) => <em className={styles.messageItalic} {...props} />,
  
  // Code
  code: (props: any) => <code className={styles.messageInlineCode} {...props} />,
  pre: (props: any) => <pre className={styles.messageCodeBlock} {...props} />,
  
  // Lists
  ul: (props: any) => <ul className={styles.messageList} {...props} />,
  ol: (props: any) => <ol className={styles.messageOrderedList} {...props} />,
  li: (props: any) => <li className={styles.messageListItem} {...props} />,
  
  // Links
  a: (props: any) => (
    <a 
      className={styles.messageLink} 
      target="_blank" 
      rel="noopener noreferrer" 
      {...props} 
    />
  ),
  
  // Blockquotes
  blockquote: (props: any) => <blockquote className={styles.messageBlockquote} {...props} />,
  
  // Tables
  table: (props: any) => <table className={styles.messageTable} {...props} />,
  thead: (props: any) => <thead className={styles.messageTableHead} {...props} />,
  tbody: (props: any) => <tbody className={styles.messageTableBody} {...props} />,
  tr: (props: any) => <tr className={styles.messageTableRow} {...props} />,
  th: (props: any) => <th className={styles.messageTableHeader} {...props} />,
  td: (props: any) => <td className={styles.messageTableCell} {...props} />,
  
  // Horizontal rule
  hr: (props: any) => <hr className={styles.messageHr} {...props} />,
};

// Simple markdown parser for basic formatting
const parseSimpleMarkdown = (text: string): string => {
  return text
    // Bold **text** or __text__
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    
    // Italic *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    
    // Inline code `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    
    // Code blocks ```language\ncode\n```
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    
    // Line breaks
    .replace(/\n/g, '<br />');
};

const MessageRenderer: React.FC<MessageRendererProps> = ({ content, isUser }) => {
  // For user messages, render as plain text
  if (isUser) {
    return <div className={styles.messageText}>{content}</div>;
  }

  // For bot messages, parse markdown
  const htmlContent = parseSimpleMarkdown(content);

  return (
    <div 
      className={styles.messageMarkdown}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MessageRenderer;
