export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Layer {
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

export enum ToolMode {
  SELECT = 'SELECT', // Selection/Transform tool
  LASSO = 'LASSO',   // Freehand selection for operations
  PAN = 'PAN',       // Pan the canvas
}

export interface EditorState {
  layers: Layer[];
  selectedLayerIds: string[];
  canvasScale: number;
  canvasOffset: Point;
  toolMode: ToolMode;
  lassoPath: Point[]; // Points for the current lasso selection
}

export interface ProcessedImageResult {
    background: string | null; // Base64 of background (inpainted)
    object: string | null;     // Base64 of detached object
}