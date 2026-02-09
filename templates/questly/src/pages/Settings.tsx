import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, User, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { useSettingsStore, useAvatarSettings } from '@/stores/settingsStore';
import CustomButton from '@/components/CustomButton';
import MenuOverlayController from '@/components/MenuOverlayController';

export default function Settings() {
  const navigate = useNavigate();
  const musicEnabled = useSettingsStore((state) => state.musicEnabled);
  const setMusicEnabled = (enabled: boolean) => {
    useSettingsStore.setState({ musicEnabled: enabled });
  };
  const { avatar, updateAvatar } = useAvatarSettings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Audio Settings */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700" data-help-id="audio-settings">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              {musicEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              Audio
            </h2>
            <div className="space-y-3">
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
            </div>
          </div>

          {/* Avatar Settings */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700" data-help-id="avatar-settings">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Avatar Settings
            </h2>
            <div className="space-y-4">
              {/* Avatar Visibility */}
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

              {/* Speech Bubble */}
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

              {/* Head Only Mode */}
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-300 group-hover:text-white transition">
                  Head Only Mode
                  <span className="block text-xs text-slate-400 mt-1">
                    Show only avatar head (saves screen space)
                  </span>
                </span>
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

              {/* Avatar Scale */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">
                    Avatar Scale
                    <span className="block text-xs text-slate-400 mt-1">
                      Adjust size of 3D avatar in play mode
                    </span>
                  </span>
                  <span className="text-slate-300 text-sm font-mono">
                    {(avatar.avatarScale ?? 1.0).toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={avatar.avatarScale ?? 1.0}
                  onChange={(e) => updateAvatar({ avatarScale: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>
            </div>
          </div>

          {/* Other Settings */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700" data-help-id="other-settings">
            <h2 className="text-xl font-semibold text-white mb-4">Other Settings</h2>
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">
                More settings coming soon...
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <CustomButton
            onClick={() => navigate(-1)}
            className="w-full"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </CustomButton>
        </div>
      </div>

      <MenuOverlayController />
    </div>
  );
}
