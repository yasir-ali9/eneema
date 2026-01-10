import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EditorNode, Point, ToolMode, Viewport, HandleType, EditorAction } from '../../core/types.ts';
import { handleWheelZoom, applyPan } from './handlers/zoom-pan.ts';
import { handleMouseDownAction } from './handlers/mouse-down.ts';
import { handleMouseMoveAction } from './handlers/mouse-move.ts';
import { getCursorForHover } from './handlers/mouse-hover.ts';
import { handleKeyboardShortcuts } from './handlers/keyboard.ts';
import { renderCanvas } from './rendering.ts';
import { screenToWorld } from './helpers/viewport.utils.ts';
import { SelectionOverlay } from './interactions/selection.tsx';
import { findNodesInMarquee } from './interactions/marquee.ts';

interface CanvasBoardProps {
  nodes: EditorNode[];
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  selectedNodeIds: string[];
  lassoPath: Point[];
  onSetLassoPath: (path: Point[]) => void;
  onUpdateNode: (node: EditorNode) => void;
  onUpdateNodes: (nodes: EditorNode[]) => void;
  onSelectNode: (id: string | null) => void;
  onSelectNodes: (ids: string[]) => void;
  onDeleteNode: (id: string) => void;
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;
  showGrid: boolean;
}

/**
 * CanvasBoard orchestrator.
 * Delegates all logic to modular handlers for maximum maintainability.
 */
const CanvasBoard: React.FC<CanvasBoardProps> = ({ 
  nodes, toolMode, setToolMode, selectedNodeIds, lassoPath, 
  onSetLassoPath, onUpdateNode, onUpdateNodes, onSelectNode, onSelectNodes, onDeleteNode, setCanvasRef, showGrid 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [currentAction, setCurrentAction] = useState<EditorAction>(EditorAction.IDLE);
  const [lastMousePos, setLastMousePos] = useState<Point>({ x: 0, y: 0 });
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const [imageCache, setImageCache] = useState<Record<string, HTMLImageElement>>({});

  // Marquee state
  const [marquee, setMarquee] = useState<{ start: Point, end: Point } | null>(null);

  useEffect(() => { setCanvasRef(canvasRef.current); }, [setCanvasRef]);

  // Preload and cache node assets
  useEffect(() => {
    nodes.forEach(n => {
      if (!imageCache[n.src]) {
        const img = new Image(); img.crossOrigin = "Anonymous"; img.src = n.src;
        img.onload = () => setImageCache(prev => ({ ...prev, [n.src]: img }));
      }
    });
  }, [nodes]);

  // Main Draw function
  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) renderCanvas(ctx, nodes, imageCache, viewport, lassoPath, marquee, showGrid);
  }, [nodes, imageCache, viewport, lassoPath, marquee, showGrid]);

  // Sync window resizing and global hotkeys
  useEffect(() => {
    const resize = () => { 
        if (containerRef.current && canvasRef.current) { 
            canvasRef.current.width = containerRef.current.clientWidth; 
            canvasRef.current.height = containerRef.current.clientHeight; 
            draw(); 
        } 
    };
    const onKey = (e: KeyboardEvent) => handleKeyboardShortcuts(e, setToolMode, () => {
        selectedNodeIds.forEach(onDeleteNode);
    });
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKey);
    resize();
    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKey);
    };
  }, [draw, setToolMode, selectedNodeIds, onDeleteNode]);

  useEffect(() => { draw(); }, [draw]);

  // Setup Wheel Zoom listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setViewport(v => handleWheelZoom(e, v, el.getBoundingClientRect()));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Global mouse up safety and marquee finalization
  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (currentAction === EditorAction.MARQUEE && marquee) {
        const selectedIds = findNodesInMarquee(marquee.start, marquee.end, nodes);
        onSelectNodes(selectedIds);
      }
      setCurrentAction(EditorAction.IDLE); 
      setActiveHandle(null);
      setMarquee(null);
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, [currentAction, marquee, nodes, onSelectNodes]);

  const getMouseInfo = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const worldPos = screenToWorld(pos, viewport);
    return { pos, worldPos };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const { pos, worldPos } = getMouseInfo(e);
    setLastMousePos(pos);
    const action = handleMouseDownAction(worldPos, toolMode, nodes, selectedNodeIds, activeHandle, onSelectNode, onSetLassoPath);
    if (action === EditorAction.MARQUEE) {
      setMarquee({ start: worldPos, end: worldPos });
    }
    setCurrentAction(action);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { pos, worldPos } = getMouseInfo(e);
    const dx = pos.x - lastMousePos.x;
    const dy = pos.y - lastMousePos.y;
    
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));

    handleMouseMoveAction(
        worldPos, dx, dy, currentAction, viewport, 
        selectedNodes,
        activeHandle, lassoPath, onUpdateNodes, onSetLassoPath,
        (pdx, pdy) => setViewport(v => applyPan(v, pdx, pdy)),
        (mPos) => setMarquee(prev => prev ? { ...prev, end: mPos } : null)
    );
    setLastMousePos(pos);
  };

  const cursorStyle = getCursorForHover(
    screenToWorld(lastMousePos, viewport), nodes, toolMode, currentAction, activeHandle, selectedNodeIds.length > 0
  );

  return (
    <div ref={containerRef} className="flex-1 bg-bk-60 relative overflow-hidden" style={{ cursor: cursorStyle }}>
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} className="block w-full h-full" />
      
      <SelectionOverlay 
        selectedNodes={nodes.filter(n => selectedNodeIds.includes(n.id))} 
        viewport={viewport}
        onResizeStart={(h) => { setActiveHandle(h); setCurrentAction(EditorAction.RESIZING); }}
      />

      <div className="absolute top-4 right-4 bg-bk-60/80 px-2 py-1 rounded text-[10px] text-fg-70 font-mono pointer-events-none border border-bd-50">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
};

export default CanvasBoard;