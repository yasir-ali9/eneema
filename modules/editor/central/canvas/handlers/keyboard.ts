import { ToolMode } from '../../../core/types.ts';

/**
 * Processes hotkeys for switching tools, deleting nodes, or duplicating them.
 * Added onCancel callback for resetting active selections.
 */
export const handleKeyboardShortcuts = (
  e: KeyboardEvent,
  onSetToolMode: (mode: ToolMode) => void,
  onDeleteSelected: () => void,
  onDuplicateSelected: () => void,
  onCancel: () => void
) => {
  const key = e.key.toLowerCase();
  const isMod = e.ctrlKey || e.metaKey;
  
  // Tool Shortcuts
  if (key === 'v') onSetToolMode(ToolMode.SELECT);
  if (key === 'h') onSetToolMode(ToolMode.PAN);
  if (key === 'l') onSetToolMode(ToolMode.LASSO);
  if (key === 'b') onSetToolMode(ToolMode.BRUSH);

  // Actions
  if (key === 'delete' || key === 'backspace') {
    // Only delete if not in an input field
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        onDeleteSelected();
    }
  }

  // Duplicate shortcut (Ctrl+D / Cmd+D)
  if (isMod && key === 'd') {
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        onDuplicateSelected();
    }
  }

  // Cancel/Clear shortcut (Escape)
  if (key === 'escape') {
    onCancel();
  }
};
