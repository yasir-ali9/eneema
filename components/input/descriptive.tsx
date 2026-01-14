"use client";

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

export const DescriptiveInput: React.FC<DescriptiveInputProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  maxLength,
  disabled = false,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingChangeRef = useRef<string | null>(null);

  // Update internal value when prop changes (but not when focused)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(value);
      pendingChangeRef.current = null;
    }
  }, [value, isFocused]);

  // Flush pending changes before component unmounts or value prop changes
  useEffect(() => {
    return () => {
      // Cleanup: flush any pending changes
      if (
        pendingChangeRef.current !== null &&
        pendingChangeRef.current !== value
      ) {
        onChange(pendingChangeRef.current);
      }
    };
  }, [value, onChange]);

  // Auto-resize textarea based on content (like PromptInput)
  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to auto to get the correct scrollHeight
      textareaRef.current.style.height = "auto";

      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 144; // max-h-[144px]

      // Set height to scrollHeight
      textareaRef.current.style.height = `${scrollHeight}px`;

      // Only show scrollbar when content exceeds max height
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

    // Respect maxLength if provided
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    setInputValue(newValue);
    // Track pending change
    pendingChangeRef.current = newValue;
  };

  const handleBlur = () => {
    setIsFocused(false);

    // Only call onChange if value actually changed
    if (inputValue !== value) {
      onChange(inputValue);
      pendingChangeRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Ctrl+Enter or Cmd+Enter to trigger blur (save)
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
        className="descriptive-input w-full px-2.5 py-2 text-[11px] bg-bk-40 text-fg-50 rounded border border-bd-50 focus:outline-none focus:border-bd-50 focus:shadow-[0_0_0_2px_rgb(var(--ac-02))] resize-none placeholder:text-fg-70 disabled:opacity-50 disabled:cursor-not-allowed max-h-[144px] overflow-y-hidden selection:bg-ac-02 selection:text-white"
        style={{ minHeight: `${rows * 16 + 16}px` }}
      />

      {/* Character counter - only show if maxLength is provided and field is focused */}
      {maxLength && isFocused && (
        <div className="absolute bottom-2 right-2.5 pointer-events-none">
          <span
            className={`text-[9px] ${
              inputValue.length > maxLength * 0.9
                ? inputValue.length >= maxLength
                  ? "text-red-500"
                  : "text-yellow-500"
                : "text-fg-70"
            }`}
          >
            {inputValue.length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
};
