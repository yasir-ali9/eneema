import React from 'react';
import PropertiesPanel from './properties-panel/index.tsx';
import { EditorNode } from '../core/types.ts';
import { Settings2 } from 'lucide-react';

interface RightPanelProps {
  nodes: EditorNode[];
  selectedNodeIds: string[];
  onUpdateNodes: (nodes: EditorNode[]) => void;
  onPushHistory: () => void;
  // AI Actions
  onDetach: () => void;
  onPlace: () => void;
  onRemoveBg: () => void;
  onEditText: () => void;
  isProcessing: boolean;
  processingTool: 'detach' | 'place' | 'text' | 'remove-bg' | null;
  hasSelection: boolean;
  hasTextBlocks: boolean;
  hasTextChanged: boolean;
  canPlace: boolean;
}

/**
 * RightPanel Component
 * Container for the Properties Panel.
 */
const RightPanel: React.FC<RightPanelProps> = ({ 
  nodes, 
  selectedNodeIds, 
  onUpdateNodes,
  onPushHistory,
  onDetach,
  onPlace,
  onRemoveBg,
  onEditText,
  isProcessing,
  processingTool,
  hasSelection,
  hasTextBlocks,
  hasTextChanged,
  canPlace
}) => {
  // derive selected nodes objects from IDs
  const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));

  return (
    <div className="w-72 bg-bk-50 border-l border-bd-50 flex flex-col h-full z-20">
      {/* Header title weight changed from bold to medium */}
      <div className="flex items-center gap-2 p-4 border-b border-bd-50 text-[10px] font-medium tracking-widest text-fg-70">
        <Settings2 size={12} /> Properties
      </div>
      
      <PropertiesPanel 
        selectedNodes={selectedNodes} 
        onUpdateNodes={onUpdateNodes}
        onPushHistory={onPushHistory}
        onDetach={onDetach}
        onPlace={onPlace}
        onRemoveBg={onRemoveBg}
        onEditText={onEditText}
        isProcessing={isProcessing}
        processingTool={processingTool}
        hasSelection={hasSelection}
        hasTextBlocks={hasTextBlocks}
        hasTextChanged={hasTextChanged}
        canPlace={canPlace}
      />
    </div>
  );
};

export default RightPanel;