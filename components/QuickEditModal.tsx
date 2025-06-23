import React, { useEffect, useRef } from 'react';
import { Layer, TextLayer, ImageLayer, LogoLayer } from '../types';
import { FONT_OPTIONS, FONT_WEIGHT_OPTIONS, TEXT_ALIGN_OPTIONS, VERTICAL_ALIGN_OPTIONS } from '../constants';

interface QuickEditModalProps {
  layer: Layer | null;
  position: { x: number; y: number };
  onClose: () => void;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
}

const QuickEditModal: React.FC<QuickEditModalProps> = ({ layer, position, onClose, onUpdateLayer }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number } | null>(null);
  const [modalPos, setModalPos] = React.useState<{ x: number; y: number }>(position);

  // Update modal position if position prop changes (new right-click)
  React.useEffect(() => { setModalPos(position); }, [position]);

  // Drag logic
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left mouse
    const rect = modalRef.current?.getBoundingClientRect();
    setDragOffset({ x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
    e.stopPropagation();
  };
  const handleDrag = (e: MouseEvent) => {
    if (!dragOffset) return;
    setModalPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };
  const handleDragEnd = () => setDragOffset(null);
  React.useEffect(() => {
    if (dragOffset) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [dragOffset]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Detect if mobile (window width < 640)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  if (!layer) return null;

  return (
    <div
      ref={modalRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 min-w-[260px] animate-fade-in cursor-default"
      style={{ left: modalPos.x, top: modalPos.y, transform: 'translateY(8px)' }}
    >
      <div className="flex items-center justify-between mb-2 cursor-move select-none" onMouseDown={handleDragStart}>
        <span className="font-semibold text-gray-700 text-sm">Gyors szerkesztés</span>
        <button className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded" onClick={onClose}>✕</button>
      </div>
      {layer.type === 'text' && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Szöveg</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            value={(layer as TextLayer).content}
            onChange={e => onUpdateLayer(layer.id, { content: e.target.value })}
          />
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={!!(layer as TextLayer).italic}
                onChange={e => onUpdateLayer(layer.id, { italic: e.target.checked })}
              />
              Dőlt
            </label>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={!!(layer as TextLayer).underline}
                onChange={e => onUpdateLayer(layer.id, { underline: e.target.checked })}
              />
              Aláhúzott
            </label>
          </div>
          <label className="block text-xs font-medium text-gray-700">Szín</label>
          <input
            type="color"
            className="w-8 h-8 p-0 border border-gray-300 rounded"
            value={(layer as TextLayer).textColor}
            onChange={e => onUpdateLayer(layer.id, { textColor: e.target.value })}
          />
          <label className="block text-xs font-medium text-gray-700">Betűtípus</label>
          <select
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            value={(layer as TextLayer).fontFamily}
            onChange={e => onUpdateLayer(layer.id, { fontFamily: e.target.value })}
          >
            {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
          </select>
          <label className="block text-xs font-medium text-gray-700">Vastagság</label>
          <select
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            value={(layer as TextLayer).fontWeight}
            onChange={e => onUpdateLayer(layer.id, { fontWeight: e.target.value })}
          >
            {FONT_WEIGHT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
          </select>
          <label className="block text-xs font-medium text-gray-700">Betűméret</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            min={8}
            max={200}
            value={(layer as TextLayer).fontSize}
            onChange={e => onUpdateLayer(layer.id, { fontSize: Number(e.target.value) })}
          />
          <label className="block text-xs font-medium text-gray-700">Igazítás</label>
          <select
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            value={(layer as TextLayer).textAlign}
            onChange={e => onUpdateLayer(layer.id, { textAlign: e.target.value as any })}
          >
            {TEXT_ALIGN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
          </select>
          <label className="block text-xs font-medium text-gray-700">Függőleges igazítás</label>
          <select
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            value={(layer as TextLayer).verticalAlign}
            onChange={e => onUpdateLayer(layer.id, { verticalAlign: e.target.value as any })}
          >
            {VERTICAL_ALIGN_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.name}</option>)}
          </select>
          
          <label className="block text-xs font-medium text-gray-700">Betűköz (px)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            min={-5}
            max={20}
            value={(layer as TextLayer).letterSpacing}
            onChange={e => onUpdateLayer(layer.id, { letterSpacing: Number(e.target.value) })}
          />
          <label className="block text-xs font-medium text-gray-700">Sormagasság</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            min={0.7}
            max={3}
            step={0.05}
            value={(layer as TextLayer).lineHeightMultiplier}
            onChange={e => onUpdateLayer(layer.id, { lineHeightMultiplier: Number(e.target.value) })}
          />
          <label className="block text-xs font-medium text-gray-700">Forgatás (°)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            min={-180}
            max={180}
            value={layer.rotation}
            onChange={e => onUpdateLayer(layer.id, { rotation: Number(e.target.value) })}
          />
          {/* Szöveg árnyék beállítások csak szövegnél */}
          <label className="block text-xs font-medium text-gray-700">Árnyék</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(layer as TextLayer).textShadow.enabled}
              onChange={e => onUpdateLayer(layer.id, { textShadow: { ...((layer as TextLayer).textShadow), enabled: e.target.checked } })}
            />
            <span className="text-xs">Engedélyezve</span>
          </div>
          {(layer as TextLayer).textShadow.enabled && (
            <div className="space-y-1 pl-2">
              <label className="block text-xs font-medium text-gray-700">Szín</label>
              <input
                type="color"
                className="w-8 h-8 p-0 border border-gray-300 rounded"
                value={(layer as TextLayer).textShadow.color}
                onChange={e => onUpdateLayer(layer.id, { textShadow: { ...((layer as TextLayer).textShadow), color: e.target.value } })}
              />
              <label className="block text-xs font-medium text-gray-700">Elmozdulás X</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                value={(layer as TextLayer).textShadow.offsetX}
                onChange={e => onUpdateLayer(layer.id, { textShadow: { ...((layer as TextLayer).textShadow), offsetX: Number(e.target.value) } })}
              />
              <label className="block text-xs font-medium text-gray-700">Elmozdulás Y</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                value={(layer as TextLayer).textShadow.offsetY}
                onChange={e => onUpdateLayer(layer.id, { textShadow: { ...((layer as TextLayer).textShadow), offsetY: Number(e.target.value) } })}
              />
              <label className="block text-xs font-medium text-gray-700">Elmosás</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                value={(layer as TextLayer).textShadow.blurRadius}
                onChange={e => onUpdateLayer(layer.id, { textShadow: { ...((layer as TextLayer).textShadow), blurRadius: Number(e.target.value) } })}
              />
            </div>
          )}
        </div>
      )}
      {layer.type === 'image' && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Áttetszőség</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={(layer as ImageLayer).opacity}
            onChange={e => onUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
          <span className="text-xs text-gray-600">{Math.round((layer as ImageLayer).opacity * 100)}%</span>
          <label className="block text-xs font-medium text-gray-700">Lekerekítés</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={(layer as ImageLayer).borderRadius}
            onChange={e => onUpdateLayer(layer.id, { borderRadius: Number(e.target.value) })}
            className="w-full"
          />
          <span className="text-xs text-gray-600">{(layer as ImageLayer).borderRadius}px</span>
          <label className="block text-xs font-medium text-gray-700">Forgatás (°)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            min={-180}
            max={180}
            value={layer.rotation}
            onChange={e => onUpdateLayer(layer.id, { rotation: Number(e.target.value) })}
          />
        </div>
      )}
      {layer.type === 'logo' && (
        isMobile ? (
          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs mt-2">
            Logó beállításai csak asztali nézetben érhetők el!
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700">Logó kép</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-xs"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    onUpdateLayer(layer.id, { src: ev.target?.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <label className="block text-xs font-medium text-gray-700">Méret</label>
            <input
              type="range"
              min={20}
              max={600}
              step={5}
              value={(layer as LogoLayer).size}
              onChange={e => onUpdateLayer(layer.id, { size: Number(e.target.value) })}
              className="w-full"
            />
            <span className="text-xs text-gray-600">{(layer as LogoLayer).size}px</span>
            <label className="block text-xs font-medium text-gray-700">Forgatás (°)</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              min={-180}
              max={180}
              value={layer.rotation}
              onChange={e => onUpdateLayer(layer.id, { rotation: Number(e.target.value) })}
            />
            <label className="block text-xs font-medium text-gray-700">Szabad mozgatás</label>
            <input
              type="checkbox"
              checked={(layer as LogoLayer).isFreelyPositioned}
              onChange={e => onUpdateLayer(layer.id, { isFreelyPositioned: e.target.checked })}
              className="ml-2"
            />
            {!(layer as LogoLayer).isFreelyPositioned && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mt-2">Sarokpozíció</label>
                <select
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  value={(layer as LogoLayer).cornerPosition}
                  onChange={e => onUpdateLayer(layer.id, { cornerPosition: e.target.value as any })}
                >
                  <option value="top-left">Bal felső</option>
                  <option value="top-right">Jobb felső</option>
                  <option value="bottom-left">Bal alsó</option>
                  <option value="bottom-right">Jobb alsó</option>
                </select>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default QuickEditModal;
