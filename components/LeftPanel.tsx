import React from 'react';
import { PLACEHOLDER_IMAGES } from '../constants';
import { Image as ImageIcon, Upload } from 'lucide-react';

interface LeftPanelProps {
  onImportImage: (src: string) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ onImportImage }) => {
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          onImportImage(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-64 bg-surface border-r border-surfaceHighlight flex flex-col h-full z-10">
      <div className="p-4 border-b border-surfaceHighlight">
        <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
          <ImageIcon size={18} />
          Assets
        </h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:bg-surfaceHighlight transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <p className="text-xs text-gray-400">Import Image</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
        </div>

        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Library</h3>
        <div className="grid grid-cols-2 gap-2">
          {PLACEHOLDER_IMAGES.map((src, index) => (
            <button
              key={index}
              onClick={() => onImportImage(src)}
              className="relative aspect-square rounded-md overflow-hidden hover:ring-2 hover:ring-primary focus:outline-none group"
            >
              <img src={src} alt={`Asset ${index}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeftPanel;