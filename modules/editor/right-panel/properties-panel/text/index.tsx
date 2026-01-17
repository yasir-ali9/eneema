import React from 'react';
import { EditorNode } from '../../../../core/types.ts';
import { DescriptiveInput } from '../../../../../components/input/descriptive.tsx';
import { ActionButton } from '../../../../../components/button/action.tsx';

interface TextSectionProps {
  node: EditorNode;
  onUpdate: (updates: Partial<EditorNode>) => void;
  onUpdateText: () => void;
  isProcessing: boolean;
  processingTool: string | null;
  hasTextChanged: boolean;
}

/**
 * TextSection Component
 * Renders editable fields for AI-extracted text layers.
 * Features an integrated "Update Text" button for immediate regeneration.
 */
export const TextSection: React.FC<TextSectionProps> = ({ 
  node, 
  onUpdate, 
  onUpdateText, 
  isProcessing, 
  processingTool, 
  hasTextChanged 
}) => {
  if (!node.textBlocks || node.textBlocks.length === 0) return null;

  // Single line comment: Updates local text block state before AI trigger
  const handleTextChange = (id: string, newText: string) => {
    const updatedBlocks = node.textBlocks!.map(b => 
      b.id === id ? { ...b, text: newText } : b
    );
    onUpdate({ textBlocks: updatedBlocks });
  };

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-bd-50">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-[10px] font-medium text-fg-70 tracking-wider">Text Content</h3>
      </div>
      
      <div className="space-y-3">
        {node.textBlocks.map((block) => (
          <div key={block.id} className="flex flex-col gap-1.5">
            <DescriptiveInput 
              value={block.text} 
              onChange={(val) => handleTextChange(block.id, val)}
              placeholder="Enter new text..."
              rows={1} // Single line comment: Start at 1 line for a cleaner look with short text.
            />
          </div>
        ))}
      </div>

      {/* Update Button - Appears when changes are detected */}
      {hasTextChanged && (
        <div className="pt-2">
          <ActionButton
            label="Update Text"
            onClick={onUpdateText}
            loading={processingTool === 'text'}
            disabled={isProcessing && processingTool !== 'text'}
            colSpan={3}
            title="Regenerate image with modified text"
            tooltipPosition="top"
            tooltipOffset={8}
          />
        </div>
      )}
    </div>
  );
};