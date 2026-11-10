/* Adviuz website voice: "Talk to Amber" in the browser.
   v1 (2026-11-09): tap -> allow mic -> live voice with Amber.
   v2 (2026-11-09, Ajax: "full screen like ChatGPT", "this is a deal closer"):
     - full-screen voice view: big animated orb, live captions, round mute / end buttons, minimise
     - talks to the separate "Adviuz Website Closer" agent (chosen on the server)
     - when Amber opens a plan's checkout, the voice view shrinks to a small bar (the call keeps going)
       and that plan's checkout opens on the page
   The call is started by the website-voice function (server holds the Retell key); the Retell browser SDK
   (/assets/retell-sdk-3.0.3.js, loaded only when the voice view opens) carries the audio.
   Opens from: the mic button (bottom right), any [data-voice] element, the chat header "Talk" button.
   On /start the mic button shows only once the plans are unlocked (body.unlocked), like the chat. */
(function () {
  'use strict';
  var FN = 'https://crhvvfomwkrgwlnfruad.supabase.co/functions/v1/website-voice';
  var SDK = '/assets/retell-sdk-3.0.3.js';
  var PHONE = '+1 647 250 1152', TEL = 'tel:+16472501152';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sdkP = null, call = null, callId = '', state = 'idle', muted = false, t0 = 0, tick = 0, poll = 0, lvlRaf = 0, lvl = 0, lastAct = 0, mini = false;

  var css = ''
    /* launcher */
    + 'html body>.vc-fab{position:fixed;right:18px;bottom:18px;z-index:80;width:auto;height:58px;border-radius:999px;border:0;background:var(--grad,linear-gradient(135deg,#4000f3,#e65afc));color:#fff;box-shadow:0 14px 34px rgba(64,0,243,.4);display:flex;align-items:center;gap:10px;padding:0 22px 0 18px;cursor:pointer;font:800 16px/1 var(--font-body,sans-serif)}'
    + '.vc-fab svg{width:24px;height:24px}.vc-fab b{white-space:nowrap}'
    + '.vc-fab.pulse::after{content:"";position:absolute;inset:0;border-radius:999px;box-shadow:0 0 0 0 rgba(122,60,255,.6);animation:vcP 2s infinite}'
    + '@keyframes vcP{70%{box-shadow:0 0 0 16px rgba(122,60,255,0)}100%{box-shadow:0 0 0 0 rgba(122,60,255,0)}}'
    + 'body:not(.unlocked) .vc-fab{display:none}body.vc-open .vc-fab,body.vc-open .cb-fab,body.vc-open .cb-tip,body.vc-mini .vc-fab{display:none!important}'
    + 'body.vc-open{overflow:hidden}'
    /* full-screen view */
    + 'html body>.vc{position:fixed;inset:0;left:0;top:0;width:100%;height:100%;height:100dvh;z-index:120;display:flex;flex-direction:column;color:#fff;background:radial-gradient(120% 80% at 50% 0%,#3a1477 0%,#170a2e 55%,#0d0619 100%);font-family:var(--font-body,sans-serif)}'
    + '.vc[hidden]{display:none!important}'
    + '.vc-top{display:flex;align-items:center;gap:12px;padding:max(14px,env(safe-area-inset-top)) 18px 10px}'
    + '.vc-top img{width:34px;height:34px;border-radius:10px;background:#fff;padding:4px}'
    + '.vc-top b{display:block;font-size:16px}.vc-top small{display:block;font-size:12.5px;opacity:.7}'
    + '.vc-ib{width:42px;height:42px;border-radius:50%;border:0;background:rgba(255,255,255,.1);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}'
    + '.vc-ib[hidden]{display:none}.vc-ib svg{width:20px;height:20px}.vc-ib:hover{background:rgba(255,255,255,.18)}'
    + '.vc-top>div{flex:1;min-width:0}.vc-top .vc-ib{flex:none}'
    + '.vc-mid{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:10px 22px;min-height:0}'
    + '.vc-orb{--l:0;position:relative;width:min(46vw,210px);height:min(46vw,210px);border-radius:50%;background:radial-gradient(circle at 35% 30%,#d58bff 0%,#8a3dff 38%,#4f12e6 70%,#2a0a8a 100%);box-shadow:0 0 calc(40px + var(--l)*90px) rgba(150,80,255,.55);transform:scale(calc(1 + var(--l)*.12));transition:transform .09s linear,box-shadow .09s linear}'
    + '.vc-orb::after{content:"";position:absolute;inset:-14px;border-radius:50%;border:2px solid rgba(190,140,255,.25)}'
    + '.vc[data-s="connecting"] .vc-orb{animation:vcB 1.6s ease-in-out infinite}'
    + '.vc[data-s="idle"] .vc-orb,.vc[data-s="ended"] .vc-orb,.vc[data-s="error"] .vc-orb{animation:vcB 4s ease-in-out infinite}'
    + '@keyframes vcB{50%{transform:scale(1.06);filter:brightness(1.15)}}'
    + '.vc-st{font-weight:800;font-size:19px;text-align:center;margin:0}'
    + '.vc-tm{font-size:13px;opacity:.6;letter-spacing:.05em;margin:-14px 0 0}'
    + '.vc-cap{width:min(640px,100%);min-height:96px;max-height:30vh;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;text-align:center;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 30%);mask-image:linear-gradient(to bottom,transparent 0,#000 30%)}'
    + '.vc-cap p{margin:0;font-size:17px;line-height:1.45}.vc-cap p.u{opacity:.6;font-size:15px}'
    + '.vc-sub{font-size:15px;line-height:1.5;opacity:.8;text-align:center;max-width:420px;margin:0}'
    + '.vc-sub a{color:#fff}'
    + '.vc-bot{padding:10px 18px max(18px,env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:center;gap:14px}'
    + '.vc-ctl{display:flex;gap:22px;align-items:center;justify-content:center;flex-wrap:wrap}'
    + '.vc-rb{width:64px;height:64px;border-radius:50%;border:0;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(255,255,255,.12);color:#fff}'
    + '.vc-rb svg{width:26px;height:26px}.vc-rb[aria-pressed="true"]{background:#fff;color:#1c1030}'
    + '.vc-rb.end{background:#e5484d}'
    + '.vc-go,.vc-alt{border:0;border-radius:999px;font:800 16px var(--font-body,sans-serif);padding:16px 30px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:10px;white-space:nowrap}'
    + '.vc-go{background:#fff;color:#2a0a8a}.vc-go svg{width:20px;height:20px}'
    + '.vc-alt{background:rgba(255,255,255,.12);color:#fff}'
    + '.vc-note{font-size:12px;opacity:.6;text-align:center;max-width:520px;margin:0}.vc-note a{color:#fff}'
    /* minimised bar (call keeps going while they check out) */
    + 'html body>.vc-bar{position:fixed;left:50%;transform:translateX(-50%);top:max(10px,env(safe-area-inset-top));z-index:121;display:flex;align-items:center;gap:10px;background:#1c0b38;color:#fff;border-radius:999px;padding:8px 8px 8px 14px;box-shadow:0 14px 40px rgba(20,5,45,.45);font:700 14px var(--font-body,sans-serif);width:auto;max-width:calc(100vw - 24px)}'
    + '.vc-bar[hidden]{display:none!important}'
    + '.vc-bar .vc-bt{white-space:nowrap}.vc-bar i{flex:none;width:10px;height:10px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 4px rgba(74,222,128,.2)}'
    + '.vc-bar button{border:0;border-radius:999px;height:36px;padding:0 14px;font:800 13px var(--font-body,sans-serif);cursor:pointer;background:rgba(255,255,255,.14);color:#fff;display:inline-flex;align-items:center;gap:6px}'
    + '.vc-bar button.end{background:#e5484d}.vc-bar svg{width:16px;height:16px}'
    /* chat header shortcut */
    + '.cb-talk{border:0;background:rgba(255,255,255,.14);color:#fff;height:34px;border-radius:999px;padding:0 12px 0 10px;font:800 13px var(--font-body,sans-serif);display:inline-flex;align-items:center;gap:6px;cursor:pointer;margin-left:auto}'
    + '.cb-talk svg{width:16px;height:16px}.cb-talk+.cb-x{margin-left:8px}'
    + '@media(max-width:720px){html body>.vc-fab{right:12px;bottom:12px;height:56px;padding:0 18px 0 16px;font-size:15px}.vc-cap p{font-size:16px}.vc-rb{width:60px;height:60px}}';

  var I = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3M8.5 21h7"/></svg>',
    off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M9 9v2a3 3 0 005 2.2M15 9.3V6a3 3 0 00-5.7-1.3M5 11a7 7 0 0011.4 5.4M19 11a7 7 0 01-.6 2.8M12 18v3M8.5 21h7"/></svg>',
    end: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>'
  };

  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'vc-fab'; fab.setAttribute('aria-label', 'Have questions? Talk to Amber by voice');
  fab.innerHTML = I.mic + '<b>Have questions? Let\'s talk</b>';
  var box = document.createElement('div');
  box.className = 'vc'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Talk to Amber');
  box.innerHTML = '<div class="vc-top"><img src="/assets/favicon.svg?v=5" alt=""><div><b>Amber</b><small>Adviuz AI assistant · voice</small></div>'
    + '<button type="button" class="vc-ib vc-min" aria-label="Minimise">' + I.down + '</button><button type="button" class="vc-ib vc-x" aria-label="Close and end">' + I.end + '</button></div>'
    + '<div class="vc-mid"><div class="vc-orb" aria-hidden="true"></div><p class="vc-st" aria-live="polite"></p><p class="vc-tm" hidden></p><div class="vc-cap" aria-live="polite"></div><p class="vc-sub"></p></div>'
    + '<div class="vc-bot"><div class="vc-ctl"></div><p class="vc-note">Amber is an AI assistant and can make mistakes, so please check important details like prices and what\'s included on this page before you buy. Conversations may be recorded. Prefer a person? Call <a href="' + TEL + '">' + PHONE + '</a> (24/7).</p></div>';
  var bar = document.createElement('div');
  bar.className = 'vc-bar'; bar.hidden = true;
  bar.innerHTML = '<i></i><span class="vc-bt">Amber</span><button type="button" class="vc-open">' + I.up + 'Open</button><button type="button" class="end">' + I.end + 'End</button>';
  document.body.appendChild(fab); document.body.appendChild(box); document.body.appendChild(bar);
  var $ = function (s) { return box.querySelector(s); };
  var orb = $('.vc-orb'), sT = $('.vc-st'), sTm = $('.vc-tm'), cap = $('.vc-cap'), sSub = $('.vc-sub'), ctl = $('.vc-ctl'), minB = $('.vc-min'), barT = bar.querySelector('.vc-bt');

  function track(n, p) { try { if (window.fbq) fbq('trackCustom', n, p || {}); if (window.gtag) gtag('event', n, p || {}); } catch (_) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function leadId() {
    if (window.ADV_LEAD) return String(window.ADV_LEAD);
    try { var q = new URLSearchParams(location.search).get('lead'); if (q) return q; } catch (_) {}
    try { var ss = sessionStorage.getItem('adv_lead'); if (ss) return ss; } catch (_) {}
    return '';
  }
  /* the name they typed on this page (used only for Amber's greeting when there is no lead yet) */
  function visitorName() {
    var ids = ['iNm', 'qNm'];
    for (var i = 0; i < ids.length; i++) { var el = document.getElementById(ids[i]); if (el && el.value && el.value.trim()) return el.value.trim().slice(0, 80); }
    try { return (sessionStorage.getItem('adv_name') || '').slice(0, 80); } catch (_) { return ''; }
  }
  function audience() { var e = document.getElementById('plSeg'); var t = e ? e.textContent : ''; return /B2B/.test(t) ? 'b2b' : /B2C/.test(t) ? 'b2c' : ''; }
  function tz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { return ''; } }
  function loadSDK() {
    if (window.AdvRetell) return Promise.resolve();
    if (!sdkP) sdkP = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = SDK; s.async = true;
      s.onload = function () { window.AdvRetell ? res() : rej(new Error('sdk')); };
      s.onerror = function () { sdkP = null; rej(new Error('sdk')); };
      document.head.appendChild(s);
    });
    return sdkP;
  }
  function clockTxt() { var s = Math.max(0, Math.floor((Date.now() - t0) / 1000)); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function btn(cls, html, label) { return '<button type="button" class="' + cls + '"' + (label ? ' aria-label="' + label + '"' : '') + '>' + html + '</button>'; }
  function view(s, msg) {
    state = s; box.setAttribute('data-s', s);
    var c = '';
    sSub.hidden = false; cap.hidden = s !== 'live';
    if (s === 'idle') {
      sT.textContent = 'Talk to Amber';
      sSub.textContent = msg || 'Ask anything about the plans or Digital Flyers. Amber can help you choose and get started right now.';
      c = btn('vc-go', I.mic + 'Start talking');
    } else if (s === 'connecting') {
      sT.textContent = 'Connecting…';
      sSub.textContent = 'Allow the microphone if your browser asks.';
      c = btn('vc-rb end', I.end, 'Cancel');
    } else if (s === 'live') {
      sT.textContent = 'Amber is listening'; sSub.hidden = true;
      c = btn('vc-rb mu', I.mic, 'Mute') + btn('vc-rb end', I.end, 'End conversation');
    } else if (s === 'ended') {
      sT.textContent = 'Thanks for talking with us';
      sSub.textContent = msg || 'Ready to start? Pick your plan on this page, or book a free walkthrough.';
      c = btn('vc-go back', 'See the plans') + '<a class="vc-alt" href="/book?solution=both" target="_blank" rel="noopener">Book a free demo</a>' + btn('vc-alt again', I.mic + 'Talk again');
    } else if (s === 'error') {
      sT.textContent = 'We couldn\'t connect';
      sSub.innerHTML = msg || ('Please try again, or call us on <a href="' + TEL + '">' + PHONE + '</a>, 24/7.');
      c = btn('vc-go again', 'Try again') + '<a class="vc-alt" href="' + TEL + '">Call us</a>';
    }
    ctl.innerHTML = c;
    sTm.hidden = s !== 'live';
    if (s !== 'live') { cap.innerHTML = ''; setMini(false); }
  }
  function setLevel(v) {
    lvl = lvl * 0.7 + v * 0.3;
    if (!lvlRaf) lvlRaf = requestAnimationFrame(function () { lvlRaf = 0; orb.style.setProperty('--l', Math.min(1, lvl * 6).toFixed(3)); });
  }
  function stopTimers() { clearInterval(tick); tick = 0; clearTimeout(poll); poll = 0; orb.style.setProperty('--l', 0); lvl = 0; }

  /* captions + "open checkout" from Amber */
  function drawCaps(lines) {
    if (!Array.isArray(lines)) return;
    var h = lines.slice(-3).map(function (l) { return '<p class="' + (l.role === 'user' ? 'u' : 'a') + '">' + esc(l.content || '') + '</p>'; }).join('');
    if (cap.innerHTML !== h) cap.innerHTML = h;
  }
  function openCheckout(key) {
    track('VoiceCheckout', { plan: key });
    try { window.dispatchEvent(new CustomEvent('adv:checkout', { detail: { plan: key } })); } catch (_) {}
    setMini(true);
    try { if (typeof window.gsBuy === 'function') { window.gsBuy(key); return; } } catch (_) {}
    var a = document.querySelector('[data-k="' + key + '"]'); if (a) a.click();
  }
  /* 2026-11-09 (Ajax): Amber puts the plan she is explaining on screen (show_plans tool) */
  function showPlan(key) {
    if (key) { track('VoiceShowPlan', { plan: key }); setMini(true); }
    try { window.dispatchEvent(new CustomEvent('adv:showplan', { detail: { plan: key || null } })); } catch (_) {}
  }
  function pollLive() {
    if (!call || !callId) return;
    fetch(FN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'live', call_id: callId }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !call) return;
        drawCaps(j.lines);
        if (j.action && j.action.id && j.action.id !== lastAct) {
          lastAct = j.action.id;
          var ap = String(j.action.plan || '');
          if (/^bf-(pilot|growth|scale|pro)$/.test(ap)) openCheckout(ap);
          else if (/^show:(all|bf-(pilot|growth|scale|pro))$/.test(ap)) showPlan(ap.slice(5));
        }
      }).catch(function () {})
      .then(function () { if (call && !document.hidden) poll = setTimeout(pollLive, 1800); else if (call) poll = setTimeout(pollLive, 4000); });
  }
  function setMini(on) {
    mini = !!on && state === 'live';
    if (mini) { box.hidden = true; document.body.classList.remove('vc-open'); document.body.classList.add('vc-mini'); bar.hidden = false; }
    else { bar.hidden = true; document.body.classList.remove('vc-mini'); }
  }

  function start() {
    if (call || state === 'connecting') return;
    muted = false; lastAct = 0; callId = ''; view('connecting'); track('VoiceStart'); if (window.advTrack) window.advTrack('voice');
    loadSDK().then(function () {
      var client = new window.AdvRetell.RetellClient({
        key: 'website',
        fetch: function (url, init) {
          var h = { 'Content-Type': 'application/json' };
          try { var v = init && init.headers && init.headers['X-Retell-Client-JS-SDK-Version']; if (v) h['x-retell-client-js-sdk-version'] = v; } catch (_) {}
          return fetch(FN, { method: 'POST', headers: h, body: JSON.stringify({ action: 'start', lead: leadId(), name: visitorName(), audience: audience(), tz: tz(), page: location.pathname, returning: !!(window.ADV_VISITOR && window.ADV_VISITOR.returning) }) });
        }
      });
      var me = client.createWebCall({
        agent_id: 'amber', /* chosen on the server */
        audio: RM ? undefined : { emitRawAudioSamples: true },
        hooks: {
          onStatus: function (s) {
            if (call !== me) return;
            if (s === 'live') {
              callId = me.callId || ''; view('live'); t0 = Date.now(); sTm.textContent = '0:00';
              tick = setInterval(function () {
                var t = clockTxt(); sTm.textContent = t; barT.textContent = 'Amber · ' + t;
                if (state === 'live' && !muted) sT.textContent = me.isAgentTalking ? 'Amber is speaking' : 'Amber is listening';
              }, 400);
              poll = setTimeout(pollLive, 1200);
              track('VoiceLive');
            }
          },
          onAudio: function (a) {
            if (call !== me || !a || !a.length) return;
            var sum = 0; for (var i = 0; i < a.length; i += 8) sum += a[i] * a[i];
            setLevel(Math.sqrt(sum / (a.length / 8)));
          },
          onEnd: function () { if (call !== me) return; call = null; stopTimers(); if (state !== 'error') { view('ended'); if (box.hidden) { box.hidden = false; document.body.classList.add('vc-open'); } } },
          onError: function (e) {
            if (call !== me) return;
            var m = String((e && (e.message || e.name)) || ''), st0 = e && e.status;
            call = null; stopTimers();
            try { me.end(); } catch (_) {}
            if (/NotAllowed|Permission|denied/i.test(m)) view('error', 'Your browser blocked the microphone. Allow it in the address bar and try again, or call <a href="' + TEL + '">' + PHONE + '</a>.');
            else if (st0 === 429) view('error', 'Voice is busy right now. Please call us on <a href="' + TEL + '">' + PHONE + '</a>, 24/7.');
            else view('error');
            box.hidden = false; document.body.classList.add('vc-open');
            track('VoiceError');
          }
        }
      });
      call = me;
    }).catch(function () { call = null; view('error'); });
  }
  function end() {
    var c = call; call = null; stopTimers();
    showPlan(null);
    if (c) { try { c.end(); } catch (_) {} view('ended'); track('VoiceEnd'); }
    else view('idle');
  }
  function openV() {
    bar.hidden = true; document.body.classList.remove('vc-mini'); mini = false;
    var cb = document.getElementById('cb'); if (cb && !cb.hidden) { var x = document.getElementById('cbX'); if (x) x.click(); }
    box.hidden = false; document.body.classList.add('vc-open');
    track('VoiceOpen');
    /* one tap: opening the voice screen starts the conversation (the mic prompt appears right away);
       if they minimised during a conversation, opening just brings it back */
    if (state !== 'live' && state !== 'connecting') start();
  }
  function closeV() {
    if (call) end();
    box.hidden = true; bar.hidden = true; document.body.classList.remove('vc-open', 'vc-mini');
  }

  fab.addEventListener('click', openV);
  $('.vc-x').addEventListener('click', closeV);
  minB.addEventListener('click', function () { if (state === 'live') setMini(true); else { box.hidden = true; document.body.classList.remove('vc-open'); } });
  bar.querySelector('.vc-open').addEventListener('click', openV);
  bar.querySelector('.end').addEventListener('click', function () { end(); closeV(); });
  ctl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('vc-go') && !b.classList.contains('back') || b.classList.contains('again')) start();
    else if (b.classList.contains('back')) closeV();
    else if (b.classList.contains('end')) end();
    else if (b.classList.contains('mu') && call) {
      muted = !muted; try { muted ? call.mute() : call.unmute(); } catch (_) {}
      b.setAttribute('aria-pressed', muted ? 'true' : 'false'); b.innerHTML = muted ? I.off : I.mic;
      b.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
      sT.textContent = muted ? 'You\'re muted' : 'Amber is listening';
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) { if (state === 'live') setMini(true); else closeV(); } });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-voice]')) { e.preventDefault(); openV(); } });
  window.addEventListener('pagehide', function () { if (call) try { call.end(); } catch (_) {} });

  /* "Talk" button in the chat header */
  var cbh = document.querySelector('.cb-h'), cbx = document.getElementById('cbX');
  if (cbh && cbx) {
    var tb = document.createElement('button');
    tb.type = 'button'; tb.className = 'cb-talk'; tb.setAttribute('data-voice', ''); tb.innerHTML = I.mic + 'Talk';
    tb.setAttribute('aria-label', 'Talk to Amber by voice');
    cbh.insertBefore(tb, cbx);
  }
  view('idle');
  /* load the voice library quietly once the plans are on screen, so the mic prompt is instant on tap */
  (function () {
    var go = function () { if (document.body.classList.contains('unlocked')) { loadSDK().catch(function () {}); return true; } return false; };
    if (go()) return;
    try { var mo = new MutationObserver(function () { if (go()) mo.disconnect(); }); mo.observe(document.body, { attributes: true, attributeFilter: ['class'] }); } catch (_) {}
  })();
})();
