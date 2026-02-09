import { useEffect, useState } from 'react';

export type HelpElement = {
  id: string;
  label: string;
  description: string;
  rect?: DOMRect;
};

// PLAYER DASHBOARD HELP ELEMENTS
const HELP_ELEMENTS: HelpElement[] = [
  { 
    id: 'account-tab', 
    label: 'Account', 
    description: 'View your account information, stats, and profile details. See your total worlds, plays, and recent activity summary.' 
  },
  { 
    id: 'worlds-tab', 
    label: 'Worlds', 
    description: 'Manage all your created worlds. View, play, edit, or delete your worlds. See play statistics and activity for each world.' 
  },
  { 
    id: 'activity-tab', 
    label: 'Activity', 
    description: 'View a timeline of all your activity including when worlds were created, updated, played, or deleted.' 
  },
  { 
    id: 'settings-tab', 
    label: 'Settings', 
    description: 'Access dashboard settings and preferences. Link to full settings page for more options.' 
  },
];

interface PlayerDashboardHelpOverlayProps {
  isActive: boolean;
  onElementClick: (element: HelpElement) => void;
  onExit: () => void;
}

export default function PlayerDashboardHelpOverlay({ isActive, onElementClick, onExit }: PlayerDashboardHelpOverlayProps) {
  const [helpElements, setHelpElements] = useState<HelpElement[]>([]);

  useEffect(() => {
    if (!isActive) {
      setHelpElements([]);
      return;
    }

    const scanElements = () => {
      const foundElements: HelpElement[] = [];
      
      HELP_ELEMENTS.forEach(element => {
        const el = document.querySelector(`[data-help-id="${element.id}"]`);
        if (el && el instanceof HTMLElement) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            foundElements.push({
              ...element,
              rect,
            });
          }
        }
      });

      setHelpElements(foundElements);
    };

    scanElements();

    const handleUpdate = () => scanElements();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/70 cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onExit();
          }
        }}
      />

      <div className="fixed inset-0 z-[101]" style={{ pointerEvents: 'none' }}>
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 p-4 bg-yellow-400 rounded-lg shadow-lg border-2 border-yellow-600 z-[101] pointer-events-none max-w-md mx-4">
          <p className="text-sm font-semibold text-slate-900 text-center">Click on any highlighted section to learn more!</p>
        </div>

        {helpElements.map((element) => (
          <div key={element.id}>
            {element.rect && (
              <div
                className="absolute border-4 border-yellow-400 bg-yellow-300/10 rounded-lg shadow-lg cursor-pointer hover:bg-yellow-300/20 transition"
                style={{
                  left: `${element.rect.left - 4}px`,
                  top: `${element.rect.top - 4}px`,
                  width: `${element.rect.width + 8}px`,
                  height: `${element.rect.height + 8}px`,
                  zIndex: 101,
                  pointerEvents: 'auto',
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onElementClick(element);
                }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center text-center px-2"
                  style={{
                    zIndex: 102,
                    pointerEvents: 'none',
                  }}
                >
                  <div className="bg-yellow-400/95 text-slate-900 px-3 py-2 rounded text-xs font-semibold max-w-full">
                    {element.label}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
