import React from 'react';
import { EditorNode } from '../../../../core/types.ts';
import { DescriptiveInput } from '../../../../../components/input/descriptive.tsx';
import { Type } from 'lucide-react';

interface TextSectionProps {
  node: EditorNode;
  onUpdate: (updates: Partial<EditorNode>) => void;
}

/**
 * TextSection Component
 * Renders editable fields for AI-extracted text layers.
 */
export const TextSection: React.FC<TextSectionProps> = ({ node, onUpdate }) => {
  if (!node.textBlocks || node.textBlocks.length === 0) return null;

  const handleTextChange = (id: string, newText: string) => {
    const updatedBlocks = node.textBlocks!.map(b => 
      b.id === id ? { ...b, text: newText } : b
    );
    onUpdate({ textBlocks: updatedBlocks });
  };

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-bd-50">
      <div className="flex items-center gap-2 mb-1">
        <Type size={12} className="text-fg-70" />
        <h3 className="text-[10px] font-bold text-fg-70 uppercase tracking-wider">Text Content</h3>
      </div>
      
      <div className="space-y-3">
        {node.textBlocks.map((block) => (
          <div key={block.id} className="flex flex-col gap-1.5">
            <DescriptiveInput 
              value={block.text} 
              onChange={(val) => handleTextChange(block.id, val)}
              placeholder="Enter new text..."
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );
};