import React, { useState, useRef } from 'react';
import LeftPanel from '../left-panel/index.tsx';
import RightPanel from '../right-panel/index.tsx';
import CentralArea from '../central/index.tsx';
import { EditorNode, ToolMode, Point } from './types.ts';
import { DEFAULT_NODE_WIDTH } from './constants.ts';
import { detachObjectWithGemini } from '../services/gemini.service.ts';
import { loadImage, createCroppedSelection } from '../central/canvas/helpers/canvas.utils.ts';

/**
 * EditorRoot Component
 * The central brain orchestrating canvas nodes, project state, and AI services.
 */
const EditorRoot: React.FC = () => {
  const [nodes, setNodes] = useState<EditorNode[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.SELECT);
  const [lassoPath, setLassoPath] = useState<Point[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  // Setting the default project name to 'Gemini 3 Project' as requested
  const [projectName, setProjectName] = useState("Gemini 3 Project");
  // State for pixel grid visibility - Defaulting to false as requested
  const [showGrid, setShowGrid] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Function to create a new image node from source
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
      setNodes(prev => [...prev, node]); 
      setSelectedNodeIds([node.id]); 
      setToolMode(ToolMode.SELECT);
    } catch (error) {
      console.error("Asset import error:", error);
    }
  };

  // Bulk update multiple nodes in one state update
  const handleUpdateNodes = (updatedNodes: EditorNode[]) => {
    setNodes(prev => {
      const next = [...prev];
      updatedNodes.forEach(un => {
        const idx = next.findIndex(n => n.id === un.id);
        if (idx !== -1) next[idx] = un;
      });
      return next;
    });
  };

  // Execute the Gemini-powered object detachment pipeline
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

        if (result.background) {
            setNodes(prev => prev.map(n => n.id === active.id ? { ...n, src: result.background!, name: `${n.name} (Plate)` } : n));
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
            setNodes(prev => [...prev, newNode]); 
            setSelectedNodeIds([newNode.id]);
        }
        setLassoPath([]); setToolMode(ToolMode.SELECT);
    } catch (e) { 
        alert("AI Pipeline error. Selection might be too complex."); 
    } finally { 
        setIsProcessing(false); 
    }
  };

  // Delete a specific node from state
  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setSelectedNodeIds(prev => prev.filter(sid => sid !== id));
  };

  return (
    <div className="flex h-screen w-screen bg-bk-70 text-fg-50 overflow-hidden font-sans select-none">
      {/* Sidebar for assets, layers, and project settings */}
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
      {/* Central workspace for canvas and primary tools */}
      <CentralArea 
        nodes={nodes}
        toolMode={toolMode}
        setToolMode={setToolMode}
        selectedNodeIds={selectedNodeIds}
        setSelectedNodeIds={setSelectedNodeIds}
        lassoPath={lassoPath}
        setLassoPath={setLassoPath}
        onUpdateNode={un => handleUpdateNodes([un])}
        onUpdateNodes={handleUpdateNodes}
        onDeleteNode={handleDeleteNode}
        isProcessing={isProcessing}
        onDetach={handleDetach}
        setCanvasRef={r => canvasRef.current = r}
        showGrid={showGrid}
      />
      {/* Sidebar for fine-tuned property controls */}
      <RightPanel />
    </div>
  );
};

export default EditorRoot;