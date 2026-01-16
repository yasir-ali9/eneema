import React from 'react';
import { ToolMode } from '../../core/types.ts';
import { MousePointer2, Lasso, Brush, Hand, Undo2, Redo2 } from 'lucide-react';
import { Button } from '../../../../components/button/default.tsx';

interface VerticalDockProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number; // Single line comment: Zoom level passed from the core viewport state.
}

/**
 * VerticalDock Component
 * Persistent sidebar for core tools and history, providing a stable target for common actions.
 */
const VerticalDock: React.FC<VerticalDockProps> = ({ 
  toolMode, onSetToolMode, onUndo, onRedo, canUndo, canRedo, zoom 
}) => {
  return (
    <div className="w-12 h-full bg-bk-50 border-r border-bd-50 flex flex-col items-center py-4 justify-between z-30">
      
      {/* Primary Tool Selection Group (Top) */}
      <div className="flex flex-col items-center gap-2">
        <Button 
          variant={toolMode === ToolMode.SELECT ? 'primary' : 'ghost'} 
          size="icon" 
          className="w-9 h-9"
          onClick={() => onSetToolMode(ToolMode.SELECT)}
          title="Move Tool (V)"
        >
          <MousePointer2 size={18} />
        </Button>
        <Button 
          variant={toolMode === ToolMode.PAN ? 'primary' : 'ghost'} 
          size="icon" 
          className="w-9 h-9"
          onClick={() => onSetToolMode(ToolMode.PAN)}
          title="Hand Tool (H)"
        >
          <Hand size={18} />
        </Button>

        {/* Divider between Move/Hand and Selection tools */}
        <div className="w-6 h-[1px] bg-bd-50 my-1" />

        <Button 
          variant={toolMode === ToolMode.LASSO ? 'primary' : 'ghost'} 
          size="icon" 
          className="w-9 h-9"
          onClick={() => onSetToolMode(ToolMode.LASSO)}
          title="Lasso Tool (L)"
        >
          <Lasso size={18} />
        </Button>
        <Button 
          variant={toolMode === ToolMode.BRUSH ? 'primary' : 'ghost'} 
          size="icon" 
          className="w-9 h-9"
          onClick={() => onSetToolMode(ToolMode.BRUSH)}
          title="Brush Tool (B)"
        >
          <Brush size={18} />
        </Button>
      </div>

      {/* Navigation and Zoom Info (Bottom) */}
      <div className="flex flex-col items-center gap-2">
        {/* History Navigation Group */}
        <div className="flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-9 h-9"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </Button>
        </div>

        {/* Divider above zoom level */}
        <div className="w-6 h-[1px] bg-bd-50 my-1" />

        {/* Zoom Level Indicator - Styled to match UI icons without borders and in Inter font */}
        <div className="text-[10px] font-sans text-fg-60 px-1 py-1 select-none">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
};

export default VerticalDock;