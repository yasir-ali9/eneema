import { EditorNode, Point, ToolMode } from '../core/types.ts';

/**
 * Context passed to every tool execution.
 * Provides access to the Editor's state and state modifiers.
 */
export interface ToolExecutionContext {
  nodes: EditorNode[];
  selectedNodeIds: string[];
  lassoPath: Point[];
  
  // State Mutators
  pushHistory: (snapshot: EditorNode[]) => void;
  setNodes: (nodes: EditorNode[]) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setLassoPath: (path: Point[]) => void;
  setToolMode: (mode: ToolMode) => void;
}
