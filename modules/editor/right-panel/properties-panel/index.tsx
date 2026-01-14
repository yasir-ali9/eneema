import React from 'react';
import { EditorNode } from '../../core/types.ts';
import { LayoutSection } from './layout/index.tsx';

interface PropertiesPanelProps {
  selectedNodes: EditorNode[];
  onUpdateNodes: (nodes: EditorNode[]) => void;
  onPushHistory: () => void;
}

/**
 * PropertiesPanel Component
 * Displays and edits properties of the selected node(s).
 */
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedNodes, 
  onUpdateNodes,
  onPushHistory 
}) => {
  // If nothing is selected, we show nothing (handled by parent or empty state here)
  if (selectedNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] uppercase text-fg-70 tracking-tighter">
        No Object Selected
      </div>
    );
  }

  // We currently focus on the primary selected node for value editing
  const activeNode = selectedNodes[0];

  const handleNodeUpdate = (changes: Partial<EditorNode>) => {
    // 1. Commit current state to history before applying changes
    onPushHistory();

    // 2. Apply changes to all selected nodes (supporting multi-edit)
    const updatedNodes = selectedNodes.map(node => ({
      ...node,
      ...changes
    }));

    onUpdateNodes(updatedNodes);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bk-50">
      <LayoutSection node={activeNode} onUpdate={handleNodeUpdate} />
      {/* Additional sections (Effects, AI, etc.) can be added here */}
    </div>
  );
};

export default PropertiesPanel;
