import { useState } from 'react';
import { useAvatarSettings } from '@/stores/settingsStore';
import AvatarController2D from './AvatarController2D';

interface DruHelperProps {
  /** Optional position override ('top-left', 'top-right', 'bottom-left', 'bottom-right') */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether Dru should be clickable */
  interactive?: boolean;
  /** Callback when Dru is clicked */
  onDruClick?: () => void;
}

export default function DruHelper({ 
  position = 'bottom-right',
  interactive = true,
  onDruClick 
}: DruHelperProps) {
  const { avatar } = useAvatarSettings();
  const [mode, setMode] = useState<'idle' | 'talk'>('idle');
  const [isHovered, setIsHovered] = useState(false);

  // Hide Dru if avatar is not visible in settings
  if (!avatar.avatarVisible) {
    return null;
  }

  // Calculate position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
  };

  // Calculate size based on druScale setting (0.1 - 1.0, default 0.7)
  const baseSize = 140;
  const druSize = baseSize * avatar.druScale;

  const handleClick = () => {
    setMode(mode === 'idle' ? 'talk' : 'idle');
    onDruClick?.();
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-30 pointer-events-auto${
        interactive ? ' cursor-pointer' : ''
      }`}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
      onClick={interactive ? handleClick : undefined}
    >
      {/* Dru Avatar */}
      <div
        className={`transition-transform duration-200 ${
          isHovered && interactive ? 'scale-110' : 'scale-100'
        }`}
        style={{
          filter: isHovered && interactive ? 'drop-shadow(0 0 12px rgba(59, 130, 246, 0.5))' : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
        }}
      >
        <AvatarController2D
          mode={mode}
          size={druSize}
          className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-2"
          enablePupilTracking={true}
          headOnlyMode={avatar.headOnlyMode}
        />
      </div>

      {/* Speech bubble - only show if configured */}
      {avatar.showSpeechBubble && mode === 'talk' && (
        <div
          className="absolute top-0 -left-2 w-32 bg-primary text-primary-foreground text-xs font-bold rounded-lg p-2 shadow-lg whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            transform: `translateX(calc(-100% - 8px))`,
            marginTop: `${druSize / 2 - 20}px`,
          }}
        >
          Hello! I'm Dru! 👋
        </div>
      )}

      {/* Helper indicator - show that Dru is interactive */}
      {interactive && !isHovered && (
        <div
          className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-pulse"
          title="Click to chat with Dru"
        />
      )}
    </div>
  );
}
