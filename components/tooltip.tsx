import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

export type TooltipPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/**
 * TooltipProps Interface
 * Exported to allow consumers to reference the prop types.
 * Single line comment: children is made optional to resolve TypeScript inference issues in some JSX environments.
 */
export interface TooltipProps {
  children?: ReactNode;
  content: string;
  position?: TooltipPosition;
  delay?: number;
  disabled?: boolean;
  className?: string;
  offset?: number; // Single line comment: Custom distance from the trigger element.
}

/**
 * Tooltip Component
 * Displays helpful text when hovering over elements.
 * Updated: Wrapper is now block and w-full to fill grid cells correctly.
 */
export function Tooltip({
  children,
  content,
  position = "top",
  delay = 500,
  disabled = false,
  className = "",
  offset = 6, // Single line comment: Defaulted to 6px if not specified.
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Single line comment: Helper function to calculate position if needed on window events.
  const updateTooltipPosition = () => {
    if (!containerRef.current) return;
    containerRef.current.getBoundingClientRect();
  };

  const handleMouseEnter = () => {
    if (disabled) return;

    updateTooltipPosition();
    setIsVisible(true);

    timeoutRef.current = window.setTimeout(() => {
      setShowTooltip(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
    setShowTooltip(false);

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const handleScroll = () => updateTooltipPosition();
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isVisible]);

  // Single line comment: Calculates dynamic styles for tooltip placement with viewport boundary checks.
  const getTooltipStyle = () => {
    if (!containerRef.current) return {};

    const rect = containerRef.current.getBoundingClientRect();
    const tooltipOffset = offset; // Single line comment: Use the dynamic offset prop.
    const padding = 8;

    const estimatedTooltipWidth = content.length * 7;
    const estimatedTooltipHeight = 32;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalPosition: TooltipPosition = position;

    const spaceAbove = rect.top;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    if (
      position === "top" &&
      spaceAbove < estimatedTooltipHeight + tooltipOffset + padding
    ) {
      finalPosition = "bottom";
    } else if (
      position === "bottom" &&
      spaceBelow < estimatedTooltipHeight + tooltipOffset + padding
    ) {
      finalPosition = "top";
    } else if (
      position === "left" &&
      spaceLeft < estimatedTooltipWidth + tooltipOffset + padding
    ) {
      finalPosition = "right";
    } else if (
      position === "right" &&
      spaceRight < estimatedTooltipWidth + tooltipOffset + padding
    ) {
      finalPosition = "left";
    }

    const positions: Record<
      TooltipPosition,
      { top: number; left: number; transform: string }
    > = {
      top: {
        top: rect.top - tooltipOffset,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, -100%)",
      },
      bottom: {
        top: rect.bottom + tooltipOffset,
        left: rect.left + rect.width / 2,
        transform: "translate(-50%, 0)",
      },
      left: {
        top: rect.top + rect.height / 2,
        left: rect.left - tooltipOffset,
        transform: "translate(-100%, -50%)",
      },
      right: {
        top: rect.top + rect.height / 2,
        left: rect.right + tooltipOffset,
        transform: "translate(0, -50%)",
      },
      "top-left": {
        top: rect.top - tooltipOffset,
        left: rect.right,
        transform: "translate(0, -100%)",
      },
      "top-right": {
        top: rect.top - tooltipOffset,
        left: rect.left,
        transform: "translate(0, -100%)",
      },
      "bottom-left": {
        top: rect.bottom + tooltipOffset,
        left: rect.right,
        transform: "translate(0, 0)",
      },
      "bottom-right": {
        top: rect.bottom + tooltipOffset,
        left: rect.left,
        transform: "translate(0, 0)",
      },
    };

    return positions[finalPosition];
  };

  const tooltipClasses = `
    fixed z-[9999] px-2 py-1 text-[11px]
    bg-bk-40 text-fg-40 border border-bd-60 rounded-md shadow-sm
    pointer-events-none transition-opacity duration-200
    whitespace-nowrap ${showTooltip ? "opacity-100" : "opacity-0"}
  `;

  if (disabled || !content) {
    return <>{children}</>;
  }

  const tooltip = isVisible && mounted && (
    <div className={tooltipClasses} style={getTooltipStyle()}>
      {content}
    </div>
  );

  return (
    <>
      <div
        ref={containerRef}
        className={`relative block w-full ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {mounted && createPortal(tooltip, document.body)}
    </>
  );
}