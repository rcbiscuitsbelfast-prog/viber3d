import { useEffect, useState } from 'react';

export type HelpElement = {
  id: string;
  label: string;
  description: string;
  rect?: DOMRect;
};

// DASHBOARD HELP ELEMENTS - Asset packs and character selection
// This is a separate help overlay for the Dashboard page
const HELP_ELEMENTS: HelpElement[] = [
  // Navigation (top bar)
  { id: 'home', label: 'Home', description: 'Click here to return to the main menu.' },
  { id: 'dashboard', label: 'Dashboard', description: 'You are on the dashboard - manage your game assets here.' },
  { id: 'music', label: 'Music', description: 'Toggle the background music on and off.' },
  { id: 'settings', label: 'Settings', description: 'Open the settings menu to customize your experience.' },
  
  // Asset packs
  { id: 'pack-custom', label: 'Custom Pack', description: 'Custom assets including ornate wooden signs, druid characters, and 3D fonts.' },
  { id: 'pack-self_contained', label: 'Self-Contained', description: 'Pre-animated characters like Fox, Soldier, Parrot, Horse, Robot, and more with built-in animations.' },
  { id: 'pack-additional_models', label: 'Additional Models', description: 'Extra character models including animated Quaternius characters and other models.' },
  { id: 'pack-kaykit', label: 'KayKit Pack', description: 'Medieval fantasy characters with full animation sets - Knights, Mages, Rangers, Rogues, and Skeleton warriors.' },
  { id: 'pack-kenny', label: 'Kenney Pack', description: 'Coming soon - Kenney character asset collection. Check back later!' },
  { id: 'pack-quaternius', label: 'Quaternius Pack', description: 'Currently under investigation for skeleton compatibility - disabled for now.' },
  { id: 'pack-ultimate_monsters', label: 'Ultimate Monsters', description: '50+ animated monster models organized by type: Big creatures, Blobs, and Flying monsters.' },
];

interface DashboardHelpOverlayProps {
  isActive: boolean;
  onElementClick: (element: HelpElement) => void;
  onExit: () => void;
}

export default function DashboardHelpOverlay({ isActive, onElementClick, onExit }: DashboardHelpOverlayProps) {
  const [helpElements, setHelpElements] = useState<HelpElement[]>([]);

  useEffect(() => {
    if (!isActive) {
      setHelpElements([]);
      return;
    }

    // Simple scan: just querySelector for each data-help-id
    const scanElements = () => {
      const foundElements: HelpElement[] = [];
      
      HELP_ELEMENTS.forEach(element => {
        const el = document.querySelector(`[data-help-id="${element.id}"]`);
        if (el && el instanceof HTMLElement) {
          const rect = el.getBoundingClientRect();
          // Only add if element has visible dimensions
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

    // Initial scan
    scanElements();

    // Rescan on scroll and resize
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
      {/* Dark overlay - avatar and other UI appears above via z-index */}
      <div
        className="fixed inset-0 z-[100] bg-black/70"
        style={{ pointerEvents: 'none' }}
      />

      {/* Help UI on top of overlay */}
      <div className="fixed inset-0 z-[101]" style={{ pointerEvents: 'none' }}>
        {/* Instructions */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 p-4 bg-yellow-400 rounded-lg shadow-lg border-2 border-yellow-600 z-[101] pointer-events-none max-w-md mx-4">
          <p className="text-sm font-semibold text-slate-900 text-center">Click on any highlighted button to learn more!</p>
        </div>

        {/* Highlighted elements */}
        {helpElements.map((element) => (
          <div key={element.id}>
            {/* Highlight box around element */}
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
              />
            )}
            {/* Label - positioned below button */}
            {element.rect && (
              <div
                className="absolute bg-yellow-400 text-slate-900 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap"
                style={{
                  left: `${element.rect.left}px`,
                  top: `${element.rect.bottom + 8}px`,
                  zIndex: 102,
                  pointerEvents: 'none',
                }}
              >
                {element.label}
              </div>
            )}
          </div>
        ))}

        {/* Exit button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onExit();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute bottom-4 right-4 px-6 py-3 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition z-[101] shadow-xl border-2 border-slate-300"
          style={{ pointerEvents: 'auto' }}
        >
          Exit Help
        </button>
      </div>
    </>
  );
}
