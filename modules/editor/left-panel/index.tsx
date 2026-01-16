import React from 'react';
import MediaPanel from './media-panel/index.tsx';
import LayersPanel from './layers-panel/index.tsx';
import Header from './header/index.tsx';
import VerticalDock from './vertical-dock/index.tsx';
import { EditorNode, ToolMode } from '../core/types.ts';

interface LeftPanelProps {
  nodes: EditorNode[];
  selectedNodeIds: string[];
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onImportImage: (src: string) => void;
  onSelectNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  // Dock Props
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number; // Single line comment: New zoom prop for the vertical dock display.
}

/**
 * LeftPanel Component
 * Houses the brand header, media assets, layer stack, and the new persistent tool dock.
 */
const LeftPanel: React.FC<LeftPanelProps> = (props) => {
  return (
    <div className="flex h-full z-20">
      {/* Content Side (Fixed width sidebar) */}
      <div className="w-72 bg-bk-50 border-r border-bd-50 flex flex-col h-full overflow-hidden">
        <Header 
          projectName={props.projectName} 
          onProjectNameChange={props.onProjectNameChange} 
          showGrid={props.showGrid}
          onToggleGrid={props.onToggleGrid}
        />
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <MediaPanel onImportImage={props.onImportImage} />
          <LayersPanel 
            nodes={props.nodes} 
            selectedNodeIds={props.selectedNodeIds} 
            onSelectNode={props.onSelectNode} 
            onDeleteNode={props.onDeleteNode} 
          />
        </div>
      </div>

      {/* New Vertical Dock - Stays visible even if sidebar collapses in future */}
      <VerticalDock 
        toolMode={props.toolMode}
        onSetToolMode={props.onSetToolMode}
        onUndo={props.onUndo}
        onRedo={props.onRedo}
        canUndo={props.canUndo}
        canRedo={props.canRedo}
        zoom={props.zoom} // Single line comment: Passing zoom down to the dock indicator.
      />
    </div>
  );
};

export default LeftPanel;