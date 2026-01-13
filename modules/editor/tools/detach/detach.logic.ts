import { ToolExecutionContext } from '../types.ts';
import { createCroppedSelection, cropTransparentImage } from './detach.utils.ts';
import { detachObjectWithGemini } from './detach.service.ts';
import { loadImage } from '../../central/canvas/helpers/canvas.utils.ts';
import { EditorNode, ToolMode } from '../../core/types.ts';

export const execute = async (ctx: ToolExecutionContext): Promise<void> => {
    const { nodes, selectedNodeIds, lassoPath, pushHistory, setNodes, setSelectedNodeIds, setLassoPath, setToolMode } = ctx;

    if (!selectedNodeIds[0] || lassoPath.length < 3) return;

    const active = nodes.find(n => n.id === selectedNodeIds[0])!;
    const originalImg = await loadImage(active.src);

    // Convert global lasso points to local node space
    const localPath = lassoPath.map(p => ({ x: p.x - active.x, y: p.y - active.y }));
    
    // Create Visual Hint (Red overlay) for the AI
    const hintCanvas = document.createElement('canvas'); 
    hintCanvas.width = active.width; hintCanvas.height = active.height;
    const hCtx = hintCanvas.getContext('2d')!; 
    hCtx.drawImage(originalImg, 0, 0, active.width, active.height);
    hCtx.fillStyle = 'rgba(255, 0, 0, 0.7)'; 
    hCtx.beginPath(); hCtx.moveTo(localPath[0].x, localPath[0].y);
    localPath.forEach(p => hCtx.lineTo(p.x, p.y)); hCtx.fill();

    // Get optimized inputs for API
    const croppedHint = await createCroppedSelection(active.src, localPath, active.width, active.height);
    
    // Call AI
    const result = await detachObjectWithGemini(active.src, hintCanvas.toDataURL(), croppedHint);

    // Commit History
    pushHistory(nodes);

    let finalNodes = [...nodes];
    
    // 1. Update Background (Inpainted)
    if (result.background) {
        finalNodes = finalNodes.map(n => n.id === active.id ? { ...n, src: result.background!, name: `${n.name} (Plate)` } : n);
    }
    
    // 2. Add Object (Cutout)
    if (result.object) {
        let newSrc = result.object;
        let newX = active.x;
        let newY = active.y;
        let newW = active.width;
        let newH = active.height;

        // Auto-crop optimization
        const cropInfo = await cropTransparentImage(result.object);
        if (cropInfo) {
            newSrc = cropInfo.src;
            
            // Re-calculate position based on crop
            const scaleX = active.width / originalImg.width;
            const scaleY = active.height / originalImg.height;

            const rad = active.rotation * (Math.PI / 180);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const texCenterX = originalImg.width / 2;
            const texCenterY = originalImg.height / 2;
            const cropCenterX = cropInfo.x + cropInfo.width / 2;
            const cropCenterY = cropInfo.y + cropInfo.height / 2;

            const dxTex = cropCenterX - texCenterX;
            const dyTex = cropCenterY - texCenterY;

            const dxLocal = dxTex * scaleX;
            const dyLocal = dyTex * scaleY;

            const dxWorld = dxLocal * cos - dyLocal * sin;
            const dyWorld = dxLocal * sin + dyLocal * cos;

            const oldWorldCenterX = active.x + active.width / 2;
            const oldWorldCenterY = active.y + active.height / 2;
            const newWorldCenterX = oldWorldCenterX + dxWorld;
            const newWorldCenterY = oldWorldCenterY + dyWorld;

            newW = cropInfo.width * scaleX;
            newH = cropInfo.height * scaleY;
            newX = newWorldCenterX - newW / 2;
            newY = newWorldCenterY - newH / 2;
        }

        const newNode: EditorNode = { 
            id: crypto.randomUUID(), 
            type: 'image', 
            src: newSrc, 
            x: newX, y: newY, 
            width: newW, height: newH, 
            rotation: active.rotation, opacity: 1, 
            name: result.label || "Extracted Object" 
        };
        finalNodes.push(newNode);
        setSelectedNodeIds([newNode.id]);
    }
    
    setNodes(finalNodes);
    setLassoPath([]); 
    setToolMode(ToolMode.SELECT);
};
