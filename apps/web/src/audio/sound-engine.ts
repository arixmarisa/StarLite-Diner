import { sounds, type SoundId } from './catalog';

/** Small media boundary keeps lifecycle tests independent of a browser/Phaser. */
export interface SoundVoice {
  src: string;
  preload: string;
  volume: number;
  muted: boolean;
  currentTime: number;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  play(): Promise<void>;
  pause(): void;
  load(): void;
  removeAttribute(name: string): void;
}

interface VoiceSlot {
  id: SoundId;
  media: SoundVoice;
  busy: boolean;
  generation: number;
}

export interface SoundEngine {
  /** Call synchronously from a user gesture; false means skipped/failed/canceled. */
  play(id: SoundId): Promise<boolean>;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  stopAll(): void;
  destroy(): void;
}

/** Bounded one-shot playback. No simulation, global listeners or autoplay. */
export function createSoundEngine(
  createVoice: () => SoundVoice = () => new Audio(),
): SoundEngine {
  const slots: VoiceSlot[] = [];
  const maxVoices = 8;
  let volume = 1;
  let muted = false;
  let destroyed = false;

  function addVoice(id: SoundId): VoiceSlot {
    const media = createVoice();
    media.preload = 'auto';
    media.src = sounds[id].url;
    media.volume = sounds[id].volume * volume;
    media.muted = muted;
    const slot: VoiceSlot = { id, media, busy: false, generation: 0 };
    media.onended = media.onerror = () => {
      slot.busy = false;
      slot.generation++;
    };
    slots.push(slot);
    media.load();
    return slot;
  }

  // Preload without requiring successful media loading to enter the game.
  for (const id of Object.keys(sounds) as SoundId[]) {
    try {
      addVoice(id);
    } catch {
      // A later gesture may retry creation; sound is optional presentation.
    }
  }

  function stopAll() {
    for (const slot of slots) {
      slot.generation++;
      slot.busy = false;
      slot.media.pause();
      slot.media.currentTime = 0;
    }
  }

  return {
    async play(id) {
      if (destroyed || muted || volume === 0) return false;
      let slot: VoiceSlot | undefined;
      let generation = 0;
      try {
        slot = slots.find((voice) => voice.id === id && !voice.busy);
        if (!slot && slots.length < maxVoices) slot = addVoice(id);
        if (!slot) return false;
        slot.busy = true;
        generation = ++slot.generation;
        slot.media.currentTime = 0;
        // No await before play(): preserve the browser's activation permission.
        await slot.media.play();
        return !destroyed && generation === slot.generation;
      } catch {
        if (slot && slot.generation === generation) slot.busy = false;
        return false;
      }
    },
    setVolume(value) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new RangeError('Sound volume must be between 0 and 1.');
      }
      volume = value;
      for (const slot of slots) slot.media.volume = sounds[slot.id].volume * volume;
    },
    setMuted(value) {
      muted = value;
      for (const slot of slots) slot.media.muted = value;
    },
    stopAll,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stopAll();
      for (const slot of slots) {
        slot.media.onended = slot.media.onerror = null;
        slot.media.removeAttribute('src');
        slot.media.load();
      }
      slots.length = 0;
    },
  };
}
