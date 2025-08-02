import React from 'react';
import { useLocation } from '@docusaurus/router';
import ChatWidget from '../components/ChatWidget';

// This component wraps the entire app and allows us to add the chat widget globally
export default function Root({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Don't show chat widget on specific pages if needed
  const hideOnPaths = ['/admin', '/login']; // Add paths where you don't want the chat
  const shouldShowChat = !hideOnPaths.some(path => location.pathname.startsWith(path));

  return (
    <>
      {children}
      {shouldShowChat && <ChatWidget />}
    </>
  );
}
