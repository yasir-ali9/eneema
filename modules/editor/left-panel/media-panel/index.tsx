import React from 'react';
import { PLACEHOLDER_IMAGES } from '../../core/constants.ts';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface MediaPanelProps {
  onImportImage: (src: string) => void;
}

/**
 * MediaPanel Component
 * Uses the custom design variables for a sleek, functional sidebar area.
 */
const MediaPanel: React.FC<MediaPanelProps> = ({ onImportImage }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { if (typeof e.target?.result === 'string') onImportImage(e.target.result); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-1/2 flex flex-col p-4 border-b border-bd-50">
      <div className="text-[10px] font-bold uppercase tracking-widest text-fg-70 mb-4 flex items-center gap-2">
        <ImageIcon size={12} /> Media Library
      </div>
      
      {/* Upload Box using design variables */}
      <label className="flex flex-col items-center justify-center w-full h-24 border border-dashed border-bd-60 bg-bk-70/50 rounded-xl cursor-pointer hover:bg-bk-50 hover:border-ac-01 transition-all mb-4 group">
        <Upload className="w-5 h-5 text-fg-70 mb-1 group-hover:text-ac-01 transition-colors" />
        <p className="text-[10px] text-fg-70 font-medium group-hover:text-fg-40">Drop or Click</p>
        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
      </label>

      {/* Grid of placeholders */}
      <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-1">
        {PLACEHOLDER_IMAGES.map((src, i) => (
          <button 
            key={i} 
            onClick={() => onImportImage(src)} 
            className="relative aspect-square rounded-lg overflow-hidden border border-bd-50 hover:border-ac-01 group transition-all"
          >
            <img src={src} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="lib" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-ac-01/10 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default MediaPanel;