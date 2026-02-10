import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, User, MessageSquare, Eye, EyeOff, Mic, MicOff } from 'lucide-react';
import { useSettingsStore, useAvatarSettings } from '@/stores/settingsStore';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsOverlay({ isOpen, onClose }: SettingsOverlayProps) {
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const dialogueEnabled = useSettingsStore((state) => state.dialogueEnabled);
  const setMusicEnabled = (enabled: boolean) => {
    useSettingsStore.setState({ musicEnabled: enabled });
  };
  const setDialogueEnabled = (enabled: boolean) => {
    useSettingsStore.setState({ dialogueEnabled: enabled });
  };
  const { avatar, updateAvatar } = useAvatarSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80]"
          />

          {/* Settings panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed w-[90vw] max-w-md bg-slate-900/98 backdrop-blur-lg rounded-xl border-2 border-slate-700 shadow-2xl z-[90] overflow-hidden"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              marginLeft: 0,
              marginTop: 0
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-slate-700 bg-slate-800/50">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Close settings"
              >
                <X className="w-5 h-5 text-slate-300" />
              </button>
            </div>

            {/* Settings content */}
            <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Audio Settings */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  {musicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  Audio
                </h3>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-slate-300 group-hover:text-white transition">
                    Background Music
                  </span>
                  <button
                    onClick={() => setMusicEnabled(!musicEnabled)}
                    className={`
                      relative w-14 h-7 rounded-full transition-colors
                      ${musicEnabled ? 'bg-primary' : 'bg-slate-600'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
                        ${musicEnabled ? 'translate-x-7' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-slate-300 group-hover:text-white transition flex items-center gap-2">
                    {dialogueEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    NPC Dialogue & Voice
                  </span>
                  <button
                    onClick={() => setDialogueEnabled(!dialogueEnabled)}
                    className={`
                      relative w-14 h-7 rounded-full transition-colors
                      ${dialogueEnabled ? 'bg-primary' : 'bg-slate-600'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
                        ${dialogueEnabled ? 'translate-x-7' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </label>
              </div>

              {/* Dru Settings */}
              <div className="space-y-3 pt-3 border-t border-slate-700">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Dru Settings
                </h3>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-slate-300 group-hover:text-white transition flex items-center gap-2">
                    {avatar.avatarVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    Show Avatar
                  </span>
                  <button
                    onClick={() => updateAvatar({ avatarVisible: !avatar.avatarVisible })}
                    className={`
                      relative w-14 h-7 rounded-full transition-colors
                      ${avatar.avatarVisible ? 'bg-primary' : 'bg-slate-600'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
                        ${avatar.avatarVisible ? 'translate-x-7' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-slate-300 group-hover:text-white transition flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Show Speech Bubble
                  </span>
                  <button
                    onClick={() => updateAvatar({ showSpeechBubble: !avatar.showSpeechBubble })}
                    className={`
                      relative w-14 h-7 rounded-full transition-colors
                      ${avatar.showSpeechBubble ? 'bg-primary' : 'bg-slate-600'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
                        ${avatar.showSpeechBubble ? 'translate-x-7' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                  <div>
                    <span className="text-slate-300 group-hover:text-white transition block">
                      Head Only Mode
                    </span>
                    <span className="text-xs text-slate-400">
                      Show only avatar head (saves screen space)
                    </span>
                  </div>
                  <button
                    onClick={() => updateAvatar({ headOnlyMode: !avatar.headOnlyMode })}
                    className={`
                      relative w-14 h-7 rounded-full transition-colors
                      ${avatar.headOnlyMode ? 'bg-primary' : 'bg-slate-600'}
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform
                        ${avatar.headOnlyMode ? 'translate-x-7' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </label>

                {/* Dru Scale Slider */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-slate-300">
                      Dru Size
                    </span>
                    <span className="text-sm text-slate-400">
                      {Math.round((avatar.druScale ?? 1.0) * 100)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={avatar.druScale ?? 1.0}
                    onChange={(e) => updateAvatar({ druScale: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
