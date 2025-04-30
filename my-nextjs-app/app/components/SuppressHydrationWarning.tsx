// app/components/SuppressHydrationWarning.tsx
"use client";

import React, { useState, useEffect, ReactNode } from 'react';

interface SuppressHydrationWarningProps {
  children: ReactNode;
}

export default function SuppressHydrationWarning({ children }: SuppressHydrationWarningProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null; // Render nothing on the server
  }

  return <>{children}</>;
}