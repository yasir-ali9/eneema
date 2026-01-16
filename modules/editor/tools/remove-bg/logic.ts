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

    const activeNode = nodes.find(n => n.id === selectedNodeIds[0]);
    if (!activeNode) return;

    // 1. Get the binary mask from Gemini
    const maskData = await removeBackgroundWithGemini(activeNode.src);
    
    // 2. Apply the mask to the original image
    const transparentSrc = await applyMaskToImage(activeNode.src, maskData);
    
    // 3. Auto-crop the result to remove empty transparent space
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
        
        // Adjust position based on crop offset
        finalNodeData = {
            x: activeNode.x + (cropInfo.x * scaleX),
            y: activeNode.y + (cropInfo.y * scaleY),
            width: cropInfo.width * scaleX,
            height: cropInfo.height * scaleY
        };
    }

    // 4. Update the node in place
    const updatedNodes = nodes.map(n => n.id === activeNode.id ? {
        ...n,
        src: finalSrc,
        ...finalNodeData,
        name: `${n.name} (Cutout)`
    } : n);

    setNodes(updatedNodes);
    setToolMode(ToolMode.SELECT);
};