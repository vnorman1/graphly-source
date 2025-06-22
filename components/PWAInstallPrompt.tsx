import React, { useEffect, useState } from 'react';

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
          background: '#ffb3a7',
          color: '#1f2937',
          border: 'none',
          borderRadius: 8,
          padding: '12px 32px',
          fontWeight: 700,
          fontSize: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
        }}
      >
        Telepítsd az alkalmazást!
      </button>
    </div>
  );
};

export default PWAInstallPrompt;
