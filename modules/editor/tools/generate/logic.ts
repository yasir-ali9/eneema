import { ToolExecutionContext } from "../types.ts";
import { generateImageWithGemini } from "./service.ts";
import { EditorNode } from "../../core/types.ts";
import { createPlaceholderDataUrl, loadImage } from "../../central/canvas/helpers/canvas.utils.ts";

type SupportedRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
type SupportedQuality = "1K" | "2K" | "4K";

/**
 * Intelligent Ratio Detection
 * Scans prompt for a wide variety of cinematic and photography terms.
 */
const determineRatio = async (prompt: string, nodes: EditorNode[], selectedIds: string[]): Promise<SupportedRatio> => {
  const p = prompt.toLowerCase();
  
  // 1. Explicit Prompt Detection (Broad keywords)
  if (p.includes("16:9") || p.includes("21:9") || p.includes("twenty-one:nine") || p.includes("landscape") || p.includes("cinematic") || p.includes("panoramic") || p.includes("ultrawide")) return "16:9";
  if (p.includes("9:16") || p.includes("portrait") || p.includes("mobile") || p.includes("vertical") || p.includes("story")) return "9:16";
  if (p.includes("4:3") || p.includes("3:2") || p.includes("photo")) return "4:3";
  if (p.includes("3:4") || p.includes("4:5")) return "3:4";
  if (p.includes("1:1") || p.includes("square")) return "1:1";

  // 2. Single Image Context Fallback
  if (selectedIds.length === 1) {
    const node = nodes.find(n => n.id === selectedIds[0]);
    if (node) {
      try {
        const img = await loadImage(node.src);
        const ratio = img.width / img.height;
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
      } catch (e) { console.warn("Failed to detect context ratio"); }
    }
  }

  return "1:1";
};

/**
 * Execute Generation Logic
 */
export const execute = async (
  ctx: ToolExecutionContext,
  prompt: string,
  options?: { ratio: SupportedRatio | null; quality: SupportedQuality | null }
): Promise<string> => {
  const { nodes, selectedNodeIds, pushHistory, setNodes, setSelectedNodeIds, setProcessingNodeId } = ctx;

  // Single line comment: Predict ratio.
  const targetRatioStr = options?.ratio || await determineRatio(prompt, nodes, selectedNodeIds);
  const targetQuality = options?.quality || "1K";
  
  const [rw, rh] = targetRatioStr.split(':').map(Number);
  const baseDim = 400;
  let placeholderW = baseDim;
  let placeholderH = baseDim;

  if (rw > rh) {
    placeholderH = Math.round(baseDim * (rh / rw));
  } else {
    placeholderW = Math.round(baseDim * (rw / rh));
  }

  const contextImages = nodes
    .filter((n) => selectedNodeIds.includes(n.id))
    .map((n) => n.src);

  let newX = 100;
  let newY = 100;

  if (selectedNodeIds.length > 0) {
    const lastSelected = nodes.find(n => n.id === selectedNodeIds[selectedNodeIds.length - 1]);
    if (lastSelected) {
      newX = lastSelected.x + lastSelected.width + 40;
      newY = lastSelected.y;
    }
  }

  const placeholderId = crypto.randomUUID();
  const placeholderNode: EditorNode = {
    id: placeholderId,
    type: "image",
    src: createPlaceholderDataUrl("#9c9c9c", placeholderW, placeholderH),
    x: newX,
    y: newY,
    width: placeholderW,
    height: placeholderH,
    rotation: 0,
    opacity: 1,
    name: "AI Generating...",
  };

  setSelectedNodeIds([]);
  setNodes((prev) => [...prev, placeholderNode]);
  setProcessingNodeId(placeholderId);

  try {
    // Single line comment: Wrap the prompt with clear intent for the image model.
    const instructions = contextImages.length > 0 
      ? `Generate a new image based on the provided visual context and this instruction: ${prompt}. Match the style and mood of the reference images.`
      : prompt;

    const generatedSrc = await generateImageWithGemini(instructions, contextImages, targetRatioStr, targetQuality);

    const finalImg = await loadImage(generatedSrc);
    const actualRatio = finalImg.width / finalImg.height;

    const finalW = placeholderW;
    const finalH = Math.round(placeholderW / actualRatio);

    pushHistory(nodes);

    setNodes((prev) =>
      prev.map((n) =>
        n.id === placeholderId
          ? { 
              ...n, 
              src: generatedSrc, 
              width: finalW, 
              height: finalH, 
              name: `AI Generated (${targetQuality})` 
            }
          : n
      )
    );
    
    return placeholderId;
  } catch (error: any) {
    // Single line comment: Clean up placeholder and re-throw the descriptive error.
    setNodes((prev) => prev.filter((n) => n.id !== placeholderId));
    throw error;
  } finally {
    setProcessingNodeId(null);
  }
};