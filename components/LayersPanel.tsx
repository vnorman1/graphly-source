import React, { useState } from 'react';
import { Layer, LayerType } from '../types';
import ControlPanelSection from './ControlPanelSection'; // Visszaállítva
import IconButton from './IconButton';
import FileUploadInput from './FileUploadInput'; 
import { EyeIcon, EyeSlashIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon, TextIcon, ImageIcon, LogoIcon } from './icons/SimpleIcons';
import { BRAND_RED } from '../constants';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddLayer: (type: LayerType, file?: File) => void;
  onReorderLayers?: (fromIndex: number, toIndex: number) => void; // ÚJ
}

const LayerTypeIcon: React.FC<{type: LayerType}> = ({type}) => {
    if (type === 'text') return <TextIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" />;
    if (type === 'logo') return <LogoIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" />;
    if (type === 'image') return <ImageIcon className="w-4 h-4 mr-2 flex-shrink-0 text-gray-600" />;
    return null;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onDeleteLayer,
  onMoveLayer,
  onAddLayer,
  onReorderLayers,
}) => {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex); // Display top-most layer first

  const handleImageFileChange = (file: File) => {
    onAddLayer('image', file);
  };
  
  const handleAddTextLayer = () => {
    onAddLayer('text');
  }

  const canDelete = (layer: Layer): boolean => {
    if (layer.type === 'logo') return false; 
    return true; 
  }

  return (
    <ControlPanelSection title="Rétegek" isOpenDefault={true}>
      <div className="space-y-2">
        {sortedLayers.map((layer, index) => (
          <div
            key={layer.id}
            draggable
            onDragStart={e => {
              setDraggedLayerId(layer.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={e => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={e => {
              e.preventDefault();
              if (draggedLayerId && draggedLayerId !== layer.id && onReorderLayers) {
                const fromIndex = sortedLayers.findIndex(l => l.id === draggedLayerId);
                const toIndex = index;
                onReorderLayers(fromIndex, toIndex);
              }
              setDraggedLayerId(null);
            }}
            onDragEnd={() => setDraggedLayerId(null)}
            onClick={() => onSelectLayer(layer.id)}
            className={`flex items-center p-2.5 rounded-md cursor-pointer border-2 transition-colors duration-150
              ${selectedLayerId === layer.id ? 'bg-[#ffeaea] border-[#FF3B30] shadow-sm' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'}
              ${draggedLayerId === layer.id ? 'opacity-60' : ''}
            `}
          >
            <LayerTypeIcon type={layer.type} />
            <span className={`flex-grow text-sm text-gray-800 truncate ${selectedLayerId === layer.id ? 'font-semibold' : 'font-medium'}`} title={layer.name}>
              {layer.name}
            </span>
            <div className="flex items-center space-x-1 ml-2">
              <IconButton
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onMoveLayer(layer.id, 'up'); }}
                title="Réteg feljebb"
                className="p-1.5 text-gray-500 hover:text-gray-700"
                disabled={index === 0} 
              >
                <ArrowUpIcon className="w-4 h-4" />
              </IconButton>
              <IconButton
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onMoveLayer(layer.id, 'down'); }}
                title="Réteg lejjebb"
                className="p-1.5 text-gray-500 hover:text-gray-700"
                disabled={index === sortedLayers.length -1} 
              >
                <ArrowDownIcon className="w-4 h-4" />
              </IconButton>
              <IconButton
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                title={layer.isVisible ? 'Réteg elrejtése' : 'Réteg megjelenítése'}
                className="p-1.5 text-gray-500 hover:text-gray-700"
              >
                {layer.isVisible ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
              </IconButton>
              {canDelete(layer) && (
                <IconButton
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                    title="Réteg törlése"
                    className="p-1.5 text-red-500 hover:text-red-700"
                >
                    <TrashIcon className="w-4 h-4" />
                </IconButton>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
        <FileUploadInput
            id="addImageLayer"
            buttonText="Új kép réteg hozzáadása"
            accept="image/*"
            onChange={handleImageFileChange}
            className="w-full"
        />
        <button 
            onClick={handleAddTextLayer}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF3B30] transition-colors"
        >
            <PlusIcon className="w-4 h-4 mr-2" /> Új Szövegréteg
        </button>
      </div>
    </ControlPanelSection>
  );
};

export default LayersPanel;