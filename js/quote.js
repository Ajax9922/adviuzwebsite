/* Adviuz – Get a Quote (digital flyer campaigns).
   Shows an instant estimate, then sends the request to the hub.
   The numbers here are for the on-screen estimate only — the hub sets the real
   price on the quote the customer pays. No secrets in this file. */
(function () {
  var BASE = 'https://crhvvfomwkrgwlnfruad.supabase.co/functions/v1/';
  var RATE = { b2c: 5, b2b: 10 };          // display estimate only
  var LEAD_LO = 0.005, LEAD_HI = 0.01;     // 0.5% – 1% of viewed flyers
  var MIN = 1000, CONSULT = 50000;
  var PROV = [['AB','Alberta'],['BC','British Columbia'],['MB','Manitoba'],['NB','New Brunswick'],['NL','Newfoundland and Labrador'],
    ['NS','Nova Scotia'],['NT','Northwest Territories'],['NU','Nunavut'],['ON','Ontario'],['PE','Prince Edward Island'],
    ['QC','Quebec'],['SK','Saskatchewan'],['YT','Yukon'],['US','Outside Canada (USA)']];

  var f = document.getElementById('gqForm'); if (!f) return;
  var $ = function (id) { return document.getElementById(id); };
  var budgetEl = $('gqBudget'), chips = $('gqChips'), t0 = Date.now();

  $('gqProv').innerHTML = '<option value="">Choose…</option>' + PROV.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('');

  var ref = window.advRef ? window.advRef() : '';
  if (ref) { $('gqRefCode').textContent = '(' + ref + ')'; $('gqRef').hidden = false; }

  function money(v) { return '$' + Math.round(v).toLocaleString('en-CA'); }
  function btype() { var r = f.querySelector('input[name=btype]:checked'); return r ? r.value : 'b2c'; }
  function budget() { var v = parseFloat(budgetEl.value); return isFinite(v) ? v : 0; }

  function calc() {
    var b = budget(), views = Math.round(b / RATE[btype()]);
    var lo = Math.max(1, Math.floor(views * LEAD_LO)), hi = Math.max(lo + 1, Math.round(views * LEAD_HI));
    return { budget: b, views: views, lo: lo, hi: hi, consult: b >= CONSULT };
  }
  function paint() {
    var c = calc();
    [].forEach.call(chips.children, function (x) { x.classList.toggle('on', +x.dataset.v === c.budget || (x.dataset.v === '50000' && c.consult)); });
    $('gqConsult').hidden = !c.consult;
    $('gqContact').hidden = c.consult;
    if (c.consult) { $('gqTotal').textContent = '$50,000+'; $('gqViews').textContent = 'Planned with you'; $('gqLeads').textContent = 'Planned with you'; return; }
    if (c.budget < MIN) { $('gqTotal').textContent = money(MIN) + ' minimum'; $('gqViews').textContent = '—'; $('gqLeads').textContent = '—'; return; }
    $('gqTotal').textContent = money(c.budget);
    $('gqViews').textContent = '≈ ' + c.views.toLocaleString('en-CA');
    $('gqLeads').textContent = c.lo.toLocaleString('en-CA') + ' – ' + c.hi.toLocaleString('en-CA');
  }
  chips.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; budgetEl.value = b.dataset.v; paint(); });
  budgetEl.addEventListener('input', paint);
  f.addEventListener('change', paint);
  paint();

  function err(msg, el) { var e = $('gqError'); e.textContent = msg; e.style.display = 'block'; if (el) el.focus(); }
  function digits(s) { return (s || '').replace(/\D/g, ''); }

  f.addEventListener('submit', async function (e) {
    e.preventDefault(); $('gqError').style.display = 'none';
    var c = calc();
    if (c.consult) return;
    if (c.budget < MIN) return err('The minimum campaign is ' + money(MIN) + '.', budgetEl);
    var v = function (id) { return $(id).value.trim(); };
    if (!$('gqInd').value) return err('Please choose your industry.', $('gqInd'));
    if (v('gqArea').length < 2) return err('Please tell us where your flyer should be seen.', $('gqArea'));
    if (v('gqBiz').length < 2) return err('Please enter your business name.', $('gqBiz'));
    if (v('gqName').length < 2) return err('Please enter your name.', $('gqName'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('gqEmail'))) return err('Please enter a valid email so we can send your quote.', $('gqEmail'));
    var ph = digits(v('gqPhone')); if (ph.length === 10) ph = '1' + ph;
    if (ph.length !== 11 || ph[0] !== '1') return err('Please enter a valid 10-digit phone number.', $('gqPhone'));
    if (!$('gqProv').value) return err('Please choose your province or territory.', $('gqProv'));
    if (!$('gqConsent').checked) return err('Please tick the consent box so we can send your quote.', $('gqConsent'));
    var btn = $('gqSubmit'); btn.disabled = true; btn.textContent = 'Preparing your quote…';
    if (Date.now() - t0 < 3000 || f.querySelector('[name=website]').value) { done(); return; }

    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (x) {}
    var data = {
      product: 'digital_flyers', business_type: btype(), industry: $('gqInd').value, goal: $('gqGoal').value,
      area: v('gqArea'), budget: c.budget, est_views: c.views, est_leads_low: c.lo, est_leads_high: c.hi,
      business: v('gqBiz'), name: v('gqName'), email: v('gqEmail'), phone: '+' + ph, province: $('gqProv').value,
      consent: true, ref: ref, page: location.pathname, timezone: tz, website: ''
    };
    // 1) Preferred: the hub creates the quote and returns its secure payment page.
    try {
      var r = await fetch(BASE + 'website-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      var out = await r.json().catch(function () { return {}; });
      if (r.ok && out.success) {
        try { document.dispatchEvent(new CustomEvent('adviuz:lead', { detail: { type: 'quote' } })); } catch (x) {}
        if (out.url && /^https:\/\/(hub\.)?adviuz\.(ca|com)\//.test(out.url)) { location.href = out.url; return; }
        done(); return;
      }
    } catch (x) {}
    // 2) Fallback: send it as a website lead so nothing is lost; the team emails the quote.
    try {
      var msg = 'QUOTE REQUEST — Digital Flyers | ' + (btype() === 'b2b' ? 'B2B' : 'B2C') + ' | ' + data.industry + ' | Goal: ' + data.goal +
        ' | Area: ' + data.area + ' | Budget: ' + money(c.budget) + ' CAD | Est. views ≈ ' + c.views + ' | Est. leads ' + c.lo + '–' + c.hi +
        (ref ? ' | Partner: ' + ref : '');
      var r2 = await fetch(BASE + 'website-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, phone: data.phone, email: data.email, business: data.business, location: data.province,
          country: data.province === 'US' ? 'US' : 'CA', timezone: tz, consent: true, message: msg, kind: 'quote_request', ref: ref,
          website: '', page: location.pathname }) });
      var o2 = await r2.json().catch(function () { return {}; });
      if (!r2.ok || !o2.success) throw new Error('fail');
      try { document.dispatchEvent(new CustomEvent('adviuz:lead', { detail: { type: 'quote' } })); } catch (x) {}
      done();
    } catch (x) {
      btn.disabled = false; btn.textContent = 'Get my quote';
      err('Something went wrong sending your request. Please try again, or call us at +1 647 250 1152.');
    }
  });

  function done() {
    f.hidden = true; $('gqEst').hidden = true; $('gqDone').hidden = false;
    $('gqDone').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
})();
