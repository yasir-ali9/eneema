
// 2D coordinate system
export interface Point {
  x: number;
  y: number;
}

// Viewport state for canvas navigation
export interface Viewport {
  x: number; // pan offset x
  y: number; // pan offset y
  zoom: number; // scale factor
}

// Visual node definition
export interface EditorNode {
  id: string;
  type: 'image';
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  name: string;
}

// Editor interaction modes (Tool selection)
export enum ToolMode {
  SELECT = 'SELECT',
  LASSO = 'LASSO',
  BRUSH = 'BRUSH',
  PAN = 'PAN',
}

// Active interaction state (Action tracking)
export enum EditorAction {
  IDLE = 'IDLE',
  PANNING = 'PANNING',
  DRAGGING = 'DRAGGING',
  RESIZING = 'RESIZING',
  LASSOING = 'LASSOING',
  BRUSHING = 'BRUSHING',
  MARQUEE = 'MARQUEE',
}

// Resize handles positions
export type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

// Result structure for AI extraction
export interface ProcessedImageResult {
    background: string | null;
    object: string | null;
    label: string;
}
