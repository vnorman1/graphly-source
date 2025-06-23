import React, { useState, useEffect, useCallback } from 'react';
import { 
    AppState, BrandKitState, Template, Layer, TextLayer, LogoLayer, ImageLayer, LayerBase,
    TextShadowState, GradientState, SelectOption, SegmentedControlOption as AppSegmentedControlOption, LayerType, ExportFormat
} from './types'; 
import { 
    INITIAL_STATE, INITIAL_BRAND_KIT, CANVAS_BASE_WIDTH, CANVAS_BASE_HEIGHT,
    FONT_OPTIONS, FONT_WEIGHT_OPTIONS, TEXT_ALIGN_OPTIONS, VERTICAL_ALIGN_OPTIONS, BRAND_RED, generateId,
    EXPORT_FORMAT_OPTIONS
} from './constants';
import { OG_TEMPLATES } from './templates';
import { useImageDB } from './hooks/useImageDB';


import ControlPanelSection from './components/ControlPanelSection';
import InputLabel from './components/InputLabel';
import ColorPickerInput from './components/ColorPickerInput';
import RangeInput from './components/RangeInput';
import FileUploadInput from './components/FileUploadInput';
import IconButton from './components/IconButton';
import PreviewCanvas from './components/PreviewCanvas';
import TwitterPreviewCard from './components/TwitterPreviewCard';
import FacebookPreviewCard from './components/FacebookPreviewCard';
import MiniPreviewCanvas from './components/MiniPreviewCanvas';
import SelectInput from './components/SelectInput';
import CheckboxInput from './components/CheckboxInput';
import SegmentedControl from './components/SegmentedControl';
import LayersPanel from './components/LayersPanel'; // New
import LayerSpecificSettings from './components/LayerSpecificSettings'; // New
import PWAInstallPrompt from './components/PWAInstallPrompt';
import Preloader from './components/Preloader';
import ShareButtons from './components/ShareButtons';
import PicsSettings from './components/PicsSettings';

// import LayoutTextLeftIcon from './components/icons/LayoutTextLeftIcon';
// import LayoutTextCenterIcon from './components/icons/LayoutTextCenterIcon';
// import LayoutTextRightIcon from './components/icons/LayoutTextRightIcon';
// import PositionIcon from './components/icons/PositionIcon';
// import { EyeIcon, EyeSlashIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, PlusIcon } from './components/icons/SimpleIcons'; // Assuming these exist


