import { Viewport, Point } from '../../../core/types.ts';

/**
 * Calculates new viewport after a zoom operation centered on a mouse point
 */
export const handleWheelZoom = (
  e: WheelEvent,
  viewport: Viewport,
  containerRect: DOMRect
): Viewport => {
  const zoomSpeed = 0.001;
  const delta = -e.deltaY;
  const scaleChange = Math.exp(delta * zoomSpeed);
  const newZoom = Math.min(Math.max(viewport.zoom * scaleChange, 0.05), 20);

  // Mouse position relative to container
  const mouseX = e.clientX - containerRect.left;
  const mouseY = e.clientY - containerRect.top;

  // Preserve world coordinate under mouse
  const worldX = (mouseX - viewport.x) / viewport.zoom;
  const worldY = (mouseY - viewport.y) / viewport.zoom;

  return {
    zoom: newZoom,
    x: mouseX - worldX * newZoom,
    y: mouseY - worldY * newZoom,
  };
};

/**
 * Handle simple pan offset updates
 */
export const applyPan = (viewport: Viewport, dx: number, dy: number): Viewport => ({
  ...viewport,
  x: viewport.x + dx,
  y: viewport.y + dy,
});