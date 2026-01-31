
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro do Service Worker apontando para a raiz absoluta
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Registro absoluto para garantir que o SW seja encontrado na raiz do domínio
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('TáNaMão PWA: Service Worker ativo!', reg.scope);
      })
      .catch(err => {
        console.error('TáNaMão PWA: Erro ao registrar Service Worker:', err);
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
