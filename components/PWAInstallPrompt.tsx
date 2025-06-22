import React, { useEffect, useState } from 'react';
import { BRAND_RED } from '../constants';

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1000 }}>
      <button
        onClick={handleInstall}
        style={{
          background: BRAND_RED,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '4px 12px',
          fontWeight: 600,
          fontSize: 13,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
          minWidth: 0,
          minHeight: 0,
          transition: 'background 0.2s',
        }}
        title="Telepítsd az alkalmazást!"
        aria-label="Telepítsd az alkalmazást!"
      >
        Telepítsd az appot
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
