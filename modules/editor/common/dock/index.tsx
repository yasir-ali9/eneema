import React from 'react';
import { ToolMode } from '../../core/types.ts';
import { MousePointer2, Lasso, Brush, Scissors, Hand, Undo2, Redo2, Stamp, Type } from 'lucide-react';
import { Button } from '../../../../components/button.tsx';

interface DockProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onDetach: () => void;
  onPlace: () => void;
  onEditText: () => void;
  isProcessing: boolean;
  hasSelection: boolean;
  hasActiveNode: boolean;
  hasTextBlocks: boolean;
  hasTextChanged: boolean;
  canPlace: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Dock Component
 * Updated with Text Editing capabilities and fixed Lucide icon import.
 */
const Dock: React.FC<DockProps> = ({ 
  toolMode, onSetToolMode, onDetach, onPlace, onEditText, isProcessing, 
  hasSelection, hasActiveNode, hasTextBlocks, hasTextChanged, canPlace, onUndo, onRedo, canUndo, canRedo 
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
          <Button 
            variant={toolMode === ToolMode.BRUSH ? 'primary' : 'ghost'} 
            size="icon" 
            onClick={() => onSetToolMode(ToolMode.BRUSH)}
            title="Brush Tool (B)"
          >
            <Brush size={18} />
          </Button>
        </div>

        {/* AI action execution group */}
        <div className="flex items-center gap-1 pl-1">
          {/* Contextual Text Edit Button */}
          {hasActiveNode && (
            <>
              <Button
                variant="accent"
                onClick={onEditText}
                disabled={isProcessing}
                loading={isProcessing && (hasTextBlocks ? hasTextChanged : true)}
                icon={<Type size={16} />}
                className="h-10 px-4 font-semibold tracking-tight"
                title={hasTextBlocks ? "Update image with new text" : "Extract text from image"}
              >
                {hasTextBlocks ? "Update Text" : "Edit Text"}
              </Button>
              <div className="w-px h-6 bg-bd-50 mx-1"></div>
            </>
          )}

          <Button 
            variant="accent" 
            onClick={onPlace} 
            disabled={!canPlace || isProcessing}
            loading={isProcessing && canPlace} 
            icon={<Stamp size={16} />}
            className="h-10 px-4 font-semibold tracking-tight"
            title="Place Object (Smart Blend)"
          >
            Place
          </Button>
          <div className="w-px h-6 bg-bd-50 mx-1"></div>
          <Button 
            variant="accent" 
            onClick={onDetach} 
            disabled={!hasActiveNode || !hasSelection || isProcessing}
            loading={isProcessing && hasSelection} 
            icon={<Scissors size={16} />}
            className="h-10 px-4 font-semibold tracking-tight"
          >
            Detach
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dock;