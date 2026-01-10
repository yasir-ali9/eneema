import { EditorNode, Viewport, Point } from '../../core/types.ts';

/**
 * Pure function to render the entire canvas scene
 */
export const renderCanvas = (
  ctx: CanvasRenderingContext2D,
  nodes: EditorNode[],
  imageCache: Record<string, HTMLImageElement>,
  viewport: Viewport,
  lassoPath: Point[],
  marquee: { start: Point, end: Point } | null,
  showGrid: boolean = true
) => {
  const { width, height } = ctx.canvas;
  
  // Reset and clear
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);

  // Apply Camera (Zoom + Pan)
  ctx.translate(viewport.x, viewport.y);
  ctx.scale(viewport.zoom, viewport.zoom);

  // 1. Render Grid (Scales with zoom, optional)
  if (showGrid) {
    const gridSize = 50;
    ctx.beginPath();
    ctx.strokeStyle = `rgba(140, 140, 140, ${Math.min(0.12, viewport.zoom * 0.1)})`;
    ctx.lineWidth = 1 / viewport.zoom;
    
    const startX = Math.floor(-viewport.x / viewport.zoom / gridSize) * gridSize;
    const startY = Math.floor(-viewport.y / viewport.zoom / gridSize) * gridSize;
    const endX = startX + width / viewport.zoom + gridSize;
    const endY = startY + height / viewport.zoom + gridSize;

    for (let x = startX; x < endX; x += gridSize) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
    for (let y = startY; y < endY; y += gridSize) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
    ctx.stroke();
  }

  // 2. Render Nodes
  nodes.forEach(node => {
    const img = imageCache[node.src];
    if (img) {
      ctx.save();
      ctx.translate(node.x + node.width / 2, node.y + node.height / 2);
      ctx.rotate((node.rotation * Math.PI) / 180);
      ctx.translate(-node.width / 2, -node.height / 2);
      ctx.globalAlpha = node.opacity;
      ctx.drawImage(img, 0, 0, node.width, node.height);
      ctx.restore();
    }
  });

  // 3. Render Lasso Path
  if (lassoPath.length > 1) {
    ctx.beginPath();
    ctx.moveTo(lassoPath[0].x, lassoPath[0].y);
    lassoPath.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.fillStyle = 'rgba(36, 96, 183, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#2460b7';
    ctx.lineWidth = 1.5 / viewport.zoom;
    ctx.setLineDash([4 / viewport.zoom, 4 / viewport.zoom]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 4. Render Marquee Rect
  if (marquee) {
    const x = Math.min(marquee.start.x, marquee.end.x);
    const y = Math.min(marquee.start.y, marquee.end.y);
    const w = Math.abs(marquee.start.x - marquee.end.x);
    const h = Math.abs(marquee.start.y - marquee.end.y);

    ctx.fillStyle = 'rgba(36, 96, 183, 0.1)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#2460b7';
    ctx.lineWidth = 1 / viewport.zoom;
    ctx.strokeRect(x, y, w, h);
  }
};