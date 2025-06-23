import React from 'react';
import { Layer, TextLayer, LogoLayer, ImageLayer, LayerSpecificSettingsProps, TextShadowState, LayerBase, LogoCornerPosition } from '../types';
import ControlPanelSection from './ControlPanelSection'; // Hozzáadva
import InputLabel from './InputLabel';
import ColorPickerInput from './ColorPickerInput';
import RangeInput from './RangeInput';
import SelectInput from './SelectInput';
import CheckboxInput from './CheckboxInput';
import FileUploadInput from './FileUploadInput';
import { FONT_OPTIONS, FONT_WEIGHT_OPTIONS, TEXT_ALIGN_OPTIONS, VERTICAL_ALIGN_OPTIONS } from '../constants';
import PositionIcon from './icons/PositionIcon'; 
import IconButton from './IconButton'; 

const LayerSpecificSettings: React.FC<LayerSpecificSettingsProps> = ({
  selectedLayer,
  onUpdateLayer,
  onUpdateTextShadow,
  brandKit,
  onApplyBrandColorToLayer,
  canvasWidth,
  canvasHeight,
}) => {
  if (!selectedLayer) {
    return (
      <div className="p-4 text-sm text-gray-500 bg-gray-50 rounded-md border border-gray-200">
        Válassz ki egy réteget a szerkesztéshez.
      </div>
    );
  }

  // Detect if mobile (window width < 640)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const handleLayerBaseChange = (property: keyof LayerBase, value: any) => {
    onUpdateLayer(selectedLayer.id, { [property]: value } as Partial<LayerBase>);
  };
  
  const handleShadowChange = <K extends keyof TextShadowState>(
    property: K,
    value: TextShadowState[K]
  ) => {
    onUpdateTextShadow(selectedLayer.id, property, value);
  };

  const handleLogoFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
        if (e.target?.result) {
            onUpdateLayer(selectedLayer.id, { src: e.target.result as string } as Partial<LogoLayer>);
        }
    };
    reader.readAsDataURL(file);
  };
  
  const handleImageFileChange = (file: File) => {
     const reader = new FileReader();
      reader.onload = e => {
          if (e.target?.result && selectedLayer.type === 'image') { 
              const imgSrc = e.target.result as string;
              const img = document.createElement('img');
              img.onload = () => {
                  const aspectRatio = img.width / img.height;
                  onUpdateLayer(selectedLayer.id, { 
                      src: imgSrc,
                      height: selectedLayer.width / aspectRatio, 
                      originalAspectRatio: aspectRatio,
                  } as Partial<ImageLayer>);
              }
              img.src = imgSrc;
          }
      };
      reader.readAsDataURL(file);
  };

  const panelTitle = `Réteg Beállításai: ${selectedLayer.name}`;

  return (
    <ControlPanelSection title={panelTitle} isOpenDefault={true}>
      {/* Common Layer Settings */}
      <div>
        <InputLabel htmlFor={`${selectedLayer.id}_name`} text="Réteg neve" />
        <input
          type="text"
          id={`${selectedLayer.id}_name`}
          value={selectedLayer.name}
          onChange={(e) => handleLayerBaseChange('name', e.target.value)}
          className="mt-1 w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:border-[#FF3B30] text-sm bg-white"
        />
      </div>
      <RangeInput id={`${selectedLayer.id}_opacity`} label="Átlátszóság" min={0} max={1} step={0.01} value={selectedLayer.opacity} onChange={val => handleLayerBaseChange('opacity', val)} valueSuffix="%" valueDisplay={`${Math.round(selectedLayer.opacity * 100)}%`} />
      <RangeInput id={`${selectedLayer.id}_rotation`} label="Forgatás" min={0} max={360} step={1} value={selectedLayer.rotation} onChange={val => handleLayerBaseChange('rotation', val)} valueSuffix="°" />
      
      {/* Text Layer Specific Settings */}
      {selectedLayer.type === 'text' && (
        <>
          {selectedLayer.content !== undefined && (
            <div>
              <InputLabel htmlFor={`${selectedLayer.id}_content`} text="Szöveg" />
              <textarea
                id={`${selectedLayer.id}_content`}
                value={selectedLayer.content}
                onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })}
                className="mt-1 w-full h-24 p-2.5 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:border-[#FF3B30] text-sm"
              />
            </div>
          )}
          <SelectInput id={`${selectedLayer.id}_fontFamily`} label="Betűtípus" value={selectedLayer.fontFamily} options={FONT_OPTIONS} onChange={val => onUpdateLayer(selectedLayer.id, { fontFamily: val })} />
          <SelectInput id={`${selectedLayer.id}_fontWeight`} label="Betűvastagság" value={selectedLayer.fontWeight} options={FONT_WEIGHT_OPTIONS} onChange={val => onUpdateLayer(selectedLayer.id, { fontWeight: val })} />
          <RangeInput id={`${selectedLayer.id}_fontSize`} label="Betűméret" min={10} max={300} value={selectedLayer.fontSize} onChange={val => onUpdateLayer(selectedLayer.id, { fontSize: val })} valueSuffix="px" />
          <ColorPickerInput id={`${selectedLayer.id}_textColor`} label="Szövegszín" value={selectedLayer.textColor} onChange={val => onUpdateLayer(selectedLayer.id, { textColor: val })} />
          <button onClick={() => onApplyBrandColorToLayer(selectedLayer.id, 'textColor', 'color2')} className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-0.5">Másodlagos márkaszín alkalmazása</button>
          
          <SelectInput id={`${selectedLayer.id}_textAlign`} label="Vízszintes igazítás" value={selectedLayer.textAlign} options={TEXT_ALIGN_OPTIONS} onChange={val => onUpdateLayer(selectedLayer.id, { textAlign: val as TextLayer['textAlign'] })} />
          <SelectInput id={`${selectedLayer.id}_verticalAlign`} label="Függőleges igazítás (baseline)" value={selectedLayer.verticalAlign} options={VERTICAL_ALIGN_OPTIONS} onChange={val => onUpdateLayer(selectedLayer.id, { verticalAlign: val as TextLayer['verticalAlign'] })} />

          <RangeInput id={`${selectedLayer.id}_letterSpacing`} label="Betűköz" min={-10} max={50} step={0.1} value={selectedLayer.letterSpacing} onChange={val => onUpdateLayer(selectedLayer.id, { letterSpacing: val })} valueSuffix="px" />
          <RangeInput id={`${selectedLayer.id}_lineHeight`} label="Sormagasság" min={0.5} max={3} step={0.05} value={selectedLayer.lineHeightMultiplier} onChange={val => onUpdateLayer(selectedLayer.id, { lineHeightMultiplier: val })} valueSuffix="x" />

          <div className="flex gap-4 mb-2">
            <CheckboxInput
              id={`${selectedLayer.id}_italic`}
              label="Dőlt"
              checked={!!selectedLayer.italic}
              onChange={val => onUpdateLayer(selectedLayer.id, { italic: val })}
            />
            <CheckboxInput
              id={`${selectedLayer.id}_underline`}
              label="Aláhúzott"
              checked={!!selectedLayer.underline}
              onChange={val => onUpdateLayer(selectedLayer.id, { underline: val })}
            />
          </div>

          <div className="pt-4 mt-4 border-t border-gray-200">
            <CheckboxInput id={`${selectedLayer.id}_textShadowEnabled`} label="Szövegárnyék" checked={selectedLayer.textShadow.enabled} onChange={(val: boolean) => handleShadowChange('enabled', val)} />
            {selectedLayer.textShadow.enabled && (
              <div className="space-y-4 mt-3 p-3 bg-slate-50 rounded-md border border-slate-200">
                <ColorPickerInput id={`${selectedLayer.id}_textShadowColor`} label="Árnyék színe" value={selectedLayer.textShadow.color} onChange={(val: string) => handleShadowChange('color', val)} />
                <button onClick={() => onApplyBrandColorToLayer(selectedLayer.id, 'shadow', 'color1')} className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-0.5">Elsődleges márkaszín alkalmazása</button>
                <RangeInput id={`${selectedLayer.id}_textShadowOffsetX`} label="X eltolás" min={-20} max={20} value={selectedLayer.textShadow.offsetX} onChange={(val: number) => handleShadowChange('offsetX', val)} valueSuffix="px" />
                <RangeInput id={`${selectedLayer.id}_textShadowOffsetY`} label="Y eltolás" min={-20} max={20} value={selectedLayer.textShadow.offsetY} onChange={(val: number) => handleShadowChange('offsetY', val)} valueSuffix="px" />
                <RangeInput id={`${selectedLayer.id}_textShadowBlurRadius`} label="Elmosás" min={0} max={30} value={selectedLayer.textShadow.blurRadius} onChange={(val: number) => handleShadowChange('blurRadius', val)} valueSuffix="px" />
              </div>
            )}
          </div>
        </>
      )}

      {/* Logo Layer Specific Settings */}
      {selectedLayer.type === 'logo' && !isMobile && (
        <>
          <FileUploadInput id={`${selectedLayer.id}_logoSrc`} label="Logó képfájl" buttonText="Logó cseréje..." accept="image/*" onChange={handleLogoFileChange} />
          {!selectedLayer.src && <p className="text-xs text-yellow-600 mt-1">Nincs logókép feltöltve.</p>}
          <RangeInput id={`${selectedLayer.id}_logoSize`} label="Logó mérete" min={20} max={600} step={5} value={selectedLayer.size} onChange={val => onUpdateLayer(selectedLayer.id, { size: val })} valueSuffix="px" />
          <CheckboxInput 
            id={`${selectedLayer.id}_logoFreePosition`} 
            label="Logó szabad mozgatása" 
            checked={selectedLayer.isFreelyPositioned} 
            onChange={val => onUpdateLayer(selectedLayer.id, { isFreelyPositioned: val })} 
          />
          {!selectedLayer.isFreelyPositioned && (
            <div>
                <InputLabel text="Logó sarokpozíciója" className="mt-2"/>
                <div className="mt-1 grid grid-cols-4 gap-2">
                    {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as LogoCornerPosition[]).map(pos => {
                        const positions: {[key: string]: {x: string, y: string, title: string}} = {
                        'top-left': {x: '1', y: '1', title: 'Bal felső'},
                        'top-right': {x: '6', y: '1', title: 'Jobb felső'},
                        'bottom-left': {x: '1', y: '6', title: 'Bal alsó'},
                        'bottom-right': {x: '6', y: '6', title: 'Jobb alsó'},
                        };
                        return (
                        <IconButton 
                            key={pos} 
                            onClick={() => onUpdateLayer(selectedLayer.id, { cornerPosition: pos } as Partial<LogoLayer>)} 
                            title={positions[pos].title} 
                            isActive={selectedLayer.cornerPosition === pos} 
                            className="p-1.5 h-auto aspect-square"
                        >
                            <PositionIcon rectX={positions[pos].x} rectY={positions[pos].y}/>
                        </IconButton>
                        );
                    })}
                </div>
            </div>
          )}
        </>
      )}
      {selectedLayer.type === 'logo' && isMobile && (
        <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs mt-2">
          Logó beállításai csak asztali nézetben érhetők el!
        </div>
      )}

      {/* Image Layer Specific Settings */}
      {selectedLayer.type === 'image' && (
        <>
          <FileUploadInput id={`${selectedLayer.id}_imageSrc`} label="Képfájl" buttonText="Kép cseréje..." accept="image/*" onChange={handleImageFileChange} />
          <RangeInput id={`${selectedLayer.id}_imageWidth`} label="Szélesség" min={10} max={canvasWidth * 2} value={selectedLayer.width} 
            onChange={val => {
                const aspectRatio = selectedLayer.originalAspectRatio || 1; 
                onUpdateLayer(selectedLayer.id, {width: val, height: val / aspectRatio } as Partial<ImageLayer>)
            }} 
            valueSuffix="px" 
          />
           <RangeInput id={`${selectedLayer.id}_imageHeight`} label="Magasság" min={10} max={canvasHeight * 2} value={selectedLayer.height} 
            onChange={val => {
                const aspectRatio = selectedLayer.originalAspectRatio || 1; 
                onUpdateLayer(selectedLayer.id, {height: val, width: val * aspectRatio } as Partial<ImageLayer>)
            }} 
            valueSuffix="px" 
          />
          <RangeInput id={`${selectedLayer.id}_imageBorderRadius`} label="Saroklekerekítés" min={0} max={Math.min(selectedLayer.width, selectedLayer.height) / 2} value={selectedLayer.borderRadius} onChange={val => onUpdateLayer(selectedLayer.id, { borderRadius: val })} valueSuffix="px" />
        </>
      )}
    </ControlPanelSection>
  );
};

export default LayerSpecificSettings;