type SegmentedControlOption<T extends string> = AppSegmentedControlOption<T>;


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(INITIAL_STATE);
    const [brandKit, setBrandKit] = useState<BrandKitState>(INITIAL_BRAND_KIT);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
    const [socialPreviewImageUrl, setSocialPreviewImageUrl] = useState<string | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);
    const [templateName, setTemplateName] = useState<string>('');
    const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
    const [templates, setTemplates] = useState<Template[]>(() => {
        try {
            const saved = localStorage.getItem('ogEditorTemplates');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [resolvedBgImageUrl, setResolvedBgImageUrl] = useState<string | null>(null);
    // Grid overlay state (globális, hogy PreviewCanvas is lássa)
    const [showGrid, setShowGrid] = useState(false);
    const [gridDensity, setGridDensity] = useState(5);
    const [gridStyle, setGridStyle] = useState<'dotted' | 'solid'>('dotted');
    const [gridOpacity, setGridOpacity] = useState(0.5);
    // Snap to grid state (globális)
    const [snapToGrid, setSnapToGrid] = useState<'none' | 'vertical' | 'horizontal' | 'both'>('none');

    // IndexedDB hook képek kezeléséhez
    const { saveImage, getImage, deleteImage, isSupported: isIndexedDBSupported, error: imageDBError } = useImageDB();

    // Segédfüggvény IndexedDB képek betöltéséhez
    const loadImageFromIndexedDB = useCallback(async (src: string): Promise<string | null> => {
        if (!src.startsWith('indexeddb:')) return src;
        
        const imageId = src.replace('indexeddb:', '');
        try {
            const blob = await getImage(imageId);
            if (blob) {
                return URL.createObjectURL(blob);
            }
        } catch (error) {
            console.error('Hiba a kép betöltésekor IndexedDB-ből:', error);
        }
        return null;
    }, [getImage]);

    const mergeStateWithInitial = (loadedStatePartial: Partial<AppState>): AppState => {
        const defaultTextLayerFromConstants = INITIAL_STATE.layers.find(l => l.type === 'text') as TextLayer | undefined;
        const defaultLogoLayerFromConstants = INITIAL_STATE.layers.find(l => l.type === 'logo') as LogoLayer | undefined;
        const defaultShadowForImage: TextShadowState = defaultTextLayerFromConstants?.textShadow || { enabled: false, color: '#000000', offsetX: 2, offsetY: 2, blurRadius: 4 };

        const mappedLayers = loadedStatePartial.layers
            ? loadedStatePartial.layers.map((loadedLayer: any): Layer | null => {
                if (loadedLayer.type === 'text' && defaultTextLayerFromConstants) {
                    return {
                        ...defaultTextLayerFromConstants,
                        ...loadedLayer,
                        type: 'text', 
                        textShadow: {
                            ...(defaultTextLayerFromConstants.textShadow),
                            ...(loadedLayer.textShadow || {}),
                        },
                    } as TextLayer;
                }
                if (loadedLayer.type === 'logo' && defaultLogoLayerFromConstants) {
                    return {
                        ...defaultLogoLayerFromConstants,
                        ...loadedLayer,
                        type: 'logo', 
                    } as LogoLayer;
                }
                if (loadedLayer.type === 'image') {
                    const baseImageDefaults: Partial<ImageLayer> = {
                        opacity: 1, rotation: 0, borderRadius: 0, isLocked: false,
                        shadow: { ...defaultShadowForImage }, 
                        width: loadedLayer.width || 200, 
                        height: loadedLayer.height || (loadedLayer.width ? loadedLayer.width / (loadedLayer.originalAspectRatio || 1.6) : 125), 
                        originalAspectRatio: loadedLayer.originalAspectRatio || 1.6, 
                        src: loadedLayer.src || '', 
                    };
                    return {
                        ...baseImageDefaults, 
                        ...loadedLayer, 
                        type: 'image', 
                        shadow: { 
                            ...defaultShadowForImage,
                            ...(loadedLayer.shadow || {})
                        }
                    } as ImageLayer;
                }
                return null;
            }).filter((layer): layer is Layer => layer !== null)
            : INITIAL_STATE.layers;

        // Ensure export settings have defaults if not present in loadedStatePartial
        const exportSettings = {
            exportFormat: loadedStatePartial.exportFormat || INITIAL_STATE.exportFormat,
            jpegQuality: loadedStatePartial.jpegQuality || INITIAL_STATE.jpegQuality,
            includeTransparency: loadedStatePartial.includeTransparency !== undefined ? loadedStatePartial.includeTransparency : INITIAL_STATE.includeTransparency,
        };

        const merged: AppState = {
            ...INITIAL_STATE,
            ...loadedStatePartial,
            ...exportSettings, // Apply export settings
            gradient: { ...INITIAL_STATE.gradient, ...(loadedStatePartial.gradient || {}) },
            bgImage: loadedStatePartial.bgImage !== undefined ? loadedStatePartial.bgImage : INITIAL_STATE.bgImage, // FONTOS: bgImage mindig átkerüljön
            // A filtereknél mindig számot csinálunk!
            bgImageFilters: {
                blur: Number((loadedStatePartial.bgImageFilters?.blur ?? INITIAL_STATE.bgImageFilters.blur)),
                brightness: Number((loadedStatePartial.bgImageFilters?.brightness ?? INITIAL_STATE.bgImageFilters.brightness)),
                contrast: Number((loadedStatePartial.bgImageFilters?.contrast ?? INITIAL_STATE.bgImageFilters.contrast)),
            },
            overlay: { ...INITIAL_STATE.overlay, ...(loadedStatePartial.overlay || {}) },
            layers: mappedLayers,
        };
        
        if (!merged.layers.find(l => l.type === 'text') && defaultTextLayerFromConstants) {
            merged.layers.unshift({...defaultTextLayerFromConstants, id: generateId('text')});
        }
        if (!merged.layers.find(l => l.type === 'logo') && defaultLogoLayerFromConstants) {
            merged.layers.push({...defaultLogoLayerFromConstants, id: generateId('logo')});
        }
        if (!merged.selectedLayerId || !merged.layers.find(l => l.id === merged.selectedLayerId)) {
            merged.selectedLayerId = merged.layers.find(l => l.type === 'text')?.id || merged.layers[0]?.id || null;
        }

        return merged;
    };
    

    useEffect(() => {
        const savedState = localStorage.getItem('ogEditorState');
        if (savedState) {
            try {
                setAppState(mergeStateWithInitial(JSON.parse(savedState)));
            } catch (error) {
                console.error("Failed to parse saved state, resetting to initial:", error);
                setAppState(INITIAL_STATE);
            }
        }

        const savedBrandKit = localStorage.getItem('ogEditorBrandKit');
        if (savedBrandKit) {
            try {
                setBrandKit(JSON.parse(savedBrandKit));
            } catch (error) {
                console.error("Failed to parse saved brand kit, resetting to initial:", error);
                setBrandKit(INITIAL_BRAND_KIT);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem('ogEditorState', JSON.stringify(appState));
    }, [appState]);

    // Háttérkép URL feloldása IndexedDB-ból
    useEffect(() => {
        const resolveBgImage = async () => {
            if (!appState.bgImage) {
                setResolvedBgImageUrl(null);
                return;
            }
            
            if (appState.bgImage.startsWith('indexeddb:')) {
                try {
                    const resolvedUrl = await loadImageFromIndexedDB(appState.bgImage);
                    setResolvedBgImageUrl(resolvedUrl);
                } catch (error) {
                    console.error('Hiba a háttérkép betöltésekor:', error);
                    setResolvedBgImageUrl(null);
                }
            } else {
                setResolvedBgImageUrl(appState.bgImage);
            }
        };
        
        resolveBgImage();
    }, [appState.bgImage, loadImageFromIndexedDB]);

    const updateLayer = useCallback((layerId: string, updates: Partial<Layer>) => {
        setAppState(prev => {
            const newLayers = prev.layers.map(l => {
                if (l.id === layerId) {
                    // Prevent changing layer type with this generic update function
                    if (updates.type && updates.type !== l.type) {
                        console.warn(`Attempted to change layer type from ${l.type} to ${updates.type}. This is not allowed via generic update. Layer not updated.`);
                        return l;
                    }
                    return { ...l, ...updates };
                }
                return l;
            });
            return {
                ...prev,
                layers: newLayers as Layer[] 
            };
        });
    }, []);
    
    const updateLayerShadow = useCallback(<K extends keyof TextShadowState>(
        layerId: string,
        property: K,
        value: TextShadowState[K]
    ) => {
        setAppState(prev => {
            const newLayers = prev.layers.map((l: Layer): Layer => {
                if (l.id !== layerId) {
                    return l; 
                }

                if (l.type === 'text') {
                    const updatedTextLayer: TextLayer = {
                        ...l, 
                        textShadow: {
                            ...l.textShadow,
                            [property]: value
                        }
                    };
                    return updatedTextLayer; 
                } else if (l.type === 'image') {
                    const updatedImageLayer: ImageLayer = {
                        ...l, 
                        shadow: {
                            ...l.shadow,
                            [property]: value
                        }
                    };
                    return updatedImageLayer;
                }
                
                return l; 
            });
            return { ...prev, layers: newLayers };
        });
    }, []);


    const handleLayerPositionChange = (layerId: string, position: { x: number; y: number }) => {
        updateLayer(layerId, { x: position.x, y: position.y });
    };

    const addLayer = async (type: LayerType, file?: File) => {
        // Mobil nézetben ne lehessen képréteget hozzáadni
        if (type === 'image' && window.innerWidth < 640) {
            alert('Képréteg hozzáadása mobil nézetben nem engedélyezett!');
            return;
        }
        const newLayerBaseProps: Omit<LayerBase, 'type' | 'name' | 'id'> = { 
            zIndex: appState.layers.length > 0 ? Math.max(...appState.layers.map(l => l.zIndex)) + 1 : 0,
            isVisible: true,
            opacity: 1,
            x: CANVAS_BASE_WIDTH / 2 - 100, 
            y: CANVAS_BASE_HEIGHT / 2 - 50,
            rotation: 0,
            isLocked: false,
        };

        const layerId = generateId(type);

        if (type === 'image' && file) {
            try {
                // IndexedDB-be mentjük a blob-ot
                if (isIndexedDBSupported) {
                    await saveImage(layerId, file, file.name);
                    
                    // Előnézet generálása
                    const reader = new FileReader();
                    reader.onload = e => {
                        if (e.target?.result) {
                            const imgSrc = e.target.result as string;
                            const img = document.createElement('img');
                            img.onload = () => {
                                const aspectRatio = img.width / img.height;
                                const defaultWidth = 200;
                                const defaultTextLayerForShadow = appState.layers.find(l => l.type === 'text') as TextLayer | undefined;
                                const shadowState: TextShadowState = defaultTextLayerForShadow?.textShadow 
                                    ? { ...defaultTextLayerForShadow.textShadow } 
                                    : { enabled: false, color: '#000000', offsetX: 2, offsetY: 2, blurRadius: 4 };
                                
                                const imageLayerToAdd: ImageLayer = {
                                    ...newLayerBaseProps,
                                    id: layerId,
                                    type: 'image',
                                    name: `Kép ${appState.layers.filter(l => l.type === 'image').length + 1}`,
                                    src: `indexeddb:${layerId}`, // Speciális jelölés IndexedDB-hez
                                    width: defaultWidth,
                                    height: defaultWidth / aspectRatio,
                                    originalAspectRatio: aspectRatio,
                                    borderRadius: 0,
                                    shadow: shadowState,
                                };
                                setAppState((prevState: AppState): AppState => {
                                    const newLayers: Layer[] = [...prevState.layers, imageLayerToAdd];
                                    return { 
                                        ...prevState, 
                                        layers: newLayers, 
                                        selectedLayerId: imageLayerToAdd.id 
                                    };
                                });
                            }
                            img.src = imgSrc;
                        }
                    };
                    reader.readAsDataURL(file);
                } else {
                    // Fallback localStorage/DataURL megoldás
                    const reader = new FileReader();
                    reader.onload = e => {
                        if (e.target?.result) {
                            const imgSrc = e.target.result as string;
                            const img = document.createElement('img');
                            img.onload = () => {
                                const aspectRatio = img.width / img.height;
                                const defaultWidth = 200;
                                const defaultTextLayerForShadow = appState.layers.find(l => l.type === 'text') as TextLayer | undefined;
                                const shadowState: TextShadowState = defaultTextLayerForShadow?.textShadow 
                                    ? { ...defaultTextLayerForShadow.textShadow } 
                                    : { enabled: false, color: '#000000', offsetX: 2, offsetY: 2, blurRadius: 4 };
                                
                                const imageLayerToAdd: ImageLayer = {
                                    ...newLayerBaseProps,
                                    id: layerId,
                                    type: 'image',
                                    name: `Kép ${appState.layers.filter(l => l.type === 'image').length + 1}`,
                                    src: imgSrc,
                                    width: defaultWidth,
                                    height: defaultWidth / aspectRatio,
                                    originalAspectRatio: aspectRatio,
                                    borderRadius: 0,
                                    shadow: shadowState,
                                };
                                setAppState((prevState: AppState): AppState => {
                                    const newLayers: Layer[] = [...prevState.layers, imageLayerToAdd];
                                    return { 
                                        ...prevState, 
                                        layers: newLayers, 
                                        selectedLayerId: imageLayerToAdd.id 
                                    };
                                });
                            }
                            img.src = imgSrc;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                console.error('Hiba a kép mentésekor:', error);
                alert('Hiba történt a kép mentésekor. Próbáld újra!');
            }
            return; 
        } else if (type === 'text') {
            const defaultTextLayerFromConstants = INITIAL_STATE.layers.find(l => l.type === 'text') as TextLayer | undefined;
            if (defaultTextLayerFromConstants) {
                const layerName = `Szöveg ${appState.layers.filter(l => l.type === 'text').length + 1}`;
                const layerContent = "Új szövegréteg";
                const layerX = CANVAS_BASE_WIDTH / 10;
                const layerY = CANVAS_BASE_HEIGHT / 10;

                const textLayerToAdd: TextLayer = {
                    ...newLayerBaseProps,
                    id: layerId,
                    type: 'text',
                    name: layerName,
                    content: layerContent,
                    x: layerX,
                    y: layerY,
                    fontFamily: defaultTextLayerFromConstants.fontFamily,
                    fontWeight: defaultTextLayerFromConstants.fontWeight,
                    fontSize: defaultTextLayerFromConstants.fontSize,
                    textColor: defaultTextLayerFromConstants.textColor,
                    letterSpacing: defaultTextLayerFromConstants.letterSpacing,
                    lineHeightMultiplier: defaultTextLayerFromConstants.lineHeightMultiplier,
                    textAlign: defaultTextLayerFromConstants.textAlign,
                    verticalAlign: defaultTextLayerFromConstants.verticalAlign,
                    width: defaultTextLayerFromConstants.width,
                    textShadow: { ...defaultTextLayerFromConstants.textShadow },
                };
                 setAppState((prevState: AppState): AppState => {
                    const newLayers: Layer[] = [...prevState.layers, textLayerToAdd];
                     return { 
                        ...prevState, 
                        layers: newLayers, 
                        selectedLayerId: textLayerToAdd.id 
                    };
                });
            }
        }
    };

    // Tárolt kép hozzáadása új rétegként (JAVÍTOTT - nem duplikálja az IndexedDB-ben)
    const handleAddStoredImageLayer = async (blob: Blob, filename: string, originalImageId: string) => {
        // Mobil nézetben ne lehessen képréteget hozzáadni
        if (window.innerWidth < 640) {
            alert('Képréteg hozzáadása mobil nézetben nem engedélyezett!');
            return;
        }

        const newLayerBaseProps: Omit<LayerBase, 'type' | 'name' | 'id'> = { 
            zIndex: appState.layers.length > 0 ? Math.max(...appState.layers.map(l => l.zIndex)) + 1 : 0,
            isVisible: true,
            opacity: 1,
            x: CANVAS_BASE_WIDTH / 2 - 100, 
            y: CANVAS_BASE_HEIGHT / 2 - 50,
            rotation: 0,
            isLocked: false,
        };

        const layerId = generateId('image');

        try {
            // Előnézet generálása a blob-ból
            const imgSrc = URL.createObjectURL(blob);
            const img = document.createElement('img');
            img.onload = () => {
                const aspectRatio = img.width / img.height;
                const defaultWidth = 200;
                const defaultTextLayerForShadow = appState.layers.find(l => l.type === 'text') as TextLayer | undefined;
                const shadowState: TextShadowState = defaultTextLayerForShadow?.textShadow 
                    ? { ...defaultTextLayerForShadow.textShadow } 
                    : { enabled: false, color: '#000000', offsetX: 2, offsetY: 2, blurRadius: 4 };
                
                const imageLayerToAdd: ImageLayer = {
                    ...newLayerBaseProps,
                    id: layerId,
                    type: 'image',
                    name: `${filename} másolat`,
                    src: isIndexedDBSupported ? `indexeddb:${originalImageId}` : imgSrc, // Az eredeti ID-t használjuk!
                    width: defaultWidth,
                    height: defaultWidth / aspectRatio,
                    originalAspectRatio: aspectRatio,
                    borderRadius: 0,
                    shadow: shadowState,
                };
                
                setAppState((prevState: AppState): AppState => {
                    const newLayers: Layer[] = [...prevState.layers, imageLayerToAdd];
                    return { 
                        ...prevState, 
                        layers: newLayers, 
                        selectedLayerId: imageLayerToAdd.id 
                    };
                });
                
                // Cleanup blob URL ha nem IndexedDB-t használunk
                if (!isIndexedDBSupported) {
                    setTimeout(() => URL.revokeObjectURL(imgSrc), 1000);
                } else {
                    // IndexedDB esetén is cleanup, mert csak a hivatkozásra van szükségünk
                    setTimeout(() => URL.revokeObjectURL(imgSrc), 100);
                }
            };
            img.src = imgSrc;
        } catch (error) {
            console.error('Hiba a tárolt kép hozzáadásakor:', error);
            alert('Hiba történt a kép hozzáadásakor. Próbáld újra!');
        }
    };
    
    const deleteLayer = async (layerId: string) => {
        const layerToDelete = appState.layers.find(l => l.id === layerId);
        
        if (layerToDelete?.type === 'logo') {
            alert("A logó réteg nem törölhető. Elrejtheted vagy törölheted a képét.");
            return;
        }

        // Ha kép réteg és IndexedDB-ben van tárolva, töröljük onnan is
        if (layerToDelete?.type === 'image' && layerToDelete.src?.startsWith('indexeddb:')) {
            try {
                await deleteImage(layerId);
            } catch (error) {
                console.error('Hiba a kép törlésekor IndexedDB-ből:', error);
                // Folytatjuk a réteg törlését akkor is, ha az IndexedDB törlés sikertelen
            }
        }

        setAppState(prev => {
            const newLayers = prev.layers.filter(l => l.id !== layerId);
            let newSelectedLayerId = prev.selectedLayerId;
            if (prev.selectedLayerId === layerId) {
                newSelectedLayerId = newLayers.length > 0 ? newLayers[newLayers.length - 1].id : null;
            }
            return { ...prev, layers: newLayers, selectedLayerId: newSelectedLayerId };
        });
    };

    const selectLayer = (layerId: string) => {
        setAppState(prev => ({ ...prev, selectedLayerId: layerId }));
    };

    const toggleLayerVisibility = (layerId: string) => {
        const layer = appState.layers.find(l => l.id === layerId);
        if (layer) {
            updateLayer(layerId, { isVisible: !layer.isVisible });
        }
    };

    const moveLayer = (layerId: string, direction: 'up' | 'down') => {
        setAppState(prev => {
            const layersCopy = [...prev.layers];
            const layerIndex = layersCopy.findIndex(l => l.id === layerId);
            if (layerIndex === -1) return prev;

            const currentZ = layersCopy[layerIndex].zIndex;
            if (direction === 'up') {
                let swapWithIndex = -1;
                let minHigherZ = Infinity;
                for(let i=0; i < layersCopy.length; i++) {
                    if(i === layerIndex) continue;
                    if(layersCopy[i].zIndex > currentZ) {
                        if(layersCopy[i].zIndex < minHigherZ) {
                            minHigherZ = layersCopy[i].zIndex;
                            swapWithIndex = i;
                        }
                    } else if (layersCopy[i].zIndex === currentZ) { 
                         let nextZ = currentZ + 1;
                         while(layersCopy.some(l => l.zIndex === nextZ)) nextZ++;
                         minHigherZ = nextZ;
                         layersCopy[layerIndex].zIndex = minHigherZ;
                         return { ...prev, layers: layersCopy.sort((a,b) => a.zIndex - b.zIndex) };
                    }
                }
                if(swapWithIndex !== -1) {
                    layersCopy[layerIndex].zIndex = minHigherZ;
                    layersCopy[swapWithIndex].zIndex = currentZ;
                } else { 
                     let maxZ = -1;
                     layersCopy.forEach(l => { if (l.zIndex > maxZ) maxZ = l.zIndex });
                     if (currentZ <= maxZ) layersCopy[layerIndex].zIndex = maxZ + 1;
                }


            } else { 
                let swapWithIndex = -1;
                let maxLowerZ = -Infinity;
                 for(let i=0; i < layersCopy.length; i++) {
                    if(i === layerIndex) continue;
                    if(layersCopy[i].zIndex < currentZ) {
                        if(layersCopy[i].zIndex > maxLowerZ) {
                            maxLowerZ = layersCopy[i].zIndex;
                            swapWithIndex = i;
                        }
                    }  else if (layersCopy[i].zIndex === currentZ) {
                        let prevZ = currentZ -1;
                        while(layersCopy.some(l => l.zIndex === prevZ) && prevZ > -Infinity) prevZ--;
                        if (prevZ > -Infinity) { 
                           maxLowerZ = prevZ;
                           layersCopy[layerIndex].zIndex = maxLowerZ;
                           return { ...prev, layers: layersCopy.sort((a,b) => a.zIndex - b.zIndex) };
                        }
                    }
                }
                 if(swapWithIndex !== -1) {
                    layersCopy[layerIndex].zIndex = maxLowerZ;
                    layersCopy[swapWithIndex].zIndex = currentZ;
                } else { 
                    let minZ = Infinity;
                    layersCopy.forEach(l => { if (l.zIndex < minZ) minZ = l.zIndex });
                    if (currentZ >= minZ && minZ > 0) layersCopy[layerIndex].zIndex = minZ -1;
                    else if (currentZ >=minZ && minZ <=0 ) layersCopy[layerIndex].zIndex = minZ -1; 
                }
            }
            return { ...prev, layers: layersCopy.sort((a,b) => a.zIndex - b.zIndex) };
        });
    };
    
    const handleStateChange = <K extends keyof AppState>(key: K, value: AppState[K]) => {
        setAppState(prev => {
            // Ha a háttér típusa változik, töröljük a nem releváns háttér tulajdonságokat
            if (key === 'backgroundType') {
                if (value === 'image') {
                    // Ha képre váltunk, töröljük a színt és a gradienst (de a szín maradhat fallbacknek)
                    return {
                        ...prev,
                        backgroundType: value,
                        // bgColor marad fallbacknek, de gradientet törhetjük, ha akarjuk
                        // gradient: { ...INITIAL_STATE.gradient },
                        // Ha nem akarod, hogy a szín is megjelenjen, akkor bgColor: INITIAL_STATE.bgColor
                    };
                } else {
                    // Ha nem kép, töröljük a bgImage-t
                    return {
                        ...prev,
                        [key]: value,
                        bgImage: null,
                    };
                }
            }
            return { ...prev, [key]: value };
        });
    };
    
    const handleGradientChange = <K extends keyof GradientState>(key: K, value: GradientState[K]) => {
        setAppState(prev => ({
            ...prev,
            gradient: { ...prev.gradient, [key]: value }
        }));
    };

    const handleImageFilterChange = <K extends keyof AppState['bgImageFilters']>(key: K, value: AppState['bgImageFilters'][K]) => {
        setAppState(prev => ({
            ...prev,
            bgImageFilters: { ...prev.bgImageFilters, [key]: value }
        }));
    };

    const handleBackgroundImageDelete = async () => {
        // Ha a háttérkép IndexedDB-ben van tárolva, töröljük onnan is
        if (appState.bgImage?.startsWith('indexeddb:')) {
            try {
                const imageId = appState.bgImage.replace('indexeddb:', '');
                await deleteImage(imageId);
            } catch (error) {
                console.error('Hiba a háttérkép törlésekor IndexedDB-ből:', error);
                // Folytatjuk a törlést akkor is, ha az IndexedDB törlés sikertelen
            }
        }
        
        // Háttérkép törlése az állapotból
        setAppState(prev => ({ ...prev, bgImage: null }));
    };

    const handleOverlayChange = <K extends keyof AppState['overlay']>(key: K, value: AppState['overlay'][K]) => {
        setAppState(prev => ({
            ...prev,
            overlay: { ...prev.overlay, [key]: value }
        }));
    };

    const handleSaveBrandKit = () => {
        localStorage.setItem('ogEditorBrandKit', JSON.stringify(brandKit));
        alert('Márka készlet elmentve!');
    };
    
    const handleApplyBrandColorToCanvas = (target: 'bgColor' | 'gradient1' | 'gradient2') => {
       if (target === 'bgColor') {
            handleStateChange('bgColor', brandKit.color1);
        } else if (target === 'gradient1') {
             if (appState.backgroundType === 'gradient') handleGradientChange('color1', brandKit.color1);
        } else if (target === 'gradient2') {
             if (appState.backgroundType === 'gradient') handleGradientChange('color2', brandKit.color2);
        }
    };
    
    const handleApplyBrandColorToLayer = (layerId: string, property: string, colorKey: keyof BrandKitState) => {
        const layer = appState.layers.find(l => l.id === layerId);
        if (!layer) return;
        const colorToApply = brandKit[colorKey];

        if (layer.type === 'text') {
            if (property === 'textColor') updateLayer(layerId, { textColor: colorToApply });
            else if (property === 'shadow') updateLayerShadow(layerId, 'color', colorToApply);
        } else if (layer.type === 'image') {
             if (property === 'shadow') updateLayerShadow(layerId, 'color', colorToApply);
        }
    };


    const handleSaveTemplate = () => {
        if (!templateName.trim()) {
            alert('Kérlek, adj nevet a sablonnak!');
            return;
        }
        const newTemplate: Template = { name: templateName, state: appState };
        const updatedTemplates = [...templates.filter(t => t.name !== templateName), newTemplate];
        setTemplates(updatedTemplates);
        localStorage.setItem('ogEditorTemplates', JSON.stringify(updatedTemplates));
        setTemplateName('');
        setSelectedTemplateName(newTemplate.name);
        alert(`'${newTemplate.name}' sablon elmentve!`);
    };

    const handleLoadTemplate = (name: string) => {
        setSelectedTemplateName(name);
        const templateToLoad = templates.find(t => t.name === name);
        if (templateToLoad) {
            setAppState(mergeStateWithInitial(templateToLoad.state));
        }
    };

    const slugify = (text: string): string => {
      return text.toString().toLowerCase().trim()
        .replace(/\s+/g, '-')           
        .replace(/[^\w-]+/g, '')       
        .replace(/--+/g, '-')         
        .replace(/^-+/, '')             
        .replace(/-+$/, '')
        .substring(0, 50);
    }

    const handleExport = (targetSize = { w: appState.canvasWidth, h: appState.canvasHeight }, baseFilename = 'og-image') => {
        const mainCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement;
        if (!mainCanvas) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = targetSize.w;
        tempCanvas.height = targetSize.h;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        // Handle transparency for PNG
        if (appState.exportFormat === 'png' && !appState.includeTransparency) {
            tempCtx.fillStyle = '#FFFFFF'; // Draw white background if transparency is not included
            tempCtx.fillRect(0,0, tempCanvas.width, tempCanvas.height);
        } else if (appState.exportFormat === 'jpeg') {
            tempCtx.fillStyle = '#FFFFFF'; // JPEGs don't support transparency, so always draw white bg
            tempCtx.fillRect(0,0, tempCanvas.width, tempCanvas.height);
        }


        tempCtx.drawImage(mainCanvas, 0, 0, mainCanvas.width, mainCanvas.height, 0, 0, tempCanvas.width, tempCanvas.height);

        const textLayerForFilename = appState.layers.find(l => l.type === 'text' && l.isVisible) as TextLayer | undefined;
        const filenameContent = !textLayerForFilename ? baseFilename : textLayerForFilename.content;
        const filename = slugify(filenameContent) || baseFilename;
        
        const link = document.createElement('a');
        const fileExtension = appState.exportFormat === 'jpeg' ? 'jpeg' : 'png';
        link.download = `${filename}_${targetSize.w}x${targetSize.h}.${fileExtension}`;
        
        if (appState.exportFormat === 'jpeg') {
            link.href = tempCanvas.toDataURL('image/jpeg', appState.jpegQuality);
        } else {
            link.href = tempCanvas.toDataURL('image/png');
        }
        link.click();
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleExport();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appState]); // appState added to dependencies for export settings

    const backgroundTypeOptions: SegmentedControlOption<AppState['backgroundType']>[] = [
        { label: 'Egyszínű', value: 'solid' },
        { label: 'Színátmenet', value: 'gradient' },
        { label: 'Kép', value: 'image' },
    ];
    const gradientTypeOptions: SegmentedControlOption<GradientState['type']>[] = [
        { label: 'Lineáris', value: 'linear' },
        { label: 'Radiális', value: 'radial' },
    ];
    const showOverlayControls = appState.backgroundType === 'gradient' || (appState.backgroundType === 'image' && !!appState.bgImage);
    const selectedLayer = appState.layers.find(l => l.id === appState.selectedLayerId);
    const mainTextLayer = appState.layers.find(l => l.type === 'text') as TextLayer | undefined;


    // Social preview image URL csak akkor frissüljön, ha tényleg változott a dataURL
    const lastPreviewUrlRef = React.useRef<string | null>(null);
    const handleCanvasUpdate = useCallback((dataUrl: string) => {
        if (lastPreviewUrlRef.current !== dataUrl) {
            lastPreviewUrlRef.current = dataUrl;
            setSocialPreviewImageUrl(dataUrl);
        }
    }, []);

    // Template application handler
    const handleApplyTemplate = (templateKey: string) => {
        const template = OG_TEMPLATES.find(t => t.key === templateKey);
        if (template) {
            setAppState(mergeStateWithInitial(template.state));
            setSelectedTemplateKey(templateKey);
        }
    };

    // Drag & drop rétegsorrend handler
    const handleReorderLayers = (fromIndex: number, toIndex: number) => {
        setAppState(prev => {
            const sorted = [...prev.layers].sort((a, b) => b.zIndex - a.zIndex);
            if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev;
            const moved = sorted.splice(fromIndex, 1)[0];
            sorted.splice(toIndex, 0, moved);
            // Új zIndex kiosztás (legfelső: legnagyobb)
            const maxZ = sorted.length > 0 ? Math.max(...sorted.map(l => l.zIndex)) : 0;
            const newLayers = sorted.map((l, i) => ({ ...l, zIndex: maxZ - i }));
            return { ...prev, layers: newLayers };
        });
    };

    useEffect(() => {
        // Preloader: minimum 0.5s, de csak addig, amíg minden betölt
        const minTime = 1000;
        const start = Date.now();
        let ready = false;
        let timeoutId: NodeJS.Timeout;

        // Simulált app init (pl. adatok, fontok, képek betöltése)
        const finishLoading = () => {
            const elapsed = Date.now() - start;
            if (elapsed < minTime) {
                timeoutId = setTimeout(() => setIsLoading(false), minTime - elapsed);
            } else {
                setIsLoading(false);
            }
        };

        // Itt lehetne pl. Promise.all([...]) ha van aszinkron betöltés
        // Most csak szimuláció (1s), de ha gyorsabb, akkor is min. 0.5s
        setTimeout(() => {
            ready = true;
            finishLoading();
        },); // vagy cseréld le a tényleges betöltésre

        return () => clearTimeout(timeoutId);
    }, []);

    // --- HÁTTÉRKÉP MOBIL TILTÁS ---
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    if (isLoading) {
        return <Preloader />;
    }

    return (
        <div className={`min-h-screen font-['Inter'] ${isPreviewVisible ? '' : 'grid grid-cols-1 lg:grid-cols-3'}`}>
            {/* Left Control Panel - Conditional Rendering */}
            {!isPreviewVisible && (
                <div className="col-span-1 bg-white p-6 sm:p-8 border-r border-gray-200 overflow-y-auto max-h-screen">
                    <header className="mb-6">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-gray-900">Graphly</h1>
                        <p className="text-gray-700">Open Graph (OG) és Twitter Card-hoz tervezve.</p>
                    </header>

                    <div className="mb-6">
                        <MiniPreviewCanvas 
                            imageUrl={socialPreviewImageUrl} 
                            aspectRatio={appState.canvasWidth / appState.canvasHeight} 
                        />
                    </div>

                    <div className="space-y-6"> 
                        <ControlPanelSection title="Általános Beállítások" className="!border-b-0">
                            <RangeInput id="canvasWidth" label="Vászon szélessége" min={300} max={2400} step={10} value={appState.canvasWidth} onChange={val => handleStateChange('canvasWidth', val)} valueSuffix="px" />
                            <RangeInput id="canvasHeight" label="Vászon magassága" min={300} max={2400} step={10} value={appState.canvasHeight} onChange={val => handleStateChange('canvasHeight', val)} valueSuffix="px" />
                            
                            <SelectInput 
                                id="exportFormat" 
                                label="Export Formátum" 
                                value={appState.exportFormat} 
                                options={EXPORT_FORMAT_OPTIONS}
                                onChange={val => handleStateChange('exportFormat', val as ExportFormat)} 
                            />
                            {appState.exportFormat === 'jpeg' && (
                                <RangeInput 
                                    id="jpegQuality" 
                                    label="JPEG Minőség" 
                                    min={0.7} max={1} step={0.01} 
                                    value={appState.jpegQuality} 
                                    onChange={val => handleStateChange('jpegQuality', val)} 
                                    valueDisplay={`${Math.round(appState.jpegQuality * 100)}%`}
                                />
                            )}
                            
                        </ControlPanelSection>

                        <LayersPanel
                            layers={appState.layers}
                            selectedLayerId={appState.selectedLayerId}
                            onSelectLayer={selectLayer}
                            onToggleVisibility={toggleLayerVisibility}
                            onDeleteLayer={deleteLayer}
                            onMoveLayer={moveLayer}
                            onAddLayer={addLayer}
                            onReorderLayers={handleReorderLayers}
                            // Grid overlay props
                            showGrid={showGrid}
                            setShowGrid={setShowGrid}
                            gridDensity={gridDensity}
                            setGridDensity={setGridDensity}
                            gridStyle={gridStyle}
                            setGridStyle={setGridStyle}
                            gridOpacity={gridOpacity}
                            setGridOpacity={setGridOpacity}
                            canAddImageLayer={!isMobile}
                            snapToGrid={snapToGrid}
                            setSnapToGrid={setSnapToGrid}
                        />
                        
                        {selectedLayer && ( 
                            <LayerSpecificSettings
                                selectedLayer={selectedLayer}
                                onUpdateLayer={updateLayer}
                                onUpdateTextShadow={updateLayerShadow}
                                brandKit={brandKit}
                                onApplyBrandColorToLayer={handleApplyBrandColorToLayer}
                                canvasWidth={appState.canvasWidth}
                                canvasHeight={appState.canvasHeight}
                            />
                        )}

                        <ControlPanelSection title="Vászon Háttér">
                            <SegmentedControl<AppState['backgroundType']>
                                label="Háttér típusa"
                                name="backgroundType"
                                options={backgroundTypeOptions}
                                value={appState.backgroundType}
                                onChange={(val) => handleStateChange('backgroundType', val)}
                            />

                            {appState.backgroundType === 'solid' && (
                                <ColorPickerInput id="bgColor" label="Háttérszín" value={appState.bgColor} onChange={val => handleStateChange('bgColor', val)} />
                            )}

                            {appState.backgroundType === 'gradient' && (
                                <div className="space-y-4 mt-4 p-4 bg-gray-100/50 rounded-lg border border-gray-200">
                                    <SegmentedControl<GradientState['type']>
                                        label="Színátmenet típusa"
                                        name="gradientType"
                                        options={gradientTypeOptions}
                                        value={appState.gradient.type}
                                        onChange={(val) => handleGradientChange('type', val)}
                                    />
                                    <ColorPickerInput id="gradientColor1" label="1. Szín" value={appState.gradient.color1} onChange={val => handleGradientChange('color1', val)} />
                                    <ColorPickerInput id="gradientColor2" label="2. Szín" value={appState.gradient.color2} onChange={val => handleGradientChange('color2', val)} />
                                    {appState.gradient.type === 'linear' && (
                                      <RangeInput id="gradientAngle" label="Szög (lineáris)" min={0} max={360} step={5} value={appState.gradient.angle} onChange={val => handleGradientChange('angle', val)} valueSuffix="°" />
                                    )}
                                </div>
                            )}
                            {/* Háttérkép feltöltő CSAK ha nincs háttérkép és NEM mobil nézet */}
                            {appState.backgroundType === 'image' && !appState.bgImage && !isMobile && (
                                <FileUploadInput 
                                    id="bgImageUpload" 
                                    label="Háttérkép"
                                    buttonText="Vászon háttérkép feltöltése..." 
                                    accept="image/*" 
                                    onChange={async (file) => {
                                        if (!file) return;
                                        try {
                                            if (isIndexedDBSupported) {
                                                // IndexedDB-be mentjük a háttérképet
                                                const bgImageId = `bg-${Date.now()}`;
                                                await saveImage(bgImageId, file, file.name);
                                                handleStateChange('bgImage', `indexeddb:${bgImageId}`);
                                            } else {
                                                // Fallback: DataURL
                                                const reader = new FileReader();
                                                reader.onload = e => {
                                                    if (e.target?.result && e.target.result !== appState.bgImage) {
                                                        handleStateChange('bgImage', e.target.result as string);
                                                    }
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        } catch (error) {
                                            console.error('Hiba a háttérkép mentésekor:', error);
                                            alert('Hiba történt a háttérkép mentésekor. Próbáld újra!');
                                        }
                                    }}
                                    disabled={appState.backgroundType !== 'image'}
                                    className="mt-4"
                                />
                            )}
                            {/* Ha van háttérkép, csak a filterek és törlés gomb jelenjen meg, de csak NEM mobil nézetben */}
                            {appState.backgroundType === 'image' && appState.bgImage && !isMobile && (
                                <div className="space-y-4 mt-4 p-4 bg-gray-100/50 rounded-lg border border-gray-200">
                                    {resolvedBgImageUrl && (
                                        <img src={resolvedBgImageUrl} alt="Háttérkép előnézet" className="w-full rounded mb-2 border border-gray-300" style={{maxHeight: 180, objectFit: 'contain'}} />
                                    )}
                                    <InputLabel text="Képfilterek (vászon háttér)" />
                                    <RangeInput id="bgBlur" label="Elmosás (Blur)" min={0} max={20} value={appState.bgImageFilters.blur} onChange={val => handleImageFilterChange('blur', val)} valueSuffix="px" />
                                    <RangeInput id="bgBrightness" label="Fényerő" min={0} max={200} step={5} value={appState.bgImageFilters.brightness} onChange={val => handleImageFilterChange('brightness', val)} valueSuffix="%" />
                                    <RangeInput id="bgContrast" label="Kontraszt" min={0} max={200} step={5} value={appState.bgImageFilters.contrast} onChange={val => handleImageFilterChange('contrast', val)} valueSuffix="%" />
                                     <div className='font-italic text-sm text-gray-500'>A szűrők telefonra nem optimalizáltak!</div>
                                    <button 
                                        onClick={handleBackgroundImageDelete} 
                                        className="w-full text-sm font-semibold text-red-600 hover:text-red-800 py-2 rounded-md border border-red-300 hover:bg-red-50 transition-colors mt-2"
                                    >
                                    Háttérkép törlése
                                    </button>
                                </div>
                            )}
                            {/* Mobil nézetben háttérkép nem engedélyezett figyelmeztetés */}
                            {appState.backgroundType === 'image' && isMobile && (
                                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm text-center">
                                    Képháttér beállításához kérlek, használd a desktop verziót! Mobil nézetben csak egyszínű vagy színátmenetes háttér engedélyezett.
                                </div>
                            )}
                            {showOverlayControls && (
                                 <div className="mt-4 p-4 bg-gray-100/50 rounded-lg border border-gray-200 space-y-4">
                                   <InputLabel text="Szín-overlay (vászon háttér)" />
                                   <div className="grid grid-cols-3 gap-2 items-center">
                                       <div className="col-span-1"> 
                                        <input type="color" id="overlayColor" value={appState.overlay.color} onChange={(e) => handleOverlayChange('color', e.target.value)} className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:border-[#FF3B30]" />
                                       </div>
                                       <div className="col-span-2">
                                           <input type="range" id="overlayOpacity" min={0} max={1} step={0.05} value={appState.overlay.opacity} onChange={e => handleOverlayChange('opacity', parseFloat(e.target.value))}  className="mt-0 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none accent-[#FF3B30]" />
                                       </div>
                                   </div>
                                   <span className="text-xs text-gray-600 block text-right -mt-2">{Math.round(appState.overlay.opacity * 100)}% Opacitás</span>
                               </div>
                            )}
                        </ControlPanelSection>

                        <ControlPanelSection title="Márka & Sablonok">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">Márka Készlet</h3>
                                <div className="mt-2 p-4 bg-gray-100/50 rounded-lg space-y-4 border border-gray-200">
                                    <div className="grid grid-cols-2 gap-4">
                                        <ColorPickerInput id="brandColor1" label="Elsődleges szín" value={brandKit.color1} onChange={val => setBrandKit(prev => ({...prev, color1: val}))} />
                                        <ColorPickerInput id="brandColor2" label="Másodlagos szín" value={brandKit.color2} onChange={val => setBrandKit(prev => ({...prev, color2: val}))} />
                                    </div>
                                    <button onClick={handleSaveBrandKit} className="w-full text-sm font-bold bg-gray-200 py-2.5 rounded hover:bg-gray-300 transition-colors text-gray-700">Márka mentése</button>
                                    <InputLabel text="Márkaszínek alkalmazása (Vászon):" className="!text-xs !font-semibold !uppercase text-center !text-gray-600 mt-2"/>
                                    <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
                                        <button onClick={() => handleApplyBrandColorToCanvas('bgColor')} className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors text-gray-700">Alap Háttérszín</button>
                                        <button onClick={() => handleApplyBrandColorToCanvas('gradient1')} className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors text-gray-700" disabled={appState.backgroundType !== 'gradient'}>Gradient Szín 1</button>
                                        <button onClick={() => handleApplyBrandColorToCanvas('gradient2')} className="bg-white p-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors text-gray-700" disabled={appState.backgroundType !== 'gradient'}>Gradient Szín 2</button>
                                    </div>
                                     <p className="text-xs text-gray-500 mt-1">A rétegekre vonatkozó márkaszíneket a kiválasztott réteg beállításainál találod.</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mt-4">Sablonok</h3>
                                <div className="mt-2 space-y-2">
                                    {/* Gyári sablonok (OG_TEMPLATES) */}
                                    <select
                                        value={selectedTemplateKey}
                                        onChange={e => {
                                            setSelectedTemplateKey(e.target.value);
                                            handleApplyTemplate(e.target.value);
                                        }}
                                        className="input-field w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:border-[#FF3B30] bg-white"
                                    >
                                        <option value="">Gyári sablon kiválasztása...</option>
                                        {OG_TEMPLATES.map(t => (
                                            <option key={t.key} value={t.key}>{t.name}</option>
                                        ))}
                                    </select>
                                    {selectedTemplateKey && (
                                        <div className="text-xs text-gray-600 italic mt-1">
                                            {OG_TEMPLATES.find(t => t.key === selectedTemplateKey)?.description}
                                        </div>
                                    )}
                                    {/* Egyéni sablonok (mentés/betöltés) */}
                                    <div className="flex gap-2 mt-4">
                                        <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} className="input-field w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:border-[#FF3B30]" placeholder="Sablon neve..."/>
                                        <button onClick={handleSaveTemplate} className={`px-4 bg-gray-800 text-white rounded font-bold hover:bg-black transition-colors ${!templateName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`} title="Aktuális állapot mentése sablonként" disabled={!templateName.trim()}>Ment</button>
                                    </div>
                                    {templates && templates.length > 0 && (
                                        <select value={selectedTemplateName} onChange={e => handleLoadTemplate(e.target.value)} className="input-field w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF3B30] focus:border-[#FF3B30] bg-white mt-2">
                                            <option value="">Egyéni sablon betöltése...</option>
                                            {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </ControlPanelSection>

                        <ControlPanelSection title="Képek">
                            <div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Kezeld a lokálisan tárolt képeket.
                                </p>
                                <PicsSettings onAddImageLayer={handleAddStoredImageLayer} />
                            </div>
                        </ControlPanelSection>
                    </div>
                    
                    <div className="mt-10 pt-6 border-t-2 border-gray-300">
                         <h2 className="text-xl font-black mb-4 text-gray-900">Exportálás </h2>
                         <p className="text-sm text-gray-700 mb-4">Válassz célplatformot a megfelelő méretarányhoz. A letöltéshez használhatod a <kbd className="font-mono bg-gray-200 px-1 py-0.5 rounded text-xs text-gray-800">Cmd/Ctrl+S</kbd> parancsot is.</p>
                         <div className="space-y-3">
                             <button onClick={() => handleExport()} className={`w-full bg-[#FF3B30] text-white font-bold uppercase py-3.5 rounded-md hover:bg-red-700 transition-colors`}>
                                Letöltés ({appState.canvasWidth}x{appState.canvasHeight}px)
                            </button>
                            
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleExport({w: 1200, h: 600}, 'twitter-share')} className="w-full bg-gray-700 text-white font-bold py-3 rounded-md hover:bg-gray-800 transition-colors">Twitter (2:1)</button>
                                <button onClick={() => handleExport({w: 1200, h: 628}, 'facebook-share')} className="w-full bg-gray-700 text-white font-bold py-3 rounded-md hover:bg-gray-800 transition-colors">Facebook (1.91:1)</button>
                             </div>
                            <ShareButtons getImageBlob={async () => {
  const mainCanvas = document.getElementById('previewCanvas') as HTMLCanvasElement | null;
  if (!mainCanvas) return null;
  return await new Promise<Blob | null>(resolve => {
    mainCanvas.toBlob(blob => resolve(blob), 'image/png');
  });
}} />
                            <div className="text-center text-sm text-gray-500 mt-8">
                              Készítette: <span className="font-semibold text-black"> [V.N.] </span> &copy; {new Date().getFullYear()}
                            </div>
                            <PWAInstallPrompt />
                         </div>
                    </div>
                </div>
            )}

            {/* Right Preview Area - Dynamically styled */}
            <div 
                className={`bg-gray-100 flex flex-col items-center p-4 sm:p-8 overflow-y-auto ${isPreviewVisible 
                        ? 'w-full min-h-screen justify-start pt-12' 
                        : 'lg:col-span-2 justify-center max-h-screen lg:max-h-none'
                    }`}
            >
                <PreviewCanvas 
                    appState={appState} 
                    onCanvasUpdate={handleCanvasUpdate}
                    onLayerPositionChange={handleLayerPositionChange}
                    onLayerSelect={selectLayer}
                    onAddStoredImageLayer={handleAddStoredImageLayer}
                    // Grid overlay props
                    showGrid={!isPreviewVisible && showGrid}
                    gridDensity={gridDensity}
                    gridStyle={gridStyle}
                    gridOpacity={gridOpacity}
                    selectedLayer={selectedLayer || null}
                    onUpdateLayer={updateLayer}
                    snapToGrid={snapToGrid}
                    loadImageFromIndexedDB={loadImageFromIndexedDB}
                    resolvedBgImageUrl={resolvedBgImageUrl}
                />
                <button
                    onClick={() => setIsPreviewVisible(!isPreviewVisible)}
                    className="mt-6 px-6 py-2.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 font-semibold"
                >
                    {isPreviewVisible ? 'Vissza a szerkesztőhöz' : 'Közösségi média előnézet'} 
                </button>

                {isPreviewVisible && socialPreviewImageUrl && (
                    <div className="mt-8 w-full max-w-4xl flex flex-col md:flex-row md:justify-around items-start md:items-stretch gap-6 px-2">
                        <TwitterPreviewCard imageUrl={socialPreviewImageUrl} headlineContent={mainTextLayer?.content || ''} />
                        <FacebookPreviewCard imageUrl={socialPreviewImageUrl} headlineContent={mainTextLayer?.content || ''} siteName="YOURWEBSITE.COM" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;