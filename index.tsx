
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Registro do Service Worker apontando para a raiz pública
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Busca o arquivo na raiz /sw.js que foi movido para /public
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
