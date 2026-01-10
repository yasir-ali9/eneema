import React from 'react';
import { EditorNode, Viewport, HandleType } from '../../../core/types.ts';

interface SelectionOverlayProps {
  selectedNodes: EditorNode[];
  viewport: Viewport;
  onResizeStart: (handle: HandleType, e: React.MouseEvent) => void;
}

/**
 * SelectionOverlay Component
 * Renders a bounding box. If multiple nodes are selected, it encompasses all of them.
 */
export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ selectedNodes, viewport, onResizeStart }) => {
  if (selectedNodes.length === 0) return null;

  // Calculate the collective bounding box of all selected nodes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  selectedNodes.forEach(node => {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });

  const width = maxX - minX;
  const height = maxY - minY;

  const { zoom, x: ox, y: oy } = viewport;

  // Convert world coordinates to screen space
  const screenX = minX * zoom + ox;
  const screenY = minY * zoom + oy;
  const screenW = width * zoom;
  const screenH = height * zoom;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: screenX,
    top: screenY,
    width: screenW,
    height: screenH,
    pointerEvents: 'none',
    border: '1.5px solid rgb(var(--ac-01))',
    boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
    zIndex: 30,
  };

  const getCursor = (h: HandleType): string => {
    switch (h) {
      case 'nw': case 'se': return 'nwse-resize';
      case 'ne': case 'sw': return 'nesw-resize';
      case 'n': case 's': return 'ns-resize';
      case 'e': case 'w': return 'ew-resize';
      default: return 'default';
    }
  };

  const cornerHandles: HandleType[] = ['nw', 'ne', 'se', 'sw'];
  const edgeHandles: HandleType[] = ['n', 's', 'e', 'w'];

  // Only show handles if exactly one node is selected (simplified for now)
  // or if we want to support group resizing later.
  const showHandles = selectedNodes.length === 1;

  return (
    <div style={containerStyle}>
      {showHandles && edgeHandles.map(h => (
        <div
          key={h}
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart(h, e); }}
          className="absolute pointer-events-auto"
          style={{
            cursor: getCursor(h),
            top: h === 'n' ? -4 : h === 's' ? '100%' : 0,
            bottom: h === 'n' ? '100%' : h === 's' ? -4 : 0,
            left: h === 'w' ? -4 : h === 'e' ? '100%' : 0,
            right: h === 'w' ? '100%' : h === 'e' ? -4 : 0,
            height: (h === 'n' || h === 's') ? 8 : '100%',
            width: (h === 'e' || h === 'w') ? 8 : '100%',
            marginTop: h === 's' ? -4 : 0,
            marginLeft: h === 'e' ? -4 : 0,
          }}
        />
      ))}

      {showHandles && cornerHandles.map(h => (
        <div
          key={h}
          onMouseDown={(e) => { e.stopPropagation(); onResizeStart(h, e); }}
          className="absolute w-2.5 h-2.5 bg-fg-30 border-2 border-ac-01 rounded-full pointer-events-auto shadow-md transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            cursor: getCursor(h),
            left: h.includes('w') ? '0%' : '100%',
            top: h.includes('n') ? '0%' : '100%',
          }}
        />
      ))}
      
      {/* Visual indication for multi-selection: show individual bounds lightly inside the main box */}
      {!showHandles && selectedNodes.map(node => (
        <div 
          key={node.id}
          className="absolute border border-ac-01/30"
          style={{
            left: (node.x - minX) * zoom,
            top: (node.y - minY) * zoom,
            width: node.width * zoom,
            height: node.height * zoom,
          }}
        />
      ))}
    </div>
  );
};