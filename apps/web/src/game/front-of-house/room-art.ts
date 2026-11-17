import type { Rect } from '../engine';

/** Renderer-only room data; engine world geometry lives separately. */
export interface RoomArtwork {
  id: string;
  size: { width: number; height: number };
  textures: { id: string; image: string; width: number; height: number }[];
  tiles: (Rect & { id: string; asset: string; depth: number })[];
  instances: { id: string; asset: string; x: number; y: number; depth: number; crop?: Rect }[];
}
