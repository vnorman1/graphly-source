import React, { useState, useRef } from 'react';
import { Layer, LayerType } from '../types';
import ControlPanelSection from './ControlPanelSection'; // Visszaállítva
import IconButton from './IconButton';
import FileUploadInput from './FileUploadInput'; 
import { EyeIcon, EyeSlashIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon, TextIcon, ImageIcon, LogoIcon } from './icons/SimpleIcons';
import GridIcon from './icons/GridIcon';
import { BRAND_RED } from '../constants';
import RangeInput from './RangeInput';
import SelectInput from './SelectInput';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAddLayer: (type: LayerType, file?: File) => void;
  onReorderLayers?: (fromIndex: number, toIndex: number) => void;
  // Grid overlay vezérlők (App-ből jönnek)
  showGrid: boolean;
  setShowGrid: (v: boolean) => void;
  gridDensity: number;
  setGridDensity: (v: number) => void;
  gridStyle: 'dotted' | 'solid';
  setGridStyle: (v: 'dotted' | 'solid') => void;
  gridOpacity: number;
  setGridOpacity: (v: number) => void;
  canAddImageLayer?: boolean; // ÚJ prop
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
  // Grid overlay propok
  showGrid,
  setShowGrid,
  gridDensity,
  setGridDensity,
  gridStyle,
  setGridStyle,
  gridOpacity,
  setGridOpacity,
  canAddImageLayer = true, // Default érték: true
}) => {
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  // Drag & drop image to panel (canvas)
  const handlePanelDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes('Files')) {
      e.preventDefault();
      if (panelRef.current) panelRef.current.classList.add('ring-2', 'ring-[#FF3B30]');
    }
  };
  const handlePanelDragLeave = () => {
    if (panelRef.current) panelRef.current.classList.remove('ring-2', 'ring-[#FF3B30]');
  };
  const handlePanelDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (panelRef.current) panelRef.current.classList.remove('ring-2', 'ring-[#FF3B30]');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Végigmegyünk az összes képfájlon!
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          onAddLayer('image', file);
        }
      });
    }
  };

  // Grid overlay UI state (csak a beállítás-panel láthatósága marad lokális)
  const [showGridSettings, setShowGridSettings] = useState(false);

  return (
    <ControlPanelSection title="Rétegek" isOpenDefault={true}>
      {/* Grid overlay toggle button középen, lebegő beállításokkal */}
      <div className="flex justify-center mb-4 relative">
        <button
          type="button"
          aria-pressed={showGrid}
          title={showGrid ? 'Grid kikapcsolása' : 'Grid bekapcsolása'}
          className={`group flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm font-semibold transition-all duration-150
            ${showGrid ? 'bg-[#ffeaea] border-[#FF3B30] text-[#FF3B30]' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-100 hover:border-gray-400'}
            focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:ring-offset-2`}
          onClick={() => { setShowGrid(!showGrid); if (!showGrid) setShowGridSettings(true); }}
        >
          <GridIcon className="w-5 h-5" />
          <span className="text-sm select-none">Grid</span>
          <span className="sr-only">{showGrid ? 'Kikapcsol' : 'Bekapcsol'}</span>
        </button>
        {/* Lebegő beállítás-panel, csak ha aktív a grid */}
        {showGrid && showGridSettings && (
          <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex flex-col gap-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700 text-sm">Grid beállítások</span>
              <button
                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded focus:outline-none"
                onClick={() => setShowGridSettings(false)}
                title="Beállítások elrejtése"
              >
                ✕
              </button>
            </div>
            <RangeInput
              id="gridDensity"
              label="Sűrűség"
              min={2}
              max={12}
              step={1}
              value={gridDensity}
              onChange={setGridDensity}
              valueDisplay={`${gridDensity}x${gridDensity}`}
            />
            <div className="flex flex-col gap-2">
              <label htmlFor="gridStyle" className="block text-sm font-medium text-gray-700">Vonal stílus</label>
              <SelectInput
                id="gridStyle"
                label=""
                value={gridStyle}
                options={[
                  { value: 'dotted', name: 'Pontozott' },
                  { value: 'solid', name: 'Folytonos' }
                ]}
                onChange={val => setGridStyle(val as 'dotted' | 'solid')}
              />
            </div>
            <RangeInput
              id="gridOpacity"
              label="Áttetszőség"
              min={0.1}
              max={1}
              step={0.05}
              value={gridOpacity}
              onChange={setGridOpacity}
              valueDisplay={`${Math.round(gridOpacity * 100)}%`}
            />
          </div>
        )}
        {/* Beállítások gomb csak ha grid aktív, de panel nem látszik */}
        {showGrid && !showGridSettings && (
          <button
            className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded focus:outline-none"
            onClick={() => setShowGridSettings(true)}
            title="Grid beállítások megnyitása"
          >
            ⚙️
          </button>
        )}
      </div>
      <div
        ref={panelRef}
        onDragOver={handlePanelDragOver}
        onDragLeave={handlePanelDragLeave}
        onDrop={handlePanelDrop}
        className="space-y-2 transition-all"
      >
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
        {canAddImageLayer !== false && (
          <FileUploadInput
              id="addImageLayer"
              buttonText="Új kép réteg hozzáadása"
              accept="image/*"
              onChange={handleImageFileChange}
              className="w-full"
          />
        )}
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