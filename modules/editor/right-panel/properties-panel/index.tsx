import React from 'react';
import { EditorNode } from '../../core/types.ts';
import { LayoutSection } from './layout/index.tsx';
import { TextSection } from './text/index.tsx';
import { InstantTools } from './instant-tools/index.tsx';

interface PropertiesPanelProps {
  selectedNodes: EditorNode[];
  onUpdateNodes: (nodes: EditorNode[]) => void;
  onPushHistory: () => void;
  // AI Tool Actions
  onDetach: () => void;
  onPlace: () => void;
  onEditText: () => void;
  isProcessing: boolean;
  processingTool: 'detach' | 'place' | 'text' | null;
  hasSelection: boolean;
  hasTextBlocks: boolean;
  hasTextChanged: boolean;
  canPlace: boolean;
}

/**
 * PropertiesPanel Component
 * Displays and edits properties of the selected node(s).
 * Now includes "Instant Tools" for AI-powered actions.
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedNodes, 
  onUpdateNodes,
  onPushHistory,
  onDetach,
  onPlace,
  onEditText,
  isProcessing,
  processingTool,
  hasSelection,
  hasTextBlocks,
  hasTextChanged,
  canPlace
}) => {
  // If nothing is selected, we show nothing
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
    // 1. Commit current state to history before applying changes (only for layout/transform)
    if (Object.keys(changes).some(k => ['x','y','width','height','rotation','opacity'].includes(k))) {
       onPushHistory();
    }

    // 2. Apply changes to all selected nodes (supporting multi-edit)
    const updatedNodes = selectedNodes.map(node => ({
      ...node,
      ...changes
    }));

    onUpdateNodes(updatedNodes);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bk-50">
      {/* AI Actions at the top for high visibility */}
      <InstantTools 
        onDetach={onDetach}
        onPlace={onPlace}
        onEditText={onEditText}
        isProcessing={isProcessing}
        processingTool={processingTool}
        hasSelection={hasSelection}
        hasActiveNode={true}
        hasTextBlocks={hasTextBlocks}
        hasTextChanged={hasTextChanged}
        canPlace={canPlace}
      />

      {/* Transformation and Layout controls */}
      <LayoutSection node={activeNode} onUpdate={handleNodeUpdate} />
      
      {/* Dynamic text blocks extracted by AI */}
      <TextSection node={activeNode} onUpdate={handleNodeUpdate} />
    </div>
  );
};

export default PropertiesPanel;