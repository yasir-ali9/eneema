import { Point, Viewport, EditorNode, HandleType, ToolMode, EditorAction } from '../../../core/types.ts';
import { calculateDrag, calculateResize } from '../interactions/index.ts';

/**
 * Processes movement deltas and updates state accordingly.
 */
export const handleMouseMoveAction = (
  worldPos: Point,
  dx: number,
  dy: number,
  currentAction: EditorAction,
  viewport: Viewport,
  selectedNodes: EditorNode[],
  activeHandle: HandleType | null,
  lassoPath: Point[],
  brushStrokes: Point[][],
  onUpdateNodes: (nodes: EditorNode[]) => void,
  onSetLassoPath: (path: Point[]) => void,
  onSetBrushStrokes: (strokes: Point[][]) => void,
  onUpdateViewport: (dx: number, dy: number) => void,
  onUpdateMarquee: (pos: Point) => void
) => {
  // Skip logic if no movement occurred
  if (dx === 0 && dy === 0) return;

  switch (currentAction) {
    case EditorAction.PANNING:
      onUpdateViewport(dx, dy);
      break;

    case EditorAction.DRAGGING:
      // Move all selected nodes relative to delta
      if (selectedNodes.length > 0) {
        const updated = selectedNodes.map(node => calculateDrag(node, dx, dy, viewport.zoom));
        onUpdateNodes(updated);
      }
      break;

    case EditorAction.RESIZING:
      // Resizing typically only affects a single node or a group bounding box
      // For now, we maintain single-node resizing for the primary selection
      if (selectedNodes.length === 1 && activeHandle) {
        onUpdateNodes([calculateResize(selectedNodes[0], activeHandle, dx, dy, viewport.zoom)]);
      }
      break;

    case EditorAction.LASSOING:
      onSetLassoPath([...lassoPath, worldPos]);
      break;
      
    case EditorAction.BRUSHING:
      if (brushStrokes.length > 0) {
        const strokes = [...brushStrokes];
        const currentStroke = strokes[strokes.length - 1];
        // Add point to current stroke
        strokes[strokes.length - 1] = [...currentStroke, worldPos];
        onSetBrushStrokes(strokes);
      }
      break;

    case EditorAction.MARQUEE:
      onUpdateMarquee(worldPos);
      break;

    default:
      break;
  }
};
