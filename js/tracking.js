/* Adviuz – ad tracking (Google Ads + Meta Pixel).
   HOW TO USE: paste your IDs between the quotes below and upload this file again.
   Nothing loads until an ID is filled in. These IDs are public, not secrets.
     GOOGLE_ADS_ID      – from Google Ads > Goals > Conversions > tag setup, looks like 'AW-123456789'
     GOOGLE_PURCHASE    – the "Purchase" conversion label, looks like 'AbCdEfGhIjK'
     GOOGLE_CALL        – the "Call our AI" click conversion label
     META_PIXEL_ID      – from Meta Events Manager, a number like '1234567890123456'          */
(function () {
  var CFG = {
    GOOGLE_ADS_ID:   '',
    GOOGLE_PURCHASE: '',
    GOOGLE_CALL:     '',
    META_PIXEL_ID:   ''
  };

  // Plan values in CAD (Essential includes the $300 setup fee), used for the purchase event on the welcome page
  var VALUE = {
    'ce-essential': 900, 'ce-pro': 1000, 'ce-max': 2000
  };

  function addScript(src) {
    var s = document.createElement('script'); s.async = true; s.src = src;
    document.head.appendChild(s);
  }

  // ---- Google Ads ----
  if (CFG.GOOGLE_ADS_ID) {
    addScript('https://www.googletagmanager.com/gtag/js?id=' + CFG.GOOGLE_ADS_ID);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', CFG.GOOGLE_ADS_ID);
  }

  // ---- Meta Pixel ----
  if (CFG.META_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', CFG.META_PIXEL_ID);
    fbq('track', 'PageView');
  }

  function gEvent(label, extra) {
    if (window.gtag && CFG.GOOGLE_ADS_ID && label) {
      var o = { send_to: CFG.GOOGLE_ADS_ID + '/' + label };
      for (var k in extra) o[k] = extra[k];
      gtag('event', 'conversion', o);
    }
  }
  function mEvent(name, data) { if (window.fbq) fbq('track', name, data || {}); }

  // ---- Clicks: "Call our AI" and Buy buttons ----
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) { gEvent(CFG.GOOGLE_CALL, {}); mEvent('Contact'); }
    else if (a.classList.contains('ce-buy')) {
      var plan = a.getAttribute('data-plan');
      mEvent('InitiateCheckout', { content_name: plan, value: VALUE[plan] || 0, currency: 'CAD' });
    }
  }, { passive: true });

  // ---- Purchase: fires once on the welcome page after Stripe ----
  if (/\/welcome(\.html)?$/.test(location.pathname)) {
    var plan = new URLSearchParams(location.search).get('plan') || '';
    var key = 'adv_purchase_' + plan;
    var seen = false;
    try { seen = sessionStorage.getItem(key) === '1'; sessionStorage.setItem(key, '1'); } catch (err) {}
    if (!seen && VALUE[plan]) {
      var v = VALUE[plan];
      gEvent(CFG.GOOGLE_PURCHASE, { value: v, currency: 'CAD' });
      mEvent('Purchase', { value: v, currency: 'CAD', content_name: plan });
      if (/-m$/.test(plan)) mEvent('Subscribe', { value: v, currency: 'CAD', predicted_ltv: v * 12 });
    }
  }
})();
