
import React, { useEffect, useState } from 'react';
import { Mail, X, Bell } from 'lucide-react';

interface NotificationProps {
  show: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

const SystemNotification: React.FC<NotificationProps> = ({ show, title, message, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show && !visible) return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm transition-all duration-500 ease-out transform ${visible ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'}`}>
      <div className="bg-white/95 backdrop-blur-md border-2 border-black rounded-3xl p-4 shadow-2xl flex items-start gap-4 ring-4 ring-black/5">
        <div className="bg-black p-2.5 rounded-2xl shrink-0 shadow-lg">
          <Mail className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-black/40">Notificação de E-mail</h4>
            <span className="text-[8px] font-bold text-black/20 uppercase">Agora</span>
          </div>
          <p className="text-xs font-black text-black truncate uppercase italic">{title}</p>
          <p className="text-[11px] font-medium text-black/70 leading-tight mt-1" dangerouslySetInnerHTML={{ __html: message }}></p>
        </div>
        <button onClick={() => setVisible(false)} className="text-black/20 hover:text-black">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SystemNotification;
