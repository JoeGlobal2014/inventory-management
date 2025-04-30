'use client';

import { useEffect } from "react";

export default function TokenDebugger() {
  useEffect(() => {
    // Debug: Log token on mount
    console.log('TokenDebugger mounted. Initial token in localStorage:', localStorage.getItem('token'));

    // Debug: Override localStorage.setItem to catch token changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      if (key === 'token') {
        console.log('localStorage.setItem called for token. New value:', value);
        console.trace('Call stack for localStorage.setItem:');
      }
      originalSetItem.apply(this, [key, value]);
    };

    // Debug: Poll localStorage for token changes
    let lastToken = localStorage.getItem('token');
    const tokenPollInterval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== lastToken) {
        console.log('Token changed in localStorage (TokenDebugger polling). Old token:', lastToken, 'New token:', currentToken);
        console.trace('Call stack for token change (polling):');
        lastToken = currentToken;
      }
    }, 1000);

    return () => {
      clearInterval(tokenPollInterval);
      localStorage.setItem = originalSetItem; // Restore original setItem
    };
  }, []);

  return null; // This component doesn't render anything
}