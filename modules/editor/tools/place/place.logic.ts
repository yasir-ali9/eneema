import { ToolExecutionContext } from '../types.ts';
import { createCompositeAndMask } from './place.utils.ts';
import { placeObjectWithGemini } from './place.service.ts';

export const execute = async (ctx: ToolExecutionContext): Promise<void> => {
    const { nodes, selectedNodeIds, pushHistory, setNodes, setSelectedNodeIds } = ctx;

    if (selectedNodeIds.length !== 1) return;
    
    const fgId = selectedNodeIds[0];
    const fgIndex = nodes.findIndex(n => n.id === fgId);
    if (fgIndex <= 0) return; 

    const fg = nodes[fgIndex];
    const bg = nodes[fgIndex - 1]; 

    // 1. Prepare Composite & Mask
    const { composite, mask } = await createCompositeAndMask(bg, fg);

    // 2. Call AI Service
    const placedResult = await placeObjectWithGemini(composite, mask);

    // 3. Update State
    pushHistory(nodes);
    
    const newNodes = nodes.filter(n => n.id !== fg.id).map(n => {
        if (n.id === bg.id) {
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
