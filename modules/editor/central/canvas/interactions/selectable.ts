import { EditorNode, Point, Viewport } from '../../../core/types.ts';

/**
 * Logic to find which node is under the mouse
 */
export const findNodeAt = (pos: Point, nodes: EditorNode[]): string | null => {
  // Check from top to bottom (reverse nodes array)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    // Basic AABB check for now (can be expanded to OBB for rotation)
    if (pos.x >= n.x && pos.x <= n.x + n.width && pos.y >= n.y && pos.y <= n.y + n.height) {
      return n.id;
    }
  }
  return null;
};