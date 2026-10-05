/* ============================================================
   MAIN — boot, clocks, autosave.
   Logic ticks on a wall-clock interval (keeps earning in
   throttled background tabs); rendering rides requestAnimationFrame.
   ============================================================ */

(() => {

  function boot() {
    /* load save + credit time away */
    const offline = Game.load();

    Renderer.init(document.getElementById('stage'));
    UI.init();

    if (!Game.state.flags.introSeen) {
      UI.showIntro();
    } else if (offline && offline.earned >= 1) {
      UI.showOffline(offline);
      if (offline.learnedTask) Game.emit('change');
    }

    /* ---- logic clock (wall time, survives tab throttling) ---- */
    let last = Date.now();
    setInterval(() => {
      const now = Date.now();
      let dt = (now - last) / 1000;
      last = now;
      if (dt <= 0 || UI.modalOpen() || Game.state.flags.gameOver) return;

      if (dt > 90) {
        /* the laptop lid closed on you — treat it as time away */
        const off = Game.away(dt);
        Game.emit('change');
        if (off.earned >= 1) UI.showOffline(off);
        return;
      }
      Game.tick(dt);
    }, 250);

    /* ---- render clock ---- */
    const loop = (t) => {
      Renderer.frame(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    /* ---- autosave ---- */
    setInterval(() => Game.save(), BALANCE.autosaveEvery * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') Game.save();
    });
    window.addEventListener('beforeunload', () => Game.save());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
