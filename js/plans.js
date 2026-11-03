/* Adviuz – partner plans page (/plans).
   Renders the Digital Flyers plans, switches the Black Friday prices off
   automatically after 30 Nov 2026, and runs Buy:
     1. client picks province → sees plan + tax + total,
     2. "Continue to secure payment" asks the server (website-plan-checkout)
        for a Stripe/hub payment link — the SERVER sets the real price,
     3. if online payment isn't available, the order is sent to the Adviuz
        team instead (website-lead) with the partner code, so no sale is lost.
   Prices here are for display only. No secrets in this file. */
(function () {
  var BASE = 'https://crhvvfomwkrgwlnfruad.supabase.co/functions/v1/';
  var PAY_API = BASE + 'website-plan-checkout';
  var LEAD_API = BASE + 'website-lead';
  var BF_END = Date.UTC(2026, 11, 1, 6, 0, 0);          // 30 Nov 2026, end of day Saskatchewan
  var BF = Date.now() < BF_END;

  var PLANS = [
    { key: 'df-growth', name: 'Growth', who: 'Most local businesses start here', views: 1000, ai: 500, msgs: 2500, design: 3,
      plan: 5000, aiv: 750, total: 6350, bf: 4999 },
    { key: 'df-scale', name: 'Scale', who: 'Cover a city or several areas', views: 2500, ai: 1250, msgs: 6250, design: 4,
      plan: 12500, aiv: 1500, total: 14600, bf: 12499, hot: true },
    { key: 'df-pro', name: 'Pro', who: 'For brands and wider coverage', views: 5000, ai: 2500, msgs: 12500, design: 5,
      plan: 25000, aiv: 2500, total: 28100, bf: 24999 }
  ];
  var SETUP = 300;  // each one-time setup fee
  var PROV = [['AB','Alberta',.05],['BC','British Columbia',.12],['MB','Manitoba',.12],['NB','New Brunswick',.15],
    ['NL','Newfoundland and Labrador',.15],['NS','Nova Scotia',.15],['NT','Northwest Territories',.05],['NU','Nunavut',.05],
    ['ON','Ontario',.13],['PE','Prince Edward Island',.15],['QC','Quebec',.14975],['SK','Saskatchewan',.11],['YT','Yukon',.05]];
  var RATE = {}; PROV.forEach(function (p) { RATE[p[0]] = p[2]; });
  var OK_HOSTS = ['checkout.stripe.com', 'hub.adviuz.ca', 'adviuz.com', 'www.adviuz.com'];

  function n(v) { return v.toLocaleString('en-CA'); }
  function m0(v) { return '$' + n(v); }
  function m2(v) { return '$' + v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function price(p) { return BF ? p.bf : p.total; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var ref = (window.advRef && window.advRef()) || '';

  /* ---------- page state ---------- */
  if (!BF) {
    document.querySelectorAll('[data-offer-bf]').forEach(function (e) { e.remove(); });
    document.querySelectorAll('.pp-std-only').forEach(function (e) { e.hidden = false; });
  }
  if (ref) {
    var pb = document.getElementById('ppPartner');
    if (pb) { document.getElementById('ppPartnerCode').textContent = ref; pb.hidden = false; }
  }

  /* ---------- plan cards ---------- */
  var TICK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function row(label, val, cls) { return '<div class="pp-row' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><span>' + val + '</span></div>'; }
  var html = PLANS.map(function (p) {
    var stack = row('Digital Flyers plan', m0(p.plan)) +
      row('AI Conversion Engine', m0(p.aiv)) +
      row('Flyer account setup (one-time)', m0(SETUP)) +
      row('AI engine setup (one-time)', m0(SETUP)) +
      row(BF ? 'Total value' : 'Plan price', BF ? '<s>' + m0(p.total) + '</s>' : m0(p.total), 'tot');
    var priceBlock = BF
      ? '<div class="pp-price"><small>Black Friday price</small><b>' + m0(p.bf) + '</b><em>You save ' + m0(p.total - p.bf) + '</em></div>'
      : '<div class="pp-price"><small>One-time payment</small><b>' + m0(p.total) + '</b><em class="std">+ tax</em></div>';
    return '<article class="pp-card' + (p.hot ? ' hot' : '') + '" id="plan-' + p.key + '">' +
      (p.hot ? '<span class="pp-rec">Recommended</span>' : '') +
      '<h3>' + p.name + '</h3><p class="pp-who">' + p.who + '</p>' +
      '<div class="pp-big"><b>' + n(p.views) + '</b><span>viewed flyers</span></div>' +
      '<ul class="pp-ticks sm">' +
        '<li>' + n(p.ai) + ' AI call minutes</li>' +
        '<li>' + n(p.msgs) + ' texts, emails and IVR messages</li>' +
        '<li>Flyer design support for ' + p.design + ' months</li>' +
        '<li>15+ platforms, remarketing included</li>' +
        '<li>Valid 12 months, pause anytime</li>' +
      '</ul>' +
      '<div class="pp-stack">' + stack + '</div>' + priceBlock +
      '<button type="button" class="button button-grad pp-buy" data-plan="' + p.key + '">Buy ' + p.name + '</button>' +
      '<p class="pp-fine">One-time payment in CAD + tax · Secure card payment by Stripe</p>' +
    '</article>';
  }).join('');
  var grid = document.getElementById('ppGrid');
  if (grid) grid.innerHTML = html;

  /* ---------- buy dialog ---------- */
  var dlg, cur;
  function $(id) { return dlg.querySelector('#' + id); }
  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'co-dlg pp-dlg';
    dlg.setAttribute('aria-labelledby', 'ppTitle');
    var opts = '<option value="">Choose…</option>' + PROV.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('') +
      '<option value="XX">Outside Canada</option>';
    dlg.innerHTML =
      '<div class="co-box">' +
        '<button type="button" class="co-x" id="ppX" aria-label="Close">×</button>' +
        '<p class="co-kick">Digital Flyers</p>' +
        '<h2 id="ppTitle" class="co-h"></h2>' +
        '<p class="co-info" id="ppInfo"></p>' +
        '<div id="ppStep1">' +
          '<label class="co-lab" for="ppProv">Your province or territory</label>' +
          '<select id="ppProv" class="co-sel">' + opts + '</select>' +
          '<dl class="co-sum">' +
            '<div><dt id="ppPlanL">Plan</dt><dd id="ppPlan"></dd></div>' +
            '<div><dt id="ppTaxL">Tax</dt><dd id="ppTax">–</dd></div>' +
            '<div class="co-tot"><dt>Total today</dt><dd id="ppTot">–</dd></div>' +
          '</dl>' +
          '<p class="co-err" id="ppErr" role="alert" hidden></p>' +
          '<button type="button" class="button button-grad co-go" id="ppGo">Continue to secure payment</button>' +
          '<p class="co-note">One-time prepaid payment in CAD, no monthly fees. After payment you get your hub login to upload your content. By paying you agree to the <a href="/terms.html" target="_blank" rel="noopener">Terms</a> and <a href="/refund-policy.html" target="_blank" rel="noopener">Refund Policy</a>.</p>' +
        '</div>' +
        '<form id="ppStep2" hidden novalidate>' +
          '<p class="pp-alt" id="ppAltMsg">Leave your details and our team will email you a secure payment link today, with this price held for you.</p>' +
          '<label class="co-lab" for="ppName">Your name</label><input class="co-sel" id="ppName" autocomplete="name" required>' +
          '<label class="co-lab" for="ppBiz">Business name</label><input class="co-sel" id="ppBiz" autocomplete="organization" required>' +
          '<label class="co-lab" for="ppEmail">Email</label><input class="co-sel" id="ppEmail" type="email" autocomplete="email" required>' +
          '<label class="co-lab" for="ppPhone">Phone</label><input class="co-sel" id="ppPhone" type="tel" inputmode="tel" autocomplete="tel" required>' +
          '<div class="hp" aria-hidden="true"><label>Website<input id="ppHp" type="text" tabindex="-1" autocomplete="off"></label></div>' +
          '<label class="pp-consent"><input type="checkbox" id="ppConsent"><span>I agree to receive calls, texts and emails from Adviuz about my order and its services. Consent is not a condition of purchase. Reply STOP to opt out.</span></label>' +
          '<p class="co-err" id="ppErr2" role="alert" hidden></p>' +
          '<button type="submit" class="button button-grad co-go" id="ppSend">Send my order</button>' +
          '<p class="co-note">Adviuz (Instad Web Services Ltd.) · Saskatoon SK · <a href="/privacy.html" target="_blank" rel="noopener">Privacy Policy</a></p>' +
        '</form>' +
        '<div id="ppDone" class="pp-done" hidden><div class="pp-ok">✓</div><h3>Order received</h3><p id="ppDoneTxt"></p></div>' +
      '</div>';
    document.body.appendChild(dlg);
    $('ppX').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    $('ppProv').addEventListener('change', update);
    $('ppGo').addEventListener('click', go);
    $('ppStep2').addEventListener('submit', sendOrder);
  }

  function update() {
    var p = cur, prov = $('ppProv').value, pre = price(p);
    $('ppPlanL').textContent = p.name + (BF ? ' · Black Friday price' : '');
    $('ppPlan').textContent = m2(pre);
    $('ppErr').hidden = true;
    if (RATE[prov] != null) {
      var tax = Math.round(pre * RATE[prov] * 100) / 100;
      $('ppTaxL').textContent = 'Tax (' + +(RATE[prov] * 100).toFixed(3) + '% ' + prov + ')';
      $('ppTax').textContent = m2(tax);
      $('ppTot').textContent = m2(pre + tax) + ' CAD';
    } else {
      $('ppTaxL').textContent = 'Tax'; $('ppTax').textContent = prov === 'XX' ? 'Confirmed by our team' : '–';
      $('ppTot').textContent = prov === 'XX' ? m2(pre) + ' CAD + tax' : '–';
    }
  }

  function showStep2(msg) {
    $('ppStep1').hidden = true; $('ppStep2').hidden = false;
    if (msg) $('ppAltMsg').textContent = msg;
    setTimeout(function () { $('ppName').focus(); }, 30);
  }

  function go() {
    var prov = $('ppProv').value;
    if (!prov) { $('ppErr').textContent = 'Please choose your province or territory.'; $('ppErr').hidden = false; $('ppProv').focus(); return; }
    try { localStorage.setItem('adv_prov', prov); } catch (e) {}
    if (prov === 'XX') { showStep2('For clients outside Canada, our team confirms tax and sends your secure payment link. Leave your details below.'); return; }
    var b = $('ppGo'); b.disabled = true; b.textContent = 'Opening secure payment…';
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
    fetch(PAY_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl ? ctrl.signal : undefined,
      body: JSON.stringify({ plan: cur.key, province: prov, offer: BF ? 'black-friday-2026' : '', ref: ref, back: '/plans.html' })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        clearTimeout(timer);
        var url = x.ok && x.j && x.j.url;
        var safe = false;
        try { var u = new URL(url); safe = u.protocol === 'https:' && OK_HOSTS.indexOf(u.hostname) > -1; } catch (e) {}
        if (safe) { location.href = url; return; }
        b.disabled = false; b.textContent = 'Continue to secure payment';
        showStep2();
      })
      .catch(function () { clearTimeout(timer); b.disabled = false; b.textContent = 'Continue to secure payment'; showStep2(); });
  }

  function sendOrder(e) {
    e.preventDefault();
    var err = $('ppErr2'); err.hidden = true;
    var name = $('ppName').value.trim(), biz = $('ppBiz').value.trim(), email = $('ppEmail').value.trim();
    var d = $('ppPhone').value.replace(/\D/g, ''); if (d.length === 11 && d[0] === '1') d = d.slice(1);
    var prov = $('ppProv').value;
    var msg = name.length < 2 ? 'Please enter your name.' : !biz ? 'Please enter your business name.' :
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Please enter a valid email.' :
      (d.length !== 10 && prov !== 'XX') ? 'Please enter a valid phone number.' : '';
    if (prov === 'XX' && d.length < 8) msg = msg || 'Please enter a valid phone number.';
    if (msg) { err.textContent = msg; err.hidden = false; return; }
    var phone = d.length === 10 ? '+1' + d : '+' + d;
    var b = $('ppSend'); b.disabled = true; b.textContent = 'Sending…';
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (x) {}
    var p = cur, pre = price(p);
    fetch(LEAD_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name, phone: phone, email: email, business: biz,
        message: 'ORDER REQUEST — Digital Flyers ' + p.name + ' plan (' + n(p.views) + ' viewed flyers)' +
          ' · Price ' + m0(pre) + ' CAD + tax' + (BF ? ' (Black Friday price, total value ' + m0(p.total) + ')' : '') +
          ' · Province ' + (prov === 'XX' ? 'outside Canada' : prov) + (ref ? ' · Partner ' + ref : '') +
          ' · Please send a secure payment link.',
        country: prov === 'XX' ? '' : 'CA', location: prov === 'XX' ? '' : prov, timezone: tz,
        consent: $('ppConsent').checked, website: $('ppHp').value, ref: ref, page: location.pathname
      })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok || !x.j || !x.j.success) throw new Error('fail');
        try { document.dispatchEvent(new CustomEvent('adviuz:lead', { detail: { type: 'order' } })); } catch (z) {}
        $('ppStep2').hidden = true; $('ppDone').hidden = false;
        $('ppDoneTxt').textContent = 'Thank you, ' + name.split(' ')[0] + '. We’ll email your secure payment link for the ' + p.name +
          ' plan to ' + email + ' today' + (BF ? ', with the Black Friday price held for you' : '') + '. Questions? Call +1 647 250 1152.';
      })
      .catch(function () {
        b.disabled = false; b.textContent = 'Send my order';
        err.innerHTML = 'Something went wrong. Please try again or call <a href="tel:+16472501152">+1 647 250 1152</a>.'; err.hidden = false;
      });
  }

  function open(key) {
    cur = PLANS.filter(function (p) { return p.key === key; })[0];
    if (!cur) return;
    if (!dlg) build();
    $('ppTitle').textContent = cur.name + ' plan';
    $('ppInfo').textContent = n(cur.views) + ' viewed flyers · ' + n(cur.ai) + ' AI minutes · valid 12 months';
    $('ppStep1').hidden = false; $('ppStep2').hidden = true; $('ppDone').hidden = true;
    var b = $('ppGo'); b.disabled = false; b.textContent = 'Continue to secure payment';
    var sb = $('ppSend'); sb.disabled = false; sb.textContent = 'Send my order';
    var saved = ''; try { saved = localStorage.getItem('adv_prov') || ''; } catch (e) {}
    if (saved && !$('ppProv').value) $('ppProv').value = saved;
    update();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.pp-buy');
    if (!a) return;
    e.preventDefault();
    open(a.getAttribute('data-plan'));
  });

  if (/[?&]checkout=cancelled/.test(location.search)) {
    var t = document.createElement('div');
    t.className = 'co-toast'; t.setAttribute('role', 'status');
    t.textContent = 'Payment cancelled. Nothing was charged.';
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 5000);
    setTimeout(function () { t.remove(); }, 5600);
  }
})();
