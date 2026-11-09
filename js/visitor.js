/* Adviuz website visitors (2026-11-09, Ajax: "if they visit next time system should know they are visiting again").
   Gives this browser a private random visitor id (kept only in this browser), records the visit with the
   website-visitor function, and recognises returning visitors. When we already know who they are (their lead),
   the page skips the details form and Amber greets them by name ("welcome back").
   window.advTrack(e, d) records voice / chat / checkout / pay / lead events for the hub's Website Visitors list. */
(function () {
  'use strict';
  var FN = 'https://crhvvfomwkrgwlnfruad.supabase.co/functions/v1/website-visitor';
  var KEY = 'adv_vid', lastPlan = '';
  function uuid() {
    try { if (crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
    var b = new Uint8Array(16); crypto.getRandomValues(b); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function getVid() {
    var v = '';
    try { v = localStorage.getItem(KEY) || ''; } catch (_) {}
    if (!v) { var m = document.cookie.match(/(?:^|; )adv_vid=([0-9a-f-]{36})/); if (m) v = m[1]; }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)) v = uuid();
    try { localStorage.setItem(KEY, v); } catch (_) {}
    try { document.cookie = 'adv_vid=' + v + ';path=/;max-age=31536000;SameSite=Lax;Secure'; } catch (_) {}
    return v;
  }
  var vid = getVid();
  function post(body) {
    body.vid = vid;
    return fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });
  }
  window.advTrack = function (e, d) { try { post({ action: 'event', e: e, d: d || '' }).catch(function () {}); } catch (_) {} };

  var qs = {}; try { qs = new URLSearchParams(location.search); } catch (_) {}
  var lead = (qs.get && qs.get('lead')) || ''; try { lead = lead || sessionStorage.getItem('adv_lead') || ''; } catch (_) {}
  var utm = {}; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { var v = qs.get && qs.get(k); if (v) utm[k] = v.slice(0, 80); });
  if (qs.get && qs.get('gclid')) utm.gclid = '1';
  if (qs.get && qs.get('fbclid')) utm.fbclid = '1';
  var ref = ''; try { if (document.referrer && new URL(document.referrer).host !== location.host) ref = document.referrer.split('?')[0]; } catch (_) {}
  var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) {}

  post({ action: 'hit', page: location.pathname, ref: ref, utm: Object.keys(utm).length ? utm : null, tz: tz, dev: matchMedia('(max-width:760px)').matches ? 'mobile' : 'desktop', lead: lead })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (!j) return;
      if (j.lead_id) {
        if (!window.ADV_LEAD) window.ADV_LEAD = j.lead_id;
        try { sessionStorage.setItem('adv_lead', j.lead_id); if (j.first_name && !sessionStorage.getItem('adv_name')) sessionStorage.setItem('adv_name', j.first_name); } catch (_) {}
      }
      if (j.prefill) fillForms(j.prefill);
      window.ADV_VISITOR = { returning: !!j.returning, visits: j.visits || 1, first_name: j.first_name || '', lead_id: j.lead_id || '' };
      try { window.dispatchEvent(new CustomEvent('adv:visitor', { detail: window.ADV_VISITOR })); } catch (_) {}
    }).catch(function () {});

  /* known lead: their details are already filled in on the checkout (and the details form) */
  function fillForms(p) {
    var map = { name: ['qNm', 'iNm'], business: ['qBz', 'iBz'], email: ['qEm', 'iEm'], phone: ['qPh', 'iPh'] };
    Object.keys(map).forEach(function (k) {
      if (!p[k]) return;
      map[k].forEach(function (id) { var el = document.getElementById(id); if (el && !el.value) el.value = String(p[k]).slice(0, 160); });
    });
    var ck = document.getElementById('qCk'); if (ck && p.consent) ck.checked = true;
  }

  /* what they do on the page */
  document.addEventListener('click', function (e) {
    var k = e.target.closest && e.target.closest('[data-k]');
    if (k && k.dataset.k) { lastPlan = k.dataset.k; window.advTrack('checkout', lastPlan); }
    if (e.target.closest && e.target.closest('#cbFab,[data-chat]')) window.advTrack('chat');
  }, true);
  window.addEventListener('adv:checkout', function (e) { lastPlan = (e.detail && e.detail.plan) || lastPlan; window.advTrack('checkout', lastPlan); });
  document.addEventListener('submit', function (e) { if (e.target && e.target.id === 'qForm') window.advTrack('pay', lastPlan); }, true);
})();
