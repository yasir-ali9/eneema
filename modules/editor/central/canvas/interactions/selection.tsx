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
 * Updated to draw borders OUTSIDE the content boundaries to prevent visual overlap or clipping errors.
 * Fixed multi-select visual thickness by aligning inner/outer borders.
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
  
  // We expand the box by the border width so the border sits *outside* the image pixels.
  const MAIN_BORDER_WIDTH = 1.3; 
  const INNER_BORDER_WIDTH = 1.3;

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: screenX - MAIN_BORDER_WIDTH,
    top: screenY - MAIN_BORDER_WIDTH,
    width: screenW + (MAIN_BORDER_WIDTH * 2),
    height: screenH + (MAIN_BORDER_WIDTH * 2),
    pointerEvents: 'none',
    border: `${MAIN_BORDER_WIDTH}px solid rgb(var(--ac-01))`,
    boxSizing: 'border-box',
    // Removed boxShadow to match inner stroke style and thickness
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
            // Position handles relative to the border box
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
      
      {/* Visual indication for multi-selection: show individual bounds strictly matching or surrounding the nodes */}
      {!showHandles && selectedNodes.map(node => (
        <div 
          key={node.id}
          className="absolute"
          style={{
            // Position relative to the main container's padding box (which starts at minX/minY)
            // We subtract INNER_BORDER_WIDTH so the inner border sits *outside* the node content.
            // If the node is at the edge (node.x == minX), left becomes -INNER_BORDER_WIDTH.
            // This aligns the inner border ([-1.3, 0]) exactly with the container border ([-1.3, 0]), preventing double thickness.
            left: (node.x - minX) * zoom - INNER_BORDER_WIDTH,
            top: (node.y - minY) * zoom - INNER_BORDER_WIDTH,
            width: node.width * zoom + (INNER_BORDER_WIDTH * 2),
            height: node.height * zoom + (INNER_BORDER_WIDTH * 2),
            border: `${INNER_BORDER_WIDTH}px solid rgb(var(--ac-01))`,
            boxSizing: 'border-box'
          }}
        />
      ))}
    </div>
  );
};
