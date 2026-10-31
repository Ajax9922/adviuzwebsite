/* Adviuz – mobile menu drawer.
   On phones the ☰ button opens a side panel from the right, over a dimmed page,
   with every link, Book a demo, Call now and a close button. Built from the
   page's own nav links, so every page stays in sync. */
(function () {
  var btn = document.getElementById('menuToggle'), nav = document.getElementById('navLinks');
  if (!btn || !nav) return;
  var mq = matchMedia('(max-width:960px)'), drawer, back, lastFocus;

  function build() {
    back = document.createElement('div'); back.className = 'mdr-back'; back.hidden = true;
    drawer = document.createElement('aside');
    drawer.className = 'mdr'; drawer.id = 'mDrawer'; drawer.hidden = true;
    drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-label', 'Menu');
    var links = [].map.call(nav.querySelectorAll(':scope > a'), function (a) {
      var cur = a.hasAttribute('aria-current') ? ' aria-current="page"' : '';
      return '<a href="' + a.getAttribute('href') + '"' + cur + '>' + a.textContent.trim() + '</a>';
    }).join('');
    var cta = nav.querySelector('.m-cta');
    drawer.innerHTML =
      '<div class="mdr-top"><span>Menu</span><button type="button" class="mdr-x" aria-label="Close menu">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>' +
      '<nav class="mdr-links" aria-label="Main navigation">' + links + '</nav>' +
      '<div class="mdr-cta">' + (cta ? cta.innerHTML : '') + '</div>' +
      '<button type="button" class="mdr-close">Close menu</button>';
    document.body.appendChild(back); document.body.appendChild(drawer);
    back.addEventListener('click', close);
    drawer.querySelector('.mdr-x').addEventListener('click', close);
    drawer.querySelector('.mdr-close').addEventListener('click', close);
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        var f = drawer.querySelectorAll('a,button'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function open() {
    if (!drawer) build();
    lastFocus = document.activeElement;
    back.hidden = false; drawer.hidden = false;
    requestAnimationFrame(function () { back.classList.add('on'); drawer.classList.add('on'); });
    document.documentElement.classList.add('mdr-lock');
    btn.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('tabindex','-1'); drawer.focus({ preventScroll: true });
  }
  function close() {
    if (!drawer || drawer.hidden) return;
    back.classList.remove('on'); drawer.classList.remove('on');
    document.documentElement.classList.remove('mdr-lock');
    btn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { back.hidden = true; drawer.hidden = true; }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  // Take over the ☰ button on phones (runs before the page's own toggle).
  document.addEventListener('click', function (e) {
    if (!mq.matches || !e.target.closest('#menuToggle')) return;
    e.stopImmediatePropagation(); e.preventDefault();
    nav.classList.remove('open');
    drawer && !drawer.hidden ? close() : open();
  }, true);
  mq.addEventListener ? mq.addEventListener('change', function () { if (!mq.matches) close(); }) : 0;
})();
