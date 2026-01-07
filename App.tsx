import React, { useState, useRef, useCallback } from 'react';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import CanvasBoard from './components/CanvasBoard';
import Dock from './components/Dock';
import { Layer, ToolMode, Point, ProcessedImageResult } from './types';
import { DEFAULT_LAYER_WIDTH } from './constants';
import { detachObjectWithGemini } from './services/geminiService';
import { loadImage, getBoundingBox, createCroppedSelection } from './utils/canvasHelpers';

function App() {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>(ToolMode.SELECT);
  const [lassoPath, setLassoPath] = useState<Point[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Layer Management ---
  const addLayer = async (src: string) => {
    try {
        const img = await loadImage(src);
        const aspectRatio = img.height / img.width;
        
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'image',
            src,
            x: 100 + layers.length * 20,
            y: 100 + layers.length * 20,
            width: DEFAULT_LAYER_WIDTH,
            height: DEFAULT_LAYER_WIDTH * aspectRatio,
            rotation: 0,
            opacity: 1,
            name: `Image ${layers.length + 1}`
        };
        
        setLayers([...layers, newLayer]);
        setSelectedLayerIds([newLayer.id]);
        setToolMode(ToolMode.SELECT);
    } catch (e) {
        console.error("Failed to load image", e);
    }
  };

  const updateLayer = (updatedLayer: Layer) => {
    setLayers(prev => prev.map(l => l.id === updatedLayer.id ? updatedLayer : l));
  };

  const selectLayer = (id: string | null) => {
    if (id) {
        setSelectedLayerIds([id]);
    } else {
        setSelectedLayerIds([]);
    }
    if (toolMode === ToolMode.SELECT) {
        setLassoPath([]);
    }
  };

  const deleteLayer = (id: string) => {
      setLayers(prev => prev.filter(l => l.id !== id));
      setSelectedLayerIds(prev => prev.filter(pid => pid !== id));
  };

  // --- Core Feature: Detach ---
  const handleDetach = async () => {
    if (selectedLayerIds.length === 0 || lassoPath.length < 3 || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
        const activeLayerId = selectedLayerIds[0];
        const activeLayer = layers.find(l => l.id === activeLayerId);
        if (!activeLayer) throw new Error("Layer not found");

        const localLassoPath = lassoPath.map(p => ({
            x: p.x - activeLayer.x,
            y: p.y - activeLayer.y
        }));

        // 1. Generate Full Context Mask Hint
        const fullCanvas = document.createElement('canvas');
        fullCanvas.width = activeLayer.width;
        fullCanvas.height = activeLayer.height;
        const fullCtx = fullCanvas.getContext('2d');
        if (!fullCtx) throw new Error("Context failed");

        const img = await loadImage(activeLayer.src);
        fullCtx.drawImage(img, 0, 0, activeLayer.width, activeLayer.height);

        fullCtx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        fullCtx.beginPath();
        if (localLassoPath.length > 0) {
            fullCtx.moveTo(localLassoPath[0].x, localLassoPath[0].y);
            for(let i=1; i<localLassoPath.length; i++) {
                fullCtx.lineTo(localLassoPath[i].x, localLassoPath[i].y);
            }
            fullCtx.closePath();
            fullCtx.fill();
        }
        const fullMaskHintDataUrl = fullCanvas.toDataURL('image/png');

        // 2. Generate Cropped Zoom-In Hint
        const croppedMaskHintDataUrl = await createCroppedSelection(
            activeLayer.src,
            localLassoPath,
            activeLayer.width,
            activeLayer.height,
            100 // Increased padding for even better scene reasoning
        );
        
        // 3. Call Semantic Detach Service
        const result = await detachObjectWithGemini(
            activeLayer.src, 
            fullMaskHintDataUrl, 
            croppedMaskHintDataUrl
        );

        // 4. Update Canvas with the magic results
        if (result.background) {
            updateLayer({
                ...activeLayer,
                src: result.background,
                name: `${activeLayer.name} (Cleaned)`
            });
        }

        if (result.object) {
            const newObjectLayer: Layer = {
                id: crypto.randomUUID(),
                type: 'image',
                src: result.object,
                x: activeLayer.x,
                y: activeLayer.y,
                width: activeLayer.width,
                height: activeLayer.height,
                rotation: activeLayer.rotation,
                opacity: 1,
                name: result.label || "Detached Object"
            };
            setLayers(prev => [...prev, newObjectLayer]);
            setSelectedLayerIds([newObjectLayer.id]);
        }

        setLassoPath([]);
        setToolMode(ToolMode.SELECT);

    } catch (error) {
        console.error("Detach failed:", error);
        alert("Magic extraction failed. Try a slightly different selection.");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-background text-white font-sans overflow-hidden">
        <LeftPanel onImportImage={addLayer} />
        
        <div className="flex-1 flex flex-col relative">
            <CanvasBoard 
                layers={layers}
                toolMode={toolMode}
                selectedLayerIds={selectedLayerIds}
                lassoPath={lassoPath}
                onSetLassoPath={setLassoPath}
                onUpdateLayer={updateLayer}
                onSelectLayer={selectLayer}
                setCanvasRef={(ref) => canvasRef.current = ref}
            />
            
            <Dock 
                toolMode={toolMode}
                onSetToolMode={setToolMode}
                onDetach={handleDetach}
                isProcessing={isProcessing}
                hasSelection={lassoPath.length > 2}
                hasActiveLayer={selectedLayerIds.length > 0}
            />
        </div>

        <RightPanel 
            layers={layers}
            selectedLayerIds={selectedLayerIds}
            onSelectLayer={selectLayer}
            onDeleteLayer={deleteLayer}
        />
    </div>
  );
}

export default App;