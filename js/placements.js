/* Adviuz – "See how your flyer appears" viewer for the 24 channels on the homepage.
   Tap any channel to open a preview. Real ad screenshots are labelled as such;
   the rest are illustrative previews. */
(function () {
  var board = document.getElementById('lboard'); if (!board) return;
  var P = 'assets/placements/';
  var MAP = {
    'Facebook Feed': ['facebook-feed', 1], 'Facebook Messenger': ['facebook-messenger', 0], 'Facebook Reels': ['facebook-reels', 1],
    'Instagram Feed': ['instagram-feed', 1], 'Instagram Sponsored': ['instagram-sponsored', 0, 'Instagram Stories (Sponsored)'], 'Instagram Reels': ['instagram-reels', 1],
    'WhatsApp Status': ['whatsapp-status', 0], 'LinkedIn': ['linkedin', 0], 'X (Twitter)': ['x-twitter', 0], 'TikTok': ['tiktok', 0],
    'YouTube Ads': ['youtube-ads', 0], 'YouTube Shorts': ['youtube-shorts', 0], 'Discovery Ads': ['discovery-ads', 0],
    'Display Network Ads': ['display-network-ads', 0], 'Mobile App Pop-up Ads': ['mobile-app-pop-up-ads', 0],
    'CNN': ['news-sites', 0, 'a premium news website'], 'Fox News': ['news-sites', 0, 'a premium news website'],
    'The New York Times': ['news-sites', 0, 'a premium news website'], 'CNBC': ['news-sites', 0, 'a premium news website'],
    'Global News': ['news-sites', 0, 'a premium news website'],
    'Remarketing Ads': ['remarketing-ads', 0], 'SMS to leads': ['sms-to-leads', 0, 'a text to your lead'],
    'Email to leads': ['email-to-leads', 0, 'an email to your lead'], 'AI calls to leads': ['ai-calls-to-leads', 0, 'an AI call to your lead']
  };
  var items = [].slice.call(board.querySelectorAll('li')).filter(function (li) {
    var n = li.querySelector('.lb-name'); return n && MAP[n.textContent.trim()];
  });
  items.forEach(function (li, i) {
    li.classList.add('lb-view'); li.tabIndex = 0; li.setAttribute('role', 'button');
    li.setAttribute('aria-label', 'See how your flyer appears on ' + li.querySelector('.lb-name').textContent.trim());
    li.addEventListener('click', function () { open(i); });
    li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
  });
  var note = board.parentNode.querySelector('.plat-note');
  if (note) { var h = document.createElement('p'); h.className = 'plat-tip'; h.textContent = 'Tap any channel to see how your flyer appears there.'; note.parentNode.insertBefore(h, note); }

  var dlg, img, ttl, tag, cur = 0, last;
  function build() {
    dlg = document.createElement('div'); dlg.className = 'plv'; dlg.hidden = true;
    dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', 'plvT');
    dlg.innerHTML = '<div class="plv-box"><div class="plv-head"><div><p class="plv-k">How your flyer appears on</p><h3 id="plvT"></h3></div>' +
      '<button type="button" class="plv-x" aria-label="Close">×</button></div>' +
      '<div class="plv-img"><img alt=""></div>' +
      '<div class="plv-foot"><button type="button" class="plv-nav plv-prev" aria-label="Previous channel">‹</button><p class="plv-tag"></p><button type="button" class="plv-nav plv-next" aria-label="Next channel">›</button></div></div>';
    document.body.appendChild(dlg);
    img = dlg.querySelector('img'); ttl = dlg.querySelector('h3'); tag = dlg.querySelector('.plv-tag');
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    dlg.querySelector('.plv-x').addEventListener('click', close);
    dlg.querySelector('.plv-prev').addEventListener('click', function () { show(cur - 1); });
    dlg.querySelector('.plv-next').addEventListener('click', function () { show(cur + 1); });
    document.addEventListener('keydown', function (e) {
      if (dlg.hidden) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1);
    });
    var sx = 0; img.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    img.addEventListener('touchend', function (e) { var d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) show(cur + (d < 0 ? 1 : -1)); }, { passive: true });
  }
  function show(i) {
    cur = (i + items.length) % items.length;
    var name = items[cur].querySelector('.lb-name').textContent.trim(), m = MAP[name];
    ttl.textContent = m[2] ? (m[2] === 'a premium news website' ? name + ' and other premium news sites' : m[2]) : name;
    img.src = P + m[0] + '.webp'; img.alt = (m[1] ? 'Real Adviuz ad on ' : 'Illustrative preview of an Adviuz flyer on ') + name;
    tag.textContent = m[1] ? 'Real Adviuz ad screenshot' : 'Illustrative preview — actual layout varies by platform and device';
    tag.classList.toggle('real', !!m[1]);
  }
  function open(i) {
    if (!dlg) build(); last = document.activeElement; show(i); dlg.hidden = false;
    document.documentElement.classList.add('mdr-lock'); var bx = dlg.querySelector('.plv-box'); bx.tabIndex = -1; bx.focus({ preventScroll: true });
  }
  function close() { dlg.hidden = true; document.documentElement.classList.remove('mdr-lock'); if (last) last.focus({ preventScroll: true }); }
})();
