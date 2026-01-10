import React from 'react';
import { Spinner } from '../modules/editor/common/components/spinner.tsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ReactNode;
}

/**
 * Global Button Component
 * Redesigned to use the custom color design system.
 */
export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  icon, 
  className = '', 
  ...props 
}) => {
  // Base structural styles
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all focus:outline-none disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] select-none";
  
  // Custom variants mapping to the new design variables
  const variants = {
    primary: "bg-ac-01 hover:bg-ac-02 text-fg-30 rounded-lg shadow-sm",
    accent: "bg-gradient-to-br from-ac-01 to-ac-02 hover:opacity-90 text-fg-30 rounded-lg shadow-md shadow-ac-01/10",
    secondary: "bg-bk-40 hover:bg-bk-20 text-fg-40 border border-bd-50 rounded-lg",
    ghost: "hover:bg-bk-50 text-fg-60 hover:text-fg-30 rounded-lg",
    danger: "hover:bg-red-500/10 text-fg-70 hover:text-red-400 rounded-lg"
  };

  // Size constraints
  const sizes = {
    sm: "px-2.5 py-1 text-[11px]",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "p-2 aspect-square"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner /> {size !== 'icon' && <span>Loading...</span>}
        </span>
      ) : (
        <>
          {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};