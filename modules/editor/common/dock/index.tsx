import React, { useState } from 'react';
import { PromptInput, ImageRatio, ImageQuality } from '../../../../components/input/prompt.tsx';
import { EditorNode, ToolMode, Point } from '../../core/types.ts';
import { ToolExecutionContext } from '../../types.ts';
import { GenerateTool } from '../../tools/generate/index.ts';

interface DockProps {
  nodes: EditorNode[];
  selectedNodeIds: string[];
  pushHistory: (snapshot: EditorNode[]) => void;
  setNodes: (updater: EditorNode[] | ((prev: EditorNode[]) => EditorNode[])) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setLassoPath: (path: Point[]) => void;
  setBrushStrokes: (strokes: Point[][]) => void;
  setToolMode: (mode: ToolMode) => void;
  setProcessingNodeId: (id: string | null) => void; // Single line comment: New prop for shimmer control.
}

/**
 * Dock Component
 * The primary AI prompt entry point. Positioned with balanced breathing room from the bottom edge.
 */
const Dock: React.FC<DockProps> = (props) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Single line comment: Get sources of selected nodes for the context bar.
  const contextImages = props.nodes
    .filter(n => props.selectedNodeIds.includes(n.id))
    .map(n => n.src);

  const handlePromptSubmit = async (value: string, config: { ratio: ImageRatio | null; quality: ImageQuality | null }) => {
    if (!value.trim() || isGenerating) return;

    // Single line comment: Clear prompt instantly and enter loading state.
    setPrompt(""); 
    setIsGenerating(true);
    
    try {
      const toolContext: ToolExecutionContext = {
        nodes: props.nodes,
        selectedNodeIds: props.selectedNodeIds,
        lassoPath: [], 
        brushStrokes: [],
        pushHistory: props.pushHistory,
        setNodes: props.setNodes,
        setSelectedNodeIds: props.setSelectedNodeIds,
        setLassoPath: props.setLassoPath,
        setBrushStrokes: props.setBrushStrokes,
        setToolMode: props.setToolMode,
        setProcessingNodeId: props.setProcessingNodeId,
      };

      await GenerateTool.execute(toolContext, value, config);
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-full max-w-[460px] px-4 z-50">
      <PromptInput 
        value={prompt}
        onChange={setPrompt}
        onSubmit={handlePromptSubmit}
        contextImages={contextImages}
        loading={isGenerating}
        disabled={isGenerating}
      />
    </div>
  );
};

export default Dock;