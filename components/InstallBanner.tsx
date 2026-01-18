
import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, ArrowBigDown } from 'lucide-react';

interface InstallBannerProps {
  deferredPrompt: any;
  onInstall: () => void;
}

const InstallBanner: React.FC<InstallBannerProps> = ({ deferredPrompt, onInstall }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('install_banner_dismissed_v2');
      if (!dismissed) setShowBanner(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem('install_banner_dismissed_v2', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] p-4 pointer-events-none animate-in slide-in-from-top duration-500">
      <div className="max-w-md mx-auto bg-black text-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2 border-yellow-400/30 pointer-events-auto">
        <div className="flex items-start gap-4">
          <div className="bg-yellow-400 p-3 rounded-2xl shrink-0 shadow-lg animate-bounce">
            <Download className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-black text-sm uppercase tracking-tighter text-yellow-400">Instalar Aplicativo</h3>
            {isIOS ? (
              <div className="space-y-3">
                <p className="text-[11px] font-bold leading-tight opacity-90">
                  Para usar como aplicativo no seu iPhone:
                </p>
                <div className="flex flex-col gap-2 bg-white/10 p-3 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <span className="bg-yellow-400 text-black w-5 h-5 flex items-center justify-center rounded-full text-[10px]">1</span>
                    Toque em <Share className="w-4 h-4 inline text-blue-400" /> (Compartilhar)
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase">
                    <span className="bg-yellow-400 text-black w-5 h-5 flex items-center justify-center rounded-full text-[10px]">2</span>
                    Role e toque em <PlusSquare className="w-4 h-4 inline" /> "Tela de Início"
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-bold leading-tight opacity-90">
                  Acesse com um toque e use offline!
                </p>
                {deferredPrompt ? (
                  <button 
                    onClick={onInstall}
                    className="w-full bg-yellow-400 text-black font-black py-3 rounded-xl text-xs uppercase shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Instalar Agora <ArrowBigDown className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-[9px] bg-white/5 p-2 rounded-lg italic opacity-60">
                    Abra as opções do navegador (três pontos) e clique em "Instalar Aplicativo".
                  </p>
                )}
              </div>
            )}
          </div>
          <button onClick={dismiss} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
