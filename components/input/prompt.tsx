import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * PromptInput Component
 * AI interaction primitive designed to match the DescriptiveInput aesthetic.
 * Updated: Increased border-radius to 14px and reduced horizontal padding to 7px.
 */
export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Modify or generate an image with Gemini 3",
  disabled = false,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Single line comment: Sync internal state with external value updates.
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Single line comment: Advanced auto-resize logic to prevent scrollbar flickering.
  useEffect(() => {
    if (textareaRef.current) {
      // 1. Reset height to auto to get an accurate scrollHeight measurement
      textareaRef.current.style.height = "auto";
      
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Single line comment: Max height for multi-line inputs.

      // 2. Apply the new height capped at maxHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;

      // 3. Toggle overflow visibility only when text exceeds the max height
      if (scrollHeight > maxHeight) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  }, [inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Single line comment: Support power-user submission pattern (Ctrl/Cmd + Enter).
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (inputValue.trim()) onSubmit(inputValue);
    }
  };

  return (
    <div className={`flex flex-col w-full px-1 py-1.5 bg-bk-50 border border-bd-50 rounded-[14px] ${className}`}>
      {/* Top Section: Main Text Input Area - Reduced horizontal padding by 1px (from 8px to 7px) */}
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="w-full px-[7px] py-2 bg-transparent text-fg-50 text-[11px] leading-tight focus:outline-none resize-none placeholder:text-fg-70 selection:bg-ac-02 selection:text-white"
        style={{ minHeight: '24px' }}
      />

      {/* Bottom Section: Action Row - Refined gap and medium weight button text */}
      <div className="flex items-center justify-between mt-1.5 px-1 py-0.5">
        <button 
          type="button"
          className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-bk-30 text-fg-70 transition-colors shrink-0"
          title="Attach context"
        >
          <Plus size={14} />
        </button>

        <button
          onClick={() => inputValue.trim() && onSubmit(inputValue)}
          disabled={disabled || !inputValue.trim()}
          className="flex items-center justify-center px-3 h-6 rounded-md bg-ac-01 hover:bg-ac-02 text-fg-30 text-[11px] font-medium transition-all disabled:opacity-30 disabled:grayscale"
        >
          Go
        </button>
      </div>
    </div>
  );
};