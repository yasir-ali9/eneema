import React, { useState, useRef, useEffect } from 'react';
import { Dropdown, useDropdown, DropdownItem } from '../../../../components/dropdown.tsx';
import { Check } from 'lucide-react';

interface HeaderProps {
  projectName: string;
  onProjectNameChange: (newName: string) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
}

/**
 * Header Component for the Left Panel
 * Displays the application logo and an editable project name.
 * Features a dropdown on the logo for theme and view management.
 */
const Header: React.FC<HeaderProps> = ({ projectName, onProjectNameChange, showGrid, onToggleGrid }) => {
  // State to toggle between text and input mode for the project name
  const [isEditing, setIsEditing] = useState(false);
  // Local state for the input field to allow smooth typing
  const [tempName, setTempName] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Theme state management
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark'));
  const { isOpen, toggle, close } = useDropdown();

  // Focus and select input text when entering edit mode
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  // Persist project name on blur
  const handleBlur = () => {
    setIsEditing(false);
    if (tempName.trim()) {
      onProjectNameChange(tempName);
    } else {
      setTempName(projectName);
    }
  };

  // Keyboard shortcut support for renaming
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  // Toggle theme between dark and light modes
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  };

  // Dropdown items configuration
  const menuItems: DropdownItem[] = [
    // Theme option: No icon, but will align because space is reserved in Dropdown component
    {
      label: isDark ? "Light theme" : "Dark theme",
      onClick: toggleTheme,
    },
    // Grid option: Shows check icon when grid is enabled, text aligns with theme option above
    {
      label: "Pixel grid",
      onClick: onToggleGrid,
      icon: showGrid ? Check : undefined,
      active: showGrid,
    }
  ];

  return (
    <div className="flex items-center px-4 py-3 border-b border-bd-50 bg-bk-50 h-14 flex-shrink-0">
      {/* App Logo acting as a Dropdown Trigger */}
      <Dropdown
        isOpen={isOpen}
        onToggle={toggle}
        onClose={close}
        items={menuItems}
        align="left"
        trigger={
          <div className="text-fg-50 flex-shrink-0 transition-opacity hover:opacity-80 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="currentColor" d="M21.996 12.018a10.65 10.65 0 0 0-9.98 9.98h-.04c-.32-5.364-4.613-9.656-9.976-9.98v-.04c5.363-.32 9.656-4.613 9.98-9.976h.04c.324 5.363 4.617 9.656 9.98 9.98v.036z"/>
            </svg>
          </div>
        }
      />

      {/* Project Name Area - Aligned left next to logo */}
      <div className="flex-1 ml-3 overflow-hidden flex items-center">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="bg-bk-70 border border-ac-01 rounded px-2 py-0.5 text-[11px] text-fg-30 w-full outline-none focus:ring-1 focus:ring-ac-01/50"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <span 
            className="text-[11px] font-semibold text-fg-60 cursor-text truncate select-none"
            onClick={() => setIsEditing(true)}
            title="Click to rename"
          >
            {projectName}
          </span>
        )}
      </div>
    </div>
  );
};

export default Header;