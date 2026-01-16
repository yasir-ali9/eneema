import { ToolExecutionContext } from '../types.ts';
import { createCroppedSelection, cropTransparentImage } from './detach.utils.ts';
import { detachObjectWithGemini } from './detach.service.ts';
import { loadImage } from '../../central/canvas/helpers/canvas.utils.ts';
import { EditorNode, ToolMode } from '../../core/types.ts';

/**
 * Detach Tool Logic
 * Extracts an object from a background, inpaints the hole, and creates a new cropped node.
 */
export const execute = async (ctx: ToolExecutionContext): Promise<void> => {
    const { nodes, selectedNodeIds, lassoPath, brushStrokes, pushHistory, setNodes, setSelectedNodeIds, setLassoPath, setBrushStrokes, setToolMode } = ctx;

    // Safety check: ensure a node is selected and there is a selection area
    if (!selectedNodeIds[0] || (lassoPath.length < 3 && brushStrokes.length === 0)) return;

    const nodeId = selectedNodeIds[0];
    const active = nodes.find(n => n.id === nodeId)!;
    const originalImg = await loadImage(active.src);

    // Convert global selection points to local node-relative coordinates
    const localLasso = lassoPath.map(p => ({ x: p.x - active.x, y: p.y - active.y }));
    const localStrokes = brushStrokes.map(stroke => stroke.map(p => ({ x: p.x - active.x, y: p.y - active.y })));
    
    // Create a hint canvas with the original image and a red highlight for the AI
    const hintCanvas = document.createElement('canvas'); 
    hintCanvas.width = active.width; hintCanvas.height = active.height;
    const hCtx = hintCanvas.getContext('2d')!; 
    hCtx.drawImage(originalImg, 0, 0, active.width, active.height);
    
    const buffer = document.createElement('canvas');
    buffer.width = active.width; buffer.height = active.height;
    const bCtx = buffer.getContext('2d')!;
    bCtx.fillStyle = '#FF0000'; 
    bCtx.strokeStyle = '#FF0000';
    bCtx.lineCap = 'round';
    bCtx.lineJoin = 'round';
    bCtx.lineWidth = 30;

    if (localLasso.length > 2) {
        bCtx.beginPath(); 
        bCtx.moveTo(localLasso[0].x, localLasso[0].y);
        localLasso.forEach(p => bCtx.lineTo(p.x, p.y)); 
        bCtx.fill();
    }

    if (localStrokes.length > 0) {
        localStrokes.forEach(stroke => {
            if (stroke.length < 1) return;
            bCtx.beginPath();
            bCtx.moveTo(stroke[0].x, stroke[0].y);
            stroke.forEach(p => bCtx.lineTo(p.x, p.y));
            bCtx.stroke();
        });
    }

    hCtx.save();
    hCtx.globalAlpha = 0.45;
    hCtx.drawImage(buffer, 0, 0);
    hCtx.restore();

    // Prepare inputs for the AI service
    const croppedHint = await createCroppedSelection(active.src, localLasso, active.width, active.height, 120, localStrokes);
    const result = await detachObjectWithGemini(active.src, hintCanvas.toDataURL(), croppedHint);

    pushHistory(nodes);

    // Single line comment: Fetch new node ID early to handle selection after update.
    const newObjectId = crypto.randomUUID();

    // Prepare the final object source and dimensions
    let finalObjectSrc = result.object;
    let finalObjectX = active.x;
    let finalObjectY = active.y;
    let finalObjectW = active.width;
    let finalObjectH = active.height;

    // Apply auto-cropping to the extracted object to prevent full-frame nodes
    if (result.object) {
        const cropInfo = await cropTransparentImage(result.object);
        if (cropInfo) {
            const scaleX = active.width / originalImg.width;
            const scaleY = active.height / originalImg.height;
            
            finalObjectSrc = cropInfo.src;
            finalObjectX = active.x + (cropInfo.x * scaleX);
            finalObjectY = active.y + (cropInfo.y * scaleY);
            finalObjectW = cropInfo.width * scaleX;
            finalObjectH = cropInfo.height * scaleY;
        }
    }

    setNodes(prevNodes => {
        let nextNodes = [...prevNodes];
        
        // Update Background: Replace with inpainted version
        if (result.background) {
            nextNodes = nextNodes.map(n => n.id === nodeId ? { ...n, src: result.background!, name: `${n.name} (Plate)` } : n);
        }
        
        // Add Object: Create new tightly-cropped node
        if (finalObjectSrc) {
            const newNode: EditorNode = { 
                id: newObjectId, 
                type: 'image', 
                src: finalObjectSrc, 
                x: finalObjectX, y: finalObjectY, 
                width: finalObjectW, height: finalObjectH, 
                rotation: active.rotation, opacity: 1, 
                name: result.label || "Extracted Object" 
            };
            nextNodes.push(newNode);
        }
        return nextNodes;
    });

    // Clean up UI and select the newly created object
    setSelectedNodeIds([newObjectId]);
    setLassoPath([]); 
    setBrushStrokes([]);
    setToolMode(ToolMode.SELECT);
};