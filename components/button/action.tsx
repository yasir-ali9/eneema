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
 * Features a shimmer effect during AI processing.
 * Reduced prominence during processing state by using muted colors and subtle opacity.
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
      // Button is disabled functionally during loading
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
      {/* Background Shimmer Overlay */}
      {loading && (
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full animate-shimmer" />
        </div>
      )}

      {/* Button Content - Muted dominance during loading as requested */}
      <div className={`relative z-10 flex items-center h-full w-full transition-opacity duration-300 ${loading ? 'opacity-70' : 'opacity-100'}`}>
        {icon && (
          <div className="flex items-center justify-center shrink-0 pl-1.5 pr-1 pointer-events-none">
            <span className={`${loading ? 'text-fg-70' : 'text-fg-60'} flex items-center justify-center w-[14px] transition-colors`}>
              {icon}
            </span>
          </div>
        )}
        
        <span className={`
          truncate ${loading ? 'text-fg-70 font-medium' : 'text-fg-50 font-normal'} text-[11px]
          transition-colors
          ${icon ? 'pl-0' : 'pl-2'}
          pr-2
        `}>
          {label}
        </span>
      </div>
    </button>
  );
};