import { ToolExecutionContext } from "../types.ts";
import { generateImageWithGemini } from "./service.ts";
import { EditorNode } from "../../core/types.ts";

/**
 * Execute Generation Logic
 * Handles the creation of a new node based on AI output.
 */
export const execute = async (
  ctx: ToolExecutionContext,
  prompt: string
): Promise<string> => {
  const { nodes, selectedNodeIds, pushHistory, setNodes, setSelectedNodeIds } = ctx;

  // Single line comment: Extract sources from selected nodes to provide as context.
  const contextImages = nodes
    .filter((n) => selectedNodeIds.includes(n.id))
    .map((n) => n.src);

  // Single line comment: Call the AI service.
  const generatedSrc = await generateImageWithGemini(prompt, contextImages);

  // Single line comment: Commit history before updating canvas.
  pushHistory(nodes);

  const newNodeId = crypto.randomUUID();
  
  // Calculate default placement
  let newX = 100;
  let newY = 100;
  let newW = 400;
  let newH = 400;

  // Single line comment: If an image was selected, place the new one to its right.
  if (selectedNodeIds.length > 0) {
    const lastSelected = nodes.find(n => n.id === selectedNodeIds[selectedNodeIds.length - 1]);
    if (lastSelected) {
      newX = lastSelected.x + lastSelected.width + 40;
      newY = lastSelected.y;
      newW = lastSelected.width;
      newH = lastSelected.height;
    }
  }

  const newNode: EditorNode = {
    id: newNodeId,
    type: "image",
    src: generatedSrc,
    x: newX,
    y: newY,
    width: newW,
    height: newH,
    rotation: 0,
    opacity: 1,
    name: "AI Generated",
  };

  setNodes((prev) => [...prev, newNode]);
  setSelectedNodeIds([newNodeId]);
  
  return newNodeId;
};