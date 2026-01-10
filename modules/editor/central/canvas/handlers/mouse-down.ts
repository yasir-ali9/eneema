import { Point, ToolMode, EditorNode, HandleType, EditorAction } from '../../../core/types.ts';
import { findNodeAt } from '../interactions/selectable.ts';

/**
 * Determines what action to start when the mouse is pressed.
 * Logic updated to respect existing multi-selections.
 */
export const handleMouseDownAction = (
  worldPos: Point,
  toolMode: ToolMode,
  nodes: EditorNode[],
  selectedNodeIds: string[],
  activeHandle: HandleType | null,
  onSelectNode: (id: string | null) => void,
  onSetLassoPath: (path: Point[]) => void
): EditorAction => {
  // 1. Pan Tool override
  if (toolMode === ToolMode.PAN) return EditorAction.PANNING;

  // 2. Selection Mode logic
  if (toolMode === ToolMode.SELECT) {
    // If user clicked a resize handle
    if (activeHandle) return EditorAction.RESIZING;
    
    // Hit test against nodes
    const hitId = findNodeAt(worldPos, nodes);
    
    if (hitId) {
      // If clicking a node that ISN'T already selected, make it the only selection
      // If it IS already selected (part of a group), don't clear the others yet
      if (!selectedNodeIds.includes(hitId)) {
        onSelectNode(hitId);
      }
      return EditorAction.DRAGGING;
    } else {
      // Clicked on empty space: start marquee selection
      onSelectNode(null);
      return EditorAction.MARQUEE;
    }
  }
  
  // 3. Lasso Mode logic
  if (toolMode === ToolMode.LASSO) {
    onSetLassoPath([worldPos]);
    return EditorAction.LASSOING;
  }

  return EditorAction.IDLE;
};