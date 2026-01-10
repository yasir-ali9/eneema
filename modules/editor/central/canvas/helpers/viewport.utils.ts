import { Point, Viewport } from '../../../core/types.ts';

/**
 * Maps screen coordinates (mouse position) to world coordinates (canvas space)
 */
export const screenToWorld = (p: Point, viewport: Viewport): Point => ({
  x: (p.x - viewport.x) / viewport.zoom,
  y: (p.y - viewport.y) / viewport.zoom
});

/**
 * Maps world coordinates back to screen coordinates
 */
export const worldToScreen = (p: Point, viewport: Viewport): Point => ({
  x: p.x * viewport.zoom + viewport.x,
  y: p.y * viewport.zoom + viewport.y
});