/* Adviuz – partner referral tracking.
   A partner's link (adviuz.com/p/CODE) opens the site with ?ref=CODE.
   We remember the code for 90 days in this browser so the quote, demo booking
   or purchase can be credited to that partner. No personal data is stored here. */
(function () {
  var KEY = 'adv_ref', DAYS = 90, MAX = DAYS * 864e5;
  try {
    var q = new URLSearchParams(location.search).get('ref');
    if (q && /^[A-Za-z0-9_-]{2,32}$/.test(q)) {
      q = q.toUpperCase();
      try { localStorage.setItem(KEY, JSON.stringify({ c: q, t: Date.now() })); } catch (e) {}
      document.cookie = KEY + '=' + q + ';path=/;max-age=' + DAYS * 86400 + ';SameSite=Lax;Secure';
    }
  } catch (e) {}
  window.advRef = function () {
    try {
      var o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (o && o.c && Date.now() - o.t < MAX) return o.c;
    } catch (e) {}
    var m = document.cookie.match(/(?:^|;\s*)adv_ref=([A-Za-z0-9_-]{2,32})/);
    return m ? m[1] : '';
  };
})();
