import React from 'react';
import PropertiesPanel from './properties-panel/index.tsx';
import { EditorNode } from '../core/types.ts';
import { Settings2 } from 'lucide-react';

interface RightPanelProps {
  nodes: EditorNode[];
  selectedNodeIds: string[];
  onUpdateNodes: (nodes: EditorNode[]) => void;
  onPushHistory: () => void;
}

/**
 * RightPanel Component
 * Container for the Properties Panel.
 */
const RightPanel: React.FC<RightPanelProps> = ({ 
  nodes, 
  selectedNodeIds, 
  onUpdateNodes,
  onPushHistory
}) => {
  // derive selected nodes objects from IDs
  const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));

  return (
    <div className="w-72 bg-bk-50 border-l border-bd-50 flex flex-col h-full z-20">
      <div className="flex items-center gap-2 p-4 border-b border-bd-50 text-[10px] font-bold uppercase tracking-widest text-fg-70">
        <Settings2 size={12} /> Properties
      </div>
      
      <PropertiesPanel 
        selectedNodes={selectedNodes} 
        onUpdateNodes={onUpdateNodes}
        onPushHistory={onPushHistory}
      />
    </div>
  );
};

export default RightPanel;
