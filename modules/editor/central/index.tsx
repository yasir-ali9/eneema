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
  onSetNodes: (updater: EditorNode[] | ((prev: EditorNode[]) => EditorNode[])) => void; // Single line comment: Raw state setter for operations that add/remove nodes.
  onPushHistory: (snapshot: EditorNode[]) => void;
  onDeleteNode: (id: string) => void;
  onDuplicateNodes: () => void;
  isProcessing: boolean;
  processingNodeId: string | null;
  setProcessingNodeId: (id: string | null) => void; // Single line comment: New prop for passing down processing state setter.
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;
  showGrid: boolean;
  viewport: Viewport;
  onUpdateViewport: (viewport: Viewport | ((prev: Viewport) => Viewport)) => void;
}

/**
 * CentralArea Component
 * Orchestrates the canvas and the AI-integrated functional Dock.
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
        viewport={props.viewport}
        onSetViewport={props.onUpdateViewport}
      />
      
      {/* Unified AI Command Dock - Fixed setNodes prop to use the raw setter instead of the partial updater */}
      <Dock 
        nodes={props.nodes}
        selectedNodeIds={props.selectedNodeIds}
        pushHistory={props.onPushHistory}
        setNodes={props.onSetNodes}
        setSelectedNodeIds={props.setSelectedNodeIds}
        setLassoPath={props.setLassoPath}
        setBrushStrokes={props.setBrushStrokes}
        setToolMode={props.setToolMode}
        setProcessingNodeId={props.setProcessingNodeId}
      />
    </div>
  );
};

export default CentralArea;