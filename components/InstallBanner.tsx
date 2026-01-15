
import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

const InstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Verifica se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Lógica para detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Mostra o banner após 3 segundos
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('install_banner_dismissed');
      if (!dismissed) setShowBanner(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem('install_banner_dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-black text-white p-4 animate-in slide-in-from-top duration-500 relative z-[70] shadow-xl">
      <div className="flex items-start gap-3">
        <div className="bg-yellow-400 p-2 rounded-xl shrink-0 border-2 border-white/20">
          <Download className="w-6 h-6 text-black" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-xs uppercase tracking-tight text-yellow-400">INSTALE O TÁNAMÃO</h3>
          {isIOS ? (
            <p className="text-[10px] font-medium leading-tight opacity-90">
              Toque no ícone de <Share className="w-3 h-3 inline mb-1 mx-0.5" /> compartilhar e selecione <span className="font-bold">"Adicionar à Tela de Início"</span> para usar como aplicativo.
            </p>
          ) : (
            <p className="text-[10px] font-medium leading-tight opacity-90">
              Clique nas opções do navegador e selecione <span className="font-bold">"Instalar Aplicativo"</span> para acesso rápido e offline.
            </p>
          )}
        </div>
        <button onClick={dismiss} className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default InstallBanner;
