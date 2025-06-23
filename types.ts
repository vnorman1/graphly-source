export type LayerType = 'text' | 'logo' | 'image';
export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'middle' | 'bottom'; // Added for more comprehensive text control
export type LogoCornerPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type BackgroundType = 'solid' | 'gradient' | 'image';
export type GradientType = 'linear' | 'radial';
export type ExportFormat = 'png' | 'jpeg'; // New

export interface Identifiable {
  id: string;
}

export interface LayerBase extends Identifiable {
  type: LayerType;
  name: string;
  zIndex: number;
  isVisible: boolean;
  opacity: number; // 0-1
  x: number;
  y: number;
  rotation: number; // degrees
  isLocked?: boolean; // For future use
}

export interface TextShadowState {
  enabled: boolean;
  color: string;
  offsetX: number;
  offsetY: number;
  blurRadius: number;
}

export interface TextLayer extends LayerBase {
  type: 'text';
  content: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  textColor: string;
  letterSpacing: number;
  lineHeightMultiplier: number;
  textAlign: TextAlign;
  verticalAlign: VerticalAlign; // Added
  width?: number; // Optional: for fixed width text box, otherwise auto
  textShadow: TextShadowState;
  italic?: boolean;
  underline?: boolean;
}

export interface LogoLayer extends LayerBase {
  type: 'logo';
  src: string | null;
  size: number; // width of the logo, height derived from aspect ratio
  // For corner positioning if not freely moved by x,y from LayerBase
  cornerPosition: LogoCornerPosition; 
  isFreelyPositioned: boolean; // if true, x,y from LayerBase are used directly
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  src: string;
  width: number;
  height: number;
  originalAspectRatio: number; // To maintain aspect ratio during resize
  borderRadius: number; // in pixels
  shadow: TextShadowState; // Re-using TextShadowState for simplicity
  // Filters could be added here later, similar to bgImageFilters
}

export type Layer = TextLayer | LogoLayer | ImageLayer;

export interface GradientState {
  type: GradientType;
  color1: string;
  color2: string;
  angle: number; // For linear gradient
}

export interface ImageFilters {
  blur: number;
  brightness: number;
  contrast: number;
}

export interface OverlayState {
  color: string;
  opacity: number;
}

export interface AppState {
  // Canvas Background Settings (distinct from layers)
  backgroundType: BackgroundType;
  bgColor: string;
  gradient: GradientState;
  bgImage: string | null; // Data URL for canvas background image
  bgImageFilters: ImageFilters;
  overlay: OverlayState; // Applied over canvas background

  // Layers
  layers: Layer[];
  selectedLayerId: string | null;

  // Global settings / modes
  canvasWidth: number;
  canvasHeight: number;
  exportFormat: ExportFormat; // New
  jpegQuality: number; // New (0.7-1.0)
  includeTransparency: boolean; // New (for PNG)
}

export interface BrandKitState {
  color1: string;
  color2: string;
}

export interface Template {
  name: string;
  state: AppState; // Saved state will include layers
}

// UI Component Props (existing ones might need slight adjustments if they interact with layers)

export interface ControlPanelSectionProps {
  title: string;
  isOpenDefault?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface InputLabelProps {
  htmlFor?: string;
  text: string;
  valueDisplay?: string;
  className?: string;
}

export interface ColorPickerInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface RangeInputProps {
  id: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  valueSuffix?: string;
  valueDisplay?: string; // Added optional valueDisplay
  disabled?: boolean;
}

export interface FileUploadInputProps {
  id: string;
  label?: string; // Made optional
  buttonText: string;
  accept?: string;
  onChange: (file: File) => void;
  className?: string;
  disabled?: boolean;
}

export interface IconButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void; // Updated to accept event
  title: string;
  isActive?: boolean; // Made optional as not all icon buttons have an active state
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export interface IconProps {
  className?: string;
  viewBox?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  strokeLinecap?: CanvasLineCap;
}

export interface TwitterPreviewCardProps {
  imageUrl: string | null;
  headlineContent: string; // Changed from headline to reflect it's content
}

export interface FacebookPreviewCardProps {
  imageUrl: string | null;
  headlineContent: string; // Changed from headline
  siteName: string;
}

export interface MiniPreviewCanvasProps {
  imageUrl: string | null;
  aspectRatio: number;
  className?: string;
}

export interface SelectOption {
  name: string;
  value: string;
}
export interface SelectInputProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export interface CheckboxInputProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

export interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
  icon?: React.ReactNode;
}
export interface SegmentedControlProps<T extends string> {
  label?: string;
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  name: string;
  disabled?: boolean;
}

export interface LayerItemProps {
    layer: Layer;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onDelete: (id: string) => void;
    onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export interface LayerSpecificSettingsProps {
    selectedLayer: Layer | null | undefined;
    onUpdateLayer: (id: string, updates: Partial<TextLayer> | Partial<LogoLayer> | Partial<ImageLayer>) => void; // Made more specific
    onUpdateTextShadow: <K extends keyof TextShadowState>(id: string, key: K, value: TextShadowState[K]) => void;
    brandKit: BrandKitState;
    onApplyBrandColorToLayer: (layerId: string, property: string, colorKey: keyof BrandKitState) => void;
    canvasWidth: number;
    canvasHeight: number;
}