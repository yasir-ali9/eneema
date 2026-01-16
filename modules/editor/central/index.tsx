import React from 'react';
import CanvasBoard from './canvas/index.tsx';
import Dock from '../common/dock/index.tsx';
import { EditorNode, ToolMode, Point } from '../core/types.ts';

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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * CentralArea Component
 * Wraps the canvas and floating dock tools.
 */
const CentralArea: React.FC<CentralAreaProps> = (props) => {
  return (
    <div className="flex-1 flex flex-col relative">
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
      />
      
      <Dock 
        toolMode={props.toolMode} 
        onSetToolMode={props.setToolMode} 
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        canUndo={props.canUndo}
        canRedo={props.canRedo}
      />
    </div>
  );
};

export default CentralArea;