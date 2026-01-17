import React from 'react';
import { EditorNode } from '../../core/types.ts';
import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/button/default.tsx';
import { Tooltip } from '../../../../components/tooltip.tsx';

interface LayersPanelProps {
  nodes: EditorNode[];
  selectedNodeIds: string[];
  onSelectNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
}

/**
 * LayersPanel Component
 * Presents canvas nodes as a vertical stack of layers for user management.
 */
const LayersPanel: React.FC<LayersPanelProps> = ({ nodes, selectedNodeIds, onSelectNode, onDeleteNode }) => {
  return (
    <div className="h-1/2 flex flex-col p-4">
      {/* Panel Header - Simplified title without icon and uppercase styling */}
      <div className="text-[11px] font-medium text-fg-70 mb-4">
        Layers
      </div>
      
      {/* List of nodes rendered as manageable layer items */}
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {nodes.slice().reverse().map((node) => {
          const isSelected = selectedNodeIds.includes(node.id);
          return (
            <div 
              key={node.id} 
              onClick={() => onSelectNode(node.id)} 
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all group border border-bd-50 ${
                isSelected 
                  ? 'bg-bk-50 shadow-md ring-1 ring-ac-01/20' 
                  : 'bg-transparent hover:bg-bk-50/50'
              }`}
            >
              {/* Node preview thumbnail */}
              <div className="w-10 h-10 bg-bk-70 rounded-md flex-shrink-0 overflow-hidden border border-bd-50 flex items-center justify-center">
                <img src={node.src} className="w-full h-full object-contain" alt="thumb" />
              </div>
              
              {/* Node metadata display */}
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] truncate font-semibold ${isSelected ? 'text-fg-30' : 'text-fg-60'}`}>
                  {node.name}
                </p>
                <p className="text-[9px] text-fg-70 capitalize tracking-tighter">Node ({node.type})</p>
              </div>
              
              {/* Delete action for the node - Upgraded to Tooltip */}
              <Tooltip content="Delete Layer" position="top">
                <Button 
                  variant="danger" 
                  size="icon" 
                  className="opacity-0 group-hover:opacity-100 h-7 w-7 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }}
                >
                  <Trash2 size={12} />
                </Button>
              </Tooltip>
            </div>
          );
        })}
        
        {/* State when no nodes are on the canvas */}
        {nodes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-30">
            <div className="text-[9px] text-fg-70 uppercase tracking-[0.2em]">
              Empty Stack
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayersPanel;