import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarController2D from './AvatarController2D';
import SpeechBubbleController from './SpeechBubbleController';
import HelpOverlay from './HelpOverlay';
import SettingsHelpOverlay from './SettingsHelpOverlay';
import HaveYourSayHelpOverlay from './HaveYourSayHelpOverlay';
import PlayerDashboardHelpOverlay from './PlayerDashboardHelpOverlay';
import { DEFAULT_AVATAR_LAYERS } from '@/lib/avatarDefaults';
import { useAvatarSettings } from '@/stores/settingsStore';

type AvatarMode = 'idle' | 'talk';
type MenuState = 'idle' | 'main' | 'chat' | 'joke' | 'help';

type SpeechPayload = {
  id: number;
  text: string;
};

const getChatOptions = (path: string) => {
  if (path === '/settings') {
    return [
      'What are Avatar Settings?',
      'How do I control audio?',
      'What is Head Only Mode?',
    ];
  } else if (path === '/have-your-say') {
    return [
      'How do I submit feedback?',
      'What categories can I choose?',
      'Will my feedback be read?',
    ];
  } else if (path === '/player-dashboard') {
    return [
      'What is the Account tab?',
      'How do I manage my worlds?',
      'What is the Activity timeline?',
    ];
  }
  return [
    'How do I build a game?',
    'How do I play a game?',
    'What is "Have Your Say"?',
  ];
};

const getChatResponses = (path: string): { [key: string]: string } => {
  if (path === '/settings') {
    return {
      'What are Avatar Settings?': 'Avatar Settings let you control your helper avatar. You can show or hide it, toggle speech bubbles, and choose between full avatar or head-only mode to save screen space.',
      'How do I control audio?': 'Use the Audio section to toggle background music on or off. Simply click the toggle switch next to "Background Music" to change the setting.',
      'What is Head Only Mode?': 'Head Only Mode shows just the avatar\'s head without the body. This saves screen space while still giving you access to help, chat, and jokes.',
    };
  } else if (path === '/have-your-say') {
    return {
      'How do I submit feedback?': 'Choose a category, type your message in the text area, and click Submit. Your feedback will be saved and reviewed by our team.',
      'What categories can I choose?': 'You can choose from: Suggestion (ideas for improvement), Question (ask us anything), Complaint (report issues), or Report Quest (report problems with a specific quest).',
      'Will my feedback be read?': 'Yes! All feedback is saved and reviewed by our team. We use your suggestions to improve Questly and help other players.',
    };
  } else if (path === '/player-dashboard') {
    return {
      'What is the Account tab?': 'The Account tab shows your profile information, account type, and quick stats like total worlds and plays. It gives you an overview of your activity.',
      'How do I manage my worlds?': 'Use the Worlds tab to see all your created worlds. You can play, edit, report, or delete worlds. Each world shows play statistics and last updated date.',
      'What is the Activity timeline?': 'The Activity tab shows a chronological timeline of all your actions: when worlds were created, updated, played, or deleted. It helps you track your progress.',
    };
  }
  return {
    'How do I build a game?': 'Click the Build button to start creating! You can choose from templates or use Free Build mode to create your own adventure from scratch.',
    'How do I play a game?': 'Click the Play button to browse and play games created by the community. Select a template to jump right into the action!',
    'What is "Have Your Say"?': 'Have Your Say lets you share feedback, suggestions, questions, or report issues. We love hearing from you!',
  };
};

const jokePool = [
  'Why did the wizard bring a ladder? To reach higher levels! ✨',
  'I tried to cast a spell on lag... now it is "loading..." 🪄',
  'The druid loves trees because they always "branch out." 🌳',
];

