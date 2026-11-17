import './grill-station.css';
import { kitchenArtwork, kitchenLayout } from '../game/front-of-house/kitchen';
import { createGrillStationScene } from '../game/front-of-house/grill-scene';
import type { Rect } from '../game/engine';
import type { GrillContents } from '../game/front-of-house/grill-contents';
import { grillFoodInstances, grillFoodTextures } from '../game/front-of-house/grill-food-art';
const outlineOffsets = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
] as const;

function artImage(path: string): HTMLImageElement {
  const image = document.createElement('img');
  image.src = path;
  image.alt = '';
  image.draggable = false;
  return image;
}

/** The actual kitchen viewport at a closer zoom; no independently arranged menu scene. */
export function createGrillStationView(
  parent: HTMLElement,
  onClose: () => void,
  contents: GrillContents,
  addIngredient: (id: string) => boolean,
) {
  const abort = new AbortController();
  const { signal } = abort;
  const element = document.createElement('dialog');
  element.className = 'grill-station';
  element.tabIndex = -1;
  element.setAttribute('aria-label', 'Grill station. Press Escape to return to the kitchen.');
  const stage = document.createElement('div');
  stage.className = 'grill-station-stage';
  const scene = createGrillStationScene(kitchenArtwork, kitchenLayout.stationViews.grill);
  const { viewport } = scene;
  const textures = new Map(scene.textures.map((texture) => [texture.id, texture]));
  const imagesToDecode: HTMLImageElement[] = [];
  const position = (element: HTMLElement, rect: Rect) => {
    element.style.left = `${((rect.x - viewport.x) / viewport.width) * 100}%`;
    element.style.top = `${((rect.y - viewport.y) / viewport.height) * 100}%`;
    element.style.width = `${(rect.width / viewport.width) * 100}%`;
    element.style.height = `${(rect.height / viewport.height) * 100}%`;
  };
  const drawables = [
    ...scene.tiles.map((tile) => ({ depth: tile.depth, tile, instance: undefined })),
    ...scene.instances.map((instance) => ({ depth: instance.depth, instance, tile: undefined })),
  ].sort((a, b) => a.depth - b.depth);
  for (const drawable of drawables) {
    const item = drawable.instance ?? drawable.tile;
    if (!item) continue;
    const texture = textures.get(item.asset);
    if (!texture) throw new Error(`Missing kitchen station texture: ${item.asset}`);
    const piece = document.createElement('div');
    piece.className = 'grill-station-piece';
    piece.dataset.worldInstance = item.id;
    if (drawable.tile) {
      position(piece, drawable.tile);
      piece.style.backgroundImage = `url("${texture.image}")`;
      piece.style.backgroundSize = `calc(${texture.width} * var(--station-pixel)) calc(${texture.height} * var(--station-pixel))`;
      imagesToDecode.push(artImage(texture.image));
    } else if (drawable.instance) {
      const { instance } = drawable;
      const crop = instance.crop ?? { x: 0, y: 0, width: texture.width, height: texture.height };
      position(piece, {
        x: instance.x + crop.x,
        y: instance.y + crop.y,
        width: crop.width,
        height: crop.height,
      });
      const image = artImage(texture.image);
      image.style.left = `${(-crop.x / crop.width) * 100}%`;
      image.style.top = `${(-crop.y / crop.height) * 100}%`;
      image.style.width = `${(texture.width / crop.width) * 100}%`;
      image.style.height = `${(texture.height / crop.height) * 100}%`;
      piece.append(image);
      imagesToDecode.push(image);
    }
    stage.append(piece);
  }

  const foodLayer = document.createElement('div');
  foodLayer.className = 'grill-station-food-layer';
  foodLayer.setAttribute('role', 'img');
  stage.append(foodLayer);
  const foodNodes = new Map<string, HTMLImageElement>();
  const foodTextures = new Map<string, (typeof grillFoodTextures)[number]>(
    grillFoodTextures.map((texture) => [texture.id, texture]),
  );
  for (const texture of grillFoodTextures) imagesToDecode.push(artImage(texture.image));
  const ingredientButtons: HTMLButtonElement[] = [];
  for (const target of scene.targets) {
    const { rect: tray, ingredientRect: ingredient } = target;
    const choice = document.createElement('button');
    choice.type = 'button';
    choice.className = 'grill-station-ingredient';
    choice.dataset.ingredient = target.instanceId;
    choice.setAttribute('aria-label', target.label);
    position(choice, tray);
    const highlight = document.createElement('span');
    highlight.className = 'grill-station-ingredient-highlight';
    highlight.setAttribute('aria-hidden', 'true');
    highlight.style.left = `${((ingredient.x - tray.x) / tray.width) * 100}%`;
    highlight.style.top = `${((ingredient.y - tray.y) / tray.height) * 100}%`;
    highlight.style.width = `${(ingredient.width / tray.width) * 100}%`;
    highlight.style.height = `${(ingredient.height / tray.height) * 100}%`;
    for (const [offsetX, offsetY] of outlineOffsets) {
      const outline = artImage(target.image);
      outline.style.setProperty('--outline-x', String(offsetX));
      outline.style.setProperty('--outline-y', String(offsetY));
      highlight.append(outline);
      // Each copy has the same source; decoding one per ingredient checks asset availability.
      if (offsetX === -1 && offsetY === -1) imagesToDecode.push(outline);
    }
    choice.append(highlight);
    choice.addEventListener(
      'click',
      () => {
        if (opened && !disposed) addIngredient(target.instanceId);
      },
      { signal },
    );
    choice.addEventListener(
      'keydown',
      (event) => {
        if (event.repeat && (event.code === 'Enter' || event.code === 'Space'))
          event.preventDefault();
      },
      { signal },
    );
    ingredientButtons.push(choice);
    stage.append(choice);
  }

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'grill-station-back';
  back.textContent = 'Esc · Back';
  const status = document.createElement('p');
  status.className = 'grill-station-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  element.append(stage, status, back);
  parent.append(element);

  let disposed = false;
  let loaded = false;
  let opened = false;
  const resize = () => {
    if (disposed) return;
    const available = Math.min(
      parent.clientWidth / viewport.width,
      parent.clientHeight / viewport.height,
    );
    const scale = available >= 1 ? Math.floor(available) : available;
    stage.style.width = `${viewport.width * scale}px`;
    stage.style.height = `${viewport.height * scale}px`;
    stage.style.setProperty('--station-pixel', `${scale}px`);
  };
  const finishClose = () => {
    if (!opened || disposed) return;
    opened = false;
    onClose();
  };
  const close = () => {
    if (!opened || disposed) return;
    element.close();
    finishClose();
  };
  back.addEventListener('click', close, { signal });
  element.addEventListener(
    'close',
    () => {
      // A queued close event may arrive after an immediate reopen.
      if (!element.open) finishClose();
    },
    { signal },
  );
  element.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      close();
    },
    { signal },
  );
  const observer = new ResizeObserver(resize);
  observer.observe(parent);
  const unsubscribeContents = contents.subscribe((state) => {
    if (disposed) return;
    const instances = grillFoodInstances(state);
    const ids = new Set(instances.map((instance) => instance.id));
    for (const [id, node] of foodNodes) {
      if (!ids.has(id)) {
        node.remove();
        foodNodes.delete(id);
      }
    }
    for (const instance of instances) {
      const texture = foodTextures.get(instance.asset);
      if (!texture) throw new Error(`Missing grill food image: ${instance.asset}`);
      let node = foodNodes.get(instance.id);
      if (!node) {
        node = artImage(texture.image);
        node.className = 'grill-station-food';
        node.dataset.grillFood = instance.id;
        foodNodes.set(instance.id, node);
        foodLayer.append(node);
      }
      if (node.getAttribute('src') !== texture.image) node.src = texture.image;
      node.dataset.foodKind = instance.asset;
      position(node, {
        x: instance.x,
        y: instance.y,
        width: texture.width,
        height: texture.height,
      });
    }
    const full = state.pieces.length >= state.capacity;
    for (const button of ingredientButtons) button.disabled = full;
    status.textContent = full ? 'Grill is full.' : '';
    status.hidden = !full;
    foodLayer.setAttribute(
      'aria-label',
      state.pieces.length ? `Grill contents: ${state.pieces.length} food items.` : 'Empty grill.',
    );
  });
  const ready = Promise.all(imagesToDecode.map((image) => image.decode())).then(() => {
    if (disposed) return;
    loaded = true;
    resize();
  });

  return {
    element,
    ready,
    open: () => {
      if (disposed || opened || !loaded) return;
      resize();
      element.showModal();
      opened = true;
      element.focus({ preventScroll: true });
    },
    close,
    destroy: () => {
      if (disposed) return;
      disposed = true;
      opened = false;
      abort.abort();
      observer.disconnect();
      unsubscribeContents();
      foodNodes.clear();
      if (element.open) element.close();
      element.remove();
    },
  };
}
