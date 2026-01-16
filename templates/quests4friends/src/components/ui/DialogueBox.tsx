import { useState, useEffect } from 'react';
import { useQuestStore } from '../../store/questStore';

export function DialogueBox() {
  const activeDialogue = useQuestStore((state) => state.activeDialogue);
  const activeNPCId = useQuestStore((state) => state.activeNPCId);
  const hideDialogue = useQuestStore((state) => state.hideDialogue);
  const currentQuest = useQuestStore((state) => state.currentQuest);

  // Debug logging
  useEffect(() => {
    console.log('DialogueBox rendered with activeDialogue:', activeDialogue);
    console.log('activeNPCId:', activeNPCId);
  }, [activeDialogue, activeNPCId]);

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Find NPC name
  const npc = currentQuest?.entities.find((e) => e.id === activeNPCId);
  const npcName = npc?.npcData?.name || 'NPC';

  // Reset when dialogue changes
  useEffect(() => {
    setCurrentLineIndex(0);
    setDisplayedText('');
  }, [activeDialogue]);

  // Typewriter effect
  useEffect(() => {
    if (!activeDialogue || activeDialogue.length === 0) return;

    const currentLine = activeDialogue[currentLineIndex];
    if (!currentLine) return;

    setIsTyping(true);
    setDisplayedText('');

    let charIndex = 0;
    const typingSpeed = 30; // ms per character

    const interval = setInterval(() => {
      if (charIndex < currentLine.length) {
        setDisplayedText(currentLine.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, typingSpeed);

    return () => clearInterval(interval);
  }, [activeDialogue, currentLineIndex]);

  // Handle progression
  const handleNext = () => {
    if (!activeDialogue) return;

    if (isTyping) {
      // Skip typing animation
      setDisplayedText(activeDialogue[currentLineIndex]);
      setIsTyping(false);
    } else if (currentLineIndex < activeDialogue.length - 1) {
      // Next line
      setCurrentLineIndex(currentLineIndex + 1);
    } else {
      // Close dialogue
      handleClose();
    }
  };

  const handleClose = () => {
    hideDialogue();
    setCurrentLineIndex(0);
    setDisplayedText('');
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isTyping, currentLineIndex, activeDialogue]);

  if (!activeDialogue || activeDialogue.length === 0) {
    console.log('DialogueBox: No active dialogue, returning null');
    return null;
  }

  console.log('DialogueBox: Rendering with dialogue:', activeDialogue);

  return (
    <div 
      className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 pointer-events-auto" 
      style={{ zIndex: 10000, position: 'fixed' }}
    >
      <div 
        className="bg-gradient-to-b from-gray-900 to-black border-4 border-yellow-600 rounded-lg p-6 shadow-2xl" 
        style={{ 
          backgroundColor: 'rgba(17, 24, 39, 0.98)',
          borderColor: '#eab308',
          borderWidth: '4px'
        }}
      >
        {/* NPC Name */}
        <div className="bg-yellow-600 text-black font-bold px-4 py-2 rounded-t-lg -mt-6 -mx-6 mb-4">
          {npcName}
        </div>

        {/* Dialogue Text */}
        <div className="text-white text-lg leading-relaxed min-h-[80px]">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-2 h-5 bg-white ml-1 animate-pulse" />
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="bg-gray-700 text-white px-2 py-1 rounded text-xs">SPACE</kbd>
            <span>Continue</span>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-1">
            {activeDialogue.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentLineIndex
                    ? 'bg-yellow-500'
                    : index < currentLineIndex
                    ? 'bg-yellow-700'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <kbd className="bg-gray-700 text-white px-2 py-1 rounded text-xs">ESC</kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