export default function MenuOverlayController() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Start hidden
  const [isAnimating, setIsAnimating] = useState(false);
  const [avatarMode, setAvatarMode] = useState<AvatarMode>('idle');
  const [speech, setSpeech] = useState<SpeechPayload | null>(null);
  const [menuState, setMenuState] = useState<MenuState>('idle');
  const [helpMode, setHelpMode] = useState(false);
  const [bubbleOffsetX] = useState(-120);
  const [bubbleOffsetY] = useState(243);
  const [bubbleScale] = useState(1);
  const talkTimeoutRef = useRef<number | null>(null);
  const { avatar: avatarSettings } = useAvatarSettings();
  
  // Head height offset for head-only mode
  // Default: -104px to position head directly above toggle button
  const headHeightOffset = -104;
  
  // Menu button positions (fixed values from testing)
  const helpX = 92.00; // Help Button (10:30)
  const helpY = -26.00;
  const chatX = 33.00; // Chat Button (11:15)
  const chatY = 16.00;
  const jokeX = -12.00; // Joke Button (12:00)
  const jokeY = 63.00;
  
  // Determine which help overlay to use based on current route
  const getHelpOverlay = () => {
    const path = location.pathname;
    if (path === '/settings') {
      return SettingsHelpOverlay;
    } else if (path === '/have-your-say') {
      return HaveYourSayHelpOverlay;
    } else if (path === '/player-dashboard') {
      return PlayerDashboardHelpOverlay;
    } else if (path === '/dashboard') {
      // User dashboard uses DashboardHelpOverlay
      const DashboardHelpOverlay = require('./DashboardHelpOverlay').default;
      return DashboardHelpOverlay;
    }
    return HelpOverlay;
  };
  
  const HelpOverlayComponent = getHelpOverlay();
  
  // Animate avatar in on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setIsOpen(true);
    }, 300); // Small delay for magical appearance
    return () => clearTimeout(timer);
  }, []);

  const triggerSpeech = useCallback((text: string, duration: number = 2400) => {
    setSpeech({ id: Date.now(), text });
    setAvatarMode('talk');

    if (talkTimeoutRef.current) {
      window.clearTimeout(talkTimeoutRef.current);
    }

    talkTimeoutRef.current = window.setTimeout(() => {
      setAvatarMode('idle');
    }, duration);
  }, []);

  useEffect(() => {
    return () => {
      if (talkTimeoutRef.current) {
        window.clearTimeout(talkTimeoutRef.current);
      }
    };
  }, []);

  const handleHelpMode = () => {
    setMenuState('help');
    setHelpMode(true);
  };

  const handleMainMenuClick = () => {
    if (menuState === 'idle') {
      setMenuState('main');
    } else if (menuState === 'chat') {
      // If in chat mode, go back to main menu
      setMenuState('main');
    } else {
      // Close menu if clicking avatar again
      setMenuState('idle');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (menuState === 'idle') return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on menu buttons or avatar
      if (
        target.closest('[data-avatar-menu]') ||
        target.closest('[data-avatar-container]')
      ) {
        return;
      }
      setMenuState('idle');
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [menuState]);

  const handleOptionClick = (option: 'help' | 'chat' | 'joke') => {
    if (option === 'help') {
      handleHelpMode();
    } else if (option === 'chat') {
      setMenuState('chat');
    } else {
      setMenuState('joke');
      const random = jokePool[Math.floor(Math.random() * jokePool.length)];
      triggerSpeech(random, 3000);
      setTimeout(() => setMenuState('idle'), 3500);
    }
  };

  const handleChatOptionClick = (question: string) => {
    const responses = getChatResponses(location.pathname);
    const response = responses[question] || 'Hmm, I am not sure about that one!';
    triggerSpeech(response, 4000);
    // Immediately hide chat menu
    setTimeout(() => setMenuState('idle'), 100);
  };

  const handleExitHelp = () => {
    setHelpMode(false);
    setMenuState('idle');
  };

  const handleToggleAvatar = () => {
    setIsAnimating(true);
    setIsOpen((prev) => !prev);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[110] pointer-events-none">
        <div 
          className="relative flex flex-col items-end pointer-events-auto"
          style={{
            gap: avatarSettings.headOnlyMode ? '0px' : '12px',
          }}
        >
          <AnimatePresence>
            {isOpen && avatarSettings.avatarVisible && (
              <motion.div
                key="avatar-container"
                initial={{ 
                  scale: 0, 
                  rotate: -180, 
                  opacity: 0,
                  y: 50
                }}
                animate={{ 
                  scale: 1, 
                  rotate: 0, 
                  opacity: 1,
                  y: 0
                }}
                exit={{ 
                  scale: 0, 
                  rotate: 180, 
                  opacity: 0,
                  y: 50
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  duration: 0.6
                }}
                className="flex flex-col relative"
                data-avatar-container
                style={{
                  // In head-only mode, position directly above toggle button
                  alignItems: avatarSettings.headOnlyMode ? 'flex-end' : 'center',
                  justifyContent: avatarSettings.headOnlyMode ? 'flex-end' : 'center',
                  marginBottom: avatarSettings.headOnlyMode ? `${headHeightOffset}px` : '0px',
                  order: avatarSettings.headOnlyMode ? -1 : 0,
                  gap: avatarSettings.headOnlyMode ? '0px' : '12px',
                }}
              >
                {/* Speech Bubble - Directly Above Avatar */}
                {avatarSettings.showSpeechBubble && (
                  <SpeechBubbleController
                    key={speech?.id}
                    text={speech?.text}
                    visible={Boolean(speech)}
                    onHide={() => setSpeech(null)}
                    className="absolute"
                    style={{
                      bottom: `${bubbleOffsetY}px`,
                      left: `${bubbleOffsetX}px`,
                      transform: `scale(${bubbleScale})`,
                      transformOrigin: 'bottom left',
                      zIndex: 111,
                    }}
                  />
                )}

              {/* Main Menu Options - Circular Layout Around Avatar Head */}
              {menuState === 'main' && (() => {
                // Head center is at the top-center of the avatar (approximately)
                const headCenterX = 0; // Relative to avatar center
                const headCenterY = -65; // Above avatar center (head is at top)
                
                return (
                  <div
                    data-avatar-menu
                    className="absolute z-30"
                    style={{ 
                      top: `${headCenterY}px`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '200px',
                      height: '200px',
                    }}
                  >
                    {/* Help - 10:30 position */}
                    <button
                      onClick={() => handleOptionClick('help')}
                      className="absolute px-4 py-2 bg-white text-slate-900 text-xs rounded-lg border-2 border-black shadow-lg hover:bg-slate-100 transition font-medium whitespace-nowrap"
                      style={{
                        top: `${headCenterY + helpY}px`,
                        left: `${headCenterX + helpX}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      Help
                    </button>
                    {/* Chat - 11:15 position */}
                    <button
                      onClick={() => handleOptionClick('chat')}
                      className="absolute px-4 py-2 bg-white text-slate-900 text-xs rounded-lg border-2 border-black shadow-lg hover:bg-slate-100 transition font-medium whitespace-nowrap"
                      style={{
                        top: `${headCenterY + chatY}px`,
                        left: `${headCenterX + chatX}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      Chat
                    </button>
                    {/* Joke - 12:00 position */}
                    <button
                      onClick={() => handleOptionClick('joke')}
                      className="absolute px-4 py-2 bg-white text-slate-900 text-xs rounded-lg border-2 border-black shadow-lg hover:bg-slate-100 transition font-medium whitespace-nowrap"
                      style={{
                        top: `${headCenterY + jokeY}px`,
                        left: `${headCenterX + jokeX}px`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      Joke/Story
                    </button>
                  </div>
                );
              })()}

              {/* Chat Options - Above Avatar */}
              {menuState === 'chat' && (
                <div
                  data-avatar-menu
                  className="flex flex-col gap-2 items-center absolute z-30 w-48"
                  style={{ 
                    top: '-280px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    maxWidth: 'calc(100vw - 2rem)',
                  }}
                >
                  <div className="bg-white border-2 border-black rounded-lg p-3 shadow-xl w-full">
                    <div className="text-xs text-slate-600 uppercase mb-2 font-semibold">Ask a question</div>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                      {getChatOptions(location.pathname).map((option) => (
                        <button
                          key={option}
                          onClick={() => handleChatOptionClick(option)}
                          className="text-left text-xs text-slate-700 hover:text-slate-900 transition hover:font-medium p-1 hover:bg-slate-50 rounded"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}


                {/* Avatar */}
                <div 
                  className="relative"
                  style={{
                    // In head-only mode, align head to right (above toggle button)
                    alignSelf: avatarSettings.headOnlyMode ? 'flex-end' : 'center',
                    marginBottom: avatarSettings.headOnlyMode ? '0px' : '0px',
                  }}
                >
                  <AvatarController2D
                    size={130}
                    mode={avatarMode}
                    headTransform={DEFAULT_AVATAR_LAYERS.head}
                    faceTransform={DEFAULT_AVATAR_LAYERS.face}
                    mouthTransform={DEFAULT_AVATAR_LAYERS.mouth}
                    blinkTransform={DEFAULT_AVATAR_LAYERS.blink}
                    leftEyeTransform={DEFAULT_AVATAR_LAYERS.leftEye}
                    rightEyeTransform={DEFAULT_AVATAR_LAYERS.rightEye}
                    leftPupilTransform={DEFAULT_AVATAR_LAYERS.leftPupil}
                    rightPupilTransform={DEFAULT_AVATAR_LAYERS.rightPupil}
                    leftBrowTransform={DEFAULT_AVATAR_LAYERS.leftBrow}
                    rightBrowTransform={DEFAULT_AVATAR_LAYERS.rightBrow}
                    hideEyesOnSelect={true}
                    forceMouthOpen={false}
                    forceBlinkVisible={false}
                    headOnlyMode={avatarSettings.headOnlyMode}
                    onPartPointerDown={handleMainMenuClick}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button */}
          <motion.button
            onClick={handleToggleAvatar}
            className="w-10 h-10 rounded-full bg-primary text-white shadow-lg flex items-center justify-center border border-white/20 hover:scale-105 transition"
            aria-label="Toggle helper"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={isAnimating ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              ✦
            </motion.span>
          </motion.button>
        </div>
      </div>

      {/* Help Overlay - Separate Component - Changes based on route */}
      <HelpOverlayComponent
        isActive={helpMode}
        onElementClick={(element: { description: string }) => {
          triggerSpeech(element.description, 4000);
        }}
        onExit={handleExitHelp}
      />
    </>
  );
}
