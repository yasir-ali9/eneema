import React from 'react';
import { Scissors, Stamp, Type, Eraser } from 'lucide-react';
import { ActionButton } from '../../../../../components/button/action.tsx';

interface InstantToolsProps {
  onDetach: () => void;
  onPlace: () => void;
  onRemoveBg: () => void;
  onEditText: () => void;
  isProcessing: boolean;
  processingTool: 'detach' | 'place' | 'text' | 'remove-bg' | null;
  hasSelection: boolean;
  hasActiveNode: boolean;
  hasTextBlocks: boolean;
  hasTextChanged: boolean;
  canPlace: boolean;
}

/**
 * InstantTools Section
 * Centralizes AI action buttons in the Properties Panel.
 */
export const InstantTools: React.FC<InstantToolsProps> = ({
  onDetach,
  onPlace,
  onRemoveBg,
  onEditText,
  isProcessing,
  processingTool,
  hasSelection,
  hasActiveNode,
  hasTextBlocks,
  hasTextChanged,
  canPlace
}) => {
  if (!hasActiveNode) return null;

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-bd-50">
      <div className="flex items-center justify-between">
        {/* Header font weight changed from bold to medium */}
        <h3 className="text-[10px] font-medium text-fg-70 tracking-wider">Instant Tools</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Row 1: Detach and Text AI */}
        <ActionButton
          label="Detach"
          icon={<Scissors size={14} />}
          onClick={onDetach}
          disabled={!hasSelection || (isProcessing && processingTool !== 'detach')}
          loading={processingTool === 'detach'}
          colSpan={1}
          title="Extract selected object from background"
        />

        <ActionButton
          label={hasTextBlocks ? (hasTextChanged ? "Update Text" : "Refresh Text") : "Edit Text"}
          icon={<Type size={14} />}
          onClick={onEditText}
          loading={processingTool === 'text'}
          disabled={isProcessing && processingTool !== 'text'}
          colSpan={2}
          title={hasTextBlocks ? "Regenerate image with modified text" : "Scan and extract text layers"}
        />

        {/* Row 2: Placement and Remove BG AI */}
        <ActionButton
          label="Place"
          icon={<Stamp size={14} />}
          onClick={onPlace}
          disabled={!canPlace || (isProcessing && processingTool !== 'place')}
          loading={processingTool === 'place'}
          colSpan={1}
          title="Seamlessly blend foreground into overlapping background"
        />

        <ActionButton
          label="Remove BG"
          icon={<Eraser size={14} />}
          onClick={onRemoveBg}
          disabled={isProcessing && processingTool !== 'remove-bg'}
          loading={processingTool === 'remove-bg'}
          colSpan={2}
          title="AI-powered background removal"
        />
      </div>
    </div>
  );
};