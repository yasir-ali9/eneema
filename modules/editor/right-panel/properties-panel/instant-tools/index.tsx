import React from 'react';
import { Scissors, Stamp, SquareMinus, Eraser, Zap } from 'lucide-react';
import { ActionButton } from '../../../../../components/button/action.tsx';

interface InstantToolsProps {
  onDetach: () => void;
  onPlace: () => void;
  onRemoveBg: () => void;
  onErase: () => void;
  onUpscale: () => void; // Single line comment: Callback for upscale action.
  isProcessing: boolean;
  processingTool: 'detach' | 'place' | 'text' | 'remove-bg' | 'erase' | 'upscale' | null;
  hasSelection: boolean;
  hasActiveNode: boolean;
  canPlace: boolean;
}

/**
 * InstantTools Section
 * Centralizes primary AI action buttons in a compact, organized 3x2 grid.
 * Single line comment: Spans and gaps are synchronized with the Layout section for consistent aesthetics.
 */
export const InstantTools: React.FC<InstantToolsProps> = ({
  onDetach,
  onPlace,
  onRemoveBg,
  onErase,
  onUpscale,
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
        {/* Row 1: Detach, Place, and Erase (1+1+1) */}
        <ActionButton
          label="Detach"
          icon={<Scissors size={13} />}
          onClick={onDetach}
          disabled={!hasSelection || isHardLocked}
          loading={processingTool === 'detach'}
          colSpan={1}
          title="Extract selected object"
          tooltipPosition="top"
          tooltipOffset={8}
        />

        <ActionButton
          label="Place"
          icon={<Stamp size={13} />}
          onClick={onPlace}
          disabled={!canPlace || isHardLocked}
          loading={processingTool === 'place'}
          colSpan={1}
          title="Blend foreground"
          tooltipPosition="top"
          tooltipOffset={8}
        />

        <ActionButton
          label="Erase"
          icon={<Eraser size={13} />}
          onClick={onErase}
          disabled={!hasSelection || isHardLocked}
          loading={processingTool === 'erase'}
          colSpan={1}
          title="Generative erase"
          tooltipPosition="top"
          tooltipOffset={8}
        />

        {/* Row 2: Remove BG AI (2) & Upscale (1) - Completes the 3x2 inspired grid */}
        <ActionButton
          label="Remove Background"
          icon={<SquareMinus size={13} />}
          onClick={onRemoveBg}
          disabled={isHardLocked}
          loading={processingTool === 'remove-bg'}
          colSpan={2}
          title="AI Background Removal"
          tooltipPosition="top"
          tooltipOffset={8}
        />

        <ActionButton
          label="Upscale"
          icon={<Zap size={13} />}
          onClick={onUpscale}
          disabled={isHardLocked}
          loading={processingTool === 'upscale'}
          colSpan={1}
          title="Enhance resolution to 4K"
          tooltipPosition="top"
          tooltipOffset={8}
        />
      </div>
    </div>
  );
};