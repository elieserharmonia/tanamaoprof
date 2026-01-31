
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registro do Service Worker com lógica de limpeza de cache forçada
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('TáNaMão PWA: Service Worker ativo!', reg.scope);
        
        // Se houver uma atualização esperando, avisa o usuário ou recarrega
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('Nova versão disponível. Recarregando...');
                  window.location.reload();
                }
              }
            };
          }
        };
      })
      .catch(err => {
        console.warn('TáNaMão PWA: Erro ao registrar Service Worker:', err);
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
