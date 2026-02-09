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
    'track_2_1': '/Assets/music/track_2_1.mp3', // Splash screen
    'track_2_5': '/Assets/music/track_2_5.mp3', // Main menu and other pages
  };

  /**
   * Initialize the audio manager
   * Must be called before playing music (usually on first page load)
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    // Subscribe to music enabled setting changes
    useSettingsStore.subscribe(
      (state) => state.musicEnabled,
      (enabled) => {
        this.musicEnabled = enabled;
        if (!enabled && this.musicAudio) {
          this.musicAudio.pause();
        } else if (enabled && this.musicAudio && this.currentTrack) {
          this.musicAudio.play().catch((err) => {
            console.warn('Failed to resume music:', err);
          });
        }
      },
      { fireImmediately: true }
    );

    // Get initial music enabled state
    this.musicEnabled = useSettingsStore.getState().musicEnabled;
    this.isInitialized = true;
  }

  /**
   * Play background music
   * @param trackId - Track identifier (e.g., 'track_2_1', 'track_2_5')
   * @param loop - Whether to loop the track (default: true)
   */
  playMusic(trackId: string, loop: boolean = true): void {
    if (!this.isInitialized) {
      console.warn('AudioManager not initialized. Call init() first.');
      return;
    }

    // If same track is already playing, don't restart
    if (this.currentTrack === trackId && this.musicAudio && !this.musicAudio.paused) {
      return;
    }

    // Stop current music
    this.stopMusic();

    // Check if music is enabled
    if (!this.musicEnabled) {
      this.currentTrack = trackId; // Remember the track for when music is re-enabled
      return;
    }

    const trackPath = this.trackPaths[trackId];
    if (!trackPath) {
      console.warn(`Track ${trackId} not found in trackPaths`);
      return;
    }

    // Create new audio element
    this.musicAudio = new Audio(trackPath);
    this.musicAudio.loop = loop;
    this.musicAudio.volume = 0.5; // 50% volume

    // Handle errors
    this.musicAudio.addEventListener('error', (e) => {
      console.error(`Failed to load music track ${trackId}:`, e);
      this.musicAudio = null;
      this.currentTrack = null;
    });

    // Play music
    this.musicAudio
      .play()
      .then(() => {
        this.currentTrack = trackId;
      })
      .catch((err) => {
        console.warn(`Failed to play music track ${trackId}:`, err);
        // User interaction may be required - music will play on next user interaction
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
