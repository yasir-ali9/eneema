import React from 'react';

// Common module for shared UI elements like buttons, inputs, and modals
const Common: React.FC = () => {
  return (
    <div className="p-2 border border-blue-500/30 rounded bg-blue-500/10">
      <h4 className="text-[10px] font-bold text-blue-400 uppercase">Common Module</h4>
      <p className="text-xs text-blue-300/70">Hello World: Shared UI components will live here.</p>
    </div>
  );
};

export default Common;