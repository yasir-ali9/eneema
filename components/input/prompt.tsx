import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  contextImages?: string[]; // Single line comment: Prop for showing active selection context thumbnails.
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean; // Single line comment: Prop for submission state handling.
  className?: string;
}

/**
 * PromptInput Component
 * AI interaction primitive with context awareness and refined aesthetics.
 * Updated: Border-radius at 14px, solid border-bd-50 for context bar, and medium button text.
 */
export const PromptInput: React.FC<PromptInputProps> = ({
  value,
  onChange,
  onSubmit,
  contextImages = [],
  placeholder = "Modify or generate an image with Gemini 3",
  disabled = false,
  loading = false,
  className = "",
}) => {
  const [inputValue, setInputValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Single line comment: Sync internal state with external value updates.
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Single line comment: Advanced auto-resize logic for the prompt area.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Single line comment: Support Ctrl/Cmd + Enter for submission.
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (inputValue.trim() && !loading) onSubmit(inputValue);
    }
  };

  return (
    <div className={`flex flex-col w-full p-1 bg-bk-50 border border-bd-50 rounded-[14px] shadow-2xl transition-all ${className}`}>
      
      {/* Context Area: Thumbnails of selected images - Assigned solid border-bd-50 as requested */}
      {contextImages.length > 0 && (
        <div className="flex items-center gap-2 p-1.5 overflow-x-auto no-scrollbar border-b border-bd-50 mb-1">
          {contextImages.slice(0, 14).map((src, idx) => (
            <div 
              key={idx} 
              className="relative w-8 h-8 rounded-md border border-bd-50 bg-bk-70 overflow-hidden shrink-0 group"
            >
              <img src={src} className="w-full h-full object-cover" alt="context" />
              <div className="absolute inset-0 bg-ac-01/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
          {contextImages.length > 14 && (
            <div className="text-[9px] text-fg-70 px-2 font-medium">+{contextImages.length - 14} more</div>
          )}
        </div>
      )}

      {/* Input Area: Refined horizontal padding */}
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        rows={1}
        className="w-full px-[7px] py-2 bg-transparent text-fg-50 text-[11px] leading-tight focus:outline-none resize-none placeholder:text-fg-70 selection:bg-ac-02 selection:text-white"
        style={{ minHeight: '24px' }}
      />

      {/* Action Row: Increased gap and medium weight button text */}
      <div className="flex items-center justify-between mt-2 px-1 pb-1">
        <button 
          type="button"
          disabled={disabled || loading}
          className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-bk-30 text-fg-70 transition-colors shrink-0 disabled:opacity-30"
          title="Add attachment"
        >
          <Plus size={14} />
        </button>

        <button
          onClick={() => inputValue.trim() && onSubmit(inputValue)}
          disabled={disabled || !inputValue.trim() || loading}
          className={`
            relative flex items-center justify-center px-4 h-7 rounded-md 
            bg-ac-01 hover:bg-ac-02 text-fg-30 text-[11px] font-medium transition-all 
            disabled:opacity-30 disabled:grayscale overflow-hidden
          `}
        >
          {loading && (
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          )}
          <span className={loading ? "opacity-70" : ""}>{loading ? "Thinking..." : "Go"}</span>
        </button>
      </div>
    </div>
  );
};