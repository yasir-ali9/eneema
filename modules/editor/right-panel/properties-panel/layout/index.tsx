import React from 'react';
import { EditorNode } from '../../../../core/types.ts';
import { PropertyInput } from '../../../../../components/input/property.tsx';

interface LayoutSectionProps {
  node: EditorNode;
  onUpdate: (updates: Partial<EditorNode>) => void;
}

interface IconProps {
  className?: string;
  size?: number;
}

// Custom Icons
const OpacityIcon: React.FC<IconProps> = ({ className = "", size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 14V12H17.61C17.85 12.71 18 13.39 18 14H16ZM15.58 8C15.12 7.29 14.65 6.61 14.2 6H14V8H15.58ZM16 12V10H14V12H16ZM16 8.68V10H16.74C16.5 9.56 16.26 9.11 16 8.68ZM12 16V14H14V12H12V10H14V8H12V6H14V5.73C12.9 4.26 12 3.25 12 3.25C12 3.25 6 10 6 14C6 17.31 8.69 20 12 20V18H14V16H12ZM14 19.65C14.75 19.39 15.42 19 16 18.46V18H14V19.65ZM14 16H16V14H14V16ZM16 18H16.46C17 17.42 17.39 16.75 17.65 16H16V18Z" fill="currentColor" />
  </svg>
);

const AngleIcon: React.FC<IconProps> = ({ className = "", size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M19.9998 19.0002H4.08984L14.1798 4.43018L15.8198 5.57018L11.2798 12.1302C12.8898 12.9602 13.9998 14.6202 13.9998 16.5402C13.9998 16.7002 13.9998 16.8502 13.9698 17.0002H19.9998V19.0002ZM7.90984 17.0002H11.9598C11.9998 16.8502 11.9998 16.7002 11.9998 16.5402C11.9998 15.2802 11.2398 14.2202 10.1398 13.7802L7.90984 17.0002Z" fill="currentColor" />
  </svg>
);

export const LayoutSection: React.FC<LayoutSectionProps> = ({ node, onUpdate }) => {
  return (
    <div className="flex flex-col gap-3 p-4 border-b border-bd-50">
      <div className="flex items-center justify-between">
        {/* Header font weight changed from bold to medium */}
        <h3 className="text-[10px] font-medium text-fg-70 tracking-wider">Layout</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Row 1: Position and Angle */}
        <PropertyInput 
            label="X" 
            value={node.x} 
            onChange={(v) => onUpdate({ x: v })} 
        />
        <PropertyInput 
            label="Y" 
            value={node.y} 
            onChange={(v) => onUpdate({ y: v })} 
        />
        <PropertyInput 
            icon={<AngleIcon />} 
            value={node.rotation} 
            unit="°"
            onChange={(v) => onUpdate({ rotation: v })} 
        />

        {/* Row 2: Dimensions and Opacity */}
        <PropertyInput 
            label="W" 
            value={node.width} 
            min={1} 
            onChange={(v) => onUpdate({ width: v })} 
        />
        <PropertyInput 
            label="H" 
            value={node.height} 
            min={1} 
            onChange={(v) => onUpdate({ height: v })} 
        />
        <PropertyInput 
            icon={<OpacityIcon />} 
            value={Math.round(node.opacity * 100)} 
            unit="%"
            min={0}
            max={100}
            onChange={(v) => onUpdate({ opacity: v / 100 })} 
        />
      </div>
    </div>
  );
};