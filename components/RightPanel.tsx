import React from 'react';
import { Layer } from '../types';
import { Layers, Eye, Trash2 } from 'lucide-react';

interface RightPanelProps {
  layers: Layer[];
  selectedLayerIds: string[];
  onSelectLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  layers, 
  selectedLayerIds, 
  onSelectLayer,
  onDeleteLayer
}) => {
  return (
    <div className="w-64 bg-surface border-l border-surfaceHighlight flex flex-col h-full z-10">
      <div className="p-4 border-b border-surfaceHighlight">
        <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <Layers size={18} />
          Layers
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {layers.slice().reverse().map((layer) => {
          const isSelected = selectedLayerIds.includes(layer.id);
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`
                flex items-center gap-3 p-2 rounded-md mb-1 cursor-pointer transition-colors group
                ${isSelected ? 'bg-primary/20 border border-primary/50' : 'hover:bg-surfaceHighlight border border-transparent'}
              `}
            >
              <div className="w-10 h-10 bg-black/40 rounded overflow-hidden flex-shrink-0">
                <img src={layer.src} alt="thumbnail" className="w-full h-full object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {layer.name}
                </p>
                <p className="text-[10px] text-gray-600">
                  {Math.round(layer.width)} x {Math.round(layer.height)}
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
        {layers.length === 0 && (
            <div className="text-center mt-10 text-gray-600 text-xs">
                No active layers
            </div>
        )}
      </div>
    </div>
  );
};

export default RightPanel;