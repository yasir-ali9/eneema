import { Point, EditorNode } from '../../../core/types.ts';

/**
 * Checks if two rectangles (AABBs) overlap.
 */
const intersects = (
  r1x: number, r1y: number, r1w: number, r1h: number,
  r2x: number, r2y: number, r2w: number, r2h: number
): boolean => {
  return !(r2x > r1x + r1w || 
           r2x + r2w < r1x || 
           r2y > r1y + r1h ||
           r2y + r2h < r1y);
};

/**
 * Finds all nodes that touch or are inside the marquee rectangle.
 */
export const findNodesInMarquee = (
  start: Point,
  end: Point,
  nodes: EditorNode[]
): string[] => {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const w = Math.abs(start.x - end.x);
  const h = Math.abs(start.y - end.y);

  // Return IDs of all nodes whose bounding box intersects the marquee
  return nodes
    .filter(n => intersects(x, y, w, h, n.x, n.y, n.width, n.height))
    .map(n => n.id);
};