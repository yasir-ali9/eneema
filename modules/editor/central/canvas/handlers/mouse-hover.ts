import { Point, EditorNode, ToolMode, HandleType, EditorAction } from '../../../core/types.ts';
import { findNodeAt } from '../interactions/selectable.ts';

/**
 * Returns the appropriate cursor string for the current canvas state.
 * Reverts move cursor to 'default' as per user preference for node interaction.
 */
export const getCursorForHover = (
  worldPos: Point,
  nodes: EditorNode[],
  toolMode: ToolMode,
  currentAction: EditorAction,
  activeHandle: HandleType | null,
  hasSelection: boolean
): string => {
  // 1. Resizing cursors take top priority (directional arrows for edges/corners)
  if (currentAction === EditorAction.RESIZING && activeHandle) {
    if (['nw', 'se'].includes(activeHandle)) return 'nwse-resize';
    if (['ne', 'sw'].includes(activeHandle)) return 'nesw-resize';
    if (['n', 's'].includes(activeHandle)) return 'ns-resize';
    if (['e', 'w'].includes(activeHandle)) return 'ew-resize';
  }

  // 2. Dragging state - Use default cursor
  if (currentAction === EditorAction.DRAGGING) {
    return 'default';
  }

  // 3. Tool-specific cursors
  if (toolMode === ToolMode.PAN) {
    return currentAction === EditorAction.PANNING ? 'grabbing' : 'grab';
  }
  
  if (toolMode === ToolMode.LASSO) {
    return 'crosshair';
  }
  
  if (toolMode === ToolMode.BRUSH) {
    return 'crosshair'; // Or we could use a custom brush cursor later
  }

  // 4. Default Select mode hover detection
  if (toolMode === ToolMode.SELECT) {
    const hitId = findNodeAt(worldPos, nodes);
    // Even if hovering a node, keep the normal default cursor
    if (hitId) return 'default';
  }

  return 'default';
};
