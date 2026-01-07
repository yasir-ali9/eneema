import React from 'react';
import { ToolMode } from '../types';
import { MousePointer2, Lasso, Scissors, Wand2 } from 'lucide-react';
import { Spinner } from './Spinner';

interface DockProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  onDetach: () => void;
  isProcessing: boolean;
  hasSelection: boolean;
  hasActiveLayer: boolean;
}

const Dock: React.FC<DockProps> = ({ 
  toolMode, 
  onSetToolMode, 
  onDetach, 
  isProcessing,
  hasSelection,
  hasActiveLayer
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-2 py-2 bg-surfaceHighlight/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
        
        {/* Navigation / Selection Tools */}
        <div className="flex items-center gap-1 pr-2 border-r border-white/10">
          <button
            onClick={() => onSetToolMode(ToolMode.SELECT)}
            className={`p-3 rounded-xl transition-all ${
              toolMode === ToolMode.SELECT 
                ? 'bg-white text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Move Tool"
          >
            <MousePointer2 size={20} />
          </button>
          
          <button
            onClick={() => onSetToolMode(ToolMode.LASSO)}
            className={`p-3 rounded-xl transition-all ${
              toolMode === ToolMode.LASSO 
                ? 'bg-white text-black shadow-lg' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
            title="Lasso Selection"
          >
            <Lasso size={20} />
          </button>
        </div>

        {/* AI Actions */}
        <div className="flex items-center gap-1 pl-2">
           <button
            onClick={onDetach}
            disabled={!hasActiveLayer || !hasSelection || isProcessing}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all
              ${(!hasActiveLayer || !hasSelection) && !isProcessing ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-500' : ''}
              ${isProcessing ? 'bg-primary/80 text-white cursor-wait' : ''}
              ${hasActiveLayer && hasSelection && !isProcessing ? 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95' : ''}
            `}
          >
            {isProcessing ? (
                <>
                    <Spinner />
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <Scissors size={18} />
                    <span>Detach</span>
                </>
            )}
          </button>
        </div>
      </div>
      
      {/* Help Tooltip */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
         {toolMode === ToolMode.LASSO && !hasSelection && (
             <span className="text-xs text-white/70 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                 Draw around an object to select it
             </span>
         )}
         {hasSelection && hasActiveLayer && !isProcessing && (
             <span className="text-xs text-white/70 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                 Ready to Detach
             </span>
         )}
      </div>

    </div>
  );
};

export default Dock;