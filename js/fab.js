/* Adviuz – mobile floating "Call now" + "Book a demo" buttons for every page.
   Shows once the visitor scrolls past the top of the page; hides near a booking form. */
(function () {
  if (document.getElementById('mFab')) return;
  var bk = document.getElementById('book-demo');
  var wrap = document.createElement('div');
  wrap.className = 'mfab'; wrap.id = 'mFab'; wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = '<a class="mfab-b mfab-call" href="tel:+16472501152" aria-label="Call Adviuz" tabindex="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.6 3.5 9 3l1.6 4-2 1.3a11 11 0 0 0 5.1 5.1l1.3-2 4 1.6-.5 2.4a2 2 0 0 1-2 1.6A15.5 15.5 0 0 1 5 5.5a2 2 0 0 1 1.6-2z"/></svg>Call now</a>' +
    '<a class="mfab-b mfab-book" href="' + (bk ? '#book-demo' : '/book') + '" tabindex="-1">Book a demo</a>';
  document.body.appendChild(wrap);
  var past = false, atBook = false, ticking = false;
  function upd() {
    var on = past && !atBook;
    wrap.classList.toggle('on', on); wrap.setAttribute('aria-hidden', !on);
    [].forEach.call(wrap.querySelectorAll('a'), function (a) { a.tabIndex = on ? 0 : -1; });
  }
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; var p = window.scrollY > window.innerHeight * 0.6; if (p !== past) { past = p; upd(); } });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var forms = document.querySelectorAll('#book-demo, #bkForm, .bk-wrap, #ctForm');
  if ('IntersectionObserver' in window && forms.length) {
    var vis = new Set();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? vis.add(e.target) : vis.delete(e.target); });
      atBook = vis.size > 0; upd();
    }, { threshold: 0 });
    [].forEach.call(forms, function (f) { io.observe(f); });
  }
})();
