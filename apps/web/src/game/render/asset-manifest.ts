export interface AssetDefinition {
  id: string;
  image: string;
  frameSize: { width: number; height: number };
  sheetSize: { width: number; height: number };
  anchor: { x: number; y: number };
  footprint: { x: number; y: number; width: number; height: number };
  animations: Record<string, { frames: number[]; fps: number }>;
}

export interface AssetManifest {
  schemaVersion: 1;
  assets: AssetDefinition[];
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Asset manifest: expected an object');
  }
  return value as Record<string, unknown>;
}

function finite(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error('Asset manifest: expected a finite number');
  }
  return value;
}

function size(value: unknown) {
  const data = record(value);
  const width = finite(data.width);
  const height = finite(data.height);
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 4096 ||
    height > 4096
  ) {
    throw new Error('Asset manifest: invalid dimensions');
  }
  return { width, height };
}

/** Parse untrusted metadata without treating a type assertion as validation. */
export function parseAssetManifest(value: unknown): AssetManifest {
  const root = record(value);
  if (root.schemaVersion !== 1 || !Array.isArray(root.assets) || root.assets.length > 256) {
    throw new Error('Asset manifest: unsupported schema or asset list');
  }
  const ids = new Set<string>();
  const assets = root.assets.map((entry: unknown): AssetDefinition => {
    const data = record(entry);
    if (
      typeof data.id !== 'string' ||
      !/^[a-z][a-z0-9-]{0,63}$/.test(data.id) ||
      ids.has(data.id)
    ) {
      throw new Error('Asset manifest: invalid or duplicate ID');
    }
    ids.add(data.id);
    if (typeof data.image !== 'string' || !/^\/art\/[a-zA-Z0-9/_-]+\.png$/.test(data.image)) {
      throw new Error('Asset manifest: expected a local PNG path');
    }
    const frameSize = size(data.frameSize);
    const sheetSize = size(data.sheetSize);
    if (sheetSize.width % frameSize.width || sheetSize.height % frameSize.height) {
      throw new Error('Asset manifest: frames do not divide the sheet');
    }
    const point = record(data.anchor);
    const anchor = { x: finite(point.x), y: finite(point.y) };
    if (
      anchor.x < 0 ||
      anchor.x >= frameSize.width ||
      anchor.y < 0 ||
      anchor.y >= frameSize.height
    ) {
      throw new Error('Asset manifest: anchor outside frame');
    }
    const box = record(data.footprint);
    const footprint = { x: finite(box.x), y: finite(box.y), ...size(box) };
    const maxFrame = (sheetSize.width / frameSize.width) * (sheetSize.height / frameSize.height);
    const animations: AssetDefinition['animations'] = {};
    for (const [name, raw] of Object.entries(record(data.animations))) {
      const animation = record(raw);
      const fps = finite(animation.fps);
      if (
        !/^[a-z][a-z0-9_]{0,63}$/.test(name) ||
        fps <= 0 ||
        fps > 60 ||
        !Array.isArray(animation.frames) ||
        !animation.frames.length ||
        animation.frames.length > 256
      ) {
        throw new Error('Asset manifest: invalid animation');
      }
      const frames = animation.frames.map((frame: unknown) => {
        const index = finite(frame);
        if (!Number.isInteger(index) || index < 0 || index >= maxFrame)
          throw new Error('Asset manifest: frame outside sheet');
        return index;
      });
      animations[name] = { fps, frames };
    }
    return { id: data.id, image: data.image, frameSize, sheetSize, anchor, footprint, animations };
  });
  return { schemaVersion: 1, assets };
}

export function requireAsset(manifest: AssetManifest, id: string): AssetDefinition {
  const asset = manifest.assets.find((entry) => entry.id === id);
  if (!asset) throw new Error(`Asset manifest: missing ${id}`);
  return asset;
}
