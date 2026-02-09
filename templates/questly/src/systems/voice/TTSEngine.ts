/**
 * TTS Engine - Text-to-Speech using Web Speech API
 * Provides voice synthesis for NPCs and dialogue
 */

export interface Voice {
  id: string;
  name: string;
  description: string;
  lang: string;
  tier: 'free' | 'creator' | 'pro';
}

const AVAILABLE_VOICES: Voice[] = [
  { id: 'google-uk-male', name: 'Google UK English Male', description: 'British narrator', lang: 'en-GB', tier: 'free' },
  { id: 'google-uk-female', name: 'Google UK English Female', description: 'British narrator', lang: 'en-GB', tier: 'free' },
  { id: 'google-us', name: 'Google US English', description: 'American neutral', lang: 'en-US', tier: 'free' },
  { id: 'samantha', name: 'Samantha', description: 'American female (iOS)', lang: 'en-US', tier: 'creator' },
  { id: 'daniel', name: 'Daniel', description: 'British male (iOS)', lang: 'en-GB', tier: 'creator' },
  { id: 'karen', name: 'Karen', description: 'Australian female', lang: 'en-AU', tier: 'pro' },
  { id: 'moira', name: 'Moira', description: 'Irish female', lang: 'en-IE', tier: 'pro' },
];

class TTSEngine {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private tier: 'free' | 'creator' | 'pro' = 'free';
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      
      // Reload voices when they become available
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  setTier(tier: 'free' | 'creator' | 'pro') {
    this.tier = tier;
  }

  getAllVoices(): Voice[] {
    return AVAILABLE_VOICES;
  }

  isVoiceAvailable(voiceId: string): boolean {
    const voice = AVAILABLE_VOICES.find(v => v.id === voiceId);
    if (!voice) return false;
    
    // Check tier access
    if (voice.tier === 'pro' && this.tier !== 'pro') return false;
    if (voice.tier === 'creator' && this.tier === 'free') return false;
    
    // Check if voice exists in browser
    const voiceDef = AVAILABLE_VOICES.find(v => v.id === voiceId);
    if (!voiceDef) return false;
    
    // Try to find matching browser voice
    const browserVoice = this.voices.find(v => 
      v.lang.startsWith(voiceDef.lang) && 
      (voiceId.includes('female') ? v.name.toLowerCase().includes('female') : 
       voiceId.includes('male') ? v.name.toLowerCase().includes('male') : true)
    );
    
    return browserVoice !== undefined || this.tier === 'pro'; // Pro tier can use any voice
  }

  speak(text: string, voiceId?: string, onEnd?: () => void): void {
    if (!this.synth || !text) return;
    
    // Stop any current speech
    this.stop();
    
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;
    
    // Set voice if specified
    if (voiceId) {
      const voiceDef = AVAILABLE_VOICES.find(v => v.id === voiceId);
      if (voiceDef && this.isVoiceAvailable(voiceId)) {
        const browserVoice = this.voices.find(v => 
          v.lang.startsWith(voiceDef.lang) &&
          (voiceId.includes('female') ? v.name.toLowerCase().includes('female') : 
           voiceId.includes('male') ? v.name.toLowerCase().includes('male') : true)
        );
        if (browserVoice) {
          utterance.voice = browserVoice;
        }
        utterance.lang = voiceDef.lang;
      }
    }
    
    // Set default properties
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    if (onEnd) {
      utterance.onend = onEnd;
    }
    
    this.synth.speak(utterance);
  }

  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const globalTTSEngine = new TTSEngine();
