import { ToolExecutionContext } from '../types.ts';
import { extractTextWithGemini, updateTextInImage } from './service.ts';
import { EditorNode } from '../../core/types.ts';

/**
 * Action: Extract text from selected image.
 * Uses functional update to merge text data without stomping on manual layout changes (drag/resize).
 */
export const extractAction = async (ctx: ToolExecutionContext): Promise<void> => {
  const { nodes, selectedNodeIds, setNodes } = ctx;
  if (selectedNodeIds.length !== 1) return;

  const nodeId = selectedNodeIds[0];
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  // Single line comment: Long running AI call happens outside the state update block.
  const texts: string[] = await extractTextWithGemini(node.src);
  
  const textBlocks = texts.map(t => ({
    id: crypto.randomUUID(),
    text: t,
    originalText: t
  }));

  // Single line comment: Use functional update to ensure we don't overwrite current X/Y/W/H values.
  setNodes(prevNodes => prevNodes.map(n => 
    n.id === nodeId ? { ...n, textBlocks } : n
  ));
};

/**
 * Action: Apply text updates to the image.
 */
export const updateAction = async (ctx: ToolExecutionContext): Promise<void> => {
  const { nodes, selectedNodeIds, setNodes, pushHistory } = ctx;
  if (selectedNodeIds.length !== 1) return;

  const nodeId = selectedNodeIds[0];
  const node = nodes.find(n => n.id === nodeId);
  if (!node || !node.textBlocks) return;

  const changes = node.textBlocks
    .filter(b => b.text !== b.originalText)
    .map(b => ({ original: b.originalText, updated: b.text }));

  if (changes.length === 0) return;

  const newSrc = await updateTextInImage(node.src, changes);

  pushHistory(nodes);

  // Single line comment: Merges new image source into the latest node state.
  setNodes(prevNodes => prevNodes.map(n => {
    if (n.id === nodeId) {
      return { 
        ...n, 
        src: newSrc, 
        textBlocks: n.textBlocks?.map(b => ({ ...b, originalText: b.text }))
      };
    }
    return n;
  }));
};