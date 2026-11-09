/* Adviuz website voice: "Talk to Amber" in the browser (2026-11-09).
   Tap -> allow mic -> live voice conversation with Amber (the same AI as the Adviuz phone line).
   The call is started by the website-voice function (server holds the Retell key); the Retell
   browser SDK (/assets/retell-sdk-3.0.3.js, loaded only when the voice panel opens) carries the audio.
   Opens from: the mic button (bottom right), any [data-voice] element, the chat header "Talk" button.
   On /start the mic button shows only once the plans are unlocked (body.unlocked), like the chat. */
(function () {
  'use strict';
  var FN = 'https://crhvvfomwkrgwlnfruad.supabase.co/functions/v1/website-voice';
  var SDK = '/assets/retell-sdk-3.0.3.js';
  var PHONE = '+1 647 250 1152', TEL = 'tel:+16472501152';
  var RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var sdkP = null, call = null, state = 'idle', muted = false, t0 = 0, tick = 0, lvlRaf = 0, lvl = 0;

  var css = ''
    + 'html body>.vc-fab{position:fixed;right:18px;bottom:86px;z-index:80;width:54px;height:54px;border-radius:50%;border:0;background:#fff;color:var(--accent,#5b17f0);box-shadow:0 12px 30px rgba(35,8,53,.22),0 0 0 1px var(--line,#e7e1f3);display:flex;align-items:center;justify-content:center;cursor:pointer}'
    + '.vc-fab svg{width:24px;height:24px}.vc-fab:hover{transform:translateY(-1px)}'
    + '.vc-fab b{position:absolute;right:62px;white-space:nowrap;background:#fff;color:var(--ink,#1c1030);font:700 13px var(--font-body,sans-serif);padding:8px 12px;border-radius:999px;box-shadow:0 8px 22px rgba(35,8,53,.16);pointer-events:none;opacity:0;transform:translateX(6px);transition:opacity .2s,transform .2s}'
    + '.vc-fab:hover b,.vc-fab:focus-visible b{opacity:1;transform:none}'
    + 'body:not(.unlocked) .vc-fab{display:none}body.vc-open .vc-fab,body.vc-open .cb-fab,body.vc-open .cb-tip{display:none!important}'
    + 'html body>.vc{position:fixed;left:auto;right:18px;bottom:18px;z-index:95;width:360px;max-width:calc(100vw - 24px);background:#fff;border:1px solid var(--line,#e7e1f3);border-radius:24px;box-shadow:0 30px 80px rgba(35,8,53,.28);overflow:hidden;display:flex;flex-direction:column}'
    + '.vc[hidden]{display:none}'
    + '.vc-h{display:flex;align-items:center;gap:12px;padding:14px 16px;background:var(--dark-grad,#1c1030);color:#fff}'
    + '.vc-h img{width:38px;height:38px;border-radius:12px;background:#fff;padding:5px;object-fit:contain}'
    + '.vc-h b{display:block;font-size:16px}.vc-h small{display:block;font-size:12.5px;opacity:.8}'
    + '.vc-x{margin-left:auto;border:0;background:rgba(255,255,255,.14);color:#fff;width:34px;height:34px;border-radius:50%;font-size:18px;cursor:pointer}'
    + '.vc-b{padding:26px 22px 20px;text-align:center;background:#faf8fd}'
    + '.vc-orb{--l:0;position:relative;width:132px;height:132px;margin:0 auto 18px;border-radius:50%;background:var(--grad,#6a2bff);display:flex;align-items:center;justify-content:center;color:#fff}'
    + '.vc-orb svg{width:46px;height:46px;position:relative;z-index:1}'
    + '.vc-orb::before,.vc-orb::after{content:"";position:absolute;inset:-10px;border-radius:50%;border:2px solid rgba(122,60,255,.28);transform:scale(calc(1 + var(--l)*.22));transition:transform .08s linear}'
    + '.vc-orb::after{inset:-22px;border-color:rgba(122,60,255,.14);transform:scale(calc(1 + var(--l)*.4))}'
    + '.vc[data-s="connecting"] .vc-orb::before{animation:vcP 1.4s ease-in-out infinite}'
    + '@keyframes vcP{50%{transform:scale(1.12);opacity:.5}}'
    + '.vc-st{font:800 18px var(--font-body,sans-serif);color:var(--ink,#1c1030);margin:0 0 4px}'
    + '.vc-sub{font-size:14px;line-height:1.45;color:var(--muted,#6b6280);margin:0 auto 18px;max-width:280px}'
    + '.vc-tm{font:700 13px var(--font-body,sans-serif);color:var(--muted,#6b6280);margin:-10px 0 16px;letter-spacing:.04em}'
    + '.vc-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}'
    + '.vc-btns button,.vc-btns a{border:0;border-radius:999px;font:800 15px var(--font-body,sans-serif);padding:13px 22px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}'
    + '.vc-go{background:var(--grad,#6a2bff);color:#fff;box-shadow:0 12px 28px rgba(64,0,243,.32)}'
    + '.vc-go[disabled]{opacity:.6;cursor:default}'
    + '.vc-mu{background:#fff;color:var(--ink,#1c1030);border:1px solid var(--line,#e7e1f3)!important}'
    + '.vc-mu[aria-pressed="true"]{background:#fff3e8;color:#b45309}'
    + '.vc-end{background:#e5484d;color:#fff}'
    + '.vc-alt{background:#fff;color:var(--accent,#5b17f0);border:1px solid #ddd3f5!important}'
    + '.vc-note{font-size:11.5px;color:var(--muted,#6b6280);text-align:center;padding:10px 14px 12px;background:#fff;border-top:1px solid var(--line,#e7e1f3)}'
    + '.vc-note a{color:inherit}'
    + '.cb-talk{border:0;background:rgba(255,255,255,.14);color:#fff;height:34px;border-radius:999px;padding:0 12px 0 10px;font:800 13px var(--font-body,sans-serif);display:inline-flex;align-items:center;gap:6px;cursor:pointer;margin-left:auto}'
    + '.cb-talk svg{width:16px;height:16px}.cb-talk+.cb-x{margin-left:8px}'
    + '@media(max-width:720px){html body>.vc-fab{right:12px;bottom:78px;width:50px;height:50px}.vc-fab b{display:none}'
    + 'html body>.vc{right:0;bottom:0;width:100vw;max-width:100vw;border-radius:22px 22px 0 0}.vc-b{padding-bottom:26px}}';

  var MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3M8.5 21h7"/></svg>';
  var OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M9 9v2a3 3 0 005 2.2M15 9.3V6a3 3 0 00-5.7-1.3M5 11a7 7 0 0011.4 5.4M19 11a7 7 0 01-.6 2.8M12 18v3M8.5 21h7"/></svg>';

  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var fab = document.createElement('button');
  fab.type = 'button'; fab.className = 'vc-fab'; fab.setAttribute('aria-label', 'Talk to Amber by voice');
  fab.innerHTML = MIC + '<b>Talk to Amber</b>';
  var box = document.createElement('div');
  box.className = 'vc'; box.hidden = true; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Talk to Amber');
  box.innerHTML = '<div class="vc-h"><img src="/assets/favicon.svg?v=5" alt=""><div><b>Talk to Amber</b><small>Adviuz AI assistant · voice</small></div><button type="button" class="vc-x" aria-label="Close">&times;</button></div>'
    + '<div class="vc-b"><div class="vc-orb" aria-hidden="true">' + MIC + '</div><p class="vc-st" aria-live="polite"></p><p class="vc-tm" hidden></p><p class="vc-sub"></p><div class="vc-btns"></div></div>'
    + '<div class="vc-note">You\'re speaking with our AI assistant. This conversation may be recorded. Prefer a person? Call <a href="' + TEL + '">' + PHONE + '</a> (24/7).</div>';
  document.body.appendChild(fab); document.body.appendChild(box);
  var orb = box.querySelector('.vc-orb'), sT = box.querySelector('.vc-st'), sTm = box.querySelector('.vc-tm'), sSub = box.querySelector('.vc-sub'), btns = box.querySelector('.vc-btns');

  function track(n) { try { if (window.fbq) fbq('trackCustom', n); if (window.gtag) gtag('event', n); } catch (_) {} }
  function leadId() {
    if (window.ADV_LEAD) return String(window.ADV_LEAD);
    try { var q = new URLSearchParams(location.search).get('lead'); if (q) return q; } catch (_) {}
    return '';
  }
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
  function clock() {
    var s = Math.max(0, Math.floor((Date.now() - t0) / 1000));
    sTm.textContent = Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2);
  }
  function view(s, msg) {
    state = s; box.setAttribute('data-s', s);
    var b = '';
    if (s === 'idle') {
      sT.textContent = 'Have a quick chat with Amber';
      sSub.textContent = msg || 'Ask about the plans, how Digital Flyers work, or which plan fits your business. Tap Start and allow your microphone.';
      b = '<button type="button" class="vc-go">' + MIC + 'Start talking</button>';
    } else if (s === 'connecting') {
      sT.textContent = 'Connecting…';
      sSub.textContent = 'Allow the microphone if your browser asks.';
      b = '<button type="button" class="vc-end">End</button>';
    } else if (s === 'live') {
      sT.textContent = 'Amber is listening';
      sSub.textContent = 'Speak naturally. You can interrupt any time.';
      b = '<button type="button" class="vc-mu" aria-pressed="false">' + MIC + 'Mute</button><button type="button" class="vc-end">End call</button>';
    } else if (s === 'ended') {
      sT.textContent = 'Thanks for talking with us';
      sSub.textContent = msg || 'Ready to start? Pick a plan on this page, or book a free demo.';
      b = '<button type="button" class="vc-go">' + MIC + 'Talk again</button><a class="vc-alt" href="/book?solution=both" target="_blank" rel="noopener">Book a free demo</a>';
    } else if (s === 'error') {
      sT.textContent = 'We couldn\'t connect';
      sSub.innerHTML = msg || ('Please try again, or call us on <a href="' + TEL + '">' + PHONE + '</a>, 24/7.');
      b = '<button type="button" class="vc-go">Try again</button><a class="vc-alt" href="' + TEL + '">Call us</a>';
    }
    btns.innerHTML = b;
    sTm.hidden = s !== 'live';
  }
  function setLevel(v) {
    lvl = lvl * 0.7 + v * 0.3;
    if (!lvlRaf) lvlRaf = requestAnimationFrame(function () { lvlRaf = 0; orb.style.setProperty('--l', Math.min(1, lvl * 6).toFixed(3)); });
  }
  function stopTimers() { clearInterval(tick); tick = 0; orb.style.setProperty('--l', 0); lvl = 0; }

  function start() {
    if (call || state === 'connecting') return;
    muted = false; view('connecting'); track('VoiceStart');
    loadSDK().then(function () {
      var client = new window.AdvRetell.RetellClient({
        key: 'website',
        fetch: function (url, init) {
          var h = { 'Content-Type': 'application/json' };
          try { var v = init && init.headers && init.headers['X-Retell-Client-JS-SDK-Version']; if (v) h['x-retell-client-js-sdk-version'] = v; } catch (_) {}
          return fetch(FN, { method: 'POST', headers: h, body: JSON.stringify({ action: 'start', lead: leadId(), page: location.pathname }) });
        }
      });
      var me = client.createWebCall({
        agent_id: 'amber', /* replaced on the server */
        audio: RM ? undefined : { emitRawAudioSamples: true },
        hooks: {
          onStatus: function (s) {
            if (call !== me) return;
            if (s === 'live') { view('live'); t0 = Date.now(); clock(); tick = setInterval(function () { clock(); if (state === 'live' && !muted) sT.textContent = me.isAgentTalking ? 'Amber is speaking' : 'Amber is listening'; }, 400); track('VoiceLive'); }
          },
          onAudio: function (a) {
            if (call !== me || !a || !a.length) return;
            var sum = 0; for (var i = 0; i < a.length; i += 8) sum += a[i] * a[i];
            setLevel(Math.sqrt(sum / (a.length / 8)));
          },
          onEnd: function () { if (call !== me) return; call = null; stopTimers(); if (state !== 'error') view('ended'); },
          onError: function (e) {
            if (call !== me) return;
            var m = String((e && (e.message || e.name)) || '');
            var st0 = e && e.status;
            call = null; stopTimers();
            try { me.end(); } catch (_) {}
            if (/NotAllowed|Permission|denied/i.test(m)) view('error', 'Your browser blocked the microphone. Allow it in the address bar and try again, or call <a href="' + TEL + '">' + PHONE + '</a>.');
            else if (st0 === 429) view('error', 'Voice is busy right now. Please call us on <a href="' + TEL + '">' + PHONE + '</a>, 24/7.');
            else view('error');
            track('VoiceError');
          }
        }
      });
      call = me;
    }).catch(function () { call = null; view('error'); });
  }
  function end() {
    var c = call; call = null; stopTimers();
    if (c) { try { c.end(); } catch (_) {} view('ended'); track('VoiceEnd'); }
    else view('idle');
  }
  function openV() {
    if (!box.hidden) return;
    var cb = document.getElementById('cb'); if (cb && !cb.hidden) { var x = document.getElementById('cbX'); if (x) x.click(); }
    box.hidden = false; document.body.classList.add('vc-open');
    if (state !== 'live' && state !== 'connecting') view('idle');
    loadSDK().catch(function () {});
    track('VoiceOpen');
  }
  function closeV() {
    if (call) end();
    box.hidden = true; document.body.classList.remove('vc-open');
  }

  fab.addEventListener('click', openV);
  box.querySelector('.vc-x').addEventListener('click', closeV);
  btns.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('vc-go')) start();
    else if (b.classList.contains('vc-end')) end();
    else if (b.classList.contains('vc-mu') && call) {
      muted = !muted; try { muted ? call.mute() : call.unmute(); } catch (_) {}
      b.setAttribute('aria-pressed', muted ? 'true' : 'false');
      b.innerHTML = (muted ? OFF + 'Unmute' : MIC + 'Mute');
      sT.textContent = muted ? 'You\'re muted' : 'Amber is listening';
    }
  });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-voice]')) { e.preventDefault(); openV(); } });
  window.addEventListener('pagehide', function () { if (call) try { call.end(); } catch (_) {} });

  /* "Talk" button in the chat header */
  var cbh = document.querySelector('.cb-h'), cbx = document.getElementById('cbX');
  if (cbh && cbx) {
    var tb = document.createElement('button');
    tb.type = 'button'; tb.className = 'cb-talk'; tb.setAttribute('data-voice', ''); tb.innerHTML = MIC + 'Talk';
    tb.setAttribute('aria-label', 'Talk to Amber by voice');
    cbh.insertBefore(tb, cbx);
  }
  view('idle');
})();
