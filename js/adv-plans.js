/* adv-plans.js (2026-11-10, Ajax: "I like the html ... Yes go ahead")
   One shared plan table for adviuz.com/start, Amber's on-screen plans and hub proposals (same file in both repos:
   adviuzwebsite/js/adv-plans.js and adviuz/assets/adv-plans.js — keep them identical).
   Wide containers: comparison table, 3 plans at a time (arrows + dots), payment button under each price,
   price-drop animation, ⓘ help on each row, "See all features" opens the full list (ticks follow the slider).
   Narrow containers (< 720px wide): one card per plan, each with its own "See all features".
   Usage: AdvPlans.render(el, { seg:'b2c'|'b2b', plans:[{key,name,price,std,rec}], onChoose:function(key,btn){},
            contactUrl:'https://adviuz.com/book?solution=both', note:'Prices in CAD + tax · Prepaid · $0 monthly' })
          AdvPlans.cards(el, sameOptions, onlyKey?)  -> just the phone cards (Amber's on-screen plans). */
(function () {
  'use strict';
  if (window.AdvPlans) return;
  var $m = function (n) { return '$' + Number(n).toLocaleString('en-CA'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  /* consumer numbers per plan: views, AI minutes, texts/emails/calls each, editing months, typical use, validity months */
  var BASE = { 'bf-pilot': [200, 100, 500, 1, '1 week', 3], 'bf-growth': [1000, 500, 2500, 3, '1 month', 6], 'bf-scale': [3000, 1500, 7500, 4, '3 months', 9], 'bf-pro': [6000, 3000, 15000, 5, '6 months', 12] };
  var BIG = [['Ultra', 12000, 6000, 30000, '12 months', '1 year', '18 months'], ['Enterprise', 24000, 12000, 60000, 'Custom', 'Custom', 'Custom'], ['Enterprise+', 48000, 24000, 120000, 'Custom', 'Custom', 'Custom']];
  var rate = function (m) { return m <= 100 ? 2 : m <= 200 ? 1.75 : m <= 500 ? 1.5 : m <= 1250 ? 1.25 : m <= 2000 ? 1 : m <= 5000 ? .9 : .8; };
  var K = function (x) { return x >= 1e6 ? (x / 1e6) + 'M' : (x / 1e3) + 'K'; }, F = function (x) { return Number(x).toLocaleString('en-CA'); };

  function build(o) {
    var b2b = o.seg === 'b2b', dv = b2b ? 2 : 1;
    var P = (o.plans || []).filter(function (x) { return BASE[x.key]; }).map(function (x) {
      var q = BASE[x.key], v = q[0] / dv, ai = q[1] / dv, ms = q[2] / dv, pil = x.key === 'bf-pilot';
      var aiv = pil ? Math.round(ai * rate(ai)) : Math.max(0, Number(x.std || 0) - v * (b2b ? 10 : 5) - 600);
      var was = v * (b2b ? 10 : 5) + aiv + 600 + q[3] * 99, pr = Number(x.price) || 0;
      var n = pil ? 'Pilot' : String(x.name || '').replace(/ Plan$/, '');
      return { key: x.key, n: n, tag: pil ? 'lim' : (x.rec ? 'rec' : ''), was: was, pr: pr, dist: K(q[0] * 50) + '–' + K(q[0] * 100), v: F(v), ed: q[3] + ' month' + (q[3] > 1 ? 's' : ''),
        ai: F(ai), msg: F(ms), use: q[4], val: q[5] + ' months', btn: pil ? 'Start the Pilot' : 'Choose ' + n };
    });
    if (o.big !== false) BIG.forEach(function (g) { P.push({ n: g[0], cons: 1, dist: K(g[1] * 50) + '–' + K(g[1] * 100), v: F(g[1] / dv), ed: g[4], ai: F(g[2] / dv), msg: F(g[3] / dv), use: g[5], val: g[6], btn: 'Contact us' }); });
    return P;
  }

  var I = { users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c.8-3.4 3.4-5 6.5-5s5.7 1.6 6.5 5"/>', eye: '<circle cx="12" cy="12" r="3"/><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/>', pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>', loop: '<path d="M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5"/>', bot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M9 14h.01M15 14h.01"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', msg: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.4A8 8 0 1121 12z"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>', cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>' };
  var ROWS = [['users', 'Estimated distribution*', function (p) { return p.dist; }], ['eye', 'Flyer views (25 seconds)', function (p) { return p.v; }], ['pen', 'First flyer design', function () { return 'Included'; }, 1], ['loop', 'Unlimited design editing', function (p) { return p.ed; }], ['bot', 'AI Conversion Engine', function () { return 'Full access'; }, 1], ['clock', 'AI minutes', function (p) { return p.ai; }], ['msg', 'Texts, emails & calls (each)', function (p) { return p.msg; }], ['gear', 'Setup ($600 value)', function () { return 'Included'; }, 1], ['cal', 'Typically used over', function (p) { return p.use; }], ['shield', 'Recharge validity', function (p) { return p.val; }]];
  var FI = { pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>', layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>', grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    eye: '<circle cx="12" cy="12" r="3"/><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/>', phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>', link: '<path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1"/><path d="M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1"/>', print: '<path d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="7"/>',
    msg: '<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.4A8 8 0 1121 12z"/>', chat: '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><path d="M8 9h8M8 13h5"/>', out: '<path d="M15 3h6v6M21 3l-8 8"/><path d="M19 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5"/>',
    inb: '<path d="M9 21H3v-6M3 21l8-8"/><path d="M5 10V5a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2h-5"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', list: '<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
    swap: '<path d="M7 4L3 8l4 4"/><path d="M3 8h13a4 4 0 010 8h-2"/><path d="M17 20l4-4-4-4"/>', power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 11-12.8 0"/>', flow: '<rect x="3" y="3" width="6" height="6" rx="1.5"/><rect x="15" y="15" width="6" height="6" rx="1.5"/><path d="M6 9v3a3 3 0 003 3h6"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>', bell: '<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/>', undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-15-6.7L3 13"/>', hand: '<path d="M7 11V7a2 2 0 014 0v4M11 10V5a2 2 0 014 0v6M15 10V7a2 2 0 014 0v7a7 7 0 01-7 7h-1a7 7 0 01-6-3.4l-2.6-4.4a2 2 0 013.4-2L7 13"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v4"/>', doc: '<path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>', stage: '<path d="M3 20h18M6 16V9M12 16V5M18 16v-4"/>', head: '<path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1v-6h3zM3 19a2 2 0 002 2h1v-6H3z"/>',
    dash: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>', pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>', tasks: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h9"/>' };
  /* ['@', 'Stage'] = a stage heading; 3rd value = first plan index that has it (2 = Scale and up); 4th = text instead of a tick */
  var FEAT = [
    ['Digital Flyers', [['pen', 'Flyer designed by our team, with your approval'], ['layers', '15+ creative variations for all platforms, from one design'], ['grid', 'Live on 15+ platforms in one tap'], ['eye', 'Pay only for flyers viewed for 25 seconds'], ['phone', 'Calls before 25 seconds are free leads'],
      ['shield', '100% distribution guarantee, any shortfall topped up'], ['target', 'Audience targeting: area, postal codes, age, gender'], ['repeat', 'Remarketing: your flyer is shown again to people who showed interest'], ['trend', 'Campaign optimization: we keep improving your campaign while it runs'],
      ['link', 'Smart lead tracking: the ad platforms learn who becomes your customer, so they find more people like them'], ['print', '$0 printing cost']]],
    ['AI Conversion Engine', [
      ['@', 'Fresh leads, until they book'], ['msg', 'Instant text reply to every new lead'], ['chat', 'AI + human two-way texting and email'], ['out', 'Outbound AI call within 60 seconds of an enquiry'], ['inb', 'Inbound AI calls: answers your calls and missed calls'], ['mail', 'Welcome and follow-up emails in your brand\'s voice'], ['clock', 'Follow-ups by call, text and email for up to 6 months'],
      ['@', 'Booking'], ['cal', 'Books appointments into your calendar automatically'], ['msg', 'Booking confirmation by text and email'], ['bell', '3 reminders by text and email: 24 hours before, morning of, 1 hour before'],
      ['@', 'No-show'], ['undo', 'No-show rescue: the AI calls, texts and emails to rebook missed visits'],
      ['@', 'After the meeting'], ['hand', 'Deal closing assistance: follow-ups by call, text and email after the meeting until they decide'],
      ['@', 'Reactivating old leads'], ['repeat', 'Old leads in your account are followed up again by call, text and email'], ['doc', 'Upload your own lead Excel sheet, or connect other sources of leads', 0, '<a href="https://adviuz.com/ai-conversion-engine.html" target="_blank" rel="noopener">AI Conversion Engine &rsaquo;</a>'],
      ['@', 'You stay in control'], ['tasks', 'Track every task your AI does, on each lead\'s timeline'], ['swap', 'Switch any lead between AI and a person in one tap'], ['power', 'Turn the AI on when you are busy, or keep it on all the time'], ['flow', 'Customized sales flow built by our team', 2], ['clock', 'Contacts leads only within allowed hours, in their time zone'], ['shield', 'Opt-outs honoured instantly; replies pause automation']]],
    ['Booking system', [['cal', 'Your own dedicated AI booking system, with its own calendar'], ['out', 'Each lead gets a personal link to book, reschedule or cancel'], ['bell', 'Confirmations and reminders by text and email, sent for you']]],
    ['Emailing system', [['mail', 'Your own AI emailing system'], ['doc', 'Emails go out from your business name, in your brand\'s voice'], ['chat', 'The AI reads replies and answers them automatically, or waits for your approval'], ['pen', 'Draft polished HTML email templates with AI'], ['list', 'Reusable email templates for every stage']]],
    ['Telephony', [['phone', 'Call leads directly from your computer or the mobile app'], ['out', 'Ask the AI to call a lead on your behalf'], ['mic', 'Natural, human-like AI voices with hand-tuned call agents'], ['tasks', 'AI call agent training included']]],
    ['Records and reports', [['mic', 'Calls recorded with the caller\'s consent, and transcribed'], ['doc', 'A short summary saved to each lead'], ['stage', 'Sales stages updated after calls'], ['head', 'Listen live, join or take over any AI call'], ['dash', 'Live dashboard on phone and computer'], ['pause', 'Pause anytime']]]];
  var T = { 'Estimated distribution': 'How many people your flyer is likely to reach on their screens (this is distribution, not views). It is usually 50 to 100 times your flyer views, and can be higher or lower depending on your audience, offer and market. An estimate, not a guarantee.', 'Flyer views': 'A view counts only when someone keeps your flyer open for 25 seconds. You pay only for these views.', 'First flyer design': 'One design slot: our team designs your flyer plus its matching ad creatives for Facebook, Instagram, Google and YouTube, from your logo, photos and offer. Nothing goes live until you approve it.', 'Unlimited design editing': 'Ask for as many changes as you like to your design slot (your flyer and its matching ad creatives) during this time. This covers editing that one design, not creating new separate designs.', 'AI Conversion Engine': 'Our AI calls, texts and emails every new enquiry within seconds, books appointments and keeps following up.', 'AI minutes': 'Minutes the AI spends talking with your leads on calls.', 'Texts, emails': 'Texts, emails and regular call minutes to your leads for follow-ups, reminders and remarketing.', 'Setup': 'Our team sets up your flyer account and your AI ($300 each). Included free.', 'Typically used over': 'How long most businesses take to use these views. You can go faster or slower.', 'Recharge validity': 'How long you have to use your views and credits, from the day you pay.' };
  var TL = function (l) { for (var k in T) if (l.indexOf(k) === 0) { var i = l.lastIndexOf(' '); return esc(l.slice(0, i + 1)) + '<span class="ap-nw">' + esc(l.slice(i + 1)) + '<button type="button" class="ap-tip" data-tip="' + esc(T[k]) + '" aria-label="What does this mean?">i</button></span>'; } return esc(l); };
  var icon = function (set, k, cls) { return '<i class="ap-ic' + (cls || '') + '"><svg viewBox="0 0 24 24">' + set[k] + '</svg></i>'; };
  var CK = '<span class="ap-ck">&#10003;</span>', DASH = '<span class="ap-no">&mdash;</span>';
  var CHEV = '<span class="ap-chev"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></span>';
  var TAG = function (t) { return t ? '<span class="ap-tag ap-' + t + '">' + (t === 'rec' ? 'RECOMMENDED' : 'LIMITED PERIOD') + '</span>' : ''; };

  var CSS = '.ap{--ap-ink:#1b1030;--ap-sub:#6b6585;--ap-line:#ece6f8;--ap-brand:#4000f3;--ap-grad:linear-gradient(135deg,#4000f3,#e65afc);--ap-green:#15803d;color:var(--ap-ink);text-align:left}'
    + '.ap *{box-sizing:border-box}.ap-d{display:block}.ap-m{display:none}.ap.ap-narrow .ap-d{display:none}.ap.ap-narrow .ap-m{display:block}'
    + '.ap-box{background:linear-gradient(160deg,#faf8ff 0%,#fff 45%,#f7efff 100%);border:1px solid var(--ap-line);border-radius:28px;padding:26px 16px 20px;box-shadow:0 24px 60px -30px rgba(64,0,243,.25)}'
    + '.ap-win{position:relative;padding:0 52px}.ap table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed;margin:0}'
    + '.ap th,.ap td{text-align:center;padding:12px 10px;font-size:15px;font-weight:400;color:var(--ap-ink);border-bottom:1px solid var(--ap-line);background:none}'
    + '.ap th{border-bottom:0;vertical-align:bottom;padding:8px 14px 18px}.ap td.ap-l,.ap th.ap-l{width:33%;text-align:left;color:var(--ap-sub);font-weight:500}'
    + '.ap-lw{display:flex;align-items:center;gap:10px}.ap-ic{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:9px;background:#f1ecff;color:var(--ap-brand);flex-shrink:0;font-style:normal}'
    + '.ap-ic svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.ap-fi{width:26px;height:26px;border-radius:8px}.ap-fi svg{width:14px;height:14px}'
    + '.ap .ap-y{color:var(--ap-green);font-weight:500}.ap-tag{display:inline-block;font-size:10.5px;font-weight:600;letter-spacing:.08em;border-radius:999px;padding:4px 10px;margin-bottom:10px;white-space:nowrap}'
    + '.ap-rec{background:var(--ap-grad);color:#fff}.ap-lim{background:#ffe8f0;color:#b4235a}.ap-tno{visibility:hidden}'
    + '.ap-pn{font-size:18px;font-weight:600;margin-bottom:6px}.ap-was{font-size:13px;color:#9a8fb8;text-decoration:line-through;opacity:0;transition:opacity .45s}.ap-was.on{opacity:1}'
    + '.ap-pr{font-size:34px;font-weight:700;letter-spacing:-.02em;line-height:1.1}.ap-pr.cut{text-decoration:line-through;text-decoration-thickness:2px;opacity:.5}.ap-pr.ap-cons{font-size:24px;font-weight:600}'
    + '.ap-tax{font-size:12px;color:var(--ap-sub);margin-top:2px}.ap-save{display:inline-block;margin:10px 0 12px;font-size:12.5px;font-weight:600;color:var(--ap-green);background:#e9f9ef;border-radius:999px;padding:4px 10px;opacity:0;transform:scale(.92);transition:.4s}.ap-save.on{opacity:1;transform:none}.ap-save.ph{visibility:hidden}'
    + '.ap-btn{display:block;width:100%;max-width:190px;margin:0 auto;text-align:center;text-decoration:none;font-weight:600;font-size:14.5px;padding:11px 14px;border-radius:999px;border:1.5px solid #ddd0fa;color:#4b0fe0;background:#fff;cursor:pointer;transition:transform .15s,box-shadow .15s;font-family:inherit}'
    + '.ap-btn:hover{transform:translateY(-1px);box-shadow:0 10px 24px -14px rgba(64,0,243,.6)}.ap-btn[disabled]{opacity:.6}'
    + '.ap .ap-mid{background:#fff;box-shadow:-1px 0 0 #e2d6fb,1px 0 0 #e2d6fb}.ap .ap-mid .ap-btn{background:var(--ap-grad);border-color:transparent;color:#fff}'
    + '.ap th.ap-mid{border-radius:20px 20px 0 0;box-shadow:0 -1px 0 #e2d6fb,-1px 0 0 #e2d6fb,1px 0 0 #e2d6fb}.ap th.ap-mid .ap-pr:not(.ap-cons){background:var(--ap-grad);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '.ap tr.ap-last td.ap-mid{border-radius:0 0 20px 20px;box-shadow:0 1px 0 #e2d6fb,-1px 0 0 #e2d6fb,1px 0 0 #e2d6fb}'
    + '.ap-arw{position:absolute;top:70px;width:42px;height:42px;border-radius:50%;border:1px solid #ddd0fa;background:#fff;color:var(--ap-brand);font-size:20px;line-height:1;cursor:pointer;box-shadow:0 8px 20px -10px rgba(64,0,243,.4);padding:0}'
    + '.ap-prev{left:0}.ap-next{right:0}.ap-arw:disabled{opacity:.35;cursor:default;box-shadow:none}'
    + '.ap-dots{display:flex;justify-content:center;gap:7px;margin-top:14px}.ap-dots i{width:8px;height:8px;border-radius:50%;background:#ddd3f5}.ap-dots i.on{width:22px;border-radius:5px;background:var(--ap-grad)}'
    + '.ap-more{display:flex;align-items:center;gap:8px;margin:20px auto 0;border:0;background:none;color:var(--ap-brand);font:600 14.5px/1.2 inherit;font-family:inherit;cursor:pointer;padding:8px 14px;border-radius:999px}'
    + '.ap-more:hover{background:#f1ecff}.ap-chev{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#f1ecff;transition:transform .3s}.ap-more[aria-expanded=true] .ap-chev{transform:rotate(180deg)}'
    + '.ap-feat{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s ease}.ap-feat.open{grid-template-rows:1fr}.ap-feat>div{overflow:hidden}'
    + '.ap-fgs{padding:0 52px}.ap-fg{margin-top:18px}.ap-fg h4{margin:0;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ap-brand);padding:14px 10px 6px;border-bottom:1px solid var(--ap-line)}'
    + '.ap-fg td{font-size:14px;padding:10px}.ap-fg td.ap-l{font-weight:400;color:var(--ap-ink)}.ap tr.ap-stg td{font-size:13px;font-weight:600;color:var(--ap-ink);background:#f7f3ff;padding:9px 10px}.ap tr.ap-stg td.ap-l{padding-left:12px}'
    + '.ap-ck{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#e9f9ef;color:var(--ap-green);font-size:12px;font-weight:700}.ap-no{color:#c4bcd8}'
    + '.ap-sep{font-size:12px;font-weight:500;color:#9a5b00;background:#fff4e0;border-radius:999px;padding:3px 9px;white-space:nowrap}.ap-sep a,.ap-sepm a{color:inherit;text-decoration:none}.ap-sep a:hover{text-decoration:underline}'
    + '.ap-fine{font-size:12px;color:var(--ap-sub);text-align:center;margin:16px 0 0;line-height:1.55}.ap-nw{white-space:nowrap}'
    + '.ap-tip{display:inline-grid;place-items:center;width:16px;height:16px;margin-left:6px;border-radius:50%;border:1.5px solid #b9a6ec;background:#fff;color:#6a2cff;font:700 10px/1 Georgia,serif;font-style:italic;cursor:pointer;vertical-align:1px;padding:0}'
    + '.ap-tipbox{position:absolute;z-index:2147483000;max-width:260px;background:#230835;color:#fff;font-size:13.5px;line-height:1.45;border-radius:14px;padding:12px 14px;box-shadow:0 16px 40px rgba(35,8,53,.35);font-family:inherit}'
    + '.ap-tipbox:after{content:"";position:absolute;left:var(--ax,20px);top:-6px;width:12px;height:12px;background:#230835;transform:rotate(45deg)}'
    + '.ap-c{background:#fff;border:1.5px solid var(--ap-line);border-radius:22px;padding:20px 18px;margin:0 0 18px}.ap-c.ap-hl{border:2.5px solid transparent;background:linear-gradient(#fff,#fff) padding-box,var(--ap-grad) border-box}'
    + '.ap-ch{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.ap-ch h3{margin:0;font-size:22px;font-weight:600;color:var(--ap-ink)}.ap-cp{text-align:right}.ap-cp .ap-pr{font-size:30px}'
    + '.ap-c .ap-btn{max-width:none;margin-top:4px}.ap-c.ap-hl .ap-btn{background:var(--ap-grad);color:#fff;border-color:transparent}'
    + '.ap-rows{list-style:none;margin:14px 0 4px;padding:0}.ap-rows li{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid var(--ap-line);font-size:14.5px}'
    + '.ap-rows li span:first-child{color:var(--ap-sub)}.ap-rows li>span:last-child{font-weight:500;text-align:right}.ap-c .ap-more{margin:12px auto 0}'
    + '.ap-fl{list-style:none;padding:4px 0 0;margin:0}.ap-fl li{display:flex;align-items:center;gap:10px;font-size:14px;padding:8px 0;border-bottom:1px solid #f3effb}'
    + '.ap-fl li.off{color:#a49cbb}.ap-fl li.off .ap-fi{opacity:.45}.ap-fl em{font-style:normal;font-size:12px}.ap-sepm{color:#9a5b00}'
    + '.ap-fl li.ap-stgm{display:block;font-size:13px;font-weight:600;color:var(--ap-ink);background:#f7f3ff;border-radius:8px;padding:7px 10px;margin-top:8px;border:0}'
    + '.ap-fl b{display:block;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--ap-brand);padding:12px 0 4px;font-weight:600}'
    + '.ap.ap-narrow .ap-box{background:none;border:0;box-shadow:none;padding:0}';
  function style() { if (document.getElementById('apCss')) return; var s = document.createElement('style'); s.id = 'apCss'; s.textContent = CSS; document.head.appendChild(s); }

  /* tooltips: one bubble for the whole page */
  var tipBox = null;
  function tipClose() { if (tipBox) { tipBox.remove(); tipBox = null; } }
  function tipsOnce() {
    if (window.__apTips) return; window.__apTips = 1;
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('.ap-tip'); if (!t) { if (!(e.target.closest && e.target.closest('.ap-tipbox'))) tipClose(); return; }
      e.preventDefault(); e.stopPropagation(); var same = tipBox && tipBox._t === t; tipClose(); if (same) return;
      tipBox = document.createElement('div'); tipBox.className = 'ap-tipbox'; tipBox.textContent = t.getAttribute('data-tip'); tipBox._t = t; document.body.appendChild(tipBox);
      var r = t.getBoundingClientRect(), w = Math.min(260, innerWidth - 24), x = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 12));
      tipBox.style.width = w + 'px'; tipBox.style.left = (x + scrollX) + 'px'; tipBox.style.top = (r.bottom + scrollY + 10) + 'px'; tipBox.style.setProperty('--ax', (r.left + r.width / 2 - x - 6) + 'px');
    }, true);
    addEventListener('scroll', tipClose, { passive: true });
  }

  function btn(p, o) { return p.cons ? '<a class="ap-btn" href="' + esc(o.contactUrl || 'https://adviuz.com/book?solution=both') + '" target="_blank" rel="noopener">Contact us</a>' : '<button type="button" class="ap-btn" data-ap-k="' + esc(p.key) + '">' + esc(p.btn) + '</button>'; }
  function cardHTML(p, P, o) {
    var idx = P.indexOf(p);
    return '<div class="ap-c' + (p.tag === 'rec' ? ' ap-hl' : '') + '" data-ap-card="' + esc(p.key) + '"><div class="ap-ch"><div>' + TAG(p.tag) + '<h3>' + esc(p.n) + '</h3></div>'
      + '<div class="ap-cp"><div class="ap-was">' + $m(p.was) + '</div><div class="ap-pr ap-pa" data-from="' + p.was + '" data-to="' + p.pr + '">' + $m(p.was) + '</div><div class="ap-tax">CAD + tax</div></div></div>'
      + '<span class="ap-save">You save ' + $m(p.was - p.pr) + '</span>' + btn(p, o)
      + '<ul class="ap-rows">' + ROWS.map(function (r) { return '<li><span>' + TL(r[1]) + '</span><span' + (r[3] ? ' class="ap-y"' : '') + '>' + esc(r[2](p)) + '</span></li>'; }).join('') + '</ul>'
      + '<button class="ap-more" type="button" aria-expanded="false"><span>See all features</span> ' + CHEV + '</button>'
      + '<div class="ap-feat"><div><ul class="ap-fl">' + FEAT.map(function (g) {
        return '<b>' + esc(g[0]) + '</b>' + g[1].map(function (f) {
          if (f[0] === '@') return '<li class="ap-stgm">' + esc(f[1]) + '</li>';
          var on = idx >= (f[2] || 0);
          return '<li class="' + (on ? '' : 'off') + '">' + icon(FI, f[0], ' ap-fi') + '<span>' + esc(f[1]) + (f[3] ? ' <em class="ap-sepm">(' + f[3] + ')</em>' : on ? '' : ' <em>(Scale and up)</em>') + '</span></li>';
        }).join('');
      }).join('') + '</ul></div></div></div>';
  }

  function anim(root) {
    var els = [].slice.call(root.querySelectorAll('.ap-pa:not(.done)'));
    var done = function (e) { e.textContent = $m(e.getAttribute('data-to')); e.classList.remove('cut'); e.classList.add('done'); var b = e.closest('th') || e.closest('.ap-c'); if (b) [].forEach.call(b.querySelectorAll('.ap-was,.ap-save'), function (z) { z.classList.add('on'); }); };
    var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) {}
    if (reduce || document.body.classList.contains('pdfmode') || !('IntersectionObserver' in window)) { els.forEach(done); return; }
    var run = function (e) {
      if (e._ap) return; e._ap = 1; setTimeout(function () { e.classList.add('cut'); }, 300);
      setTimeout(function () {
        var a = +e.getAttribute('data-from'), b = +e.getAttribute('data-to'), t0 = null, bx = e.closest('th') || e.closest('.ap-c'), w = bx && bx.querySelector('.ap-was'); e.classList.remove('cut'); if (w) w.classList.add('on');
        (function st(ts) { if (!t0) t0 = ts; var k = Math.min(1, (ts - t0) / 900), q = 1 - Math.pow(1 - k, 3); e.textContent = $m(Math.round(a + (b - a) * q)); if (k < 1) requestAnimationFrame(st); else done(e); })(performance.now());
      }, 1100);
    };
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); run(x.target); } }); }, { threshold: 0.6 });
    els.forEach(function (e) { io.observe(e); });
    addEventListener('beforeprint', function () { els.forEach(done); });
  }

  function wire(root, o) {
    root._apO = o; if (root._apW) return; root._apW = 1;
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ap-k]'), o = root._apO || {};
      if (b && root.contains(b)) { e.preventDefault(); if (o.onChoose) o.onChoose(b.getAttribute('data-ap-k'), b); return; }
      var mo = e.target.closest('.ap-more'); if (!mo || !root.contains(mo)) return;
      var f = mo.nextElementSibling; var open = !f.classList.contains('open'); f.classList.toggle('open', open);
      mo.setAttribute('aria-expanded', open); mo.firstChild.textContent = open ? 'Hide features' : 'See all features';
    });
  }

  function render(root, o) {
    style(); tipsOnce(); o = o || {};
    var P = build(o), V = 3, pg = 0, PG = []; for (var q = 0; q < P.length; q += V) PG.push(Math.min(q, P.length - V));
    var head = function (p, i) {
      return '<th class="ap-p' + i + '">' + (p.tag ? TAG(p.tag) : '<span class="ap-tag ap-tno">-</span>') + '<div class="ap-pn">' + esc(p.n) + '</div>'
        + (p.cons ? '<div class="ap-was on" style="text-decoration:none">Custom pricing</div><div class="ap-pr ap-cons">Contact us</div><div class="ap-tax">For $50,000+ plans</div><span class="ap-save ph">-</span>'
          : '<div class="ap-was">' + $m(p.was) + '</div><div class="ap-pr ap-pa" data-from="' + p.was + '" data-to="' + p.pr + '">' + $m(p.was) + '</div><div class="ap-tax">CAD + tax, one-time</div><span class="ap-save">You save ' + $m(p.was - p.pr) + '</span>')
        + btn(p, o) + '</th>';
    };
    var tb = '<thead><tr><th class="ap-l"></th>' + P.map(head).join('') + '</tr></thead><tbody>';
    ROWS.forEach(function (r, ri) { tb += '<tr' + (ri === ROWS.length - 1 ? ' class="ap-last"' : '') + '><td class="ap-l"><span class="ap-lw">' + icon(I, r[0]) + '<span>' + TL(r[1]) + '</span></span></td>' + P.map(function (p, i) { return '<td class="ap-p' + i + (r[3] ? ' ap-y' : '') + '">' + esc(r[2](p)) + '</td>'; }).join('') + '</tr>'; });
    tb += '</tbody>';
    var fd = FEAT.map(function (g) {
      return '<div class="ap-fg"><h4>' + esc(g[0]) + '</h4><table>' + g[1].map(function (f) {
        if (f[0] === '@') return '<tr class="ap-stg"><td class="ap-l">' + esc(f[1]) + '</td>' + P.map(function (p, i) { return '<td class="ap-p' + i + '"></td>'; }).join('') + '</tr>';
        return '<tr><td class="ap-l"><span class="ap-lw">' + icon(FI, f[0], ' ap-fi') + '<span>' + esc(f[1]) + '</span></span></td>' + P.map(function (p, i) { return '<td class="ap-p' + i + '">' + (f[3] ? '<span class="ap-sep">' + f[3] + '</span>' : (i >= (f[2] || 0) ? CK : DASH)) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</table></div>';
    }).join('');
    var note = o.note || 'Prices in CAD + tax · Prepaid · $0 monthly';
    root.innerHTML = '<div class="ap"><div class="ap-box"><div class="ap-d"><div class="ap-win"><button class="ap-arw ap-prev" type="button" aria-label="Previous plans">&#8249;</button><table class="ap-t">' + tb + '</table><button class="ap-arw ap-next" type="button" aria-label="More plans">&#8250;</button></div>'
      + '<div class="ap-dots"></div><button class="ap-more" type="button" aria-expanded="false"><span>See all features</span> ' + CHEV + '</button>'
      + '<div class="ap-feat"><div class="ap-fgs"><p class="ap-fine" style="margin-top:14px">Every plan includes these features, except where marked. Plans differ in reach, flyer views and AI allowances.</p>' + fd + '</div></div>'
      + '<p class="ap-fine">' + esc(note) + '<br>*Estimated distribution is an estimate of how many people may see your flyer (typically 50–100× your flyer views). It depends on your audience, offer and market, and is not guaranteed.</p></div>'
      + '<div class="ap-m">' + P.filter(function (p) { return !p.cons; }).map(function (p) { return cardHTML(p, P, o); }).join('') + '<p class="ap-fine">' + esc(note) + '<br>*Estimated distribution is an estimate, not a guarantee.</p></div></div></div>';
    var ap = root.firstChild, d = ap.querySelector('.ap-d'), prev = d.querySelector('.ap-prev'), next = d.querySelector('.ap-next'), dots = d.querySelector('.ap-dots');
    function show() {
      var st = PG[pg];
      [].forEach.call(d.querySelectorAll('th,td'), function (c) { var mm = c.className.match(/\bap-p(\d)\b/); if (!mm) return; var i = +mm[1], on = i >= st && i < st + V; c.style.display = on ? '' : 'none'; c.classList.toggle('ap-mid', i === st + 1); });
      prev.disabled = pg === 0; next.disabled = pg === PG.length - 1; dots.innerHTML = PG.map(function (_, k) { return '<i class="' + (k === pg ? 'on' : '') + '"></i>'; }).join('');
    }
    prev.onclick = function () { if (pg > 0) { pg--; show(); } }; next.onclick = function () { if (pg < PG.length - 1) { pg++; show(); } };
    var fit = function () { ap.classList.toggle('ap-narrow', (root.clientWidth || innerWidth) < 720); };
    fit(); if ('ResizeObserver' in window) new ResizeObserver(fit).observe(root); else addEventListener('resize', fit);
    show(); wire(root, o); anim(ap);
    return ap;
  }
  /* phone cards only (Amber's on-screen plans). onlyKey: show just that plan's card. */
  function cards(root, o, onlyKey) {
    style(); tipsOnce(); o = o || {}; var P = build(Object.assign({}, o, { big: false }));
    var xs = onlyKey ? P.filter(function (p) { return p.key === onlyKey; }) : P;
    root.innerHTML = '<div class="ap ap-narrow ap-cards">' + xs.map(function (p) { return cardHTML(p, P, o); }).join('') + '</div>';
    wire(root, o); anim(root.firstChild); return root.firstChild;
  }
  window.AdvPlans = { render: render, cards: cards, features: FEAT };
})();
