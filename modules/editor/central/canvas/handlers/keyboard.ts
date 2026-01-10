import { ToolMode } from '../../../core/types.ts';

/**
 * Processes hotkeys for switching tools or deleting nodes
 */
export const handleKeyboardShortcuts = (
  e: KeyboardEvent,
  onSetToolMode: (mode: ToolMode) => void,
  onDeleteSelected: () => void
) => {
  const key = e.key.toLowerCase();
  
  // Tool Shortcuts
  if (key === 'v') onSetToolMode(ToolMode.SELECT);
  if (key === 'h') onSetToolMode(ToolMode.PAN);
  if (key === 'l') onSetToolMode(ToolMode.LASSO);

  // Actions
  if (key === 'delete' || key === 'backspace') {
    // Only delete if not in an input field
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        onDeleteSelected();
    }
  }
};