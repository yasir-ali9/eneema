import React, { useState, useRef, useEffect, useMemo } from 'react';
import LeftPanel from '../left-panel/index.tsx';
import RightPanel from '../right-panel/index.tsx';
import CentralArea from '../central/index.tsx';
import { EditorNode, ToolMode, Point } from './types.ts';
import { DEFAULT_NODE_WIDTH } from './constants.ts';
import { detachObjectWithGemini, placeObjectWithGemini } from '../services/gemini.service.ts';
import { loadImage, createCroppedSelection, cropTransparentImage, createCompositeAndMask } from '../central/canvas/helpers/canvas.utils.ts';
import { useEditorHistory } from './hooks/use-editor-history.ts';

/**
 * EditorRoot Component
 * The central brain orchestrating canvas nodes, project state, and AI services.
 */
const EditorRoot: React.FC = () => {
  // Enhanced history management
  const { nodes, setNodes, pushHistory, undo, redo, canUndo, canRedo } = useEditorHistory([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.SELECT);
  const [lassoPath, setLassoPath] = useState<Point[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectName, setProjectName] = useState("Gemini 3 Project");
  const [showGrid, setShowGrid] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine if "Place" is possible
  // Rules: 1 node selected, and it must intersect with a node strictly "behind" it in the array
  const canPlace = useMemo(() => {
    if (selectedNodeIds.length !== 1) return false;
    const fgId = selectedNodeIds[0];
    const fgIndex = nodes.findIndex(n => n.id === fgId);
    if (fgIndex <= 0) return false; // Nothing behind it
    
    // Check intersection with the immediate background node (simplified)
    const fg = nodes[fgIndex];
    const bg = nodes[fgIndex - 1]; // Node immediately below
    
    // Simple AABB intersection check
    return !(fg.x > bg.x + bg.width || 
             fg.x + fg.width < bg.x || 
             fg.y > bg.y + bg.height || 
             fg.y + fg.height < bg.y);
  }, [nodes, selectedNodeIds]);

  // Adds a node and commits current state to history beforehand
  const addNode = async (src: string) => {
    try {
      const img = await loadImage(src);
      const node: EditorNode = { 
          id: crypto.randomUUID(), 
          type: 'image', 
          src, 
          x: 100, y: 100, 
          width: DEFAULT_NODE_WIDTH, 
          height: Math.round(DEFAULT_NODE_WIDTH * (img.height/img.width)), 
          rotation: 0, opacity: 1, 
          name: `Node ${nodes.length + 1}` 
      };
      // Commit state before modification
      pushHistory(nodes);
      setNodes([...nodes, node]); 
      setSelectedNodeIds([node.id]); 
      setToolMode(ToolMode.SELECT);
    } catch (error) {
      console.error("Asset import error:", error);
    }
  };

  /**
   * Clones selected nodes and places them to the right.
   * If a node already exists in the target spot, it shifts further right.
   */
  const duplicateNodes = () => {
    if (selectedNodeIds.length === 0) return;
    
    const newNodesToSelect: string[] = [];
    const newClonedBatch: EditorNode[] = [];
    const gap = 20; // Padding between nodes

    // Helper to check if a specific position is occupied by any node
    const isPositionOccupied = (x: number, y: number, currentBatch: EditorNode[]) => {
      // Check against current nodes on canvas AND nodes we just created in this batch
      const allNodes = [...nodes, ...currentBatch];
      return allNodes.some(n => 
        Math.abs(n.x - x) < 10 && Math.abs(n.y - y) < 10
      );
    };
    
    // Sort nodes to maintain relative order if multiple are selected
    const sortedSelection = nodes
      .filter(n => selectedNodeIds.includes(n.id))
      .sort((a, b) => a.x - b.x);

    sortedSelection.forEach(node => {
      let targetX = node.x + node.width + gap;
      let targetY = node.y;

      // Smart collision detection: keep moving right until we find an empty "slot"
      // This mimics the "put even after it" behavior from Figma
      while (isPositionOccupied(targetX, targetY, newClonedBatch)) {
        targetX += node.width + gap;
      }

      const newNode: EditorNode = {
        ...node,
        id: crypto.randomUUID(),
        x: targetX,
        y: targetY,
        name: `${node.name} (Copy)`
      };
      
      newClonedBatch.push(newNode);
      newNodesToSelect.push(newNode.id);
    });

    if (newClonedBatch.length > 0) {
      // Record history snapshot before duplicating
      pushHistory(nodes);
      setNodes([...nodes, ...newClonedBatch]);
      setSelectedNodeIds(newNodesToSelect);
    }
  };

  // Transiently updates nodes (used for live dragging/resizing)
  const handleUpdateNodes = (updatedNodes: EditorNode[]) => {
    const nextNodes = nodes.map(n => {
      const updated = updatedNodes.find(un => un.id === n.id);
      return updated ? updated : n;
    });
    setNodes(nextNodes);
  };

  // Records a specific snapshot to history
  const handlePushHistory = (snapshot: EditorNode[]) => {
    pushHistory(snapshot);
  };

  // AI Place Logic (Smart Blend)
  const handlePlace = async () => {
    if (!canPlace) return;
    setIsProcessing(true);
    
    try {
        const fgId = selectedNodeIds[0];
        const fgIndex = nodes.findIndex(n => n.id === fgId);
        const fg = nodes[fgIndex];
        const bg = nodes[fgIndex - 1]; // Overlap confirmed by canPlace useMemo

        // 1. Prepare Composite & Mask
        const { composite, mask } = await createCompositeAndMask(bg, fg);

        // 2. Call AI Service
        const placedResult = await placeObjectWithGemini(composite, mask);

        // 3. Update State
        pushHistory(nodes);
        
        // We replace the BG node with the new result and remove the FG node
        // The new node retains the BG's dimensions/position as it is the "scene"
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
        setSelectedNodeIds([bg.id]); // Select the newly merged node

    } catch (e) {
        console.error("Place failed", e);
        alert("Failed to place object. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  // AI Detach logic with proper history recording and auto-cropping
  const handleDetach = async () => {
    if (!selectedNodeIds[0] || lassoPath.length < 3) return;
    setIsProcessing(true);
    try {
        const active = nodes.find(n => n.id === selectedNodeIds[0])!;
        const originalImg = await loadImage(active.src); // Pre-load to get natural dimensions

        const localPath = lassoPath.map(p => ({ x: p.x - active.x, y: p.y - active.y }));
        
        const hintCanvas = document.createElement('canvas'); 
        hintCanvas.width = active.width; hintCanvas.height = active.height;
        const hCtx = hintCanvas.getContext('2d')!; 
        hCtx.drawImage(originalImg, 0, 0, active.width, active.height);
        hCtx.fillStyle = 'rgba(255, 0, 0, 0.7)'; 
        hCtx.beginPath(); hCtx.moveTo(localPath[0].x, localPath[0].y);
        localPath.forEach(p => hCtx.lineTo(p.x, p.y)); hCtx.fill();

        const croppedHint = await createCroppedSelection(active.src, localPath, active.width, active.height);
        const result = await detachObjectWithGemini(active.src, hintCanvas.toDataURL(), croppedHint);

        // Commit state before AI modifications
        pushHistory(nodes);

        let finalNodes = [...nodes];
        
        // 1. Handle Background (Plate)
        if (result.background) {
            finalNodes = finalNodes.map(n => n.id === active.id ? { ...n, src: result.background!, name: `${n.name} (Plate)` } : n);
        }
        
        // 2. Handle Object (Cutout)
        if (result.object) {
            let newSrc = result.object;
            let newX = active.x;
            let newY = active.y;
            let newW = active.width;
            let newH = active.height;

            // Auto-crop to remove transparent whitespace
            const cropInfo = await cropTransparentImage(result.object);
            if (cropInfo) {
                newSrc = cropInfo.src;
                
                // Calculate scale factors (Active Size / Natural Size)
                const scaleX = active.width / originalImg.width;
                const scaleY = active.height / originalImg.height;

                // Rotation Math to maintain visual position
                // We must account for the shift in center of mass caused by cropping
                const rad = active.rotation * (Math.PI / 180);
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                // Offsets in texture space
                const texCenterX = originalImg.width / 2;
                const texCenterY = originalImg.height / 2;
                const cropCenterX = cropInfo.x + cropInfo.width / 2;
                const cropCenterY = cropInfo.y + cropInfo.height / 2;

                // Vector from old center to new center (Texture Space)
                const dxTex = cropCenterX - texCenterX;
                const dyTex = cropCenterY - texCenterY;

                // Vector in World Space (before rotation)
                const dxLocal = dxTex * scaleX;
                const dyLocal = dyTex * scaleY;

                // Rotate the vector
                const dxWorld = dxLocal * cos - dyLocal * sin;
                const dyWorld = dxLocal * sin + dyLocal * cos;

                // Apply to old center to get new center
                const oldWorldCenterX = active.x + active.width / 2;
                const oldWorldCenterY = active.y + active.height / 2;
                const newWorldCenterX = oldWorldCenterX + dxWorld;
                const newWorldCenterY = oldWorldCenterY + dyWorld;

                // Final Top-Left
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
        setLassoPath([]); setToolMode(ToolMode.SELECT);
    } catch (e) { 
        console.error(e);
        alert("AI Pipeline error. Selection might be too complex."); 
    } finally { 
        setIsProcessing(false); 
    }
  };

  // Deletes node and commits state
  const handleDeleteNode = (id: string) => {
    pushHistory(nodes);
    setNodes(nodes.filter(n => n.id !== id));
    setSelectedNodeIds(prev => prev.filter(sid => sid !== id));
  };

  // Global hotkeys for Undo/Redo and Duplicate
  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const isD = e.key.toLowerCase() === 'd';
      const isMod = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isMod && isZ && !isShift) {
        e.preventDefault();
        undo();
      } else if ((isMod && isZ && isShift) || (isMod && isY)) {
        e.preventDefault();
        redo();
      } else if (isMod && isD) {
        // Handle global Duplicate shortcut
        e.preventDefault();
        duplicateNodes();
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [undo, redo, nodes, selectedNodeIds]); // Dependencies updated to ensure latest state is captured for duplication

  return (
    <div className="flex h-screen w-screen bg-bk-70 text-fg-50 overflow-hidden font-sans select-none">
      <LeftPanel 
        nodes={nodes} 
        selectedNodeIds={selectedNodeIds} 
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onImportImage={addNode} 
        onSelectNode={id => setSelectedNodeIds([id])} 
        onDeleteNode={handleDeleteNode}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />
      <CentralArea 
        nodes={nodes}
        toolMode={toolMode}
        setToolMode={setToolMode}
        selectedNodeIds={selectedNodeIds}
        setSelectedNodeIds={setSelectedNodeIds}
        lassoPath={lassoPath}
        setLassoPath={setLassoPath}
        onUpdateNodes={handleUpdateNodes}
        onPushHistory={handlePushHistory}
        onDeleteNode={handleDeleteNode}
        onDuplicateNodes={duplicateNodes}
        isProcessing={isProcessing}
        onDetach={handleDetach}
        onPlace={handlePlace}
        canPlace={canPlace}
        setCanvasRef={r => canvasRef.current = r}
        showGrid={showGrid}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <RightPanel />
    </div>
  );
};

export default EditorRoot;