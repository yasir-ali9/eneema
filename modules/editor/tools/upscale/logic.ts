import { ToolExecutionContext } from '../types.ts';
import { upscaleImageWithGemini } from './service.ts';
import { EditorNode, ToolMode } from '../../core/types.ts';

/**
 * Executes the Upscale tool logic.
 * Single line comment: Replaces the current image source with a 4K AI-enhanced version.
 */
export const execute = async (ctx: ToolExecutionContext): Promise<void> => {
    const { nodes, selectedNodeIds, pushHistory, setNodes, setToolMode } = ctx;

    if (selectedNodeIds.length !== 1) return;

    const nodeId = selectedNodeIds[0];
    const activeNode = nodes.find(n => n.id === nodeId);
    if (!activeNode) return;

    // Single line comment: Call the Gemini service to generate a 4K version of the image.
    const upscaledSrc = await upscaleImageWithGemini(activeNode.src);
    
    // Single line comment: Preserve history before applying the high-res texture update.
    pushHistory(nodes);

    // Single line comment: Update the node atomically.
    setNodes(prevNodes => prevNodes.map(n => n.id === nodeId ? {
        ...n,
        src: upscaledSrc,
        name: `${n.name} (4K)`
    } : n));

    setToolMode(ToolMode.SELECT);
};