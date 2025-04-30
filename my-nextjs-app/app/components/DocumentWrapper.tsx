"use client";

  import { useState, useEffect } from 'react';

  export default function DocumentWrapper({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient) {
      return <div>Loading...</div>;
    }

    return <>{children}</>;
  }