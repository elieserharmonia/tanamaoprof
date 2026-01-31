
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro robusto do Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usando caminho absoluto para evitar que o roteamento do SPA retorne HTML
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('TáNaMão: Service Worker registrado com sucesso!', reg.scope);
      })
      .catch(err => {
        console.error('TáNaMão: Falha ao registrar Service Worker:', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
