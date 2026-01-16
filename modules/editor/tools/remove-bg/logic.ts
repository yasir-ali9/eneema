import { ToolExecutionContext } from '../types.ts';
import { removeBackgroundWithGemini } from './service.ts';
import { applyMaskToImage, cropTransparentImage } from '../detach/detach.utils.ts';
import { loadImage } from '../../central/canvas/helpers/canvas.utils.ts';
import { EditorNode, ToolMode } from '../../core/types.ts';

/**
 * Executes the Background Removal tool logic.
 */
export const execute = async (ctx: ToolExecutionContext): Promise<void> => {
    const { nodes, selectedNodeIds, pushHistory, setNodes, setSelectedNodeIds, setToolMode } = ctx;

    if (selectedNodeIds.length !== 1) return;

    const nodeId = selectedNodeIds[0];
    const activeNode = nodes.find(n => n.id === nodeId);
    if (!activeNode) return;

    const maskData = await removeBackgroundWithGemini(activeNode.src);
    const transparentSrc = await applyMaskToImage(activeNode.src, maskData);
    const cropInfo = await cropTransparentImage(transparentSrc);
    
    pushHistory(nodes);

    let finalSrc = transparentSrc;
    let finalNodeData = { 
        x: activeNode.x, 
        y: activeNode.y, 
        width: activeNode.width, 
        height: activeNode.height 
    };

    if (cropInfo) {
        finalSrc = cropInfo.src;
        const img = await loadImage(activeNode.src);
        const scaleX = activeNode.width / img.width;
        const scaleY = activeNode.height / img.height;
        
        finalNodeData = {
            x: activeNode.x + (cropInfo.x * scaleX),
            y: activeNode.y + (cropInfo.y * scaleY),
            width: cropInfo.width * scaleX,
            height: cropInfo.height * scaleY
        };
    }

    // Single line comment: Atomically update node properties while preserving concurrent global state changes.
    setNodes(prevNodes => prevNodes.map(n => n.id === nodeId ? {
        ...n,
        src: finalSrc,
        ...finalNodeData,
        name: `${n.name} (Cutout)`
    } : n));

    setToolMode(ToolMode.SELECT);
};