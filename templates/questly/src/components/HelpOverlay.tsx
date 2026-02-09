import { useEffect, useState } from 'react';

export type HelpElement = {
  id: string;
  label: string;
  description: string;
  rect?: DOMRect;
};

// MAIN MENU HELP ELEMENTS - Manually maintained to match MainMenu.tsx layout
// To add help to other pages, copy this component and update HELP_ELEMENTS to match that page's buttons
const HELP_ELEMENTS: HelpElement[] = [
  // Navigation (top bar)
  { id: 'home', label: 'Home', description: 'Click here to return to the main menu.' },
  { id: 'dashboard', label: 'Dashboard', description: 'Go to your dashboard to preview characters, adjust settings, and manage your projects.' },
  { id: 'music', label: 'Music', description: 'Toggle the background music on and off.' },
  { id: 'settings', label: 'Settings', description: 'Open the settings menu to customize your experience.' },
  
  // Main menu buttons
  { id: 'build', label: 'Build', description: 'Start creating your own games! Choose from templates or use Free Build mode to create adventures from scratch.' },
  { id: 'play', label: 'Play', description: 'Browse and play games created by the community. Select a template to jump right into the action!' },
  { id: 'have-your-say', label: 'Have Your Say', description: 'Share your feedback, suggestions, questions, or report issues. We love hearing from you!' },
  
  // Asset credits (bottom logos)
  { id: 'credit-kenney', label: 'Kenney', description: 'Visit Kenney.nl to explore thousands of free 2D and 3D game assets including characters, objects, and environments.' },
  { id: 'credit-kaykit', label: 'KayKit', description: 'Visit KayKit to download beautiful medieval fantasy character packs with complete animation sets.' },
  { id: 'credit-quaternius', label: 'Quaternius', description: 'Visit Quaternius for stylized 3D models perfect for low-poly games and projects.' },
  { id: 'credit-alkakrab', label: 'AlkaKrab', description: 'Visit AlkaKrab on Itch.io for free music tracks and game assets across various game styles.' },
  
  // Coming Soon panel
  { id: 'coming-soon', label: 'Coming Soon', description: 'Exciting features in development: multiplayer collaboration and asset marketplace. Stay tuned for updates!' },
];

interface HelpOverlayProps {
  isActive: boolean;
  onElementClick: (element: HelpElement) => void;
  onExit: () => void;
}

export default function HelpOverlay({ isActive, onElementClick, onExit }: HelpOverlayProps) {
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
      {/* Dark overlay - avatar appears above via z-index */}
      <div
        className="fixed inset-0 z-[100] bg-black/70 cursor-pointer"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => {
          // Click anywhere on overlay background to exit
          if (e.target === e.currentTarget) {
            onExit();
          }
        }}
      />

      {/* Help UI on top of overlay */}
      <div className="fixed inset-0 z-[101]" style={{ pointerEvents: 'none' }}>
        {/* Instructions */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 p-4 bg-yellow-400 rounded-lg shadow-lg border-2 border-yellow-600 z-[101] pointer-events-none max-w-md mx-4">
          <p className="text-sm font-semibold text-slate-900 text-center">Click on any highlighted button to learn more!</p>
        </div>

        {/* Highlighted elements */}
        {helpElements.map((element) => {
          // Main menu buttons get descriptions inside the box
          const isMainMenuButton = ['build', 'play', 'have-your-say', 'coming-soon'].includes(element.id);
          
          return (
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
                >
                  {/* Label inside box for main menu buttons */}
                  {isMainMenuButton && (
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
                  )}
                </div>
              )}
              {/* Label - positioned below button for non-main-menu buttons */}
              {element.rect && !isMainMenuButton && (
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
          );
        })}

      </div>
    </>
  );
}
