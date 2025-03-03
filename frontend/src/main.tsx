import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css'; // If you have this file
import { HashRouter } from 'react-router-dom'; // Import HashRouter

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <HashRouter> {/* Wrap App with HashRouter */}
      <App />
    </HashRouter>
  </React.StrictMode>
);
