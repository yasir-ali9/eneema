import React from 'react';
import { ToolMode } from '../../core/types.ts';
import { MousePointer2, Lasso, Scissors, Hand, Undo2, Redo2 } from 'lucide-react';
import { Button } from '../../../../components/button.tsx';

interface DockProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onDetach: () => void;
  isProcessing: boolean;
  hasSelection: boolean;
  hasActiveNode: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Dock Component
 * Updated with History controls and Move, Hand, Lasso tools.
 */
const Dock: React.FC<DockProps> = ({ 
  toolMode, onSetToolMode, onDetach, isProcessing, 
  hasSelection, hasActiveNode, onUndo, onRedo, canUndo, canRedo 
}) => {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-2 py-2 bg-bk-40/90 backdrop-blur-xl border border-bd-60 rounded-2xl shadow-2xl">
        
        {/* History tools (Undo/Redo) */}
        <div className="flex items-center gap-1 pr-2 border-r border-bd-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </Button>
        </div>

        {/* Interaction tools selector */}
        <div className="flex items-center gap-1 pr-2 border-r border-bd-50">
          <Button 
            variant={toolMode === ToolMode.SELECT ? 'primary' : 'ghost'} 
            size="icon" 
            onClick={() => onSetToolMode(ToolMode.SELECT)}
            title="Move Tool (V)"
          >
            <MousePointer2 size={18} />
          </Button>
          <Button 
            variant={toolMode === ToolMode.PAN ? 'primary' : 'ghost'} 
            size="icon" 
            onClick={() => onSetToolMode(ToolMode.PAN)}
            title="Hand Tool (H)"
          >
            <Hand size={18} />
          </Button>
          <Button 
            variant={toolMode === ToolMode.LASSO ? 'primary' : 'ghost'} 
            size="icon" 
            onClick={() => onSetToolMode(ToolMode.LASSO)}
            title="Lasso Tool (L)"
          >
            <Lasso size={18} />
          </Button>
        </div>

        {/* AI action execution group */}
        <div className="flex items-center gap-1 pl-1">
          <Button 
            variant="accent" 
            onClick={onDetach} 
            disabled={!hasActiveNode || !hasSelection || isProcessing}
            loading={isProcessing}
            icon={<Scissors size={16} />}
            className="h-10 px-6 font-semibold tracking-tight"
          >
            Detach
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dock;
