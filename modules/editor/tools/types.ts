import { EditorNode, Point, ToolMode } from '../core/types.ts';

/**
 * Context passed to every tool execution.
 * Provides access to the Editor's state and state modifiers.
 */
export interface ToolExecutionContext {
  nodes: EditorNode[];
  selectedNodeIds: string[];
  lassoPath: Point[];
  brushStrokes: Point[][];
  
  // State Mutators
  pushHistory: (snapshot: EditorNode[]) => void;
  // Single line comment: Updated signature to allow (prevNodes) => nextNodes updates.
  setNodes: (updater: EditorNode[] | ((prev: EditorNode[]) => EditorNode[])) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setLassoPath: (path: Point[]) => void;
  setBrushStrokes: (strokes: Point[][]) => void;
  setToolMode: (mode: ToolMode) => void;
}