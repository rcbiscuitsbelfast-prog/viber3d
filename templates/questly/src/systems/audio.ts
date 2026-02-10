import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Audio Manager for background music and sound effects
 * Handles music playback across different pages and respects user settings
 */
class AudioManager {
  private musicAudio: HTMLAudioElement | null = null;
  private currentTrack: string | null = null;
  private isInitialized = false;
  private musicEnabled = true;

  // Track paths - update these when music files are added
  private readonly trackPaths: Record<string, string> = {
    'track_1': `${import.meta.env.BASE_URL}Assets/music/Medieval Vol. 2 1 (Loop).mp3`,
    'track_2': `${import.meta.env.BASE_URL}Assets/music/Medieval Vol. 2 2 (Loop).mp3`,
    'track_3': `${import.meta.env.BASE_URL}Assets/music/Medieval Vol. 2 3 (Loop).mp3`,
    'track_4': `${import.meta.env.BASE_URL}Assets/music/Medieval Vol. 2 4 (Loop).mp3`,
    'track_5': `${import.meta.env.BASE_URL}Assets/music/Medieval Vol. 2 5 (Loop).mp3`,
    'track_6': `${import.meta.env.BASE_URL}Assets/music/Medieval Vol. 2 6 (Loop).mp3`,
    'track_7': `${import.meta.env.BASE_URL}Assets/music/Medieval Vol. 2 7 (Loop).mp3`,
    'track_8': `${import.meta.env.BASE_URL}Assets/music/Medieval Vol. 2 8 (Loop).mp3`,
  };

  /**
   * Initialize the audio manager
   * Must be called before playing music (usually on first page load)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Subscribe to music enabled setting changes
    useSettingsStore.subscribe((state) => {
      const enabled = state.musicEnabled;
      console.log('[AudioManager] Music setting changed:', enabled);

      if (this.musicEnabled === enabled) return; // No change

      this.musicEnabled = enabled;
      if (!enabled && this.musicAudio) {
        console.log('[AudioManager] Pausing music');
        this.musicAudio.pause();
      } else if (enabled) {
        // When re-enabling music, check if we have a track to play
        if (this.musicAudio && !this.musicAudio.paused) {
          // Already playing, nothing to do
          return;
        }
        if (this.musicAudio) {
          // Resume existing paused track
          console.log('[AudioManager] Resuming music');
          this.musicAudio.play().catch((err) => {
            console.warn('Failed to resume music:', err);
          });
        } else if (this.currentTrack) {
          // No audio element yet, but we have a track - start playing it
          console.log('[AudioManager] Starting music for track:', this.currentTrack);
          this.playMusic(this.currentTrack);
        }
      }
    });

    // Get initial music enabled state
    this.musicEnabled = useSettingsStore.getState().musicEnabled;
    console.log('[AudioManager] Initial music enabled state:', this.musicEnabled);
    this.isInitialized = true;
  }

  /**
   * Play background music
   * @param trackId - Track identifier (e.g., 'track_2_1', 'track_2_5')
   * @param loop - Whether to loop the track (default: true)
   * @param ignoreEnabled - If true, play regardless of musicEnabled setting (for splash screen)
   */
  playMusic(trackId: string, loop: boolean = true, ignoreEnabled: boolean = false): void {
    // Auto-initialize if not already done
    if (!this.isInitialized) {
      console.log('[AudioManager] Auto-initializing on first playMusic call');
      this.init().then(() => {
        this.playMusic(trackId, loop, ignoreEnabled);
      });
      return;
    }

    // If same track is already playing, don't restart
    if (this.currentTrack === trackId && this.musicAudio && !this.musicAudio.paused) {
      console.log(`[AudioManager] Track ${trackId} already playing, skipping`);
      return;
    }

    // Stop current music
    this.stopMusic();

    // Check if music is enabled (unless ignoreEnabled is true)
    if (!ignoreEnabled && !this.musicEnabled) {
      console.log(`[AudioManager] Music disabled, will play ${trackId} when enabled`);
      this.currentTrack = trackId; // Remember the track for when music is re-enabled
      return;
    }

    const trackPath = this.trackPaths[trackId];
    if (!trackPath) {
      console.warn(`Track ${trackId} not found in trackPaths`);
      return;
    }

    console.log(`[AudioManager] Attempting to play track: ${trackId} from path: ${trackPath}`);

    // Create new audio element
    this.musicAudio = new Audio(trackPath);
    this.musicAudio.loop = loop;
    this.musicAudio.volume = 0.5; // 50% volume

    // Handle errors
    this.musicAudio.addEventListener('error', (e) => {
      console.error(`[AudioManager] Failed to load music track ${trackId}:`, e);
      console.error(`[AudioManager] Track path: ${trackPath}`);
      console.error(`[AudioManager] Error details:`, this.musicAudio?.error);
      this.musicAudio = null;
      this.currentTrack = null;
    });

    // Log when audio can play
    this.musicAudio.addEventListener('canplay', () => {
      console.log(`[AudioManager] Track ${trackId} is ready to play`);
    });

    // Log when audio starts playing
    this.musicAudio.addEventListener('play', () => {
      console.log(`[AudioManager] Track ${trackId} started playing`);
    });

    // Play music
    this.musicAudio
      .play()
      .then(() => {
        this.currentTrack = trackId;
        console.log(`[AudioManager] Successfully playing track: ${trackId}`);
      })
      .catch((err) => {
        console.warn(`[AudioManager] Failed to play music track ${trackId}:`, err);
        console.warn(`[AudioManager] Track path: ${trackPath}`);
        console.warn(`[AudioManager] Music enabled: ${this.musicEnabled}`);
        // User interaction may be required - try to play on next user interaction
        // Add a one-time click listener to start music
        const tryPlayOnInteraction = () => {
          if (this.musicAudio && this.currentTrack === trackId) {
            this.musicAudio.play()
              .then(() => {
                console.log(`[AudioManager] Music started after user interaction`);
                document.removeEventListener('click', tryPlayOnInteraction);
                document.removeEventListener('touchstart', tryPlayOnInteraction);
              })
              .catch(() => {
                // Still failed, keep listener
              });
          }
        };
        document.addEventListener('click', tryPlayOnInteraction, { once: true });
        document.addEventListener('touchstart', tryPlayOnInteraction, { once: true });
      });
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
      this.musicAudio = null;
    }
    this.currentTrack = null;
  }

  /**
   * Pause background music (can be resumed)
   */
  pauseMusic(): void {
    if (this.musicAudio && !this.musicAudio.paused) {
      this.musicAudio.pause();
    }
  }

  /**
   * Resume background music
   */
  resumeMusic(): void {
    if (this.musicAudio && this.musicAudio.paused && this.musicEnabled) {
      this.musicAudio.play().catch((err) => {
        console.warn('Failed to resume music:', err);
      });
    }
  }

  /**
   * Set music volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.musicAudio) {
      this.musicAudio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current track ID
   */
  getCurrentTrack(): string | null {
    return this.currentTrack;
  }

  /**
   * Check if music is currently playing
   */
  isPlaying(): boolean {
    return this.musicAudio !== null && !this.musicAudio.paused;
  }
}

// Export singleton instance
export const globalAudioManager = new AudioManager();
