interface MobileActionButtonsProps {
  onJump: () => void;
  onInteract: () => void;
  visible: boolean;
  showInteract: boolean; // Only show when near NPC/object
}

export default function MobileActionButtons({
  onJump,
  onInteract,
  visible,
  showInteract
}: MobileActionButtonsProps) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
      {/* Jump Button - Always visible on mobile */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          onJump();
        }}
        className="w-16 h-16 rounded-full bg-green-600/80 active:bg-green-700 flex items-center justify-center text-2xl shadow-lg border-2 border-green-400 touch-none"
      >
        ⬆️
      </button>

      {/* Interact Button - Only when near interactable */}
      {showInteract && (
        <button
          onTouchStart={(e) => {
            e.preventDefault();
            onInteract();
          }}
          className="w-16 h-16 rounded-full bg-blue-600/80 active:bg-blue-700 flex items-center justify-center text-2xl shadow-lg border-2 border-blue-400 touch-none"
        >
          💬
        </button>
      )}
    </div>
  );
}
