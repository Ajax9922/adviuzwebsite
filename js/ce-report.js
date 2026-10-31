/* Adviuz – auto-scrolling Reports phone on the AI Conversion Engine page.
   Scrolls slowly when visible, pauses at the ends, stops while the visitor scrolls it themselves. */
(function () {
  var box = document.getElementById('rpScroll');
  if (!box) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SPEED = 38;            // px per second
  var dir = 1, pauseUntil = 0, userUntil = 0, visible = false, last = 0, raf = 0, pos = 0;
  function frame(t) {
    raf = 0;
    if (!visible) return;
    var dt = last ? Math.min(t - last, 64) : 16; last = t;
    var max = box.scrollHeight - box.clientHeight;
    if (t > pauseUntil && Date.now() > userUntil && max > 0) {
      pos += dir * SPEED * (dir < 0 ? 4 : 1) * dt / 1000;   // glide back up 4x faster
      if (pos >= max) { pos = max; dir = -1; pauseUntil = t + 1800; }
      else if (pos <= 0) { pos = 0; dir = 1; pauseUntil = t + 2200; }
      box.scrollTop = pos;
    }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function hold() { userUntil = Date.now() + 5000; pos = box.scrollTop; dir = 1; }
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(function (ev) { box.addEventListener(ev, hold, { passive: true }); });
  box.addEventListener('scroll', function () { if (Date.now() < userUntil) pos = box.scrollTop; }, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) { pauseUntil = performance.now() + 900; start(); } }, { threshold: 0.35 }).observe(box);
  } else { visible = true; start(); }
})();
