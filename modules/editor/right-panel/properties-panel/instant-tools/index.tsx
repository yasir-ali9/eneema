import React from 'react';
import { Scissors, Stamp, SquareMinus, Eraser } from 'lucide-react';
import { ActionButton } from '../../../../../components/button/action.tsx';

interface InstantToolsProps {
  onDetach: () => void;
  onPlace: () => void;
  onRemoveBg: () => void;
  onErase: () => void;
  isProcessing: boolean;
  processingTool: 'detach' | 'place' | 'text' | 'remove-bg' | 'erase' | null;
  hasSelection: boolean;
  hasActiveNode: boolean;
  canPlace: boolean;
}

/**
 * InstantTools Section
 * Centralizes primary AI action buttons in a compact, organized grid.
 */
export const InstantTools: React.FC<InstantToolsProps> = ({
  onDetach,
  onPlace,
  onRemoveBg,
  onErase,
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
        {/* Single line comment: Header restored to title case per user request. */}
        <h3 className="text-[10px] font-medium text-fg-70 tracking-wider">Instant Tools</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Row 1: Detach, Place, and Erase (Order updated to Detach -> Place -> Erase) */}
        <ActionButton
          label="Detach"
          icon={<Scissors size={13} />}
          onClick={onDetach}
          disabled={!hasSelection || isHardLocked}
          loading={processingTool === 'detach'}
          colSpan={1}
          title="Extract selected object from background"
        />

        <ActionButton
          label="Place"
          icon={<Stamp size={13} />}
          onClick={onPlace}
          disabled={!canPlace || isHardLocked}
          loading={processingTool === 'place'}
          colSpan={1}
          title="Seamlessly blend foreground into overlapping background"
        />

        <ActionButton
          label="Erase"
          icon={<Eraser size={13} />}
          onClick={onErase}
          disabled={!hasSelection || isHardLocked}
          loading={processingTool === 'erase'}
          colSpan={1}
          title="Generative erase selected area using AI"
        />

        {/* Row 2: Remove BG AI (Full width for emphasis) */}
        <ActionButton
          label="Remove Background"
          icon={<SquareMinus size={13} />}
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