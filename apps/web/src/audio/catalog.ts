/** Local presentation assets only; callers select IDs rather than arbitrary URLs. */
export const sounds = {
  'start-bell': { url: '/audio/start-bell.wav', volume: 1 },
} as const;

export type SoundId = keyof typeof sounds;
