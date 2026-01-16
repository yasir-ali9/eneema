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
 * Features a robust auto-growing text area and action row.
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
      const maxHeight = 160;

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
    // Single line comment: Support power-user submission pattern.
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (inputValue.trim()) onSubmit(inputValue);
    }
  };

  return (
    <div className={`flex flex-col w-full p-2.5 bg-bk-50 border border-bd-50 rounded-2xl ${className}`}>
      {/* Top Section: Main Text Input Area */}
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="w-full bg-transparent text-fg-50 text-[11px] leading-relaxed focus:outline-none resize-none placeholder:text-fg-70 selection:bg-ac-02 selection:text-white"
        style={{ minHeight: '24px' }}
      />

      {/* Bottom Section: Action Row */}
      <div className="flex items-center justify-between mt-1">
        <button 
          type="button"
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-bk-30 text-fg-70 transition-colors shrink-0"
          title="Attach context"
        >
          <Plus size={16} />
        </button>

        <button
          onClick={() => inputValue.trim() && onSubmit(inputValue)}
          disabled={disabled || !inputValue.trim()}
          className="flex items-center justify-center px-4 h-7 rounded-lg bg-ac-01 hover:bg-ac-02 text-fg-30 text-[11px] font-semibold transition-all disabled:opacity-30 disabled:grayscale"
        >
          Go
        </button>
      </div>
    </div>
  );
};