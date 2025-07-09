import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add debug functions to window object for testing
import { debugPractices } from './services/dataService';

declare global {
  interface Window {
    debugPractices: () => Promise<any>;
  }
}

// Make debug functions available globally
window.debugPractices = debugPractices;

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <App />
  // </StrictMode>
);
