'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TokenReset = () => {
  const router = useRouter();

  useEffect(() => {
    // Check if token exists and is old
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const issuedAt = payload.iat * 1000; // Convert to milliseconds
        const now = Date.now();
        const tokenAgeDays = (now - issuedAt) / (1000 * 60 * 60 * 24);

        if (tokenAgeDays > 30) { // Example: token is old if > 30 days
          console.log('Old token detected. Clearing...');
          localStorage.removeItem('token');
          router.push('/login'); // Redirect to login page
        }
      } catch (error) {
        console.error('Invalid token format:', error);
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  }, [router]);

  return null; // This component doesn’t render anything
};

export default TokenReset;