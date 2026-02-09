import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AvatarSettings {
  showSpeechBubble: boolean;
  headOnlyMode: boolean;
  avatarVisible: boolean;
  avatarScale: number; // Scale of the avatar in 3D scene (0.5 - 2.0, default 1.0)
}

interface AppSettings {
  musicEnabled: boolean;
  avatar: AvatarSettings;
}

const defaultSettings: AppSettings = {
  musicEnabled: true,
  avatar: {
    showSpeechBubble: true,
    headOnlyMode: false,
    avatarVisible: true,
    avatarScale: 1.0,
  },
};

export const useSettingsStore = create<AppSettings>()(
  persist(
    (set) => ({
      ...defaultSettings,
    }),
    {
      name: 'questly-settings',
    }
  )
);

export const useAvatarSettings = () => {
  const avatar = useSettingsStore((state) => state.avatar);
  const updateAvatar = (updates: Partial<AvatarSettings>) => {
    useSettingsStore.setState((state) => ({
      avatar: { ...state.avatar, ...updates },
    }));
  };
  return { avatar, updateAvatar };
};
