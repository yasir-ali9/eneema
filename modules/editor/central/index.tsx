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
  onUpdateNode: (node: EditorNode) => void;
  onUpdateNodes: (nodes: EditorNode[]) => void;
  onDeleteNode: (id: string) => void;
  isProcessing: boolean;
  onDetach: () => void;
  setCanvasRef: (ref: HTMLCanvasElement | null) => void;
  showGrid: boolean;
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
        onUpdateNode={props.onUpdateNode} 
        onUpdateNodes={props.onUpdateNodes}
        onDeleteNode={props.onDeleteNode}
        onSelectNode={id => { 
          props.setSelectedNodeIds(id ? [id] : []); 
          if (props.toolMode === ToolMode.SELECT) props.setLassoPath([]); 
        }} 
        onSelectNodes={ids => {
          props.setSelectedNodeIds(ids);
          if (props.toolMode === ToolMode.SELECT) props.setLassoPath([]);
        }}
        setCanvasRef={props.setCanvasRef} 
        showGrid={props.showGrid}
      />
      
      <Dock 
        toolMode={props.toolMode} 
        onSetToolMode={props.setToolMode} 
        onDetach={props.onDetach} 
        isProcessing={props.isProcessing} 
        hasSelection={props.lassoPath.length > 2} 
        hasActiveNode={props.selectedNodeIds.length > 0} 
      />
    </div>
  );
};

export default CentralArea;