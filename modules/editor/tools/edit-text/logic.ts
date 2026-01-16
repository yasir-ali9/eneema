import { ToolExecutionContext } from '../types.ts';
import { extractTextWithGemini, updateTextInImage } from './service.ts';
import { EditorNode } from '../../core/types.ts';

/**
 * Action: Extract text from selected image
 */
export const extractAction = async (ctx: ToolExecutionContext): Promise<void> => {
  const { nodes, selectedNodeIds, setNodes } = ctx;
  if (selectedNodeIds.length !== 1) return;

  const node = nodes.find(n => n.id === selectedNodeIds[0]);
  if (!node) return;

  const texts: string[] = await extractTextWithGemini(node.src);
  
  const textBlocks = texts.map(t => ({
    id: crypto.randomUUID(),
    text: t,
    originalText: t
  }));

  const updatedNodes = nodes.map(n => 
    n.id === node.id ? { ...n, textBlocks } : n
  );

  setNodes(updatedNodes);
};

/**
 * Action: Apply text updates to the image
 */
export const updateAction = async (ctx: ToolExecutionContext): Promise<void> => {
  const { nodes, selectedNodeIds, setNodes, pushHistory } = ctx;
  if (selectedNodeIds.length !== 1) return;

  const node = nodes.find(n => n.id === selectedNodeIds[0]);
  if (!node || !node.textBlocks) return;

  // Filter only blocks that actually changed
  const changes = node.textBlocks
    .filter(b => b.text !== b.originalText)
    .map(b => ({ original: b.originalText, updated: b.text }));

  if (changes.length === 0) return;

  const newSrc = await updateTextInImage(node.src, changes);

  pushHistory(nodes);

  // Update node with new image and reset originalText tracking to the new state
  const updatedNodes = nodes.map(n => {
    if (n.id === node.id) {
      return { 
        ...n, 
        src: newSrc, 
        textBlocks: n.textBlocks?.map(b => ({ ...b, originalText: b.text }))
      };
    }
    return n;
  });

  setNodes(updatedNodes);
};