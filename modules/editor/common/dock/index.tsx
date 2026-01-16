import React, { useState } from 'react';
import { PromptInput } from '../../../../components/input/prompt.tsx';

/**
 * Dock Component
 * The primary AI prompt entry point. Positioned centrally at the bottom of the workspace.
 * Minimalist container that hosts the PromptInput primitive.
 */
const Dock: React.FC = () => {
  const [prompt, setPrompt] = useState("");

  const handlePromptSubmit = (value: string) => {
    console.log("AI Prompt Submitted:", value);
    // Future: Connect to Gemini 3 generation service
    setPrompt(""); 
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[460px] px-4 z-50">
      <div className="shadow-md rounded-2xl">
        <PromptInput 
          value={prompt}
          onChange={setPrompt}
          onSubmit={handlePromptSubmit}
        />
      </div>
    </div>
  );
};

export default Dock;