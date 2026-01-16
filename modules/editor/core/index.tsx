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
import { EditTextTool } from '../tools/edit-text/index.ts';
import { ToolExecutionContext } from '../tools/types.ts';
import { Button } from '../../../components/button.tsx';
import { Key } from 'lucide-react';

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
  const [brushStrokes, setBrushStrokes] = useState<Point[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [projectName, setProjectName] = useState("Gemini 3 Project");
  const [showGrid, setShowGrid] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check for API key on mount to handle Veo/Gemini 3 Pro requirements
  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore - Internal API Studio global
      if (window.aistudio?.hasSelectedApiKey) {
        // @ts-ignore - Internal API Studio global
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true); // Fallback for environments without the select key requirement
      }
    };
    checkKey();
  }, []);

  // Opens the API key selection dialog provided by the platform
  const handleOpenSelectKey = async () => {
    // @ts-ignore - Internal API Studio global
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore - Internal API Studio global
      await window.aistudio.openSelectKey();
      // Assume success after triggering the dialog per guidelines
      setHasApiKey(true);
    }
  };

  // Tool Context for delegating logic to specific AI tool modules
  const toolContext: ToolExecutionContext = {
    nodes,
    selectedNodeIds,
    lassoPath,
    brushStrokes,
    pushHistory,
    setNodes,
    setSelectedNodeIds,
    setLassoPath,
    setBrushStrokes,
    setToolMode
  };

  // State derived helpers for UI feedback
  const activeNode = useMemo(() => nodes.find(n => n.id === selectedNodeIds[0]), [nodes, selectedNodeIds]);
  const hasTextBlocks = !!(activeNode?.textBlocks && activeNode.textBlocks.length > 0);
  const hasTextChanged = !!(activeNode?.textBlocks?.some(b => b.text !== b.originalText));

  // Determine if "Place" (Smart Blend) is possible based on node stacking and overlap
  const canPlace = useMemo(() => {
    if (selectedNodeIds.length !== 1) return false;
    const fgId = selectedNodeIds[0];
    const fgIndex = nodes.findIndex(n => n.id === fgId);
    if (fgIndex <= 0) return false; 
    
    const fg = nodes[fgIndex];
    const bg = nodes[fgIndex - 1];
    
    // Check if the foreground node intersects with its immediate background node
    return !(fg.x > bg.x + bg.width || 
             fg.x + fg.width < bg.x || 
             fg.y > bg.y + bg.height || 
             fg.y + fg.height < bg.y);
  }, [nodes, selectedNodeIds]);

  // Adds a new image node to the canvas at a default position
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
    } catch (err) {
      console.error("Failed to add node", err);
    }
  };

  // Synchronizes node updates across the canvas and panels
  const handleUpdateNodes = (updatedNodes: EditorNode[]) => {
    const nextNodes = nodes.map(n => {
      const updated = updatedNodes.find(un => un.id === n.id);
      return updated ? updated : n;
    });
    setNodes(nextNodes);
  };

  // Deletes a node and records the change in history
  const handleDeleteNode = (id: string) => {
    pushHistory(nodes);
    setNodes(nodes.filter(n => n.id !== id));
    setSelectedNodeIds(prev => prev.filter(sid => sid !== id));
  };

  // Duplicates the currently selected nodes
  const handleDuplicateNodes = () => {
    if (selectedNodeIds.length === 0) return;
    pushHistory(nodes);
    const newNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => ({
      ...n,
      id: crypto.randomUUID(),
      x: n.x + 40,
      y: n.y + 40,
      name: `${n.name} Copy`
    }));
    setNodes([...nodes, ...newNodes]);
    setSelectedNodeIds(newNodes.map(n => n.id));
  };

  // Executes the AI Detach tool logic
  const handleDetach = async () => {
    setIsProcessing(true);
    try {
      await DetachTool.execute(toolContext);
    } catch (err) {
      console.error("AI Detach Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Executes the AI Place (Smart Blend) tool logic
  const handlePlace = async () => {
    setIsProcessing(true);
    try {
      await PlaceTool.execute(toolContext);
    } catch (err) {
      console.error("AI Place Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Executes AI Text extraction or updates based on state
  const handleEditText = async () => {
    setIsProcessing(true);
    try {
      if (hasTextBlocks) {
        await EditTextTool.update(toolContext);
      } else {
        await EditTextTool.extract(toolContext);
      }
    } catch (err) {
      console.error("AI Text Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Show a setup screen if the user has not yet authenticated with an API key
  if (hasApiKey === false) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-bk-60 p-8 text-center">
        <div className="max-w-md bg-bk-50 border border-bd-50 p-8 rounded-2xl shadow-2xl">
          <Key className="w-12 h-12 text-ac-01 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-fg-30 mb-4">API Key Required</h2>
          <p className="text-fg-60 mb-8 text-sm leading-relaxed">
            To use the advanced AI features of Gemini 3, you need to select a valid API key from your Google Cloud project with billing enabled.
          </p>
          <Button variant="accent" onClick={handleOpenSelectKey} className="w-full h-12 text-base">
            Select API Key
          </Button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block mt-6 text-[11px] text-fg-70 hover:text-ac-01 underline uppercase tracking-widest">
            Billing Documentation
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Sidebar for project management and assets */}
      <LeftPanel 
        nodes={nodes} 
        selectedNodeIds={selectedNodeIds} 
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onImportImage={addNode}
        onSelectNode={(id) => setSelectedNodeIds([id])}
        onDeleteNode={handleDeleteNode}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
      />
      
      {/* Main viewport with canvas and dock */}
      <CentralArea 
        nodes={nodes}
        toolMode={toolMode}
        setToolMode={setToolMode}
        selectedNodeIds={selectedNodeIds}
        setSelectedNodeIds={setSelectedNodeIds}
        lassoPath={lassoPath}
        setLassoPath={setLassoPath}
        brushStrokes={brushStrokes}
        setBrushStrokes={setBrushStrokes}
        onUpdateNodes={handleUpdateNodes}
        onPushHistory={pushHistory}
        onDeleteNode={handleDeleteNode}
        onDuplicateNodes={handleDuplicateNodes}
        isProcessing={isProcessing}
        onDetach={handleDetach}
        onPlace={handlePlace}
        onEditText={handleEditText}
        hasTextBlocks={hasTextBlocks}
        hasTextChanged={hasTextChanged}
        canPlace={canPlace}
        setCanvasRef={(ref) => { canvasRef.current = ref; }}
        showGrid={showGrid}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Sidebar for editing object properties */}
      <RightPanel 
        nodes={nodes}
        selectedNodeIds={selectedNodeIds}
        onUpdateNodes={handleUpdateNodes}
        onPushHistory={() => pushHistory(nodes)}
      />
    </div>
  );
};

export default EditorRoot;