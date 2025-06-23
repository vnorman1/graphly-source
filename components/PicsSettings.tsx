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
      <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
        IndexedDB nem támogatott ebben a böngészőben.
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gray-100/50 rounded-lg border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">Tárolt Képek</h4>        <div className="flex items-center gap-2">
          <button
            onClick={loadImages}
            className="text-xs text-[#FF3B30] hover:text-red-700 font-medium"
            title="Frissítés"
          >
            ↻
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>      {loading ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Betöltés...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">Nincsenek tárolt képek.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {images.length} kép ({formatFileSize(images.reduce((sum, img) => sum + img.size, 0))})
            </span>
            <button
              onClick={handleClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-medium underline"
              title="Összes kép törlése"
            >
              Összes törlés
            </button>
          </div>
          
          {isExpanded && (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {images.map(image => (                <div
                  key={image.id}
                  className="relative border border-gray-200 rounded-md p-2 hover:border-[#FF3B30] transition-colors cursor-pointer group"
                  onClick={() => handleImageClick(image)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image)}
                  title={`Kattints vagy húzd a canvas-ra: ${image.filename}`}
                >
                  {/* Kép előnézet */}
                  <div className="aspect-video bg-gray-100 rounded-sm mb-2 overflow-hidden">
                    {imageUrls.get(image.id) && (
                      <img
                        src={imageUrls.get(image.id)}
                        alt={image.filename}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Kép információk */}
                  <div className="text-xs text-gray-700">
                    <p className="truncate font-medium" title={image.filename}>
                      {image.filename}
                    </p>
                    <p className="text-gray-500">
                      {formatFileSize(image.size)}
                    </p>
                  </div>

                  {/* Törlés gomb - csak hover-on jelenik meg */}
                  <button
                    onClick={(e) => handleDeleteImage(image.id, e)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Törlés"
                  >
                    ×
                  </button>                  {/* Drag hint */}
                  <div className="absolute inset-0 bg-[#FF3B30] bg-opacity-20 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-medium text-[#FF3B30] bg-white px-2 py-1 rounded">
                      Húzd ide ↗
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isExpanded && images.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {images.slice(0, 4).map(image => (                <div
                  key={image.id}
                  className="w-12 h-12 bg-gray-100 rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-[#FF3B30] transition-colors"
                  onClick={() => handleImageClick(image)}
                  draggable
                  onDragStart={(e) => handleDragStart(e, image)}
                  title={image.filename}
                >
                  {imageUrls.get(image.id) && (
                    <img
                      src={imageUrls.get(image.id)}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              ))}
              {images.length > 4 && (
                <div 
                  className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 cursor-pointer"
                  onClick={() => setIsExpanded(true)}
                >
                  +{images.length - 4}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="text-xs text-gray-500">
        💡 Kattints egy képre vagy húzd a canvas-ra a használathoz
      </div>
    </div>
  );
};

export default PicsSettings;
