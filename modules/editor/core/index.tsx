import React, { useState, useRef, useEffect } from 'react';
import LeftPanel from '../left-panel/index.tsx';
import RightPanel from '../right-panel/index.tsx';
import CentralArea from '../central/index.tsx';
import { EditorNode, ToolMode, Point } from './types.ts';
import { DEFAULT_NODE_WIDTH } from './constants.ts';
import { detachObjectWithGemini } from '../services/gemini.service.ts';
import { loadImage, createCroppedSelection } from '../central/canvas/helpers/canvas.utils.ts';
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

  // AI Detach logic with proper history recording
  const handleDetach = async () => {
    if (!selectedNodeIds[0] || lassoPath.length < 3) return;
    setIsProcessing(true);
    try {
        const active = nodes.find(n => n.id === selectedNodeIds[0])!;
        const localPath = lassoPath.map(p => ({ x: p.x - active.x, y: p.y - active.y }));
        
        const hintCanvas = document.createElement('canvas'); 
        hintCanvas.width = active.width; hintCanvas.height = active.height;
        const hCtx = hintCanvas.getContext('2d')!; 
        hCtx.drawImage(await loadImage(active.src), 0, 0, active.width, active.height);
        hCtx.fillStyle = 'rgba(255, 0, 0, 0.7)'; 
        hCtx.beginPath(); hCtx.moveTo(localPath[0].x, localPath[0].y);
        localPath.forEach(p => hCtx.lineTo(p.x, p.y)); hCtx.fill();

        const croppedHint = await createCroppedSelection(active.src, localPath, active.width, active.height);
        const result = await detachObjectWithGemini(active.src, hintCanvas.toDataURL(), croppedHint);

        // Commit state before AI modifications
        pushHistory(nodes);

        let finalNodes = [...nodes];
        if (result.background) {
            finalNodes = finalNodes.map(n => n.id === active.id ? { ...n, src: result.background!, name: `${n.name} (Plate)` } : n);
        }
        if (result.object) {
            const newNode: EditorNode = { 
                id: crypto.randomUUID(), 
                type: 'image', 
                src: result.object, 
                x: active.x, y: active.y, 
                width: active.width, height: active.height, 
                rotation: active.rotation, opacity: 1, 
                name: result.label || "Extracted Object" 
            };
            finalNodes.push(newNode);
            setSelectedNodeIds([newNode.id]);
        }
        setNodes(finalNodes);
        setLassoPath([]); setToolMode(ToolMode.SELECT);
    } catch (e) { 
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

  // Global hotkeys for Undo/Redo
  useEffect(() => {
    const handleUndoRedo = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const isMod = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      if (isMod && isZ && !isShift) {
        e.preventDefault();
        undo();
      } else if ((isMod && isZ && isShift) || (isMod && isY)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [undo, redo]);

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
        isProcessing={isProcessing}
        onDetach={handleDetach}
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
