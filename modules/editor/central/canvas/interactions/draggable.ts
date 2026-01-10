import { EditorNode } from '../../../core/types.ts';

/**
 * Calculates a new position for a single node based on drag delta
 */
export const calculateDrag = (node: EditorNode, dx: number, dy: number, zoom: number): EditorNode => {
  return {
    ...node,
    x: node.x + dx / zoom,
    y: node.y + dy / zoom
  };
};

/**
 * Calculates new positions for a collection of nodes
 */
export const calculateMultiDrag = (nodes: EditorNode[], dx: number, dy: number, zoom: number): EditorNode[] => {
  return nodes.map(node => calculateDrag(node, dx, dy, zoom));
};