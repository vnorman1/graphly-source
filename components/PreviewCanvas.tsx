import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AppState, Layer, TextLayer, LogoLayer, ImageLayer } from '../types';
import { BRAND_RED, CANVAS_PADDING, LOGO_CANVAS_PADDING } from '../constants';
import QuickEditModal from './QuickEditModal';

interface PreviewCanvasProps {
  appState: AppState;
  onCanvasUpdate: (dataUrl: string) => void;
  onLayerPositionChange: (layerId: string, position: { x: number; y: number }) => void;
  onLayerSelect?: (layerId: string) => void; // ÚJ: réteg kiválasztás
  onAddStoredImageLayer?: (blob: Blob, filename: string) => void; // ÚJ: tárolt kép hozzáadása
  // ÚJ: Grid overlay propok
  showGrid?: boolean;
  gridDensity?: number;
  gridStyle?: 'dotted' | 'solid';
  gridOpacity?: number;
  snapToGrid?: 'none' | 'vertical' | 'horizontal' | 'both';
  // IndexedDB támogatás
  loadImageFromIndexedDB?: (src: string) => Promise<string | null>;
  resolvedBgImageUrl?: string | null;
}

type DraggableElementInfo = {
  layerId: string;
  startX: number; // Mouse start X on drag
  startY: number; // Mouse start Y on drag
  elementStartX: number; // Element's original X
  elementStartY: number; // Element's original Y
} | null;

// Helper to load images and store them
const imageCache = new Map<string, HTMLImageElement>();

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(imageCache.get(src)!);
      return;
    }
    const img = new Image();
    // Set crossOrigin BEFORE src for CORS images
    if (!src.startsWith('data:')) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (err) => {
      imageCache.delete(src); // remove from cache on error
      reject(err);
    };
    img.src = src;
  });
};


