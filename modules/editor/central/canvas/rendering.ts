import { EditorNode, Viewport, Point } from '../../core/types.ts';

/**
 * Pure function to render the entire canvas scene
 * Added processingNodeId and shimmerOffset to support visual feedback during AI tasks.
 */
export const renderCanvas = (
  ctx: CanvasRenderingContext2D,
  nodes: EditorNode[],
  imageCache: Record<string, HTMLImageElement>,
  viewport: Viewport,
  lassoPath: Point[],
  brushStrokes: Point[][],
  marquee: { start: Point, end: Point } | null,
  showGrid: boolean = true,
  offscreenCanvas: HTMLCanvasElement | null = null,
  processingNodeId: string | null = null,
  shimmerOffset: number = 0
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

  // 2. Render Nodes (Images)
  nodes.forEach(node => {
    const img = imageCache[node.src];
    if (img) {
      ctx.save();
      
      // Move to center of node for rotation
      ctx.translate(node.x + node.width / 2, node.y + node.height / 2);
      ctx.rotate((node.rotation * Math.PI) / 180);
      // Move back to top-left relative to rotation center
      ctx.translate(-node.width / 2, -node.height / 2);
      
      ctx.globalAlpha = node.opacity;

      // Clip content to the node box
      ctx.beginPath();
      ctx.rect(0, 0, node.width, node.height);
      ctx.clip();

      // Calculate aspect ratios for "Object Fit: Cover"
      const imgRatio = img.width / img.height;
      const nodeRatio = node.width / node.height;
      
      let drawW, drawH, offsetX, offsetY;
      if (nodeRatio > imgRatio) {
        drawW = node.width;
        drawH = node.width / imgRatio;
        offsetX = 0;
        offsetY = (node.height - drawH) / 2;
      } else {
        drawH = node.height;
        drawW = node.height * imgRatio;
        offsetY = 0;
        offsetX = (node.width - drawW) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      // Shimmer Overlay logic for nodes currently being processed by AI
      if (node.id === processingNodeId) {
        ctx.save();
        // Single line comment: Creates a diagonal shimmer gradient that moves based on the animation offset.
        const shimmerGrad = ctx.createLinearGradient(
          -node.width + (shimmerOffset * node.width * 3), 
          0, 
          shimmerOffset * node.width * 3, 
          node.height
        );
        shimmerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        shimmerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        shimmerGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = shimmerGrad;
        ctx.globalCompositeOperation = 'source-atop'; // Only draw shimmer over the image pixels
        ctx.fillRect(0, 0, node.width, node.height);
        ctx.restore();
      }
      
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

  // 4. Render Brush Strokes
  if (brushStrokes.length > 0) {
    const buffer = offscreenCanvas || document.createElement('canvas');
    if (!offscreenCanvas) {
        buffer.width = width;
        buffer.height = height;
    }
    const offCtx = buffer.getContext('2d');
    if (offCtx) {
        offCtx.setTransform(1, 0, 0, 1, 0, 0);
        offCtx.clearRect(0, 0, buffer.width, buffer.height);
        offCtx.translate(viewport.x, viewport.y);
        offCtx.scale(viewport.zoom, viewport.zoom);
        offCtx.lineCap = 'round';
        offCtx.lineJoin = 'round';
        offCtx.lineWidth = 30;
        offCtx.strokeStyle = '#2460b7';
        brushStrokes.forEach(stroke => {
          if (stroke.length < 1) return;
          offCtx.beginPath();
          offCtx.moveTo(stroke[0].x, stroke[0].y);
          stroke.forEach(p => offCtx.lineTo(p.x, p.y));
          offCtx.stroke();
        });
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 0.5;
        ctx.drawImage(buffer, 0, 0);
        ctx.restore();
    }
  }

  // 5. Render Marquee Rect
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