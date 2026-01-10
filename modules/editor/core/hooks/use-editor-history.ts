import { useState, useCallback } from 'react';
import { EditorNode } from '../types.ts';

/**
 * Custom hook for managing undo/redo logic for the Editor nodes.
 * Provides granular control over when a state is committed to history.
 */
export function useEditorHistory(initialNodes: EditorNode[]) {
  // Past states stack
  const [past, setPast] = useState<EditorNode[][]>([]);
  // Current state of nodes (the source of truth for the UI)
  const [present, setPresent] = useState<EditorNode[]>(initialNodes);
  // Future states stack (for redo functionality)
  const [future, setFuture] = useState<EditorNode[][]>([]);

  // Updates the current present state without recording history (Transient)
  const setNodes = useCallback((newNodes: EditorNode[]) => {
    setPresent(newNodes);
  }, []);

  // Explicitly commits a snapshot to the history stack
  const pushHistory = useCallback((snapshot: EditorNode[]) => {
    setPast(prevPast => [...prevPast, snapshot]);
    // When history is pushed, future (redo) states are invalidated
    setFuture([]);
  }, []);

  // Function to undo the last action
  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    // Move current state to future for redoing
    setFuture(prevFuture => [present, ...prevFuture]);
    setPresent(previous);
    setPast(newPast);
  }, [past, present]);

  // Function to redo an undone action
  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    // Move current state back to past
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
