// app/components/ParticleBackground.tsx
"use client"; // Ensure this is a Client Component since it uses hooks

import React from 'react';

// Define the props interface for ParticleBackground
interface ParticleBackgroundProps {
  theme: 'light' | 'dark';
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ theme }) => {
  // Define background and particle styles based on the theme
  const backgroundStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: theme === 'dark' ? '#1a202c' : '#edf2f7', // Adjust colors based on theme
    zIndex: -1,
  };

  // Generate particles
  const particles = Array.from({ length: 50 }).map((_, index) => (
    <div
      key={index}
      className={`absolute rounded-full w-[10px] h-[10px] ${
        theme === 'dark' ? 'bg-white' : 'bg-gray-800'
      }`} // Adjust particle color based on theme
      style={{
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animation: `float ${Math.random() * 5 + 2}s infinite`,
      }}
    />
  ));

  return <div style={backgroundStyle}>{particles}</div>;
};

export default ParticleBackground;