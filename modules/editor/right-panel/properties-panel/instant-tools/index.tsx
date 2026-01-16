import React from 'react';
import { Scissors, Stamp, Eraser } from 'lucide-react';
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
 * Centralizes primary AI action buttons.
 * Single line comment: Modified logic to ensure background 'text' processing doesn't block or hide other tools.
 */
export const InstantTools: React.FC<InstantToolsProps> = ({
  onDetach,
  onPlace,
  onRemoveBg,
  isProcessing,
  processingTool,
  hasSelection,
  hasActiveNode,
  canPlace
}) => {
  if (!hasActiveNode) return null;

  // Single line comment: Background text scan shouldn't hard-lock the whole properties panel.
  const isHardLocked = isProcessing && processingTool !== 'text';

  return (
    <div className="flex flex-col gap-3 p-4 border-b border-bd-50">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-medium text-fg-70 tracking-wider">Instant Tools</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Row 1: Detach and Place AI */}
        <ActionButton
          label="Detach"
          icon={<Scissors size={14} />}
          onClick={onDetach}
          // Single line comment: Only disable if currently detaching or another heavy tool is active.
          disabled={!hasSelection || isHardLocked}
          loading={processingTool === 'detach'}
          colSpan={1}
          title="Extract selected object from background"
        />

        <ActionButton
          label="Place"
          icon={<Stamp size={14} />}
          onClick={onPlace}
          disabled={!canPlace || isHardLocked}
          loading={processingTool === 'place'}
          colSpan={2}
          title="Seamlessly blend foreground into overlapping background"
        />

        {/* Row 2: Remove BG AI */}
        <ActionButton
          label="Remove Background"
          icon={<Eraser size={14} />}
          onClick={onRemoveBg}
          disabled={isHardLocked}
          loading={processingTool === 'remove-bg'}
          colSpan={3}
          title="AI-powered background removal"
        />
      </div>
    </div>
  );
};