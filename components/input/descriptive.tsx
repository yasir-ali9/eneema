import React, { useState, useEffect, useRef } from "react";

interface DescriptiveInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * DescriptiveInput Component
 * Multi-line text input that auto-expands based on content.
 */
export const DescriptiveInput: React.FC<DescriptiveInputProps> = ({
  value,
  onChange,
  placeholder,
  rows = 1, // Single line comment: Defaulted to 1 to support compact single-line text segments.
  maxLength,
  disabled = false,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingChangeRef = useRef<string | null>(null);

  // Single line comment: Sync internal state with external value changes when not editing.
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value);
      pendingChangeRef.current = null;
    }
  }, [value, isFocused]);

  // Single line comment: Flush any uncommitted changes if the component or value prop changes.
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

  // Single line comment: Dynamic height adjustment logic to fit text content exactly.
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to calculate true scroll height correctly.
      textareaRef.current.style.height = "auto";

      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 144; 

      // Set height based on content while respecting max bounds.
      textareaRef.current.style.height = `${scrollHeight}px`;

      // Enable scrollbars only when content exceeds maximum height limit.
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  }, [inputValue]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;
    setInputValue(newValue);
    pendingChangeRef.current = newValue;
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (inputValue !== value) {
      onChange(inputValue);
      pendingChangeRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="descriptive-input w-full px-2.5 py-1.5 text-[11px] bg-bk-40 text-fg-50 rounded border border-bd-50 focus:outline-none focus:border-bd-50 focus:shadow-[0_0_0_2px_rgb(var(--ac-02))] resize-none placeholder:text-fg-70 disabled:opacity-50 disabled:cursor-not-allowed max-h-[144px] overflow-y-hidden selection:bg-ac-02 selection:text-white"
        style={{ 
          // Single line comment: Calculate minimum height based on line height (approx 16px) and padding.
          minHeight: `${rows * 16 + 12}px` 
        }}
      />

      {maxLength && isFocused && (
        <div className="absolute bottom-1.5 right-2.5 pointer-events-none">
          <span className={`text-[9px] ${inputValue.length > maxLength * 0.9 ? (inputValue.length >= maxLength ? "text-red-500" : "text-yellow-500") : "text-fg-70"}`}>
            {inputValue.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
};