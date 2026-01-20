import { ToolExecutionContext } from "../types.ts";
import { generateImageWithGemini } from "./service.ts";
import { EditorNode } from "../../core/types.ts";
import { createPlaceholderDataUrl, loadImage } from "../../central/canvas/helpers/canvas.utils.ts";

type SupportedRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

/**
 * Parses the prompt and context to determine the best aspect ratio.
 */
const determineRatio = async (prompt: string, nodes: EditorNode[], selectedIds: string[]): Promise<SupportedRatio> => {
  const p = prompt.toLowerCase();
  
  // 1. Explicit Prompt Detection
  if (p.includes("16:9") || p.includes("landscape")) return "16:9";
  if (p.includes("9:16") || p.includes("portrait")) return "9:16";
  if (p.includes("4:3")) return "4:3";
  if (p.includes("3:4")) return "3:4";
  if (p.includes("1:1") || p.includes("square")) return "1:1";

  // 2. Single Image Context Fallback
  if (selectedIds.length === 1) {
    const node = nodes.find(n => n.id === selectedIds[0]);
    if (node) {
      const img = await loadImage(node.src);
      const ratio = img.width / img.height;
      
      // Single line comment: Map numeric ratio to the closest supported Gemini string.
      const targets: { val: number, str: SupportedRatio }[] = [
        { val: 16/9, str: "16:9" },
        { val: 4/3, str: "4:3" },
        { val: 1/1, str: "1:1" },
        { val: 3/4, str: "3:4" },
        { val: 9/16, str: "9:16" }
      ];
      
      return targets.reduce((prev, curr) => 
        Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
      ).str;
    }
  }

  // 3. Multi-image or no-context default
  return "1:1";
};

/**
 * Execute Generation Logic
 * Handles the creation of a new node based on AI output with layout awareness.
 */
export const execute = async (
  ctx: ToolExecutionContext,
  prompt: string
): Promise<string> => {
  const { nodes, selectedNodeIds, pushHistory, setNodes, setSelectedNodeIds, setProcessingNodeId } = ctx;

  // Single line comment: Determine the target ratio before creating the placeholder.
  const targetRatioStr = await determineRatio(prompt, nodes, selectedNodeIds);
  
  // Single line comment: Convert ratio string to numeric dimensions for the canvas node.
  const [rw, rh] = targetRatioStr.split(':').map(Number);
  const baseDim = 400;
  let newW = baseDim;
  let newH = baseDim;

  if (rw > rh) {
    newH = Math.round(baseDim * (rh / rw));
  } else {
    newW = Math.round(baseDim * (rw / rh));
  }

  // Single line comment: Extract sources from selected nodes for context.
  const contextImages = nodes
    .filter((n) => selectedNodeIds.includes(n.id))
    .map((n) => n.src);

  // Single line comment: Placement calculation.
  let newX = 100;
  let newY = 100;

  if (selectedNodeIds.length > 0) {
    const lastSelected = nodes.find(n => n.id === selectedNodeIds[selectedNodeIds.length - 1]);
    if (lastSelected) {
      newX = lastSelected.x + lastSelected.width + 40;
      newY = lastSelected.y;
    }
  }

  // Single line comment: Create a visual placeholder node instantly with the correct aspect ratio.
  const placeholderId = crypto.randomUUID();
  const placeholderNode: EditorNode = {
    id: placeholderId,
    type: "image",
    src: createPlaceholderDataUrl("#9c9c9c", newW, newH),
    x: newX,
    y: newY,
    width: newW,
    height: newH,
    rotation: 0,
    opacity: 1,
    name: "AI Generating...",
  };

  // Single line comment: Deselect everything and insert placeholder.
  setSelectedNodeIds([]);
  setNodes((prev) => [...prev, placeholderNode]);
  setProcessingNodeId(placeholderId);

  try {
    // Single line comment: Pass the detected ratio string to the Gemini service.
    const generatedSrc = await generateImageWithGemini(prompt, contextImages, targetRatioStr);

    pushHistory(nodes);

    setNodes((prev) =>
      prev.map((n) =>
        n.id === placeholderId
          ? { ...n, src: generatedSrc, name: "AI Generated" }
          : n
      )
    );
    
    return placeholderId;
  } catch (error) {
    console.error("AI Generation Error:", error);
    setNodes((prev) => prev.filter((n) => n.id !== placeholderId));
    throw error;
  } finally {
    setProcessingNodeId(null);
  }
};