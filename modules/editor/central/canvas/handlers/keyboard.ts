import { ToolMode } from '../../../core/types.ts';

/**
 * Processes hotkeys for switching tools, deleting nodes, or duplicating them.
 * Guarded to prevent firing when user is typing in input fields.
 */
export const handleKeyboardShortcuts = (
  e: KeyboardEvent,
  onSetToolMode: (mode: ToolMode) => void,
  onDeleteSelected: () => void,
  onDuplicateSelected: () => void,
  onCancel: () => void
) => {
  // Single line comment: Check if the focus is inside an input or textarea to avoid intercepting typed characters.
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  const key = e.key.toLowerCase();
  const isMod = e.ctrlKey || e.metaKey;
  
  // Tool Shortcuts
  if (key === 'v') onSetToolMode(ToolMode.SELECT);
  if (key === 'h') onSetToolMode(ToolMode.PAN);
  if (key === 'l') onSetToolMode(ToolMode.LASSO);
  if (key === 'b') onSetToolMode(ToolMode.BRUSH);

  // Actions
  if (key === 'delete' || key === 'backspace') {
    onDeleteSelected();
  }

  // Duplicate shortcut (Ctrl+D / Cmd+D)
  if (isMod && key === 'd') {
    e.preventDefault();
    onDuplicateSelected();
  }

  // Cancel/Clear shortcut (Escape)
  if (key === 'escape') {
    onCancel();
  }
};