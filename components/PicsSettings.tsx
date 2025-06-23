import React, { useState, useEffect } from 'react';
import { useImageDB, ImageRecord } from '../hooks/useImageDB';

interface PicsSettingsProps {
  onAddImageLayer: (blob: Blob, filename: string, originalImageId: string) => void;
}

const PicsSettings: React.FC<PicsSettingsProps> = ({ onAddImageLayer }) => {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());  const [isExpanded, setIsExpanded] = useState(false);
  const { listImages, deleteImage, clearAll, isSupported } = useImageDB();

  // Képek betöltése az első renderkor
  useEffect(() => {
    if (isSupported) {
      loadImages();
    }
  }, [isSupported]);

  // Cleanup: blob URL-ek felszabadítása amikor a komponens unmount-olódik
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const imageList = await listImages();
      setImages(imageList);
      
      // Blob URL-ek generálása az előnézethez
      const urlMap = new Map<string, string>();
      imageList.forEach(image => {
        const url = URL.createObjectURL(image.blob);
        urlMap.set(image.id, url);
      });
      
      // Régi URL-ek felszabadítása
      imageUrls.forEach(url => URL.revokeObjectURL(url));
      setImageUrls(urlMap);
    } catch (error) {
      console.error('Hiba a képek betöltésekor:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteImage = async (imageId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Megakadályozza a kép hozzáadását a törlés gombra kattintáskor
    
    if (!confirm('Biztosan törölni szeretnéd ezt a képet?')) {
      return;
    }

    try {
      await deleteImage(imageId);
      
      // URL felszabadítása
      const url = imageUrls.get(imageId);
      if (url) {
        URL.revokeObjectURL(url);
      }
      
      // Állapot frissítése
      setImages(prev => prev.filter(img => img.id !== imageId));
      setImageUrls(prev => {
        const newMap = new Map(prev);
        newMap.delete(imageId);
        return newMap;
      });
    } catch (error) {
      console.error('Hiba a kép törlésekor:', error);
      alert('Hiba történt a kép törlésekor!');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Biztosan törölni szeretnéd az ÖSSZES tárolt képet? Ez a művelet visszavonhatatlan!')) {
      return;
    }

    try {
      await clearAll();
      
      // Összes URL felszabadítása
      imageUrls.forEach(url => URL.revokeObjectURL(url));
      
      // Állapot frissítése
      setImages([]);
      setImageUrls(new Map());
      
      alert('Minden kép sikeresen törölve!');
    } catch (error) {
      console.error('Hiba az összes kép törlésekor:', error);
      alert('Hiba történt az összes kép törlésekor!');
    }
  };
  const handleImageClick = (image: ImageRecord) => {
    onAddImageLayer(image.blob, image.filename, image.id);
  };

  const handleDragStart = (event: React.DragEvent, image: ImageRecord) => {
    // A blob nem közvetlenül szerializálható, ezért csak az ID-t mentjük
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'stored-image',
      imageId: image.id,
      filename: image.filename
    }));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isSupported) {
    return (
      <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg  text-yellow-800 text-sm">
        IndexedDB nem támogatott ebben a böngészőben.
      </div>
    );
  }

  return (
    <div className="mt-4 bg-[#F8F9FB] rounded-xl border border-gray-200 ">
      <div className="px-6 pt-5 pb-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-bold text-xl text-gray-900">Képtár</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadImages}
            className="px-2 h-6  border-gray-300 rounded-md bg-white hover:text-[#FF3B30] text-gray-500 font-semibold text-xs text-base hover:border-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors duration-150 focus:outline-none"
            title="Frissítés"
            type="button"
            aria-label="Frissítés"
          >
            Frissítés
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group p-0 m-0 bg-transparent border-none outline-none focus:outline-none"
            title={isExpanded ? 'Bezár' : 'Kibont'}
            type="button"
            aria-label={isExpanded ? 'Bezár' : 'Kibont'}
          >
            <svg
              className={`w-6 h-6 text-gray-700 transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''} group-hover:text-[#FF3B30]`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
      <div className="px-6 pt-4 pb-2">
        {loading ? (
          <div className="text-center py-6">
            <div className="w-8 h-8 mx-auto border-2 border-[#FF3B30]/30 border-t-[#FF3B30] rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-500">Betöltés...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">Nincsenek tárolt képek.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="font-medium">
                {images.length} kép <span className="text-gray-300">|</span> {formatFileSize(images.reduce((sum, img) => sum + img.size, 0))}
              </span>
              <button
                onClick={handleClearAll}
                className="px-2 h-6  border-gray-300 rounded-md bg-white hover:text-[#FF3B30] text-gray-500 font-semibold text-xs text-base hover:border-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors duration-150 focus:outline-none"
                title="Összes kép törlése"
                type="button"
              >
                Összes törlés
              </button>
            </div>
            {isExpanded && (
              <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto">
                {images.map(image => (
                  <div
                    key={image.id}
                    className="relative border border-gray-200 rounded-md p-2 bg-white  hover:border-[#FF3B30] transition-colors cursor-pointer group flex flex-col"
                    onClick={() => handleImageClick(image)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, image)}
                    title={`Kattints vagy húzd a canvas-ra: ${image.filename}`}
                  >
                    {/* Kép előnézet */}
                    <div className="aspect-video bg-gray-50 rounded-md mb-2 overflow-hidden border border-gray-200 flex items-center justify-center">
                      {imageUrls.get(image.id) ? (
                        <img
                          src={imageUrls.get(image.id)}
                          alt={image.filename}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">?</div>
                      )}
                    </div>
                    {/* Kép információk */}
                    <div className="text-xs text-gray-700 flex-1">
                      <p className="truncate font-semibold" title={image.filename}>
                        {image.filename}
                      </p>
                      <p className="text-gray-400">
                        {formatFileSize(image.size)}
                      </p>
                    </div>
                    {/* Törlés gomb */}
                    <button
                      onClick={(e) => handleDeleteImage(image.id, e)}
                      className="absolute top-2 right-2 w-6 h-6 border border-[#FF3B30] bg-white text-[#FF3B30] rounded-md text-base font-bold  hover:bg-[#FF3B30] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF3B30]"
                      title="Törlés"
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!isExpanded && images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.slice(0, 4).map(image => (
                  <div
                    key={image.id}
                    className="w-14 h-14 bg-gray-50 rounded-md border border-gray-200  overflow-hidden cursor-pointer hover:border-[#FF3B30] transition-colors flex items-center justify-center"
                    onClick={() => handleImageClick(image)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, image)}
                    title={image.filename}
                  >
                    {imageUrls.get(image.id) ? (
                      <img
                        src={imageUrls.get(image.id)}
                        alt={image.filename}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">?</div>
                    )}
                  </div>
                ))}
                {images.length > 4 && (
                  <div 
                    className="w-14 h-14 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-500 cursor-pointer  hover:bg-gray-200 transition-colors"
                    onClick={() => setIsExpanded(true)}
                    title="További képek megjelenítése"
                  >
                    +{images.length - 4}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <div className="text-xs text-gray-400 pt-3 flex items-center gap-1">
          <span role="img" aria-label="info">💡</span> Kattints vagy húzd a képet a canvas-hoz.
        </div>
      </div>
    </div>
  );
};

export default PicsSettings;
