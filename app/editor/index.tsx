import React from 'react';
import EditorRoot from '../../modules/editor/core/index.tsx';

/**
 * EditorPage Component
 * Route-level entry for the AI editor, pointing to the core orchestrator.
 */
const EditorPage: React.FC = () => {
  return (
    <div className="w-full h-full overflow-hidden bg-background">
      <EditorRoot />
    </div>
  );
};

export default EditorPage;