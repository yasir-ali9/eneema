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
  onRemoveBg: () => void;
  onErase: () => void;
  onUpscale: () => void; // Single line comment: New upscale action.
  onEditText: () => void;
  isProcessing: boolean;
  processingTool: 'detach' | 'place' | 'text' | 'remove-bg' | 'erase' | 'upscale' | null;
  hasSelection: boolean;
  hasTextBlocks: boolean;
  hasTextChanged: boolean;
  canPlace: boolean;
}

/**
 * PropertiesPanel Component
 * Displays and edits properties of the selected node(s).
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  selectedNodes, 
  onUpdateNodes,
  onPushHistory,
  onDetach,
  onPlace,
  onRemoveBg,
  onErase,
  onUpscale,
  onEditText,
  isProcessing,
  processingTool,
  hasSelection,
  hasTextBlocks,
  hasTextChanged,
  canPlace
}) => {
  // If nothing is selected, we show a placeholder message
  if (selectedNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] uppercase text-fg-70 tracking-tighter">
        No Object Selected
      </div>
    );
  }

  // We currently focus on the primary selected node for value editing
  const activeNode = selectedNodes[0];

  // Helper to synchronize updates across all selected nodes
  const handleNodeUpdate = (changes: Partial<EditorNode>) => {
    // Commit current state to history before applying changes (only for layout/transform properties)
    if (Object.keys(changes).some(k => ['x','y','width','height','rotation','opacity'].includes(k))) {
       onPushHistory();
    }

    // Apply changes to all selected nodes (supporting multi-edit functionality)
    const updatedNodes = selectedNodes.map(node => ({
      ...node,
      ...changes
    }));

    onUpdateNodes(updatedNodes);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-bk-50">
      {/* Transformation and Layout controls */}
      <LayoutSection node={activeNode} onUpdate={handleNodeUpdate} />

      {/* AI Actions */}
      <InstantTools 
        onDetach={onDetach}
        onPlace={onPlace}
        onRemoveBg={onRemoveBg}
        onErase={onErase}
        onUpscale={onUpscale}
        // Removed onEditText, hasTextBlocks, and hasTextChanged as they are not used in InstantTools
        isProcessing={isProcessing}
        processingTool={processingTool}
        hasSelection={hasSelection}
        hasActiveNode={true}
        canPlace={canPlace}
      />
      
      {/* Dynamic text blocks extracted by AI */}
      <TextSection 
        node={activeNode} 
        onUpdate={handleNodeUpdate} 
        onUpdateText={onEditText}
        isProcessing={isProcessing}
        processingTool={processingTool}
        hasTextChanged={hasTextChanged}
      />
    </div>
  );
};

export default PropertiesPanel;