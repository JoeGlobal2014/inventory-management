// app/components/ErrorBoundary.tsx
"use client"; // Mark as Client Component

import React, { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface ErrorBoundaryProps {
  children: ReactNode;
}

const FallbackComponent = () => (
  <h1>Something went wrong. Please refresh the page.</h1>
);

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const handleError = (error: Error, info: React.ErrorInfo) => {
    console.error('ErrorBoundary caught an error:', error, {
      componentStack: info.componentStack || 'No stack trace available',
    });
  };

  return (
    <ReactErrorBoundary FallbackComponent={FallbackComponent} onError={handleError}>
      {children}
    </ReactErrorBoundary>
  );
}