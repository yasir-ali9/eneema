import { ToolExecutionContext } from '../types.ts';
import { eraseObjectWithGemini } from './service.ts';
import { loadImage } from '../../central/canvas/helpers/canvas.utils.ts';

/**
 * Executes the Generative Erase tool logic.
 * Single line comment: Processes selections into a red highlight hint and calls the AI inpainting service.
 */
export const execute = async (ctx: ToolExecutionContext): Promise<void> => {
  const { nodes, selectedNodeIds, lassoPath, brushStrokes, pushHistory, setNodes, setLassoPath, setBrushStrokes } = ctx;

  if (selectedNodeIds.length !== 1 || (lassoPath.length < 3 && brushStrokes.length === 0)) return;

  const nodeId = selectedNodeIds[0];
  const active = nodes.find(n => n.id === nodeId);
  if (!active) return;

  // 1. Generate Hint Image (Original + Red Overlay)
  const img = await loadImage(active.src);
  const canvas = document.createElement('canvas');
  canvas.width = active.width;
  canvas.height = active.height;
  const hCtx = canvas.getContext('2d')!;
  hCtx.drawImage(img, 0, 0, active.width, active.height);

  const localLasso = lassoPath.map(p => ({ x: p.x - active.x, y: p.y - active.y }));
  const localStrokes = brushStrokes.map(stroke => stroke.map(p => ({ x: p.x - active.x, y: p.y - active.y })));

  hCtx.save();
  hCtx.globalAlpha = 0.5;
  hCtx.fillStyle = '#FF0000';
  hCtx.strokeStyle = '#FF0000';
  hCtx.lineWidth = 30;
  hCtx.lineCap = 'round';
  hCtx.lineJoin = 'round';

  if (localLasso.length > 2) {
    hCtx.beginPath();
    hCtx.moveTo(localLasso[0].x, localLasso[0].y);
    localLasso.forEach(p => hCtx.lineTo(p.x, p.y));
    hCtx.fill();
  }

  if (localStrokes.length > 0) {
    localStrokes.forEach(stroke => {
      if (stroke.length < 1) return;
      hCtx.beginPath();
      hCtx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(p => hCtx.lineTo(p.x, p.y));
      hCtx.stroke();
    });
  }
  hCtx.restore();

  // 2. Call AI
  const erasedSrc = await eraseObjectWithGemini(active.src, canvas.toDataURL('image/jpeg', 0.8));

  // 3. Update State
  pushHistory(nodes);
  setNodes(prevNodes => prevNodes.map(n => n.id === nodeId ? { ...n, src: erasedSrc } : n));
  
  // 4. Cleanup UI
  setLassoPath([]);
  setBrushStrokes([]);
};