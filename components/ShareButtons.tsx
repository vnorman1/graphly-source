import React from 'react';

interface ShareButtonsProps {
  getImageBlob: () => Promise<Blob | null>; // A canvas vagy exportált kép blobját adja vissza
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ getImageBlob }) => {
  const handleShare = async () => {
    try {
      const blob = await getImageBlob();
      if (!blob) return;
      if (navigator.share && typeof window !== 'undefined') {
        const file = new File([blob], 'og-image.png', { type: blob.type });
        // Ellenőrizzük, hogy a Web Share API támogatja-e a fájlokat
        if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Szia!',
            text: 'Nézd meg ezt a képet! amit a GRAPHLY-val csináltam! https://vnorman1.github.io/graphly/'
          });
        } else {
          // Ha nem támogatja a fájlokat, próbáljuk meg csak az URL-t megosztani (pl. desktopon)
          const urlObj = URL.createObjectURL(blob);
          await navigator.share({
            title: 'Szia!',
            text: 'Nézd meg ezt a képet! amit a GRAPHLY-val csináltam! https://vnorman1.github.io/graphly/',
            url: urlObj
          });
          setTimeout(() => URL.revokeObjectURL(urlObj), 5000);
        }
      }
    } catch {}
  };

  return (
    <div className="flex flex-row items-center">
      <button
        type="button"
        className={
          `share-btn transition-all border-2 border-[#FF3B30] rounded-xl px-6 py-2 font-bold text-[#FF3B30] bg-white
          shadow-md hover:shadow-lg w-full hover:bg-[#FF3B30] hover:text-white focus:outline-none
          focus:ring-4 focus:ring-[#FF3B30]/30 focus:ring-offset-2
          active:scale-95
          group relative overflow-hidden`
        }
        onClick={handleShare}
        title="Kép megosztása"
      >
        <span className="relative z-10">Megosztás</span>
        <span className="absolute inset-0 rounded-xl border-2 border-dotted border-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></span>
      </button>
      {/* Extra animációkhoz globális CSS, nem style jsx! */}
      <style>{`
        .share-btn {
          box-shadow: 0 2px 8px 0 #ff3b3022;
          transition: box-shadow 0.2s, background 0.2s, color 0.2s, border-color 0.2s, transform 0.12s;
        }
        .share-btn:hover {
          box-shadow: 0 4px 16px 0 #ff3b3044;
        }
        .share-btn:active {
          transform: scale(0.96);
        }
      `}</style>
    </div>
  );
};

export default ShareButtons;
