import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Créer le root de l'application
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendre l'application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service Worker pour PWA (optionnel)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}