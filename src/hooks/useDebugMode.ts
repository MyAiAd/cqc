import { useState, useEffect } from 'react';

export const useDebugMode = () => {
  const [debugMode, setDebugMode] = useState<boolean>(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('harmony360-debug-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Save to localStorage whenever debugMode changes
    localStorage.setItem('harmony360-debug-mode', JSON.stringify(debugMode));
  }, [debugMode]);

  const toggleDebugMode = () => {
    setDebugMode(prev => !prev);
  };

  return {
    debugMode,
    toggleDebugMode,
    setDebugMode
  };
}; 