import React from 'react';

const RightPanel: React.FC = () => {
  return (
    <div className="w-72 bg-bk-50 border-l border-bd-50 flex flex-col h-full z-20">
      <div className="p-4 border-b border-bd-50 text-[10px] font-bold uppercase tracking-widest text-fg-70">
        Properties
      </div>
      <div className="flex-1 flex items-center justify-center text-[10px] uppercase text-fg-70 tracking-tighter">
        No Object Selected
      </div>
    </div>
  );
};

export default RightPanel;