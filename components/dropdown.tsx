import React, { useEffect, useRef, useState } from "react";

/**
 * Dropdown Item Interface
 * Defines the structure for each menu entry in the dropdown.
 */
export interface DropdownItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  shortcut?: string;
  active?: boolean;
}

/**
 * Dropdown Props Interface
 */
interface DropdownProps {
  items: DropdownItem[];
  trigger: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  position?: "top" | "bottom";
  align?: "left" | "right";
  variant?: "default" | "compact";
}

/**
 * Dropdown Component
 * A generic, accessible dropdown menu using the application's design system.
 */
export function Dropdown({
  items,
  trigger,
  isOpen,
  onToggle,
  onClose,
  position = "bottom",
  align = "left",
  variant = "default",
}: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Calculate dynamic position classes based on props
  const getPositionClasses = () => {
    const positionClass = position === "top" ? "bottom-full mb-1" : "top-full mt-1";
    const alignClass = align === "right" ? "right-0" : "left-0";
    return `${positionClass} ${alignClass}`;
  };

  return (
    <div className="relative inline-block">
      {/* Trigger Area */}
      <div ref={triggerRef} onClick={onToggle} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Menu Overlay */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute z-[100] bg-bk-40 border border-bd-50 rounded-lg shadow-xl py-1 px-1 w-max min-w-[140px] ${getPositionClasses()}`}
        >
          {items.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={index}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick();
                    onClose();
                  }
                }}
                disabled={item.disabled}
                className={`
                  w-full px-3 py-2 text-left flex items-center gap-2 tracking-tight whitespace-nowrap rounded-md transition-all
                  ${
                    item.active
                      ? "bg-bk-30 text-fg-30"
                      : item.disabled
                      ? "text-fg-60 cursor-not-allowed"
                      : "text-fg-50 hover:bg-bk-30 focus:bg-bk-30 focus:outline-none cursor-pointer"
                  }
                `}
                style={{ fontSize: "11px" }}
              >
                {/* Reserved Icon Space for consistent text alignment */}
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  {Icon && <Icon size={14} />}
                </div>

                {/* Main Label */}
                <span className="flex-1 font-medium">{item.label}</span>

                {/* Keyboard Shortcut Hint */}
                {item.shortcut && (
                  <span className="text-[9px] text-fg-70 ml-4 opacity-60 uppercase">
                    {item.shortcut}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * useDropdown Hook
 * Simplifies managing the open/close state of a dropdown.
 */
export function useDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    toggle,
    close,
  };
}
