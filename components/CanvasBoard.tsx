import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Layer, Point, ToolMode } from '../types';

interface CanvasBoardProps {
  layers: Layer[];
  toolMode: ToolMode;
  selectedLayerIds: string[];
  lassoPath: Point[];
  onSetLassoPath: (path: Point[]) => void;
  onUpdateLayer: (layer: Layer) => void;
  onSelectLayer: (id: string | null) => void;
  // Expose the canvas element or context method for export
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;
}

const CanvasBoard: React.FC<CanvasBoardProps> = ({
  layers,
  toolMode,
  selectedLayerIds,
  lassoPath,
  onSetLassoPath,
  onUpdateLayer,
  onSelectLayer,
  setCanvasRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  
  // Track images to avoid flickering re-loads
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});

  // Sync ref to parent
  useEffect(() => {
    setCanvasRef(canvasRef.current);
  }, [setCanvasRef]);

  // Load images into cache
  useEffect(() => {
    layers.forEach(layer => {
      if (!imageCache[layer.src]) {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = layer.src;
        img.onload = () => {
            setImageCache(prev => ({ ...prev, [layer.src]: img }));
        };
      }
    });
  }, [layers, imageCache]);

  // Main Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Background
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Dot Pattern
    ctx.fillStyle = '#27272a';
    const spacing = 40;
    for(let x=0; x<canvas.width; x+=spacing) {
        for(let y=0; y<canvas.height; y+=spacing) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // Draw Layers
    layers.forEach(layer => {
      const img = imageCache[layer.src];
      if (img) {
        ctx.save();
        ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-layer.width / 2, -layer.height / 2);
        
        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(img, 0, 0, layer.width, layer.height);
        
        // Selection Highlight
        if (selectedLayerIds.includes(layer.id)) {
            ctx.strokeStyle = '#818cf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, layer.width, layer.height);
            
            // Corner handles
            ctx.fillStyle = '#fff';
            ctx.fillRect(-4, -4, 8, 8);
            ctx.fillRect(layer.width-4, -4, 8, 8);
            ctx.fillRect(layer.width-4, layer.height-4, 8, 8);
            ctx.fillRect(-4, layer.height-4, 8, 8);
        }
        
        ctx.restore();
      }
    });

    // Draw Lasso Selection Overlay
    if (lassoPath.length > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(lassoPath[0].x, lassoPath[0].y);
        for(let i=1; i<lassoPath.length; i++) {
            ctx.lineTo(lassoPath[i].x, lassoPath[i].y);
        }
        ctx.closePath();
        
        // Fill semi-transparent
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fill();
        
        // Stroke border
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();
    }

  }, [layers, imageCache, selectedLayerIds, lassoPath]);

  // Resize observer for canvas
  useEffect(() => {
      const resize = () => {
          if (containerRef.current && canvasRef.current) {
              canvasRef.current.width = containerRef.current.clientWidth;
              canvasRef.current.height = containerRef.current.clientHeight;
              render();
          }
      };
      window.addEventListener('resize', resize);
      resize();
      return () => window.removeEventListener('resize', resize);
  }, [render]);

  useEffect(() => {
    render();
  }, [render]);


  // Event Handlers
  const getMousePos = (e: React.MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setIsDragging(true);
    setDragStart(pos);

    if (toolMode === ToolMode.SELECT) {
        // Hit detection (reverse order to get top layer)
        let clickedLayerId: string | null = null;
        for (let i = layers.length - 1; i >= 0; i--) {
            const l = layers[i];
            // Simple rect hit test (ignores rotation for MVP simplicity)
            if (pos.x >= l.x && pos.x <= l.x + l.width &&
                pos.y >= l.y && pos.y <= l.y + l.height) {
                clickedLayerId = l.id;
                break;
            }
        }
        onSelectLayer(clickedLayerId);
    } else if (toolMode === ToolMode.LASSO) {
        onSetLassoPath([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging) return;
      const pos = getMousePos(e);

      if (toolMode === ToolMode.SELECT) {
          if (selectedLayerIds.length > 0) {
              const activeLayer = layers.find(l => l.id === selectedLayerIds[0]);
              if (activeLayer) {
                  const dx = pos.x - dragStart.x;
                  const dy = pos.y - dragStart.y;
                  
                  onUpdateLayer({
                      ...activeLayer,
                      x: activeLayer.x + dx,
                      y: activeLayer.y + dy
                  });
                  setDragStart(pos);
              }
          }
      } else if (toolMode === ToolMode.LASSO) {
          onSetLassoPath([...lassoPath, pos]);
      }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // If lasso, we keep the path until explicit clear or tool change usually, 
    // but here we keep it for the "Detach" action.
    if (toolMode === ToolMode.LASSO && lassoPath.length > 2) {
        // Close the loop visually (optional, just ensuring last point connects to first in logic)
    }
  };

  return (
    <div ref={containerRef} className="flex-1 bg-background relative overflow-hidden cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="block touch-none"
      />
    </div>
  );
};

export default CanvasBoard;