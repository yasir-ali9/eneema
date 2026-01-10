import { EditorNode, HandleType } from '../../../core/types.ts';

/**
 * Calculates new node dimensions based on handle deltas.
 * Optimized for performance and smooth interaction.
 */
export const calculateResize = (
  node: EditorNode,
  handle: HandleType,
  dx: number,
  dy: number,
  zoom: number
): EditorNode => {
  // Translate screen delta to world delta
  const dw = dx / zoom;
  const dh = dy / zoom;
  
  // Create a copy to maintain immutability
  const next = { ...node };

  // Horizontal resizing (East/West)
  if (handle.includes('e')) {
    next.width = Math.max(10, node.width + dw);
  }
  if (handle.includes('w')) {
    const newWidth = Math.max(10, node.width - dw);
    // Adjust position only if width changed to avoid "shaking"
    if (newWidth !== node.width) {
      next.x = node.x + (node.width - newWidth);
      next.width = newWidth;
    }
  }

  // Vertical resizing (North/South)
  if (handle.includes('s')) {
    next.height = Math.max(10, node.height + dh);
  }
  if (handle.includes('n')) {
    const newHeight = Math.max(10, node.height - dh);
    // Adjust position only if height changed
    if (newHeight !== node.height) {
      next.y = node.y + (node.height - newHeight);
      next.height = newHeight;
    }
  }

  return next;
};