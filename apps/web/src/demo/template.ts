/** Static, trusted UI markup; user and world values are assigned with textContent. */
export const demoTemplate = `
  <a class="skip-link" href="#demo-surface">Skip to the movement demo</a>
  <div class="demo-shell">
    <header class="demo-header">
      <a class="wordmark" href="/" aria-label="Starlite Diner home"><span class="brand-star" aria-hidden="true">✦</span><span>STARLITE<span class="wordmark-small">D I N E R</span></span></a>
      <span class="demo-edition">THE MOVEMENT STUDY <span>NO. 01</span></span>
      <a class="demo-back" href="/">Back to the diner <span aria-hidden="true">↗</span></a>
    </header>
    <main class="demo-main">
      <div class="demo-heading"><div><p class="eyebrow">A SMALL TEST. A LITTLE ROOM TO MOVE.</p><h1>Find your <em>footing.</em></h1></div><p>One worker. One table.<br />Make yourself familiar.</p></div>
      <section class="demo-frame" aria-label="Movement concept test">
        <div class="demo-frame-header"><span><i aria-hidden="true"></i> DINING ROOM</span><span id="demo-state-label">PREPARING THE ROOM</span></div>
        <div class="demo-stage">
          <div id="demo-surface" class="demo-surface" tabindex="0" role="group" aria-label="Interactive diner movement test" aria-describedby="demo-instructions"></div>
          <div class="demo-loading" id="demo-loading" role="status"><span class="demo-loading-star" aria-hidden="true">✦</span><p>Getting the room ready…</p></div>
          <div class="demo-focus-note" id="demo-focus-note">Click the room or press Tab to begin</div>
          <button class="demo-interaction" id="demo-interaction" type="button" hidden><kbd>E</kbd> Inspect table <span aria-hidden="true">↗</span></button>
        </div>
        <div class="demo-room-footer"><span id="demo-hint" role="status">Walk behind the table, then around its edge.</span><button type="button" id="demo-pause" class="demo-small-button" disabled>Pause <kbd>Esc</kbd></button></div>
      </section>
      <section class="demo-toolbar" aria-label="Movement controls and tuning">
        <div class="demo-instructions" id="demo-instructions"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> <span class="or">/</span> arrows <b>to walk</b></span><span><kbd>E</kbd> interact <span class="or">·</span> <kbd>Esc</kbd> pause</span></div>
        <div class="demo-tuning"><label for="demo-speed">Walk speed <output id="demo-speed-value" for="demo-speed">88</output></label><input id="demo-speed" type="range" min="48" max="140" step="4" value="88" disabled aria-label="Walking speed in pixels per second" /></div>
        <label class="demo-feel" for="demo-feel">Movement feel<select id="demo-feel" disabled><option value="crisp">Crisp</option><option value="soft">Soft</option></select></label>
        <label class="demo-debug-toggle"><input type="checkbox" id="demo-debug" disabled /> Show collision</label>
        <button type="button" id="demo-reset" class="demo-reset" disabled>Reset position <span aria-hidden="true">↺</span></button>
      </section>
      <div class="demo-diagnostics" id="demo-diagnostics" hidden aria-label="Engine diagnostics"><span>POSITION <output id="demo-position">132.0, 132.0</output></span><span>VELOCITY <output id="demo-velocity">0.0, 0.0</output></span><span>FACING <output id="demo-facing">south</output></span><span>DEPTH <output id="demo-depth">in front</output></span><span>TICK <output id="demo-tick">0</output></span><span>INTERACTIONS <output id="demo-interactions">0</output></span></div>
      <p class="demo-mobile-note">This concept test uses a keyboard and pointer.</p>
    </main>
    <footer class="demo-footer"><span>WARM LIGHT. SMALL STEPS.</span><span>STARLITE DINER <span aria-hidden="true">✦</span> CONCEPT DEMO</span></footer>
  </div>
  <dialog id="demo-inspection" class="demo-dialog" aria-labelledby="demo-inspection-title"><div class="dialog-inner"><p class="eyebrow">YOU’RE AT THE TABLE</p><h2 id="demo-inspection-title">A familiar <em>corner.</em></h2><p>The tabletop sits in front when you walk behind it. Come around the edge and your worker appears in front.</p><p class="demo-panel-note">Service time keeps running while you inspect.</p><button type="button" class="primary-button" id="demo-close-inspection">Keep walking <span aria-hidden="true">↗</span></button></div></dialog>
  <dialog id="demo-pause-dialog" class="demo-dialog" aria-labelledby="demo-pause-title"><div class="dialog-inner"><p class="eyebrow">TAKE YOUR TIME</p><h2 id="demo-pause-title">A little <em>breather.</em></h2><p>The room is paused. Resume when you’re ready.</p><button type="button" class="primary-button" id="demo-resume">Back to the room <span aria-hidden="true">↗</span></button></div></dialog>
`;
