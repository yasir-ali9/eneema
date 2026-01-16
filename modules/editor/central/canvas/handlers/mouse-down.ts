import { Point, ToolMode, EditorNode, HandleType, EditorAction } from '../../../core/types.ts';
import { findNodeAt } from '../interactions/selectable.ts';

/**
 * Determines what action to start when the mouse is pressed.
 * Logic updated to auto-select nodes when using selection tools (Lasso/Brush) 
 * to ensure context-aware AI buttons appear immediately as the user interacts.
 */
export const handleMouseDownAction = (
  worldPos: Point,
  toolMode: ToolMode,
  nodes: EditorNode[],
  selectedNodeIds: string[],
  activeHandle: HandleType | null,
  onSelectNode: (id: string | null) => void,
  onSetLassoPath: (path: Point[]) => void,
  onSetBrushStrokes: (strokes: Point[][]) => void,
  currentStrokes: Point[][]
): EditorAction => {
  // 1. Pan Tool override: Priority for navigation
  if (toolMode === ToolMode.PAN) return EditorAction.PANNING;

  // 2. Selection Mode logic: Standard direct manipulation
  if (toolMode === ToolMode.SELECT) {
    if (activeHandle) return EditorAction.RESIZING;
    
    const hitId = findNodeAt(worldPos, nodes);
    if (hitId) {
      if (!selectedNodeIds.includes(hitId)) {
        onSelectNode(hitId);
      }
      return EditorAction.DRAGGING;
    } else {
      onSelectNode(null);
      return EditorAction.MARQUEE;
    }
  }
  
  // 3. Lasso Mode logic: Added auto-select behavior for convenience
  if (toolMode === ToolMode.LASSO) {
    // If starting a lasso on a node and no node is selected, auto-select it
    const hitId = findNodeAt(worldPos, nodes);
    if (hitId && !selectedNodeIds.includes(hitId)) {
      onSelectNode(hitId);
    }
    
    onSetLassoPath([worldPos]);
    return EditorAction.LASSOING;
  }

  // 4. Brush Mode logic: Added auto-select behavior for convenience
  if (toolMode === ToolMode.BRUSH) {
    // If starting a brush stroke on a node and no node is selected, auto-select it
    const hitId = findNodeAt(worldPos, nodes);
    if (hitId && !selectedNodeIds.includes(hitId)) {
      onSelectNode(hitId);
    }

    // Start a new stroke in the global strokes collection
    onSetBrushStrokes([...currentStrokes, [worldPos]]);
    return EditorAction.BRUSHING;
  }

  return EditorAction.IDLE;
};