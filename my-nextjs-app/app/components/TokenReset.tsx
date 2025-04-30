'use client';

import { useEffect } from 'react';

function TokenReset() {
  console.log('Rendering TokenReset');

  useEffect(() => {
    localStorage.removeItem('token');
  }, []); // Empty dependency array ensures this runs only once on mount

  return null;
}

export default TokenReset;