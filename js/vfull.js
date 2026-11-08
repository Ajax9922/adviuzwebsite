/* Full screen + rotate for the "How it works" video.
   Opens the video in a black full-screen layer. If the phone is held upright, the video is turned sideways
   so it fills the screen (works on iPhone, where websites cannot rotate the screen); turning the phone
   sideways also works. On Android it also asks the browser for real full screen + landscape. */
(function () {
  var st = document.createElement('style'); st.textContent = '.vov{position:fixed;inset:0;z-index:10000;background:#000}.vov-in{position:absolute;left:50%;top:50%;width:var(--vw,100vw);height:var(--vh,100vh);transform:translate(-50%,-50%)}@media (orientation:portrait){.vov-in{width:var(--vh,100vh);height:var(--vw,100vw);transform:translate(-50%,-50%) rotate(90deg)}}.vov-in video{position:static!important;display:block!important;width:100%!important;height:100%!important;object-fit:contain!important;background:#000!important;opacity:1!important;aspect-ratio:auto!important;visibility:visible!important}.vov-x{position:absolute;right:12px;top:12px;z-index:2;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;font:400 30px/44px sans-serif;cursor:pointer}.vov-snd{position:absolute;left:12px;top:12px;z-index:2;border:0;border-radius:999px;background:linear-gradient(135deg,#4000f3,#e65afc);color:#fff;font:700 14px/1 Inter,system-ui,sans-serif;padding:12px 16px;cursor:pointer}'; document.head.appendChild(st);
  window.adviuzFull = function (btn, video, play) {
    if (!btn || !video) return;
    var home = video.parentNode, next = video.nextSibling, layer = null;
    function size() {
      if (!layer) return;
      layer.style.setProperty('--vw', innerWidth + 'px');
      layer.style.setProperty('--vh', innerHeight + 'px');
    }
    function close() {
      if (!layer) return;
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {});
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
      home.insertBefore(video, next);
      layer.remove(); layer = null;
      document.documentElement.style.overflow = '';
      removeEventListener('resize', size); removeEventListener('orientationchange', size);
      removeEventListener('keydown', esc);
      btn.focus();
    }
    function esc(e) { if (e.key === 'Escape') close(); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      layer = document.createElement('div');
      layer.className = 'vov';
      layer.setAttribute('role', 'dialog');
      layer.setAttribute('aria-label', 'Video, full screen');
      layer.innerHTML = '<div class="vov-in"><button type="button" class="vov-x" aria-label="Close full screen">&times;</button>' +
        '<button type="button" class="vov-snd"></button></div>';
      var inner = layer.firstChild, snd = layer.querySelector('.vov-snd');
      inner.insertBefore(video, inner.firstChild);
      document.body.appendChild(layer);
      document.documentElement.style.overflow = 'hidden';
      size();
      addEventListener('resize', size); addEventListener('orientationchange', size); addEventListener('keydown', esc);
      function sndLabel() { snd.textContent = video.muted ? 'Tap for sound' : 'Mute'; }
      sndLabel();
      snd.addEventListener('click', function (ev) { ev.stopPropagation(); if (video.muted) { video.muted = false; video.currentTime = 0; } else video.muted = true; sndLabel(); play(); });
      layer.querySelector('.vov-x').addEventListener('click', function (ev) { ev.stopPropagation(); close(); });
      inner.addEventListener('click', function () { if (video.paused) play(); else video.pause(); });
      layer.querySelector('.vov-x').focus();
      play();
      // Android: real full screen + landscape lock (the layer then simply fills the landscape screen)
      if (layer.requestFullscreen && matchMedia('(pointer:coarse)').matches) {
        layer.requestFullscreen().then(function () {
          if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {});
        }).catch(function () {});
      }
    });
    document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && layer && !matchMedia('(pointer:coarse)').matches) close(); });
  };
})();
