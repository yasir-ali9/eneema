import React, { useState, useRef, useEffect, useMemo } from 'react';
import LeftPanel from '../left-panel/index.tsx';
import RightPanel from '../right-panel/index.tsx';
import CentralArea from '../central/index.tsx';
import { EditorNode, ToolMode, Point } from './types.ts';
import { DEFAULT_NODE_WIDTH } from './constants.ts';
import { loadImage } from '../central/canvas/helpers/canvas.utils.ts';
import { useEditorHistory } from './hooks/use-editor-history.ts';
import { DetachTool } from '../tools/detach/index.ts';
import { PlaceTool } from '../tools/place/index.ts';
import { ToolExecutionContext } from '../tools/types.ts';

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

  // Tool Context for delegating logic
  const toolContext: ToolExecutionContext = {
    nodes,
    selectedNodeIds,
    lassoPath,
    pushHistory,
    setNodes,
    setSelectedNodeIds,
    setLassoPath,
    setToolMode
  };

  // Determine if "Place" is possible
  const canPlace = useMemo(() => {
    if (selectedNodeIds.length !== 1) return false;
    const fgId = selectedNodeIds[0];
    const fgIndex = nodes.findIndex(n => n.id === fgId);
    if (fgIndex <= 0) return false; 
    
    // Check intersection with the immediate background node
    const fg = nodes[fgIndex];
    const bg = nodes[fgIndex - 1];
    
    return !(fg.x > bg.x + bg.width || 
             fg.x + fg.width < bg.x || 
             fg.y > bg.y + bg.height || 
             fg.y + fg.height < bg.y);
  }, [nodes, selectedNodeIds]);

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
      pushHistory(nodes);
      setNodes([...nodes, node]); 
      setSelectedNodeIds([node.id]); 
      setToolMode(ToolMode.SELECT);
    } catch (error) {
      console.error("Asset import error:", error);
    }
  };

  const duplicateNodes = () => {
    if (selectedNodeIds.length === 0) return;
    
    const newNodesToSelect: string[] = [];
    const newClonedBatch: EditorNode[] = [];
    const gap = 20; 

    const isPositionOccupied = (x: number, y: number, currentBatch: EditorNode[]) => {
      const allNodes = [...nodes, ...currentBatch];
      return allNodes.some(n => 
        Math.abs(n.x - x) < 10 && Math.abs(n.y - y) < 10
      );
    };
    
    const sortedSelection = nodes
      .filter(n => selectedNodeIds.includes(n.id))
      .sort((a, b) => a.x - b.x);

    sortedSelection.forEach(node => {
      let targetX = node.x + node.width + gap;
      let targetY = node.y;

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
      pushHistory(nodes);
      setNodes([...nodes, ...newClonedBatch]);
      setSelectedNodeIds(newNodesToSelect);
    }
  };

  const handleUpdateNodes = (updatedNodes: EditorNode[]) => {
    const nextNodes = nodes.map(n => {
      const updated = updatedNodes.find(un => un.id === n.id);
      return updated ? updated : n;
    });
    setNodes(nextNodes);
  };

  const handlePushHistory = (snapshot: EditorNode[]) => {
    pushHistory(snapshot);
  };

  // --- Tool Execution Wrappers ---

  const handlePlace = async () => {
    if (!canPlace) return;
    setIsProcessing(true);
    try {
        await PlaceTool.execute(toolContext);
    } catch (e) {
        console.error("Place failed", e);
        alert("Failed to place object. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDetach = async () => {
    if (!selectedNodeIds[0] || lassoPath.length < 3) return;
    setIsProcessing(true);
    try {
        await DetachTool.execute(toolContext);
    } catch (e) { 
        console.error(e);
        alert("AI Pipeline error. Selection might be too complex."); 
    } finally { 
        setIsProcessing(false); 
    }
  };

  // --- End Tool Wrappers ---

  const handleDeleteNode = (id: string) => {
    pushHistory(nodes);
    setNodes(nodes.filter(n => n.id !== id));
    setSelectedNodeIds(prev => prev.filter(sid => sid !== id));
  };

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
        e.preventDefault();
        duplicateNodes();
      }
    };
    window.addEventListener('keydown', handleUndoRedo);
    return () => window.removeEventListener('keydown', handleUndoRedo);
  }, [undo, redo, nodes, selectedNodeIds]);

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
