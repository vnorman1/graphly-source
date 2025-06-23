import { AppState, BrandKitState, SelectOption, TextLayer, LogoLayer, Layer, ExportFormat } from './types';

export const BRAND_RED = '#FF3B30';
export const CANVAS_PADDING = 80;
export const LOGO_CANVAS_PADDING = 20; // Used for positioning logos in corners
export const CANVAS_BASE_WIDTH = 1200;
export const CANVAS_BASE_HEIGHT = 630;

let layerIdCounter = 0;
export const generateId = (prefix: string = 'layer'): string => {
    layerIdCounter++;
    return `${prefix}-${Date.now()}-${layerIdCounter}`;
};

const defaultTextLayer: TextLayer = {
    id: generateId('text'),
    type: 'text',
    name: 'Címsor',
    zIndex: 1,
    isVisible: true,
    opacity: 1,
    x: CANVAS_PADDING,
    y: CANVAS_PADDING,
    rotation: 0,
    content: "[V.N.]™",
    fontFamily: 'Inter',
    fontWeight: '900',
    fontSize: 90,
    textColor: "#111111",
    letterSpacing: 0,
    lineHeightMultiplier: 1.2,
    textAlign: 'left',
    verticalAlign: 'bottom',
    textShadow: {
        enabled: false,
        color: '#000000',
        offsetX: 2,
        offsetY: 2,
        blurRadius: 4,
    },
};

const defaultLogoLayer: LogoLayer = {
    id: generateId('logo'),
    type: 'logo',
    name: 'Logó',
    zIndex: 2,
    isVisible: true,
    opacity: 1,
    // x, y for free positioning will be set dynamically or based on corner if not free
    x: CANVAS_BASE_WIDTH - 150 - LOGO_CANVAS_PADDING, 
    y: CANVAS_BASE_HEIGHT - 50 - LOGO_CANVAS_PADDING, 
    rotation: 0,
    src: null,
    size: 150,
    cornerPosition: 'bottom-right',
    isFreelyPositioned: false,
};


export const INITIAL_STATE: AppState = {
    backgroundType: 'solid',
    bgColor: "#F8F8F8",
    gradient: {
        type: 'linear',
        color1: '#E0E7FF',
        color2: '#FFD1E3',
        angle: 90,
    },
    bgImage: null,
    bgImageFilters: {
        blur: 0,
        brightness: 100,
        contrast: 100
    },
    overlay: {
        color: BRAND_RED,
        opacity: 0
    },
    layers: [defaultTextLayer, defaultLogoLayer],
    selectedLayerId: defaultTextLayer.id, // Select text layer by default
    canvasWidth: CANVAS_BASE_WIDTH,
    canvasHeight: CANVAS_BASE_HEIGHT,
    exportFormat: 'png' as ExportFormat,
    jpegQuality: 0.9,
    includeTransparency: true,
};

export const INITIAL_BRAND_KIT: BrandKitState = {
    color1: BRAND_RED,
    color2: '#111111'
};

export const FONT_OPTIONS: SelectOption[] = [
    { name: 'Inter', value: 'Inter' },
    { name: 'Montserrat', value: 'Montserrat' },
    { name: 'Roboto', value: 'Roboto' },
    { name: 'Open Sans', value: 'Open Sans' },
    { name: 'Lato', value: 'Lato' },
    { name: 'Poppins', value: 'Poppins' },
    { name: 'Nunito', value: 'Nunito' },
    { name: 'Oswald', value: 'Oswald' },
    { name: 'Raleway', value: 'Raleway' },
];

export const FONT_WEIGHT_OPTIONS: SelectOption[] = [
    { name: 'Light', value: '300' },
    { name: 'Normal', value: '400' },
    { name: 'Bold', value: '700' },
    { name: 'Black', value: '900' },
];

export const TEXT_ALIGN_OPTIONS: SelectOption[] = [
    { name: 'Balra', value: 'left'},
    { name: 'Középre', value: 'center'},
    { name: 'Jobbra', value: 'right'},
];

export const VERTICAL_ALIGN_OPTIONS: SelectOption[] = [
    { name: 'Fent', value: 'top'},
    { name: 'Középen', value: 'middle'},
    { name: 'Lent', value: 'bottom'},
];

export const EXPORT_FORMAT_OPTIONS: SelectOption[] = [
    { name: 'PNG', value: 'png' },
    { name: 'JPEG', value: 'jpeg' },
];