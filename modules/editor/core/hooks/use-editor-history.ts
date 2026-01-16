import { useState, useCallback } from 'react';
import { EditorNode } from '../types.ts';

/**
 * Custom hook for managing undo/redo logic for the Editor nodes.
 * Provides support for functional updates to handle concurrent state changes.
 */
export function useEditorHistory(initialNodes: EditorNode[]) {
  const [past, setPast] = useState<EditorNode[][]>([]);
  const [present, setPresent] = useState<EditorNode[]>(initialNodes);
  const [future, setFuture] = useState<EditorNode[][]>([]);

  // Single line comment: Supports both direct array updates and functional updaters.
  const setNodes = useCallback((updater: EditorNode[] | ((prev: EditorNode[]) => EditorNode[])) => {
    setPresent(updater);
  }, []);

  // Single line comment: Commits current state to history and clears future redo steps.
  const pushHistory = useCallback((snapshot: EditorNode[]) => {
    setPast(prevPast => [...prevPast, snapshot]);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture(prevFuture => [present, ...prevFuture]);
    setPresent(previous);
    setPast(newPast);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast(prevPast => [...prevPast, present]);
    setPresent(next);
    setFuture(newFuture);
  }, [future, present]);

  return {
    nodes: present,
    setNodes,
    pushHistory,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}