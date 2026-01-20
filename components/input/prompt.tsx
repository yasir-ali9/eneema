import React, { useState, useEffect, useRef } from "react";
import { Plus, ChevronUp } from "lucide-react";
import { Dropdown, useDropdown, DropdownItem } from "../dropdown.tsx";

export type ImageQuality = "1K" | "2K" | "4K";
export type ImageRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string, config: { ratio: ImageRatio | null; quality: ImageQuality | null }) => void;
  contextImages?: string[]; // Single line comment: Prop for showing active selection context thumbnails.
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean; // Single line comment: Prop for submission state handling.
  className?: string;
}

/**
 * PromptInput Component
 * Optimized for vertical space with a light shadow and a default 2-row height.
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
  // Single line comment: Initially null to signify "Auto/Respect Prompt" mode.
  const [selectedRatio, setSelectedRatio] = useState<ImageRatio | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<ImageQuality | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ratioDropdown = useDropdown();
  const qualityDropdown = useDropdown();

  // Single line comment: Sync internal state with external value updates.
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Single line comment: Auto-resize logic for the prompt area.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120;
      // Single line comment: Maintain height for at least 2 rows.
      textareaRef.current.style.height = `${Math.max(40, Math.min(scrollHeight, maxHeight))}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    }
  }, [inputValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    onChange(e.target.value);
  };

  const handleSubmit = () => {
    if (inputValue.trim() && !loading) {
      onSubmit(inputValue, { ratio: selectedRatio, quality: selectedQuality });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Single line comment: Support Ctrl/Cmd + Enter for submission.
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Single line comment: Define ratio items with an "Auto" option to revert to prompt detection.
  const ratioItems: DropdownItem[] = [
    { label: "Auto (Prompt)", active: selectedRatio === null, onClick: () => setSelectedRatio(null) },
    ...(["1:1", "3:4", "4:3", "9:16", "16:9"] as ImageRatio[]).map(r => ({
      label: r,
      active: selectedRatio === r,
      onClick: () => setSelectedRatio(r)
    }))
  ];

  // Single line comment: Define quality items with an "Auto" option.
  const qualityItems: DropdownItem[] = [
    { label: "Auto (1K)", active: selectedQuality === null, onClick: () => setSelectedQuality(null) },
    ...(["1K", "2K", "4K"] as ImageQuality[]).map(q => ({
      label: q,
      active: selectedQuality === q,
      onClick: () => setSelectedQuality(q)
    }))
  ];

  return (
    <div className={`flex flex-col w-full bg-bk-50 border border-bd-50 rounded-[10px] shadow-sm transition-all ${className}`}>
      
      {/* Context Area */}
      {contextImages.length > 0 && (
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto no-scrollbar border-b border-bd-50 bg-bk-60/30 rounded-t-[10px]">
          {contextImages.slice(0, 14).map((src, idx) => (
            <div 
              key={idx} 
              className="relative w-8 h-8 rounded-md border border-bd-50 bg-bk-70 overflow-hidden shrink-0 group"
            >
              <img src={src} className="w-full h-full object-cover" alt="context" />
              <div className="absolute inset-0 bg-ac-01/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      )}

      {/* Input Area - Defaulting to 2 rows. Reduced pb-1 to pb-0 to tighten the gap. */}
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || loading}
        rows={2}
        className="w-full px-3 pt-3 pb-0 bg-transparent text-fg-50 text-[11px] leading-tight focus:outline-none resize-none placeholder:text-fg-70 selection:bg-ac-02 selection:text-white"
        style={{ minHeight: '40px' }}
      />

      {/* Action Row - Reduced mt-1 to mt-0 to tighten the gap. */}
      <div className="flex items-center justify-between px-2 pb-2 mt-0">
        <div className="flex items-center gap-1">
          <button 
            type="button"
            disabled={disabled || loading}
            className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-bk-30 text-fg-70 transition-colors shrink-0 disabled:opacity-30"
          >
            <Plus size={14} strokeWidth={1.2} />
          </button>

          {/* Minimal Ratio Dropdown */}
          <Dropdown
            isOpen={ratioDropdown.isOpen}
            onToggle={ratioDropdown.toggle}
            onClose={ratioDropdown.close}
            items={ratioItems}
            position="top"
            trigger={
              <button className="flex items-center gap-1 px-1.5 h-6 rounded hover:bg-bk-30 text-[10px] font-medium text-fg-60 transition-colors">
                {selectedRatio || "Ratio"} <ChevronUp size={10} className="opacity-50" />
              </button>
            }
          />

          {/* Minimal Quality Dropdown */}
          <Dropdown
            isOpen={qualityDropdown.isOpen}
            onToggle={qualityDropdown.toggle}
            onClose={qualityDropdown.close}
            items={qualityItems}
            position="top"
            trigger={
              <button className="flex items-center gap-1 px-1.5 h-6 rounded hover:bg-bk-30 text-[10px] font-medium text-fg-60 transition-colors">
                {selectedQuality || "Quality"} <ChevronUp size={10} className="opacity-50" />
              </button>
            }
          />
        </div>

        <button
          onClick={handleSubmit}
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