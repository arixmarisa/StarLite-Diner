import './styles.css';
import {
  History,
  addAsset,
  assetById,
  catalog,
  createDraft,
  exportDraft,
  expandSelection,
  importDraft,
  moveInstances,
  paletteAssets,
  roomLabels,
  selectInRectangle,
  ungroupInstances,
} from './model';
import type { Draft, Instance, RoomMode, SelectionRect } from './model';
import { resizeRoom } from './resize';

export function mountDesign() {
  const previousTitle = document.title;
  document.title = 'Layout designer · Starlite Diner';
  document.body.classList.add('design-page');
  document.body.innerHTML = `
    <main class="designer" aria-label="Diner layout designer">
      <header class="design-header"><a href="/" aria-label="Back to game">← Game</a><strong>Layout designer</strong><span class="design-draft-badge">Draft only</span><div class="design-actions"><button id="design-import">Import JSON</button><button id="design-export" class="design-primary" disabled>Export JSON ↓</button></div></header>
      <aside class="design-library" aria-label="Asset library"><div class="design-library-head"><label for="design-search">Assets <span id="design-asset-count"></span></label><input id="design-search" type="search" placeholder="Search assets…"><label class="sr-only" for="design-category">Asset category</label><select id="design-category"><option value="">All room assets</option><option>Dining room</option><option>Kitchen</option></select></div><div id="design-assets" class="design-assets"></div></aside>
      <section class="design-workspace" aria-label="Layout workspace">
        <form id="design-room-form" class="design-room-controls"><label>Room <select id="design-room" disabled><option value="front-of-house">Front of house</option><option value="back-of-house">Back of house</option></select></label><fieldset id="design-size-controls" disabled><legend class="sr-only">Room dimensions in native pixels</legend><label>Width <input id="design-width" type="number" min="160" max="2048" step="1" value="624" required></label><span aria-hidden="true">×</span><label>Height <input id="design-height" type="number" min="160" max="2048" step="1" value="432" required></label><button type="submit">Apply size</button></fieldset><span class="design-room-hint">Native pixels · retile walls, keep furniture in place. Move pieces inward before shrinking.</span></form>
        <div class="design-toolbar"><div><button id="design-undo" disabled>Undo</button><button id="design-redo" disabled>Redo</button><button id="design-reset" disabled>Reset</button><button id="design-ungroup-all" disabled>Ungroup all</button></div><div><label>Snap <select id="design-snap"><option value="1">1 px</option><option value="4">4 px</option><option value="8">8 px</option><option value="16">16 px</option></select></label><label>Zoom <select id="design-zoom"><option value="fit">Fit</option><option value="1">100%</option><option value="2">200%</option><option value="3">300%</option></select></label><label><input type="checkbox" id="design-floor" checked> Floor</label></div></div>
        <div id="design-viewport" class="design-viewport"><canvas id="design-canvas" width="624" height="432" tabindex="0" aria-label="Dining room layout. Select an asset then click to place. Drag empty floor to box-select. Shift-drag adds to selection. Drag selected furniture to move, arrows to nudge, Delete to remove."></canvas></div>
        <div class="design-inspector"><div class="design-object"><label for="design-object">Selected object</label><select id="design-object"><option value="">Nothing selected</option></select><span id="design-selection-detail">Drag empty floor to select · Shift-drag to add · drag a selected piece to move.</span></div><div class="design-properties"><label>X <input id="design-x" type="number" step="1" disabled></label><label>Y <input id="design-y" type="number" step="1" disabled></label><label>Layer <select id="design-layer" disabled>${['Floor / thresholds', 'Walls / decor', 'Furniture base', 'Furniture', 'Countertop props', 'Foreground', 'Front trim', 'Room foreground'].map((name, i) => `<option value="${i}">${i} · ${name}</option>`).join('')}</select></label><label class="design-group"><input type="checkbox" id="design-group"> Select assembly</label><button id="design-ungroup" disabled>Ungroup</button><button id="design-duplicate" disabled>Duplicate</button><button id="design-remove" disabled>Remove</button></div></div>
        <footer class="design-footer"><span id="design-status" role="status" aria-live="polite">Loading room assets…</span><span id="design-changes">624 × 432 · native pixels</span></footer>
      </section>
      <div id="design-context-menu" class="design-context-menu" role="menu" aria-label="Object actions" hidden><button id="design-context-duplicate" role="menuitem">Duplicate</button><button id="design-context-ungroup" role="menuitem">Ungroup</button></div>
      <input id="design-file" type="file" accept="application/json,.json" hidden>
    </main>`;
  const query = <T extends HTMLElement>(selector: string): T => {
    const node = document.querySelector<T>(selector);
    if (!node) throw new Error(`Missing design control: ${selector}`);
    return node;
  };
  const canvas = query<HTMLCanvasElement>('#design-canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable');
  const ctx = context;
  const viewport = query('#design-viewport');
  const palette = query('#design-assets');
  const search = query<HTMLInputElement>('#design-search');
  const category = query<HTMLSelectElement>('#design-category');
  const objectSelect = query<HTMLSelectElement>('#design-object');
  const group = query<HTMLInputElement>('#design-group');
  const xInput = query<HTMLInputElement>('#design-x');
  const yInput = query<HTMLInputElement>('#design-y');
  const layerInput = query<HTMLSelectElement>('#design-layer');
  const zoom = query<HTMLSelectElement>('#design-zoom');
  const snap = query<HTMLSelectElement>('#design-snap');
  const file = query<HTMLInputElement>('#design-file');
  const contextMenu = query<HTMLDivElement>('#design-context-menu');
  const roomInput = query<HTMLSelectElement>('#design-room');
  const widthInput = query<HTMLInputElement>('#design-width');
  const heightInput = query<HTMLInputElement>('#design-height');
  const abort = new AbortController();
  const { signal } = abort;
  const histories: Record<RoomMode, History> = {
    'front-of-house': new History(),
    'back-of-house': new History('back-of-house'),
  };
  let history = histories['front-of-house'];
  const images = new Map<string, HTMLImageElement>();
  const masks = new Map<string, Uint8ClampedArray>();
  const urls = new Set<string>();
  let selected: string | null = null;
  let selection: string[] = [];
  let placing: string | null = null;
  let disposed = false;
  let loaded = false;
  let drag: { pointer: number; x: number; y: number; draft: Draft; ids: string[] } | null = null;
  let preview: Draft | null = null;
  let boxDrag: {
    pointer: number;
    x: number;
    y: number;
    endX: number;
    endY: number;
    additive: boolean;
    previous: string[];
    focus: string | null;
    hit: string | null;
  } | null = null;
  const status = (message: string) => {
    query('#design-status').textContent = message;
  };
  const button = (id: string, disabled: boolean) => {
    query<HTMLButtonElement>(id).disabled = disabled;
  };
  function closeContextMenu(restoreFocus = false) {
    const wasOpen = !contextMenu.hidden;
    contextMenu.hidden = true;
    if (wasOpen && restoreFocus) canvas.focus();
  }
  function selectedItems(draft = history.current) {
    return expandSelection(draft, selection, group.checked);
  }
  function selectOnly(id: string | null) {
    selected = id;
    selection = id ? [id] : [];
  }
  function selectionRect(): SelectionRect | null {
    return boxDrag
      ? {
          x: Math.min(boxDrag.x, boxDrag.endX),
          y: Math.min(boxDrag.y, boxDrag.endY),
          width: Math.abs(boxDrag.endX - boxDrag.x),
          height: Math.abs(boxDrag.endY - boxDrag.y),
        }
      : null;
  }
  function ordered(draft: Draft) {
    return [...draft.instances].sort((a, b) => a.layer - b.layer);
  }
  function render(draft = history.current) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    const floor = draft.floor;
    const floorImage = images.get(floor.asset);
    if (floor.visible && floorImage) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(floor.x, floor.y, floor.width, floor.height);
      ctx.clip();
      for (let y = floor.y; y < floor.y + floor.height; y += floorImage.height) {
        for (let x = floor.x; x < floor.x + floor.width; x += floorImage.width)
          ctx.drawImage(floorImage, x, y);
      }
      ctx.restore();
    }
    for (const item of ordered(draft)) {
      const image = images.get(item.asset);
      if (!image) continue;
      if (item.clip) {
        const c = item.clip;
        ctx.drawImage(
          image,
          c.x,
          c.y,
          c.width,
          c.height,
          item.x + c.x,
          item.y + c.y,
          c.width,
          c.height,
        );
      } else ctx.drawImage(image, item.x, item.y);
    }
    const ids = selectedItems(draft);
    ctx.strokeStyle = '#ffe4a1';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    for (const item of draft.instances.filter((item) => ids.includes(item.id))) {
      const asset = assetById.get(item.asset)!;
      const c = item.clip;
      ctx.strokeRect(
        item.x + (c?.x ?? 0) + 0.5,
        item.y + (c?.y ?? 0) + 0.5,
        (c?.width ?? asset.width) - 1,
        (c?.height ?? asset.height) - 1,
      );
    }
    ctx.setLineDash([]);
    const box = selectionRect();
    if (box) {
      ctx.fillStyle = '#ffe4a126';
      ctx.fillRect(box.x, box.y, box.width, box.height);
      ctx.strokeStyle = '#ffe4a1';
      ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.width, box.height);
    }
  }
  function fit() {
    const roomSize = history.current.size;
    const available = Math.min(
      (viewport.clientWidth - 40) / roomSize.width,
      (viewport.clientHeight - 40) / roomSize.height,
    );
    const scale =
      zoom.value === 'fit'
        ? available >= 1
          ? Math.floor(available)
          : Math.max(0.1, available)
        : Number(zoom.value);
    canvas.style.width = `${roomSize.width * scale}px`;
    canvas.style.height = `${roomSize.height * scale}px`;
  }
  function refresh() {
    closeContextMenu();
    const draft = history.current;
    roomInput.value = draft.room;
    widthInput.value = String(draft.size.width);
    heightInput.value = String(draft.size.height);
    canvas.setAttribute(
      'aria-label',
      `${roomLabels[draft.room]} layout. Select an asset to place. Drag empty floor to box-select. Drag selected objects to move; arrows to nudge; Delete to remove.`,
    );
    if (canvas.width !== draft.size.width || canvas.height !== draft.size.height) {
      canvas.width = draft.size.width;
      canvas.height = draft.size.height;
    }
    fit();
    selection = selection.filter((id) => draft.instances.some((item) => item.id === id));
    if (!selected || !selection.includes(selected)) selected = selection[0] ?? null;
    const item = draft.instances.find((item) => item.id === selected);
    const ids = selectedItems();
    objectSelect.replaceChildren(
      new Option('Nothing selected', ''),
      ...draft.instances.map((item) => new Option(item.id, item.id)),
    );
    objectSelect.value = selected ?? '';
    xInput.disabled = yInput.disabled = layerInput.disabled = !item;
    xInput.value = item ? String(item.x) : '';
    yInput.value = item ? String(item.y) : '';
    layerInput.value = String(item?.layer ?? 3);
    query('#design-selection-detail').textContent = placing
      ? `Click the room to place ${assetById.get(placing)!.label}. Escape cancels.`
      : item
        ? `${assetById.get(item.asset)!.label} · ${ids.length} piece${ids.length === 1 ? '' : 's'} selected`
        : 'Drag empty floor to select · Shift-drag to add · drag a selected piece to move.';
    button('#design-undo', !history.canUndo);
    button('#design-redo', !history.canRedo);
    button('#design-remove', !item);
    button('#design-duplicate', !item);
    button(
      '#design-ungroup',
      !draft.instances.some((item) => ids.includes(item.id) && item.parent),
    );
    button('#design-ungroup-all', !draft.instances.some((item) => item.parent));
    query<HTMLInputElement>('#design-floor').checked = draft.floor.visible;
    const changes = exportDraft(draft).changes;
    query('#design-changes').textContent =
      `${draft.size.width} × ${draft.size.height} · +${changes.added.length} added · ${changes.updated.length} moved / edited · −${changes.removed.length} removed${changes.sizeChanged ? ' · room resized' : ''}${changes.floorChanged ? ' · floor edited' : ''}`;
    palette
      .querySelectorAll<HTMLButtonElement>('button')
      .forEach((node) => node.setAttribute('aria-pressed', String(node.dataset.asset === placing)));
    canvas.classList.toggle('is-placing', !!placing);
    render();
  }
  function commit(next: Draft, message: string) {
    history.commit(next);
    refresh();
    status(message);
  }
  function renderPalette() {
    const assets = paletteAssets.filter(
      (asset) =>
        (!category.value || asset.category === category.value) &&
        `${asset.label} ${asset.category}`.toLowerCase().includes(search.value.toLowerCase()),
    );
    palette.replaceChildren();
    for (const asset of assets) {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'design-asset';
      node.dataset.asset = asset.id;
      node.setAttribute('aria-pressed', String(placing === asset.id));
      node.disabled = !loaded;
      node.draggable = loaded;
      node.title = `${asset.label} · ${asset.width} × ${asset.height} native pixels`;
      const image = document.createElement('img');
      image.src = asset.image;
      image.alt = '';
      image.draggable = false;
      image.loading = 'lazy';
      const label = document.createElement('span');
      label.textContent = asset.label;
      const size = document.createElement('small');
      size.textContent = `${asset.width} × ${asset.height}`;
      node.append(image, label, size);
      palette.append(node);
    }
    if (!assets.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No matching assets.';
      palette.append(empty);
    }
    query('#design-asset-count').textContent = String(assets.length);
  }
  function point(event: { clientX: number; clientY: number }) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) * canvas.width) / rect.width,
      y: ((event.clientY - rect.top) * canvas.height) / rect.height,
    };
  }
  function hit(x: number, y: number): Instance | undefined {
    return ordered(history.current)
      .reverse()
      .find((item) => {
        const asset = assetById.get(item.asset)!;
        const px = Math.floor(x - item.x);
        const py = Math.floor(y - item.y);
        const c = item.clip;
        return (
          px >= (c?.x ?? 0) &&
          py >= (c?.y ?? 0) &&
          px < (c ? c.x + c.width : asset.width) &&
          py < (c ? c.y + c.height : asset.height) &&
          (masks.get(asset.id)?.[(py * asset.width + px) * 4 + 3] ?? 0) > 0
        );
      });
  }
  const snapped = (value: number) => Math.round(value / Number(snap.value)) * Number(snap.value);
  function place(asset: string, x: number, y: number) {
    if (!assetById.get(asset)?.paletteVisible) return;
    const size = assetById.get(asset)!;
    if (size.width > history.current.size.width || size.height > history.current.size.height) {
      status('This asset is larger than the room. Enlarge the room first.');
      return;
    }
    const next = addAsset(
      history.current,
      asset,
      snapped(x - size.width / 2),
      snapped(y - size.height / 2),
    );
    selectOnly(next.id);
    placing = null;
    commit(next.draft, 'Asset placed. Drag to adjust its position.');
    canvas.focus();
  }
  function remove() {
    const ids = selectedItems();
    if (!ids.length) return;
    commit(
      {
        ...history.current,
        instances: history.current.instances.filter((item) => !ids.includes(item.id)),
      },
      `Removed ${ids.length} piece${ids.length === 1 ? '' : 's'}. Undo restores them.`,
    );
  }
  function duplicate() {
    const ids = selectedItems();
    if (!ids.length) return;
    let draft = history.current;
    let first: string | null = null;
    const parent = `design-group-${Date.now()}`;
    for (const item of history.current.instances.filter((item) => ids.includes(item.id))) {
      const result = addAsset(draft, item.asset, item.x, item.y);
      draft = {
        ...result.draft,
        instances: result.draft.instances.map((copy) =>
          copy.id === result.id
            ? {
                ...copy,
                x: item.x,
                y: item.y,
                layer: item.layer,
                clip: item.clip && { ...item.clip },
                parent: ids.length > 1 ? parent : null,
                role: item.role,
              }
            : copy,
        ),
      };
      first ??= result.id;
    }
    const copies = draft.instances.slice(history.current.instances.length).map((item) => item.id);
    selected = first;
    selection = copies;
    commit(moveInstances(draft, copies, 8, 8), 'Selection duplicated.');
  }
  function ungroup(all = false) {
    if (!all && !selected) return;
    cancelDrag();
    const ids = selectedItems();
    commit(
      all
        ? ungroupInstances(history.current, null)
        : ids.reduce((draft, id) => ungroupInstances(draft, id), history.current),
      all
        ? 'All assemblies ungrouped. Every piece can move independently. Undo restores groups.'
        : 'Assembly ungrouped. Its pieces can now move independently. Undo restores the group.',
    );
  }
  function showContextMenu(clientX: number, clientY: number) {
    query<HTMLButtonElement>('#design-context-ungroup').disabled = !history.current.instances.some(
      (item) => selectedItems().includes(item.id) && item.parent,
    );
    contextMenu.hidden = false;
    const bounds = contextMenu.getBoundingClientRect();
    contextMenu.style.left = `${Math.max(8, Math.min(clientX, window.innerWidth - bounds.width - 8))}px`;
    contextMenu.style.top = `${Math.max(8, Math.min(clientY, window.innerHeight - bounds.height - 8))}px`;
    query('#design-context-duplicate').focus();
  }
  function cancelDrag() {
    const pointer = drag?.pointer ?? boxDrag?.pointer;
    if (boxDrag) {
      selection = boxDrag.previous;
      selected = boxDrag.focus;
    }
    drag = null;
    boxDrag = null;
    if (pointer !== undefined && canvas.hasPointerCapture(pointer))
      canvas.releasePointerCapture(pointer);
    preview = null;
    render();
  }
  canvas.addEventListener(
    'pointerdown',
    (event) => {
      if (!loaded || event.button !== 0 || drag || boxDrag) return;
      canvas.focus();
      const p = point(event);
      if (placing) {
        place(placing, p.x, p.y);
        return;
      }
      const target = hit(p.x, p.y)?.id ?? null;
      if (!target || event.shiftKey) {
        boxDrag = {
          pointer: event.pointerId,
          x: p.x,
          y: p.y,
          endX: p.x,
          endY: p.y,
          additive: event.shiftKey,
          previous: [...selection],
          focus: selected,
          hit: target,
        };
        if (!event.shiftKey) selectOnly(null);
        refresh();
        canvas.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      if (!selectedItems().includes(target)) selectOnly(target);
      else selected = target;
      refresh();
      if (!selected) return;
      drag = {
        pointer: event.pointerId,
        x: p.x,
        y: p.y,
        draft: history.current,
        ids: selectedItems(),
      };
      canvas.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    { signal },
  );
  canvas.addEventListener(
    'pointermove',
    (event) => {
      if (boxDrag?.pointer === event.pointerId) {
        const p = point(event);
        boxDrag.endX = p.x;
        boxDrag.endY = p.y;
        const found = selectInRectangle(history.current, selectionRect()!, masks);
        selection = [...new Set([...(boxDrag.additive ? boxDrag.previous : []), ...found])];
        selected = selection[0] ?? null;
        refresh();
        return;
      }
      if (!drag || drag.pointer !== event.pointerId) return;
      const p = point(event);
      preview = moveInstances(drag.draft, drag.ids, snapped(p.x - drag.x), snapped(p.y - drag.y));
      render(preview);
    },
    { signal },
  );
  canvas.addEventListener(
    'pointerup',
    (event) => {
      if (boxDrag?.pointer === event.pointerId) {
        const box = boxDrag;
        if (Math.hypot(box.endX - box.x, box.endY - box.y) < 2) {
          selection = box.additive
            ? box.hit
              ? box.previous.includes(box.hit)
                ? box.previous.filter((id) => id !== box.hit)
                : [...box.previous, box.hit]
              : box.previous
            : [];
        }
        boxDrag = null;
        selected = selection[0] ?? null;
        if (canvas.hasPointerCapture(event.pointerId))
          canvas.releasePointerCapture(event.pointerId);
        refresh();
        status(
          `${selectedItems().length} pieces selected. Drag a selected piece to move them together.`,
        );
        return;
      }
      if (!drag || event.pointerId !== drag.pointer) return;
      const next = preview;
      cancelDrag();
      if (next) commit(next, 'Selection moved.');
    },
    { signal },
  );
  canvas.addEventListener(
    'pointercancel',
    () => {
      cancelDrag();
      refresh();
    },
    { signal },
  );
  canvas.addEventListener(
    'contextmenu',
    (event) => {
      event.preventDefault();
      if (!loaded) return;
      cancelDrag();
      const p = point(event);
      const target = hit(p.x, p.y)?.id ?? null;
      if (!target || !selectedItems().includes(target)) selectOnly(target);
      else selected = target;
      placing = null;
      refresh();
      if (selected) showContextMenu(event.clientX, event.clientY);
    },
    { signal },
  );
  query('#design-context-duplicate').addEventListener(
    'click',
    () => {
      duplicate();
      canvas.focus();
    },
    { signal },
  );
  query('#design-context-ungroup').addEventListener(
    'click',
    () => {
      ungroup();
      canvas.focus();
    },
    { signal },
  );
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (event.target instanceof Node && !contextMenu.contains(event.target)) closeContextMenu();
    },
    { signal },
  );
  viewport.addEventListener('scroll', () => closeContextMenu(), { signal });
  window.addEventListener('resize', () => closeContextMenu(), { signal });
  contextMenu.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Tab') {
        closeContextMenu(true);
        return;
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const items = [...contextMenu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const current = items.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? items.length - 1
            : (current + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
      items[next]?.focus();
    },
    { signal },
  );
  canvas.addEventListener(
    'lostpointercapture',
    () => {
      if (drag || boxDrag) {
        cancelDrag();
        refresh();
      }
    },
    { signal },
  );
  window.addEventListener(
    'blur',
    () => {
      cancelDrag();
      closeContextMenu();
      if (!disposed) refresh();
    },
    { signal },
  );
  palette.addEventListener(
    'click',
    (event) => {
      const node = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-asset]');
      if (!node || !loaded) return;
      cancelDrag();
      placing = placing === node.dataset.asset ? null : node.dataset.asset!;
      selectOnly(null);
      refresh();
      status(placing ? 'Click in the room to place the selected asset.' : 'Placement canceled.');
    },
    { signal },
  );
  palette.addEventListener(
    'dragstart',
    (event) => {
      const node = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-asset]');
      if (!node || !event.dataTransfer || !loaded) return;
      event.dataTransfer.setData('text/plain', node.dataset.asset!);
      event.dataTransfer.effectAllowed = 'copy';
    },
    { signal },
  );
  canvas.addEventListener(
    'dragover',
    (event) => {
      if (loaded) event.preventDefault();
    },
    { signal },
  );
  canvas.addEventListener(
    'drop',
    (event) => {
      event.preventDefault();
      if (!loaded) return;
      const asset = event.dataTransfer?.getData('text/plain');
      if (!asset || !assetById.has(asset)) return;
      const p = point(event);
      place(asset, p.x, p.y);
    },
    { signal },
  );
  search.addEventListener('input', renderPalette, { signal });
  roomInput.addEventListener(
    'change',
    () => {
      cancelDrag();
      history = histories[roomInput.value as RoomMode];
      placing = null;
      selectOnly(null);
      category.value = history.current.room === 'back-of-house' ? 'Kitchen' : '';
      renderPalette();
      refresh();
      status(
        `${roomLabels[history.current.room]} draft opened. Both room drafts and their undo history are kept until reload.`,
      );
    },
    { signal },
  );
  query<HTMLFormElement>('#design-room-form').addEventListener(
    'submit',
    (event) => {
      event.preventDefault();
      if (!loaded) return;
      cancelDrag();
      try {
        commit(
          resizeRoom(history.current, widthInput.valueAsNumber, heightInput.valueAsNumber),
          'Room resized. Floor and perimeter retiled at native scale. Undo restores the previous size.',
        );
      } catch (error: unknown) {
        status(error instanceof Error ? error.message : 'Could not resize the room.');
      }
    },
    { signal },
  );
  category.addEventListener('change', renderPalette, { signal });
  zoom.addEventListener('change', fit, { signal });
  group.addEventListener('change', refresh, { signal });
  objectSelect.addEventListener(
    'change',
    () => {
      cancelDrag();
      placing = null;
      selectOnly(objectSelect.value || null);
      refresh();
    },
    { signal },
  );
  for (const [input, axis] of [
    [xInput, 'x'],
    [yInput, 'y'],
  ] as const)
    input.addEventListener(
      'change',
      () => {
        const item = history.current.instances.find((item) => item.id === selected);
        const value = input.valueAsNumber;
        if (!item || !Number.isInteger(value)) {
          refresh();
          return;
        }
        commit(
          moveInstances(
            history.current,
            selectedItems(),
            axis === 'x' ? value - item.x : 0,
            axis === 'y' ? value - item.y : 0,
          ),
          'Position updated.',
        );
      },
      { signal },
    );
  layerInput.addEventListener(
    'change',
    () => {
      if (!selected) return;
      // Foreground/base parts keep their relative authored layers; edit the focused piece only.
      commit(
        {
          ...history.current,
          instances: history.current.instances.map((item) =>
            item.id === selected ? { ...item, layer: Number(layerInput.value) } : item,
          ),
        },
        'Selected piece layer updated.',
      );
    },
    { signal },
  );
  query('#design-floor').addEventListener(
    'change',
    () =>
      commit(
        {
          ...history.current,
          floor: {
            ...history.current.floor,
            visible: query<HTMLInputElement>('#design-floor').checked,
          },
        },
        'Floor visibility updated.',
      ),
    { signal },
  );
  query('#design-remove').addEventListener('click', remove, { signal });
  query('#design-duplicate').addEventListener('click', duplicate, { signal });
  query('#design-ungroup').addEventListener('click', () => ungroup(), { signal });
  query('#design-ungroup-all').addEventListener('click', () => ungroup(true), { signal });
  query('#design-undo').addEventListener(
    'click',
    () => {
      cancelDrag();
      history.undo();
      refresh();
      status('Undone.');
    },
    { signal },
  );
  query('#design-redo').addEventListener(
    'click',
    () => {
      cancelDrag();
      history.redo();
      refresh();
      status('Redone.');
    },
    { signal },
  );
  query('#design-reset').addEventListener(
    'click',
    () => {
      cancelDrag();
      placing = null;
      selectOnly(null);
      commit(
        createDraft(history.current.room),
        'Restored this room’s original layout and size. Undo returns to your draft.',
      );
    },
    { signal },
  );
  window.addEventListener(
    'keydown',
    (event) => {
      if (
        !loaded ||
        (event.target instanceof HTMLElement && event.target.closest('input, select, textarea'))
      )
        return;
      if (event.key === 'Escape') {
        if (!contextMenu.hidden) {
          event.preventDefault();
          closeContextMenu(true);
          return;
        }
        if (boxDrag || drag) {
          cancelDrag();
          refresh();
          return;
        }
        cancelDrag();
        placing = null;
        selectOnly(null);
        refresh();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && ['z', 'y'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        cancelDrag();
        if (event.key.toLowerCase() === 'y' || event.shiftKey) history.redo();
        else history.undo();
        refresh();
        return;
      }
      if (document.activeElement !== canvas) return;
      if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
        event.preventDefault();
        if (selected) {
          const bounds = canvas.getBoundingClientRect();
          showContextMenu(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
        }
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        remove();
        return;
      }
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const direction = delta[event.key];
      if (!direction || !selected) return;
      event.preventDefault();
      const step = Number(snap.value) * (event.shiftKey ? 4 : 1);
      commit(
        moveInstances(history.current, selectedItems(), direction[0] * step, direction[1] * step),
        'Selection nudged.',
      );
    },
    { signal },
  );
  query('#design-export').addEventListener(
    'click',
    () => {
      cancelDrag();
      const blob = new Blob([JSON.stringify(exportDraft(history.current), null, 2) + '\n'], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      urls.add(url);
      const link = document.createElement('a');
      link.href = url;
      link.download = `starlite-${history.current.room}-draft.json`;
      link.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        urls.delete(url);
      }, 1000);
      status('JSON exported. The game layout is unchanged.');
    },
    { signal },
  );
  query('#design-import').addEventListener('click', () => file.click(), { signal });
  file.addEventListener(
    'change',
    () => {
      const input = file.files?.[0];
      if (!input) return;
      void (async () => {
        try {
          if (input.size > 2_000_000) throw new Error('Drafts must be smaller than 2 MB');
          const draft = importDraft(JSON.parse(await input.text()) as unknown);
          if (disposed) return;
          cancelDrag();
          selectOnly(null);
          placing = null;
          history = histories[draft.room];
          category.value = draft.room === 'back-of-house' ? 'Kitchen' : '';
          renderPalette();
          commit(draft, 'Draft imported. Undo returns to the previous layout.');
        } catch (error: unknown) {
          if (!disposed) status(error instanceof Error ? error.message : 'Could not import JSON');
        } finally {
          file.value = '';
        }
      })();
    },
    { signal },
  );
  const observer = new ResizeObserver(fit);
  observer.observe(viewport);
  renderPalette();
  fit();
  const ready = Promise.all(
    catalog.map(
      (asset) =>
        new Promise<void>((resolve, reject) => {
          const image = new Image();
          const cancel = () => {
            image.onload = null;
            image.onerror = null;
            image.src = '';
            reject(new Error('Designer disposed'));
          };
          signal.addEventListener('abort', cancel, { once: true });
          image.onerror = () => {
            signal.removeEventListener('abort', cancel);
            reject(new Error(`Could not load ${asset.label}. Reload to retry.`));
          };
          image.onload = () => {
            signal.removeEventListener('abort', cancel);
            try {
              if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height)
                throw new Error(`Unexpected size for ${asset.label}`);
              const sample = document.createElement('canvas');
              sample.width = asset.width;
              sample.height = asset.height;
              const sampleContext = sample.getContext('2d');
              if (!sampleContext) throw new Error('Canvas is unavailable');
              sampleContext.drawImage(image, 0, 0);
              masks.set(asset.id, sampleContext.getImageData(0, 0, asset.width, asset.height).data);
              images.set(asset.id, image);
              resolve();
            } catch (error: unknown) {
              reject(error);
            }
          };
          image.src = asset.image;
        }),
    ),
  )
    .then(() => {
      if (disposed) return;
      loaded = true;
      button('#design-export', false);
      button('#design-reset', false);
      roomInput.disabled = false;
      query<HTMLFieldSetElement>('#design-size-controls').disabled = false;
      renderPalette();
      refresh();
      status(
        'Drag empty floor to select · Shift-drag to add · arrows to nudge · Delete to remove.',
      );
    })
    .catch((error: unknown) => {
      if (!disposed) {
        status(error instanceof Error ? error.message : 'Assets could not load. Reload to retry.');
        query('#design-status').setAttribute('role', 'alert');
      }
    });
  return {
    ready,
    destroy() {
      if (disposed) return;
      disposed = true;
      cancelDrag();
      closeContextMenu();
      abort.abort();
      observer.disconnect();
      for (const url of urls) URL.revokeObjectURL(url);
      urls.clear();
      images.clear();
      masks.clear();
      document.body.classList.remove('design-page');
      document.title = previousTitle;
    },
  };
}
