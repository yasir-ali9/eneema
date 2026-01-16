import { ToolExecutionContext } from '../types.ts';
import { createCompositeAndMask } from './place.utils.ts';
import { placeObjectWithGemini } from './place.service.ts';
import { EditorNode } from '../../core/types.ts';

/**
 * Place Tool Logic
 * Blends a foreground object into a background scene using AI.
 */
export const execute = async (ctx: ToolExecutionContext): Promise<void> => {
    const { nodes, selectedNodeIds, pushHistory, setNodes, setSelectedNodeIds } = ctx;

    // We only support placing one item at a time
    if (selectedNodeIds.length !== 1) return;
    
    const fgId = selectedNodeIds[0];
    const fgIndex = nodes.findIndex(n => n.id === fgId);
    
    // Safety check: must be a layer above something else
    if (fgIndex <= 0) return; 

    const fg = nodes[fgIndex];
    
    // Find the topmost node below the selection that it actually intersects with
    let bg: EditorNode | null = null;
    for (let i = fgIndex - 1; i >= 0; i--) {
        const potentialBg = nodes[i];
        const intersects = !(fg.x > potentialBg.x + potentialBg.width || 
                            fg.x + fg.width < potentialBg.x || 
                            fg.y > potentialBg.y + potentialBg.height || 
                            fg.y + fg.height < potentialBg.y);
        if (intersects) {
            bg = potentialBg;
            break;
        }
    }

    // If no intersection was found after all, abort
    if (!bg) return;

    // 1. Prepare Composite & Mask for the AI generator
    const { composite, mask } = await createCompositeAndMask(bg, fg);

    // 2. Call Gemini AI Service to perform the smart blend
    const placedResult = await placeObjectWithGemini(composite, mask);

    // 3. Commit current state to history before destructive update
    pushHistory(nodes);
    
    // 4. Update state: Remove foreground and replace background content with AI result
    const newNodes = nodes.filter(n => n.id !== fg.id).map(n => {
        if (n.id === bg!.id) {
            return { 
                ...n, 
                src: placedResult, 
                name: `${n.name} + ${fg.name}` 
            };
        }
        return n;
    });

    setNodes(newNodes);
    setSelectedNodeIds([bg.id]);
};