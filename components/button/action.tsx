import React from 'react';

interface ActionButtonProps {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  colSpan?: 1 | 2 | 3;
  className?: string;
  title?: string;
}

/**
 * ActionButton Component
 * Features a shimmer effect that indicates processing without hiding content.
 * Single line comment: Ensures text and icons remain visible at reduced opacity during AI tasks.
 */
export const ActionButton: React.FC<ActionButtonProps> = ({
  label,
  icon,
  onClick,
  disabled = false,
  loading = false,
  colSpan = 1,
  className = '',
  title
}) => {
  // Map colSpan to tailwind grid-column classes
  const spanClass = {
    1: 'col-span-1',
    2: 'col-span-2',
    3: 'col-span-3'
  }[colSpan];

  return (
    <button
      onClick={onClick}
      // Button is disabled functionally during its own loading or when explicitly disabled
      disabled={disabled || loading}
      title={title}
      className={`
        ${spanClass}
        relative flex items-center justify-start
        h-[26px] rounded
        bg-bk-40 border border-bd-50 
        transition-all duration-150
        hover:bg-bk-30 hover:border-bd-60
        active:scale-[0.98]
        ${disabled && !loading ? 'opacity-40' : 'opacity-100'} 
        disabled:pointer-events-none
        focus:outline-none focus:ring-1 focus:ring-ac-01/30
        overflow-hidden select-none
        ${className}
      `}
    >
      {/* Background Shimmer Overlay - Always visible during loading */}
      {loading && (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="w-full h-full animate-shimmer" />
        </div>
      )}

      {/* Button Content - Restored visibility during loading with subtle fade */}
      <div className={`relative z-10 flex items-center h-full w-full transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {icon && (
          <div className="flex items-center justify-center shrink-0 pl-1.5 pr-1 pointer-events-none">
            <span className="text-fg-60 flex items-center justify-center w-[14px]">
              {icon}
            </span>
          </div>
        )}
        
        <span className={`
          truncate text-fg-50 font-normal text-[11px]
          ${icon ? 'pl-0' : 'pl-2'}
          pr-2
        `}>
          {label}
        </span>
      </div>
    </button>
  );
};