const PreviewCanvas: React.FC<PreviewCanvasProps & {
  selectedLayer: Layer | null;
  onUpdateLayer: (layerId: string, updates: Partial<Layer>) => void;
}> = ({
  appState, 
  onCanvasUpdate,
  onLayerPositionChange,
  onLayerSelect,
  onAddStoredImageLayer,
  showGrid,
  gridDensity,
  gridStyle,
  gridOpacity,
  selectedLayer,
  onUpdateLayer,
  snapToGrid,
  loadImageFromIndexedDB,
  resolvedBgImageUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingInfo, setDraggingInfo] = useState<DraggableElementInfo>(null);
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  // ÚJ: háttérkép töltési állapot
  const [isBgImageLoading, setIsBgImageLoading] = useState(false);
  const [quickEditModal, setQuickEditModal] = useState<{ x: number; y: number } | null>(null);

  // Detect Safari (iOS/macOS) for filter warning
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    const ua = window.navigator.userAgent;
    // iOS: has "Safari" but not "Chrome" or "CriOS" or "FxiOS"
    // macOS: has "Safari" but not "Chrome" or "Chromium"
    const isSafariBrowser = /Safari\//.test(ua) && !/Chrome|Chromium|CriOS|FxiOS/.test(ua);
    setIsSafari(isSafariBrowser);
  }, []);

  // Preload images for layers
  useEffect(() => {
    let isMounted = true;
    const newImageMap = new Map(loadedImages);
    let mapChanged = false;
    const promises: Promise<void>[] = [];

    // Gyűjtsük össze az összes szükséges src-t: layerek + bgImage
    const neededSrcs = new Set<string>();
    appState.layers.forEach(layer => {
      if ((layer.type === 'logo' || layer.type === 'image') && layer.src) {
        neededSrcs.add(layer.src);
      }
    });
    if (resolvedBgImageUrl) {
      neededSrcs.add(resolvedBgImageUrl);
    }

    // Csak azokat töltsük be, amik nincsenek a Map-ben
    neededSrcs.forEach(src => {
      if (!newImageMap.has(src)) {
        const loadPromise = src.startsWith('indexeddb:') && loadImageFromIndexedDB
          ? loadImageFromIndexedDB(src).then(resolvedSrc => {
              if (!resolvedSrc) throw new Error('Failed to resolve IndexedDB image');
              return loadImage(resolvedSrc);
            })
          : loadImage(src);

        promises.push(
          loadPromise
            .then(img => {
              if (!isMounted) return;
              newImageMap.set(src, img);
              mapChanged = true;
            })
            .catch(() => {
              if (!isMounted) return;
              if (newImageMap.has(src)) {
                  newImageMap.delete(src);
                  mapChanged = true;
              }
            })
        );
      }
    });
    // Csak azokat töröljük, amik már sehol sem kellenek
    newImageMap.forEach((_, src) => {
      if (!neededSrcs.has(src)) {
        newImageMap.delete(src);
        imageCache.delete(src);
        mapChanged = true;
      }
    });
    if (promises.length > 0) {
      Promise.all(promises).then(() => {
        if (mapChanged && isMounted) setLoadedImages(new Map(newImageMap));
      });
    } else if (mapChanged) {
        setLoadedImages(new Map(newImageMap));
    }
    return () => { isMounted = false; };
  }, [appState.layers, resolvedBgImageUrl, loadImageFromIndexedDB]); // add loadImageFromIndexedDB dependency

  // Háttérkép betöltése csak akkor, ha tényleg új src jött be
  useEffect(() => {
    if (resolvedBgImageUrl && appState.backgroundType === 'image' && !loadedImages.has(resolvedBgImageUrl)) {
        setIsBgImageLoading(true);
        loadImage(resolvedBgImageUrl)
            .then(img => {
                setLoadedImages(prev => {
                  if (prev.has(resolvedBgImageUrl!)) return prev;
                  const newMap = new Map(prev);
                  newMap.set(resolvedBgImageUrl!, img);
                  return newMap;
                });
                setIsBgImageLoading(false);
            })
            .catch(err => {
                console.error("Failed to load main background image:", err);
                setIsBgImageLoading(false);
            });
    } else {
        setIsBgImageLoading(false);
    }
  }, [resolvedBgImageUrl, appState.backgroundType]); // loadedImages NEM kell ide!


  const getCanvasAndContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  }, []);

  const getWrappedLines = useCallback((ctx: CanvasRenderingContext2D, layer: TextLayer): string[] => {
    const fontStyle = layer.italic ? 'italic' : 'normal';
    ctx.font = `${fontStyle} ${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}", sans-serif`;
    if (CSS.supports('letter-spacing', `${layer.letterSpacing}px`)) {
      ctx.letterSpacing = `${layer.letterSpacing}px`;
    } else {
      ctx.letterSpacing = '0px'; // Reset if not supported or not set
    }
    
    const textToWrap = layer.content || "";
    let maxWidth: number;
    if (layer.width) {
        maxWidth = layer.width;
    } else {
        if (layer.textAlign === 'left') {
            maxWidth = appState.canvasWidth - layer.x - CANVAS_PADDING;
        } else { // For center/right aligned text without explicit width, assume it can take up most of canvas with padding
            maxWidth = appState.canvasWidth - 2 * CANVAS_PADDING;
        }
        maxWidth = Math.max(maxWidth, layer.fontSize); // Ensure maxWidth is at least font size
    }


    const words = textToWrap.split(' ');
    if (!words[0]) return [];
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth || !currentLine.length) { // Allow single very long words to overflow
            currentLine += (currentLine.length ? " " : "") + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    ctx.letterSpacing = '0px'; // Reset after use
    return lines;
  }, [appState.canvasWidth]);

  const drawLayer = useCallback((ctx: CanvasRenderingContext2D, layer: Layer) => {
    if (!layer.isVisible) return;

    ctx.save();
    ctx.globalAlpha = layer.opacity;

    let elementCenterX = layer.x;
    let elementCenterY = layer.y;
    let actualDrawX = layer.x; // For text and image, this is usually layer.x
    let actualDrawY = layer.y; // For text and image, this is usually layer.y

    if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        // FONT STYLE: italic
        const fontStyle = textLayer.italic ? 'italic' : 'normal';
        ctx.font = `${fontStyle} ${textLayer.fontWeight} ${textLayer.fontSize}px "${textLayer.fontFamily}", sans-serif`;
        if (CSS.supports('letter-spacing', `${textLayer.letterSpacing}px`)) ctx.letterSpacing = `${textLayer.letterSpacing}px`;
        const lines = getWrappedLines(ctx, textLayer);
        ctx.letterSpacing = '0px';
        let textBlockWidth = 0;
        if (lines.length > 0) {
           ctx.font = `${fontStyle} ${textLayer.fontWeight} ${textLayer.fontSize}px "${textLayer.fontFamily}", sans-serif`;
           if (CSS.supports('letter-spacing', `${textLayer.letterSpacing}px`)) ctx.letterSpacing = `${textLayer.letterSpacing}px`;
           textBlockWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
           ctx.letterSpacing = '0px';
        }
        const textBlockHeight = (lines.length > 0 ? (lines.length -1) * (textLayer.fontSize * textLayer.lineHeightMultiplier) : 0) + textLayer.fontSize;
        let textRenderAnchorX = textLayer.x;
        if(textLayer.textAlign === 'center') actualDrawX = textRenderAnchorX - textBlockWidth / 2;
        else if(textLayer.textAlign === 'right') actualDrawX = textRenderAnchorX - textBlockWidth;
        else actualDrawX = textRenderAnchorX;
        if (textLayer.verticalAlign === 'middle') actualDrawY = textLayer.y - textBlockHeight / 2;
        else if (textLayer.verticalAlign === 'bottom') actualDrawY = textLayer.y - textBlockHeight;
        else actualDrawY = textLayer.y;
        elementCenterX = actualDrawX + textBlockWidth / 2;
        elementCenterY = actualDrawY + textBlockHeight / 2;

    } else if (layer.type === 'logo') {
        const logoLayer = layer as LogoLayer;
        const img = loadedImages.get(logoLayer.src!);
        if (img) {
            const aspectRatio = img.width / img.height;
            const logoRenderHeight = logoLayer.size / aspectRatio;
            
            if (!logoLayer.isFreelyPositioned) {
                switch(logoLayer.cornerPosition) {
                    case 'top-left': actualDrawX = LOGO_CANVAS_PADDING; actualDrawY = LOGO_CANVAS_PADDING; break;
                    case 'top-right': actualDrawX = appState.canvasWidth - logoLayer.size - LOGO_CANVAS_PADDING; actualDrawY = LOGO_CANVAS_PADDING; break;
                    case 'bottom-left': actualDrawX = LOGO_CANVAS_PADDING; actualDrawY = appState.canvasHeight - logoRenderHeight - LOGO_CANVAS_PADDING; break;
                    case 'bottom-right': default: actualDrawX = appState.canvasWidth - logoLayer.size - LOGO_CANVAS_PADDING; actualDrawY = appState.canvasHeight - logoRenderHeight - LOGO_CANVAS_PADDING; break;
                }
            } else {
                actualDrawX = logoLayer.x; // Use stored x,y if freely positioned
                actualDrawY = logoLayer.y;
            }
            elementCenterX = actualDrawX + logoLayer.size / 2;
            elementCenterY = actualDrawY + logoRenderHeight / 2;
        }
    } else if (layer.type === 'image') { // ImageLayer
        const imgLayer = layer as ImageLayer;
        actualDrawX = imgLayer.x;
        actualDrawY = imgLayer.y;
        elementCenterX = actualDrawX + imgLayer.width / 2;
        elementCenterY = actualDrawY + imgLayer.height / 2;
    }
    
    ctx.translate(elementCenterX, elementCenterY);
    ctx.rotate(layer.rotation * Math.PI / 180);
    ctx.translate(-elementCenterX, -elementCenterY);

    if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        ctx.fillStyle = textLayer.textColor;
        const fontStyle = textLayer.italic ? 'italic' : 'normal';
        ctx.font = `${fontStyle} ${textLayer.fontWeight} ${textLayer.fontSize}px "${textLayer.fontFamily}", sans-serif`;
        ctx.textAlign = 'left';
        if (CSS.supports('letter-spacing', `${textLayer.letterSpacing}px`)) {
          ctx.letterSpacing = `${textLayer.letterSpacing}px`;
        }
        if (textLayer.textShadow.enabled) {
            ctx.shadowColor = textLayer.textShadow.color;
            ctx.shadowOffsetX = textLayer.textShadow.offsetX;
            ctx.shadowOffsetY = textLayer.textShadow.offsetY;
            ctx.shadowBlur = textLayer.textShadow.blurRadius;
        }
        const lines = getWrappedLines(ctx, textLayer); 
        const lineHeight = textLayer.fontSize * textLayer.lineHeightMultiplier;
        let lineDrawY = actualDrawY;
        if (textLayer.verticalAlign === 'top') {
            ctx.textBaseline = 'top';
            lineDrawY = actualDrawY;
        } else if (textLayer.verticalAlign === 'middle') {
            ctx.textBaseline = 'middle';
            lineDrawY = actualDrawY + lineHeight / 2;
        } else {
            ctx.textBaseline = 'bottom';
            lineDrawY = actualDrawY + lineHeight;
        }
        lines.forEach((line, i) => {
            let x = textLayer.x;
            let y = lineDrawY + (i * lineHeight);
            let totalWidth = 0;
            for (let c = 0; c < line.length; c++) {
                totalWidth += ctx.measureText(line[c]).width;
            }
            if (line.length > 1) totalWidth += (line.length - 1) * textLayer.letterSpacing;
            let currentX = x;
            if (textLayer.textAlign === 'center') {
                currentX = x - totalWidth / 2;
            } else if (textLayer.textAlign === 'right') {
                currentX = x - totalWidth;
            }
            ctx.textAlign = 'left';
            for (let c = 0; c < line.length; c++) {
                const char = line[c];
                ctx.fillText(char, currentX, y);
                currentX += ctx.measureText(char).width + textLayer.letterSpacing;
            }
            // UNDERLINE: ha szükséges (a baseline alatt, kb. 1/8 fontmérettel lejjebb)
            if (textLayer.underline) {
                ctx.save();
                ctx.strokeStyle = textLayer.textColor;
                ctx.lineWidth = Math.max(1, Math.round(textLayer.fontSize / 16));
                // baseline alatt húzzuk meg a vonalat
                const underlineY = y + textLayer.fontSize * 0.15;
                ctx.beginPath();
                ctx.moveTo(currentX - totalWidth, underlineY);
                ctx.lineTo(currentX, underlineY);
                ctx.stroke();
                ctx.restore();
            }
        });
        ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowBlur = 0;
    } else if (layer.type === 'logo') {
        const logoLayer = layer as LogoLayer;
        const img = loadedImages.get(logoLayer.src!);
        if (img) {
            const aspectRatio = img.width / img.height;
            const logoRenderHeight = logoLayer.size / aspectRatio;
            // actualDrawX and actualDrawY were calculated before transformations
            ctx.drawImage(img, actualDrawX, actualDrawY, logoLayer.size, logoRenderHeight);
        }
    } else { // ImageLayer
        const imgLayer = layer as ImageLayer;
        const img = loadedImages.get(imgLayer.src);
        if (img) {
            // actualDrawX and actualDrawY for image are directly layer.x, layer.y
            if (imgLayer.shadow.enabled) {
                ctx.save(); 
                ctx.shadowColor = imgLayer.shadow.color;
                ctx.shadowOffsetX = imgLayer.shadow.offsetX;
                ctx.shadowOffsetY = imgLayer.shadow.offsetY;
                ctx.shadowBlur = imgLayer.shadow.blurRadius;
                
                ctx.beginPath();
                ctx.moveTo(actualDrawX + imgLayer.borderRadius, actualDrawY);
                ctx.lineTo(actualDrawX + imgLayer.width - imgLayer.borderRadius, actualDrawY);
                ctx.arcTo(actualDrawX + imgLayer.width, actualDrawY, actualDrawX + imgLayer.width, actualDrawY + imgLayer.borderRadius, imgLayer.borderRadius);
                ctx.lineTo(actualDrawX + imgLayer.width, actualDrawY + imgLayer.height - imgLayer.borderRadius);
                ctx.arcTo(actualDrawX + imgLayer.width, actualDrawY + imgLayer.height, actualDrawX + imgLayer.width - imgLayer.borderRadius, actualDrawY + imgLayer.height, imgLayer.borderRadius);
                ctx.lineTo(actualDrawX + imgLayer.borderRadius, actualDrawY + imgLayer.height);
                ctx.arcTo(actualDrawX, actualDrawY + imgLayer.height, actualDrawX, actualDrawY + imgLayer.height - imgLayer.borderRadius, imgLayer.borderRadius);
                ctx.lineTo(actualDrawX, actualDrawY + imgLayer.borderRadius);
                ctx.arcTo(actualDrawX, actualDrawY, actualDrawX + imgLayer.borderRadius, actualDrawY, imgLayer.borderRadius);
                ctx.closePath();
                ctx.fillStyle = 'rgba(0,0,0,0.001)'; 
                ctx.fill(); 
                ctx.restore(); 
                 ctx.save(); 
            }

            ctx.beginPath();
            ctx.moveTo(actualDrawX + imgLayer.borderRadius, actualDrawY);
            ctx.lineTo(actualDrawX + imgLayer.width - imgLayer.borderRadius, actualDrawY);
            ctx.arcTo(actualDrawX + imgLayer.width, actualDrawY, actualDrawX + imgLayer.width, actualDrawY + imgLayer.borderRadius, imgLayer.borderRadius);
            ctx.lineTo(actualDrawX + imgLayer.width, actualDrawY + imgLayer.height - imgLayer.borderRadius);
            ctx.arcTo(actualDrawX + imgLayer.width, actualDrawY + imgLayer.height, actualDrawX + imgLayer.width - imgLayer.borderRadius, actualDrawY + imgLayer.height, imgLayer.borderRadius);
            ctx.lineTo(actualDrawX + imgLayer.borderRadius, actualDrawY + imgLayer.height);
            ctx.arcTo(actualDrawX, actualDrawY + imgLayer.height, actualDrawX, actualDrawY + imgLayer.height - imgLayer.borderRadius, imgLayer.borderRadius);
            ctx.lineTo(actualDrawX, actualDrawY + imgLayer.borderRadius);
            ctx.arcTo(actualDrawX, actualDrawY, actualDrawX + imgLayer.borderRadius, actualDrawY, imgLayer.borderRadius);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(img, actualDrawX, actualDrawY, imgLayer.width, imgLayer.height);
            
            if (imgLayer.shadow.enabled) {
                ctx.restore(); 
            }
        }
    }
    ctx.restore(); 
  }, [getWrappedLines, loadedImages, appState.canvasWidth, appState.canvasHeight]);


  // Store the last dataUrl to avoid unnecessary updates
  const lastDataUrlRef = useRef<string | null>(null);
  // Store the last appState and loadedImages to detect real changes
  const lastAppStateRef = useRef<AppState | null>(null);
  const lastLoadedImagesRef = useRef<string>('');

  const drawCanvas = useCallback(() => {
    const res = getCanvasAndContext();
    if (!res) return;
    const { canvas, ctx } = res;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowBlur = 0;
    ctx.letterSpacing = '0px'; ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // --- FŐ JAVÍTÁS: ha háttérkép töltődik, CSAK a töltő szöveget rajzoljuk ki, mást nem! ---
    if (appState.backgroundType === 'image' && isBgImageLoading && resolvedBgImageUrl) {
        ctx.fillStyle = appState.bgColor; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.font = "20px Inter"; ctx.textAlign = "center";
        ctx.fillText("Háttérkép betöltése...", canvas.width/2, canvas.height/2);
        // NE hívjuk meg az onCanvasUpdate-et, amíg töltődik a kép!
        return;
    }
    if (appState.backgroundType === 'solid') {
        ctx.fillStyle = appState.bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (appState.backgroundType === 'gradient' && appState.gradient) {
        let gradientFill;
        const { type, color1, color2, angle } = appState.gradient;
        if (type === 'linear') {
            const rad = angle * Math.PI / 180;
            const x1 = canvas.width * (0.5 - Math.cos(rad) * 0.5);
            const y1 = canvas.height * (0.5 - Math.sin(rad) * 0.5);
            const x2 = canvas.width * (0.5 + Math.cos(rad) * 0.5);
            const y2 = canvas.height * (0.5 + Math.sin(rad) * 0.5);
            gradientFill = ctx.createLinearGradient(x1, y1, x2, y2);
        } else { 
            const centerX = canvas.width / 2; const centerY = canvas.height / 2;
            const radius = Math.max(canvas.width, canvas.height) / 1.5; 
            gradientFill = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        }
        gradientFill.addColorStop(0, color1); gradientFill.addColorStop(1, color2);
        ctx.fillStyle = gradientFill; ctx.fillRect(0, 0, canvas.width, canvas.height);
    } 
    const bgImageFromState = resolvedBgImageUrl; 
    const bgImageElement = bgImageFromState ? loadedImages.get(bgImageFromState) : null;
    if (appState.backgroundType === 'image') {
        if (bgImageElement) {
            ctx.save();
            // Filterek alkalmazása
            const blur = Number(appState.bgImageFilters.blur ?? 0);
            const brightness = Number(appState.bgImageFilters.brightness ?? 100);
            const contrast = Number(appState.bgImageFilters.contrast ?? 100);
            ctx.filter = `blur(${blur}px) brightness(${brightness}%) contrast(${contrast}%)`;
            ctx.drawImage(bgImageElement, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none';
            ctx.restore();
        } else if (appState.bgImage && !isBgImageLoading) {
            ctx.fillStyle = appState.bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    const overlayApplicable = appState.backgroundType === 'gradient' || (appState.backgroundType === 'image' && bgImageElement);
    if (overlayApplicable && appState.overlay.opacity > 0) {
        ctx.save();
        ctx.globalAlpha = appState.overlay.opacity; ctx.fillStyle = appState.overlay.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore();
    }
    const sortedLayers = [...appState.layers].sort((a, b) => a.zIndex - b.zIndex);
    sortedLayers.forEach(layer => drawLayer(ctx, layer));
    // --- FŐ JAVÍTÁS: csak akkor hívjuk meg az onCanvasUpdate-et, ha NEM töltődik a háttérkép, ÉS tényleg változott a tartalom! ---
    if (!(appState.backgroundType === 'image' && isBgImageLoading && appState.bgImage)) {
      let previewFormat = 'image/png';
      const newDataUrl = canvas.toDataURL(previewFormat);
      // Serialize loadedImages for comparison
      const loadedImagesKeys = Array.from(loadedImages.keys()).sort().join(',');
      // Csak akkor hívjuk meg, ha tényleg változott valami!
      if (
        lastDataUrlRef.current !== newDataUrl ||
        lastAppStateRef.current !== appState ||
        lastLoadedImagesRef.current !== loadedImagesKeys
      ) {
        lastDataUrlRef.current = newDataUrl;
        lastAppStateRef.current = appState;
        lastLoadedImagesRef.current = loadedImagesKeys;
        onCanvasUpdate(newDataUrl);
      }
    }
  }, [appState, getCanvasAndContext, onCanvasUpdate, drawLayer, loadedImages, isBgImageLoading, isSafari]);
  
  useEffect(() => {
    drawCanvas();
  }, [appState, drawCanvas, loadedImages]); 

  const getScaledMousePos = (event: MouseEvent | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
  };

  const getLayerBoundingBox = useCallback((ctx: CanvasRenderingContext2D, layer: Layer): { x: number, y: number, width: number, height: number } | null => {
    if (!layer.isVisible) return null;
    if (layer.type === 'text') {
        const textLayer = layer as TextLayer;
        ctx.font = `${textLayer.fontWeight} ${textLayer.fontSize}px "${textLayer.fontFamily}", sans-serif`;
        if (CSS.supports('letter-spacing', `${textLayer.letterSpacing}px`)) {
          ctx.letterSpacing = `${textLayer.letterSpacing}px`;
        }
        const lines = getWrappedLines(ctx, textLayer); 
        if (!lines.length) { ctx.letterSpacing = '0px'; return null; }
        const textBlockWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
        const textBlockHeight = (lines.length > 0 ? (lines.length -1) * (textLayer.fontSize * textLayer.lineHeightMultiplier) : 0) + textLayer.fontSize;
        ctx.letterSpacing = '0px';
        let boxX = textLayer.x; 
        if (textLayer.textAlign === 'center') boxX = textLayer.x - textBlockWidth / 2;
        else if (textLayer.textAlign === 'right') boxX = textLayer.x - textBlockWidth;
        let boxY = textLayer.y;
        if (textLayer.verticalAlign === 'middle') {
            boxY = textLayer.y - textBlockHeight / 2;
        } else if (textLayer.verticalAlign === 'bottom') {
            boxY = textLayer.y - textBlockHeight;
        }
        return { x: boxX, y: boxY, width: textBlockWidth, height: textBlockHeight };
    } else if (layer.type === 'logo') {
        const logo = layer as LogoLayer;
        const img = loadedImages.get(logo.src!);
        if (!img) return null;
        const aspectRatio = img.width / img.height;
        const logoRenderHeight = logo.size / aspectRatio;
        let boxX = logo.x;
        let boxY = logo.y;
        if (!logo.isFreelyPositioned) {
            switch(logo.cornerPosition) {
                case 'top-left': boxX = LOGO_CANVAS_PADDING; boxY = LOGO_CANVAS_PADDING; break;
                case 'top-right': boxX = appState.canvasWidth - logo.size - LOGO_CANVAS_PADDING; boxY = LOGO_CANVAS_PADDING; break;
                case 'bottom-left': boxX = LOGO_CANVAS_PADDING; boxY = appState.canvasHeight - logoRenderHeight - LOGO_CANVAS_PADDING; break;
                case 'bottom-right': default: boxX = appState.canvasWidth - logo.size - LOGO_CANVAS_PADDING; boxY = appState.canvasHeight - logoRenderHeight - LOGO_CANVAS_PADDING; break;
            }
        }
        return { x: boxX, y: boxY, width: logo.size, height: logoRenderHeight };
    } else if (layer.type === 'image') {
        const imgLayer = layer as ImageLayer;
        return { x: imgLayer.x, y: imgLayer.y, width: imgLayer.width, height: imgLayer.height };
    }
    return null;
  }, [getWrappedLines, loadedImages, appState.canvasWidth, appState.canvasHeight]); 

  const checkCollision = useCallback((mouseX: number, mouseY: number, layer: Layer, ctx: CanvasRenderingContext2D): boolean => {
    const layerBox = getLayerBoundingBox(ctx, layer);
    if (!layerBox) return false;

    // Point in rotated rectangle check
    let elementCenterX = layerBox.x + layerBox.width / 2;
    let elementCenterY = layerBox.y + layerBox.height / 2;
    
    const translatedX = mouseX - elementCenterX;
    const translatedY = mouseY - elementCenterY;

    const angleRad = -layer.rotation * Math.PI / 180;
    const rotatedX = translatedX * Math.cos(angleRad) - translatedY * Math.sin(angleRad);
    const rotatedY = translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);

    const halfWidth = layerBox.width / 2;
    const halfHeight = layerBox.height / 2;
    
    return rotatedX >= -halfWidth && rotatedX <= halfWidth &&
           rotatedY >= -halfHeight && rotatedY <= halfHeight;

  }, [getLayerBoundingBox]);


  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const mousePos = getScaledMousePos(event);
    const res = getCanvasAndContext();
    if (!res) return;
    const { ctx } = res;

    const sortedLayers = [...appState.layers].sort((a, b) => b.zIndex - a.zIndex);

    // Első lépés: ellenőrizzük, van-e réteg a kattintás helyén
    for (const layer of sortedLayers) {
        if (!layer.isVisible) continue;
        if (checkCollision(mousePos.x, mousePos.y, layer, ctx)) {
            // Ha más rétegre kattintottunk, válasszuk ki azt
            if (layer.id !== appState.selectedLayerId && onLayerSelect) {
                onLayerSelect(layer.id);
                return; // Várjuk meg a kiválasztást, ne indítsunk drag-et
            }
            // Ha már a kiválasztott rétegre kattintottunk, indítsunk drag-et
            if (layer.id === appState.selectedLayerId) {
                setDraggingInfo({
                    layerId: layer.id,
                    startX: mousePos.x,
                    startY: mousePos.y,
                    elementStartX: layer.x, // Store the layer's logical X/Y
                    elementStartY: layer.y,
                });
                return;
            }
        }
    }
    
    // Ha nem találtunk réteget a kattintás helyén, töröljük a kiválasztást
    setDraggingInfo(null);
  };

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const mousePos = getScaledMousePos(event);
    const res = getCanvasAndContext();
    if(!res) return;
    const {ctx} = res;

    if (draggingInfo) {
        const deltaX = mousePos.x - draggingInfo.startX;
        const deltaY = mousePos.y - draggingInfo.startY;
        let newX = draggingInfo.elementStartX + deltaX;
        let newY = draggingInfo.elementStartY + deltaY;
        // Snap to grid logic
        if (snapToGrid && snapToGrid !== 'none' && gridDensity && gridDensity > 0) {
          const canvasW = canvas.width;
          const canvasH = canvas.height;
          const spacingX = canvasW / gridDensity;
          const spacingY = canvasH / gridDensity;
          if (snapToGrid === 'vertical' || snapToGrid === 'both') {
            newX = Math.round(newX / spacingX) * spacingX;
          }
          if (snapToGrid === 'horizontal' || snapToGrid === 'both') {
            newY = Math.round(newY / spacingY) * spacingY;
          }
        }
        onLayerPositionChange(draggingInfo.layerId, { x: newX, y: newY });
    } else {
        let newHoveredId: string | null = null;
        const sortedLayers = [...appState.layers].sort((a, b) => b.zIndex - a.zIndex);
        for (const layer of sortedLayers) {
            // Only show hover effect for the selected layer
            if (layer.isVisible && layer.id === appState.selectedLayerId && checkCollision(mousePos.x, mousePos.y, layer, ctx)) {
                newHoveredId = layer.id;
                break;
            }
        }
        setHoveredLayerId(newHoveredId);
    }
  }, [draggingInfo, appState.layers, appState.selectedLayerId, onLayerPositionChange, checkCollision, getCanvasAndContext, snapToGrid, gridDensity]); 

  const handleMouseUp = useCallback(() => {
    setDraggingInfo(null);
  }, []);

  useEffect(() => {
    const currentCanvas = canvasRef.current; 
    if (currentCanvas) { 
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      if (currentCanvas) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [handleMouseMove, handleMouseUp]);
  
  const cursorStyle = (draggingInfo || (hoveredLayerId && hoveredLayerId === appState.selectedLayerId)) ? 'move' : 'default';

  // --- UI warning for Safari filter support ---
  // Only show if backgroundType is image and any filter is non-default
  const showSafariFilterWarning = isSafari && appState.backgroundType === 'image' && (
    Number(appState.bgImageFilters.blur) > 0 ||
    Number(appState.bgImageFilters.brightness) !== 100 ||
    Number(appState.bgImageFilters.contrast) !== 100
  );

  // --- Grid overlay SVG generálása ---
  const renderGridOverlay = () => {
    if (!showGrid) return null;
    // Default values if undefined
    const cols = gridDensity ?? 5;
    const rows = gridDensity ?? 5;
    const w = appState.canvasWidth;
    const h = appState.canvasHeight;
    const lines: React.JSX.Element[] = [];
    const stroke = gridStyle === 'dotted' ? '#FF3B30' : '#FF3B30';
    const dash = gridStyle === 'dotted' ? '2,8' : undefined;
    // Függőleges vonalak
    for (let i = 1; i < cols; i++) {
      const x = (w / cols) * i;
      lines.push(
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={h}
          stroke={stroke}
          strokeWidth={1.5}
          strokeDasharray={dash}
          opacity={gridOpacity ?? 0.5}
        />
      );
    }
    // Vízszintes vonalak
    for (let i = 1; i < rows; i++) {
      const y = (h / rows) * i;
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={w}
          y2={y}
          stroke={stroke}
          strokeWidth={1.5}
          strokeDasharray={dash}
          opacity={gridOpacity ?? 0.5}
        />
      );
    }
    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${w} ${h}`}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {lines}
      </svg>
    );
  };

  // Right-click handler for canvas
  const handleContextMenu = (event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!selectedLayer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setQuickEditModal({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  // Drag & Drop kezelés
  const handleDragOver = (event: React.DragEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (event: React.DragEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    try {
      const data = event.dataTransfer.getData('application/json');
      if (data && onAddStoredImageLayer) {
        const dropData = JSON.parse(data);
        
        if (dropData.type === 'stored-image') {
          // Mivel nem használhatunk hook-ot itt, az App.tsx-ben kell kezelni
          // Jelenleg csak konzolra írjuk
          console.log('Tárolt kép drop:', dropData);
          // Itt kellene valahogy a blob-ot lekérni az ID alapján és meghívni onAddStoredImageLayer-t
          // De mivel ez komplikált, egyelőre csak alert-tel jelzem
          alert('A drag & drop funkció hamarosan elérhető lesz. Kérlek, használd a kattintást!');
        }
      }
    } catch (error) {
      console.error('Hiba a drop kezeléskor:', error);
    }
  };

  // Billentyűparancsok: ctrl/cmd+I (italic), ctrl/cmd+U (underline)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!appState.selectedLayerId) return;
      const selected = appState.layers.find(l => l.id === appState.selectedLayerId);
      if (!selected || selected.type !== 'text') return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        onUpdateLayer(selected.id, { italic: !(selected as TextLayer).italic });
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        onUpdateLayer(selected.id, { underline: !(selected as TextLayer).underline });
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState.selectedLayerId, appState.layers, onUpdateLayer]);

  return (
    <div className="relative w-full max-w-4xl" style={{}}>
      <style>{`
        .safari-filter-warning-anim {
          animation: safariFadeIn 0.7s cubic-bezier(0.4,0,0.2,1);
          transition: opacity 0.3s;
        }
        @keyframes safariFadeIn {
          0% { opacity: 0; transform: translateY(-10px) scale(0.98); }
          60% { opacity: 1; transform: translateY(2px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      {showSafariFilterWarning && (
        <div className="safari-filter-warning-anim" style={{
          background: BRAND_RED, color: '#fff', fontWeight: 'bold', fontSize: 14, padding: '6px 12px', borderRadius: 6, marginBottom: 8,
          display: 'inline-block',
          maxWidth: 400,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.10)',
        }}>
          A háttérkép filterek (blur, brightness, contrast) nem támogatottak Safariban.
        </div>
      )}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-lg" style={{}}>
        <canvas
          ref={canvasRef}
          width={appState.canvasWidth}
          height={appState.canvasHeight}
          className="shadow-2xl w-full max-w-4xl rounded-lg bg-white block"
          id="previewCanvas"
          onMouseDown={handleMouseDown}
          onContextMenu={handleContextMenu}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ cursor: cursorStyle, touchAction: 'none', display: 'block' }}
        />
        {/* Grid overlay csak szerkesztő módban, exportnál nem! */}
        <div className="pointer-events-none absolute inset-0 z-10 w-full h-full overflow-hidden rounded-lg">
          {renderGridOverlay()}
        </div>
        {quickEditModal && selectedLayer && (
          <QuickEditModal
            layer={selectedLayer}
            position={quickEditModal}
            onClose={() => setQuickEditModal(null)}
            onUpdateLayer={onUpdateLayer}
          />
        )}
      </div>
    </div>
  );
};

export default PreviewCanvas;