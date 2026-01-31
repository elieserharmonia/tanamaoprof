import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro do Service Worker de forma resiliente
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('TáNaMão PWA: Service Worker ativo!', reg.scope);
      })
      .catch(err => {
        console.warn('TáNaMão PWA: Erro ao registrar Service Worker (pode ser ambiente de dev):', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Elemento root não encontrado");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);