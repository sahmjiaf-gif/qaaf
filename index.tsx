
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Suppress Recharts defaultProps warning
const originalError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('Support for defaultProps will be removed from function components')) {
    return;
  }
  originalError(...args);
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
