/* Adviuz – Buy now → secure Stripe payment page.
   Asks for the province (needed for tax), shows the total, then opens Stripe.
   Real prices are set on the server (Supabase "website-checkout"); the numbers
   here are only for display. No secrets in this file. */
(function () {
  var API = 'https://crhvvfomwkrgwlnfruad.supabase.co/functions/v1/website-checkout';
  var PLANS = {
    'ce-essential': { name: 'Essential', price: 600, setup: 300, info: '400 AI minutes · 120 days' },
    'ce-pro':       { name: 'Pro',       price: 1000, setup: 0, info: '800 AI minutes · 180 days' },
    'ce-max':       { name: 'Max',       price: 2000, setup: 0, info: '2,000 AI minutes · 360 days' },
    /* internal $10 test plan — no button anywhere; opened only via
       /pricing.html?buy=ce-test for supervised end-to-end tests */
    'ce-test':      { name: 'Test',      price: 10,   setup: 0, info: '10 AI minutes · 30 days · internal test' }
  };
  var PROV = [['AB','Alberta',.05],['BC','British Columbia',.12],['MB','Manitoba',.12],['NB','New Brunswick',.15],
    ['NL','Newfoundland and Labrador',.15],['NS','Nova Scotia',.15],['NT','Northwest Territories',.05],['NU','Nunavut',.05],
    ['ON','Ontario',.13],['PE','Prince Edward Island',.15],['QC','Quebec',.14975],['SK','Saskatchewan',.11],['YT','Yukon',.05]];
  var RATE = {}; PROV.forEach(function (p) { RATE[p[0]] = p[2]; });
  var back = /ai-conversion-engine/.test(location.pathname) ? '/ai-conversion-engine.html' : '/pricing.html';
  var dlg, plan;

  function money(v) { return '$' + v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function el(id) { return dlg.querySelector('#' + id); }

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'co-dlg';
    dlg.setAttribute('aria-labelledby', 'coTitle');
    var opts = '<option value="">Choose…</option>' + PROV.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('');
    dlg.innerHTML =
      '<form method="dialog" class="co-box">' +
        '<button type="submit" class="co-x" aria-label="Close">×</button>' +
        '<p class="co-kick">AI Conversion Engine</p>' +
        '<h2 id="coTitle" class="co-h"></h2>' +
        '<p class="co-info" id="coInfo"></p>' +
        '<label class="co-lab" for="coProv">Your province or territory</label>' +
        '<select id="coProv" class="co-sel" required>' + opts + '</select>' +
        '<dl class="co-sum">' +
          '<div><dt>Plan</dt><dd id="coPlan"></dd></div>' +
          '<div id="coSetupRow"><dt>One-time setup</dt><dd id="coSetup"></dd></div>' +
          '<div><dt id="coTaxL">Tax</dt><dd id="coTax">–</dd></div>' +
          '<div class="co-tot"><dt>Total today</dt><dd id="coTot">–</dd></div>' +
        '</dl>' +
        '<p class="co-err" id="coErr" role="alert" hidden></p>' +
        '<button type="button" class="button button-grad co-go" id="coGo">Continue to secure payment</button>' +
        '<p class="co-note">One-time prepaid payment in CAD, no monthly fees. Card payment by Stripe. After payment our team contacts you to set up your account.</p>' +
      '</form>';
    document.body.appendChild(dlg);
    el('coProv').addEventListener('change', update);
    el('coGo').addEventListener('click', go);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  function update() {
    var p = PLANS[plan], prov = el('coProv').value, pre = p.price + p.setup;
    el('coPlan').textContent = money(p.price);
    el('coSetupRow').hidden = !p.setup;
    el('coSetup').textContent = money(p.setup);
    if (RATE[prov] != null) {
      var tax = Math.round(pre * RATE[prov] * 100) / 100;
      el('coTaxL').textContent = 'Tax (' + +(RATE[prov] * 100).toFixed(3) + '%)';
      el('coTax').textContent = money(tax);
      el('coTot').textContent = money(pre + tax) + ' CAD';
    } else {
      el('coTaxL').textContent = 'Tax'; el('coTax').textContent = '–'; el('coTot').textContent = '–';
    }
    el('coErr').hidden = true;
  }

  function fail(msg) {
    var e = el('coErr');
    e.innerHTML = msg + ' You can also call <a href="tel:+16472501152">+1 647 250 1152</a>.';
    e.hidden = false;
    var b = el('coGo'); b.disabled = false; b.textContent = 'Continue to secure payment';
  }

  function go() {
    var prov = el('coProv').value;
    if (!prov) { el('coProv').focus(); fail('Please choose your province or territory.'); return; }
    try { localStorage.setItem('adv_prov', prov); } catch (e) {}
    var b = el('coGo'); b.disabled = true; b.textContent = 'Opening secure payment…';
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: plan, province: prov, back: back }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (x.ok && x.j && x.j.url) { location.href = x.j.url; }
        else fail((x.j && x.j.error) || 'The payment page could not open.');
      })
      .catch(function () { fail('The payment page could not open. Please check your connection and try again.'); });
  }

  function open(key) {
    plan = key;
    if (!dlg) build();
    var p = PLANS[key];
    el('coTitle').textContent = p.name + ' plan';
    el('coInfo').textContent = p.info + (p.setup ? '' : ' · setup included');
    var saved = ''; try { saved = localStorage.getItem('adv_prov') || ''; } catch (e) {}
    if (saved && !el('coProv').value) el('coProv').value = saved;
    var b = el('coGo'); b.disabled = false; b.textContent = 'Continue to secure payment';
    update();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.ce-buy');
    if (!a || !PLANS[a.getAttribute('data-plan')]) return;
    e.preventDefault();
    open(a.getAttribute('data-plan'));
  });

  // ?buy=<plan> opens the checkout sheet directly (used for the internal test link)
  var autoBuy = (location.search.match(/[?&]buy=([a-z-]+)/) || [])[1];
  if (autoBuy && PLANS[autoBuy]) {
    var openIt = function () { open(autoBuy); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openIt);
    else openIt();
  }

  // Came back from Stripe without paying
  if (/[?&]checkout=cancelled/.test(location.search)) {
    var t = document.createElement('div');
    t.className = 'co-toast'; t.setAttribute('role', 'status');
    t.textContent = 'Payment cancelled. Nothing was charged.';
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); }, 5000);
    setTimeout(function () { t.remove(); }, 5600);
    try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) {}
  }
})();
