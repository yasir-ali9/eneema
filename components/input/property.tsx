import React, { useState, useEffect, useRef } from "react";

interface PropertyInputProps {
  label?: string;
  value: number | string;
  onChange: (value: number) => void;
  unit?: "px" | "%" | "°" | "none";
  icon?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

/**
 * PropertyInput Component
 * Precision input for numeric properties with localized unit formatting and keyboard shortcuts.
 * Updated with w-full to ensure grid consistency.
 */
export const PropertyInput: React.FC<PropertyInputProps> = ({
  label,
  value,
  onChange,
  unit = "none",
  icon,
  min,
  max,
  step = 1,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingChangeRef = useRef<number | null>(null);

  // Single line comment: Formats values for display, adding symbols like ° or % as needed.
  const formatDisplayValue = (val: number | string) => {
    const numVal = typeof val === "number" ? val : parseFloat(String(val));
    if (isNaN(numVal)) return "";

    const rounded = Math.round(numVal * 100) / 100;

    if (unit === "°") return `${rounded}°`;
    if (unit === "%") return `${rounded}%`;
    return String(rounded);
  };

  // Single line comment: Keeps display text in sync with external state changes.
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatDisplayValue(value));
      pendingChangeRef.current = null;
    }
  }, [value, isFocused, unit]);

  // Single line comment: Commits any un-flushed changes when the component is unmounted.
  useEffect(() => {
    return () => {
      if (
        pendingChangeRef.current !== null &&
        pendingChangeRef.current !== value
      ) {
        onChange(pendingChangeRef.current);
      }
    };
  }, [value, onChange]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    const cleanValue = newValue.replace(/[°%]/g, "").trim();
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue)) {
      let clampedValue = numValue;
      if (min !== undefined && clampedValue < min) clampedValue = min;
      if (max !== undefined && clampedValue > max) clampedValue = max;
      pendingChangeRef.current = clampedValue;
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const cleanValue = inputValue.replace(/[°%]/g, "").trim();
    let numValue = parseFloat(cleanValue);

    if (isNaN(numValue)) {
      numValue = typeof value === "number" ? value : 0;
      setInputValue(formatDisplayValue(numValue));
      pendingChangeRef.current = null;
      return;
    }

    if (min !== undefined && numValue < min) numValue = min;
    if (max !== undefined && numValue > max) numValue = max;

    setInputValue(formatDisplayValue(numValue));

    if (numValue !== value) {
      onChange(numValue);
    }
    pendingChangeRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const cleanValue = inputValue.replace(/[°%]/g, "").trim();
      const currentValue = parseFloat(cleanValue) || 0;
      const newValue = currentValue + step;
      const clampedValue = max !== undefined ? Math.min(newValue, max) : newValue;
      setInputValue(formatDisplayValue(clampedValue));
      onChange(clampedValue);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const cleanValue = inputValue.replace(/[°%]/g, "").trim();
      const currentValue = parseFloat(cleanValue) || 0;
      const newValue = currentValue - step;
      const clampedValue = min !== undefined ? Math.max(newValue, min) : newValue;
      setInputValue(formatDisplayValue(clampedValue));
      onChange(clampedValue);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center bg-bk-40 rounded border border-bd-50 hover:border-bd-60 focus-within:border-bd-50 focus-within:shadow-[0_0_0_2px_rgb(var(--ac-02))] h-[26px]">
        {(icon || label) && (
          <div className="flex items-center justify-center shrink-0 pl-1.5 pr-1 pointer-events-none">
            {icon ? (
              <span className="text-fg-60 flex items-center justify-center w-[14px]">
                {icon}
              </span>
            ) : (
              <span className="text-fg-60 text-[11px] font-medium">
                {label}
              </span>
            )}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            property-input
            flex-1 h-full min-w-0
            bg-transparent text-fg-50 
            text-[11px] font-normal
            focus:outline-none
            selection:bg-ac-02 selection:text-white
            placeholder:text-fg-70
            ${icon || label ? "pl-0" : "pl-2"}
            pr-2
          `}
        />
      </div>
    </div>
  );
};