import React from 'react';
import CanvasBoard from './canvas/index.tsx';
import Dock from '../common/dock/index.tsx';
import { EditorNode, ToolMode, Point, Viewport } from '../core/types.ts';

interface CentralAreaProps {
  nodes: EditorNode[];
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  selectedNodeIds: string[];
  setSelectedNodeIds: (ids: string[]) => void;
  lassoPath: Point[];
  setLassoPath: (path: Point[]) => void;
  brushStrokes: Point[][];
  setBrushStrokes: (strokes: Point[][]) => void;
  onUpdateNodes: (nodes: EditorNode[]) => void;
  onPushHistory: (snapshot: EditorNode[]) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNodes: () => void;
  isProcessing: boolean;
  processingNodeId: string | null;
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;
  showGrid: boolean;
  viewport: Viewport; // Single line comment: Viewport received from core.
  onUpdateViewport: (viewport: Viewport | ((prev: Viewport) => Viewport)) => void; // Single line comment: Viewport update handler.
}

/**
 * CentralArea Component
 * Wraps the canvas workspace and the new AI-integrated dock.
 */
const CentralArea: React.FC<CentralAreaProps> = (props) => {
  return (
    <div className="flex-1 flex flex-col relative">
      {/* The main visual workspace */}
      <CanvasBoard 
        nodes={props.nodes} 
        toolMode={props.toolMode} 
        setToolMode={props.setToolMode}
        selectedNodeIds={props.selectedNodeIds} 
        lassoPath={props.lassoPath} 
        onSetLassoPath={props.setLassoPath} 
        brushStrokes={props.brushStrokes}
        onSetBrushStrokes={props.setBrushStrokes}
        onUpdateNodes={props.onUpdateNodes}
        onPushHistory={props.onPushHistory}
        onDeleteNode={props.onDeleteNode}
        onDuplicateNodes={props.onDuplicateNodes}
        onSelectNode={id => { 
          props.setSelectedNodeIds(id ? [id] : []); 
          if (props.toolMode === ToolMode.SELECT) {
             props.setLassoPath([]); 
             props.setBrushStrokes([]);
          }
        }} 
        onSelectNodes={ids => {
          props.setSelectedNodeIds(ids);
          if (props.toolMode === ToolMode.SELECT) {
             props.setLassoPath([]);
             props.setBrushStrokes([]);
          }
        }}
        setCanvasRef={props.setCanvasRef} 
        showGrid={props.showGrid}
        processingNodeId={props.processingNodeId}
        viewport={props.viewport} // Single line comment: Pass shared viewport to canvas.
        onSetViewport={props.onUpdateViewport} // Single line comment: Pass shared setter to canvas.
      />
      
      {/* Unified AI Command Dock */}
      <Dock />
    </div>
  );
};

export default CentralArea;