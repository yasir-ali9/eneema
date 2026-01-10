import React from 'react';
import MediaPanel from './media-panel/index.tsx';
import LayersPanel from './layers-panel/index.tsx';
import Header from './header/index.tsx';
import { EditorNode } from '../core/types.ts';

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
}

/**
 * LeftPanel Component
 * Organizes header, media library, and layer stack.
 */
const LeftPanel: React.FC<LeftPanelProps> = (props) => {
  return (
    <div className="w-72 bg-bk-50 border-r border-bd-50 flex flex-col h-full z-20">
      {/* Branding and project management header */}
      <Header 
        projectName={props.projectName} 
        onProjectNameChange={props.onProjectNameChange} 
        showGrid={props.showGrid}
        onToggleGrid={props.onToggleGrid}
      />
      
      {/* Media gallery for adding new nodes */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <MediaPanel onImportImage={props.onImportImage} />
        {/* Visual representation of nodes as layers for the user */}
        <LayersPanel 
          nodes={props.nodes} 
          selectedNodeIds={props.selectedNodeIds} 
          onSelectNode={props.onSelectNode} 
          onDeleteNode={props.onDeleteNode} 
        />
      </div>
    </div>
  );
};

export default LeftPanel;