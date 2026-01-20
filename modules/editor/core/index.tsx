import React, { useState, useRef, useEffect, useMemo } from 'react';
import LeftPanel from '../left-panel/index.tsx';
import RightPanel from '../right-panel/index.tsx';
import CentralArea from '../central/index.tsx';
import { EditorNode, ToolMode, Point, Viewport } from './types.ts';
import { DEFAULT_NODE_WIDTH } from './constants.ts';
import { loadImage } from '../central/canvas/helpers/canvas.utils.ts';
import { useEditorHistory } from './hooks/use-editor-history.ts';
import { DetachTool } from '../tools/detach/index.ts';
import { PlaceTool } from '../tools/place/index.ts';
import { EditTextTool } from '../tools/edit-text/index.ts';
import { RemoveBgTool } from '../tools/remove-bg/index.ts';
import { EraseTool } from '../tools/erase/index.ts';
import { UpscaleTool } from '../tools/upscale/index.ts';
import { ToolExecutionContext } from '../tools/types.ts';
import { Button } from '../../../components/button/default.tsx';
import { Key } from 'lucide-react';

/**
 * EditorRoot Component
 * The central brain orchestrating canvas nodes, project state, and AI services.
 */
const EditorRoot: React.FC = () => {
  const { nodes, setNodes, pushHistory, undo, redo, canUndo, canRedo } = useEditorHistory([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.SELECT);
  const [lassoPath, setLassoPath] = useState<Point[]>([]);
  const [brushStrokes, setBrushStrokes] = useState<Point[][]>([]);
  
  // Single line comment: Viewport state elevated to EditorRoot for sharing with sidebar components.
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  
  const [processingTool, setProcessingTool] = useState<'detach' | 'place' | 'text' | 'remove-bg' | 'erase' | 'upscale' | null>(null);
  // Single line comment: Explicitly track which node is shimmering to prevent shimmer loss on deselection.
  const [activeProcessingNodeId, setActiveProcessingNodeId] = useState<string | null>(null);
  
  const [projectName, setProjectName] = useState("Gemini 3 Project");
  const [showGrid, setShowGrid] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Single line comment: Blocks native browser zoom (Ctrl/Cmd + Wheel) everywhere to prevent the UI from scaling unexpectedly.
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, []);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio?.hasSelectedApiKey) {
        // @ts-ignore
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else setHasApiKey(true);
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const toolContext: ToolExecutionContext = {
    nodes, selectedNodeIds, lassoPath, brushStrokes,
    pushHistory, setNodes, setSelectedNodeIds, setLassoPath, setBrushStrokes, setToolMode,
    setProcessingNodeId: setActiveProcessingNodeId
  };

  const activeNode = useMemo(() => nodes.find(n => n.id === selectedNodeIds[0]), [nodes, selectedNodeIds]);
  const hasTextBlocks = !!(activeNode?.textBlocks && activeNode.textBlocks.length > 0);
  const hasTextChanged = !!(activeNode?.textBlocks?.some(b => b.text !== b.originalText));
  const hasSelection = lassoPath.length > 2 || brushStrokes.length > 0;

  const canPlace = useMemo(() => {
    if (selectedNodeIds.length !== 1) return false;
    const fgId = selectedNodeIds[0];
    const fgIndex = nodes.findIndex(n => n.id === fgId);
    if (fgIndex <= 0) return false; 
    const fg = nodes[fgIndex];
    return nodes.slice(0, fgIndex).some(bg => {
       return !(fg.x > bg.x + bg.width || 
                fg.x + fg.width < bg.x || 
                fg.y > bg.y + bg.height || 
                fg.y + fg.height < bg.y);
    });
  }, [nodes, selectedNodeIds]);

  const addNode = async (src: string) => {
    try {
      const img = await loadImage(src);
      const newNodeId = crypto.randomUUID();
      const node: EditorNode = { 
          id: newNodeId, type: 'image', src, x: 100, y: 100, 
          width: DEFAULT_NODE_WIDTH, 
          height: Math.round(DEFAULT_NODE_WIDTH * (img.height/img.width)), 
          rotation: 0, opacity: 1, name: `Node ${nodes.length + 1}` 
      };
      pushHistory(nodes);
      const nextNodes = [...nodes, node];
      setNodes(nextNodes);
      setSelectedNodeIds([newNodeId]);
      
      // Single line comment: Initially adding an image does NOT trigger activeProcessingNodeId (no shimmer).
      setProcessingTool('text');
      try { await EditTextTool.extract({ ...toolContext, nodes: nextNodes, selectedNodeIds: [newNodeId] }); } 
      catch (e) { console.warn("Auto text extraction failed"); } 
      finally { setProcessingTool(null); }
    } catch (err) { console.error("Failed to add node", err); }
  };

  const handleUpdateNodes = (updatedNodes: EditorNode[]) => {
    const nextNodes = nodes.map(n => {
      const updated = updatedNodes.find(un => un.id === n.id);
      return updated ? updated : n;
    });
    setNodes(nextNodes);
  };

  const handleDeleteNode = (id: string) => {
    pushHistory(nodes);
    setNodes(nodes.filter(n => n.id !== id));
    setSelectedNodeIds(prev => prev.filter(sid => sid !== id));
  };

  const handleDuplicateNodes = () => {
    if (selectedNodeIds.length === 0) return;
    pushHistory(nodes);
    const newNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => ({
      ...n, id: crypto.randomUUID(), x: n.x + 40, y: n.y + 40, name: `${n.name} Copy`
    }));
    setNodes([...nodes, ...newNodes]);
    setSelectedNodeIds(newNodes.map(n => n.id));
  };

  const handleDetach = async () => {
    setProcessingTool('detach');
    setActiveProcessingNodeId(selectedNodeIds[0]);
    try { await DetachTool.execute(toolContext); } finally { setProcessingTool(null); setActiveProcessingNodeId(null); }
  };

  const handleErase = async () => {
    setProcessingTool('erase');
    setActiveProcessingNodeId(selectedNodeIds[0]);
    try { await EraseTool.execute(toolContext); } finally { setProcessingTool(null); setActiveProcessingNodeId(null); }
  };

  const handlePlace = async () => {
    setProcessingTool('place');
    setActiveProcessingNodeId(selectedNodeIds[0]);
    try { await PlaceTool.execute(toolContext); } finally { setProcessingTool(null); setActiveProcessingNodeId(null); }
  };

  const handleRemoveBg = async () => {
    setProcessingTool('remove-bg');
    setActiveProcessingNodeId(selectedNodeIds[0]);
    try { await RemoveBgTool.execute(toolContext); } finally { setProcessingTool(null); setActiveProcessingNodeId(null); }
  };

  const handleUpscale = async () => {
    setProcessingTool('upscale');
    setActiveProcessingNodeId(selectedNodeIds[0]);
    try { await UpscaleTool.execute(toolContext); } finally { setProcessingTool(null); setActiveProcessingNodeId(null); }
  };

  const handleUpdateText = async () => {
    setProcessingTool('text');
    // Single line comment: Manual text updates trigger the shimmer effect.
    setActiveProcessingNodeId(selectedNodeIds[0]);
    try { await EditTextTool.update(toolContext); } finally { setProcessingTool(null); setActiveProcessingNodeId(null); }
  };

  if (hasApiKey === false) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-bk-60 p-8 text-center">
        <div className="max-w-md bg-bk-50 border border-bd-50 p-8 rounded-2xl shadow-2xl">
          <Key className="w-12 h-12 text-ac-01 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-fg-30 mb-4">API Key Required</h2>
          <Button variant="accent" onClick={handleOpenSelectKey} className="w-full h-12 text-base">Select API Key</Button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block mt-6 text-[11px] text-fg-70 hover:text-ac-01 underline uppercase tracking-widest">Billing Documentation</a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Updated LeftPanel with injected Tool and History props for its new VerticalDock */}
      <LeftPanel 
        nodes={nodes} selectedNodeIds={selectedNodeIds} projectName={projectName}
        onProjectNameChange={setProjectName} onImportImage={addNode}
        onSelectNode={(id) => setSelectedNodeIds([id])} onDeleteNode={handleDeleteNode}
        showGrid={showGrid} onToggleGrid={() => setShowGrid(!showGrid)}
        toolMode={toolMode} onSetToolMode={setToolMode}
        onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo}
        zoom={viewport.zoom} // Single line comment: Passing the zoom level to the LeftPanel for display in VerticalDock.
      />
      
      {/* Central workspace - Added onSetNodes to distinguish between raw state changes and partial node property updates */}
      <CentralArea 
        nodes={nodes} toolMode={toolMode} setToolMode={setToolMode}
        selectedNodeIds={selectedNodeIds} setSelectedNodeIds={setSelectedNodeIds}
        lassoPath={lassoPath} setLassoPath={setLassoPath}
        brushStrokes={brushStrokes} setBrushStrokes={setBrushStrokes}
        onUpdateNodes={handleUpdateNodes} 
        onSetNodes={setNodes}
        onPushHistory={pushHistory}
        onDeleteNode={handleDeleteNode} onDuplicateNodes={handleDuplicateNodes}
        isProcessing={!!processingTool} processingNodeId={activeProcessingNodeId}
        setProcessingNodeId={setActiveProcessingNodeId}
        setCanvasRef={(ref) => { canvasRef.current = ref; }}
        showGrid={showGrid}
        viewport={viewport} 
        onUpdateViewport={setViewport} 
      />
      
      <RightPanel 
        nodes={nodes} selectedNodeIds={selectedNodeIds} onUpdateNodes={handleUpdateNodes}
        onPushHistory={() => pushHistory(nodes)} onDetach={handleDetach}
        onPlace={handlePlace} onRemoveBg={handleRemoveBg} onErase={handleErase}
        onUpscale={handleUpscale}
        onEditText={handleUpdateText} isProcessing={!!processingTool}
        processingTool={processingTool} hasSelection={hasSelection}
        hasTextBlocks={hasTextBlocks} hasTextChanged={hasTextChanged} canPlace={canPlace}
      />
    </div>
  );
};

export default EditorRoot;