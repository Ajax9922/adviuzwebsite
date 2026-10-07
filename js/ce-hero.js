/* AI Conversion Engine hero animation, step by step:
   1 New lead -> 2 AI follow-up (text, then AI call) -> 3 Booked -> 4 Reminders -> 5 Deal closed.
   Pauses when off-screen or the tab is hidden. Moves under the points on phones. */
(function () {
  var stage = document.getElementById('ceHv');
  if (!stage) return;
  var scenes = stage.querySelectorAll('.ce-hs');
  // scene index -> step number shown in the caption and progress bar
  var STEP = [1, 2, 2, 3, 4, 5];
  var titles = ['Step 1 · New lead', 'Step 2 · AI texts the lead', 'Step 2 · AI calls the lead', 'Step 3 · Booked', 'Step 4 · Reminders sent', 'Step 5 · Deal closed'];
  var waits = [2600, 4200, 4400, 3200, 2800, 4000];
  var nEl = document.getElementById('ceHvN'), tEl = document.getElementById('ceHvT'), dotsEl = document.getElementById('ceHvDots');
  var bars = stage.querySelectorAll('.hv-steps i');
  var dots = [], i = 0, timer = null, visible = false;
  for (var k = 0; k < 5; k++) { var d = document.createElement('i'); dotsEl.appendChild(d); dots.push(d); }

  function paint() {
    var st = STEP[i];
    nEl.textContent = st; tEl.textContent = titles[i];
    for (var j = 0; j < 5; j++) {
      dots[j].classList.toggle('on', j === st - 1);
      if (bars[j]) bars[j].classList.toggle('on', j < st);
    }
  }
  function show(n) {
    scenes[i].classList.remove('on'); stage.classList.remove('s' + (i + 1));
    i = n;
    scenes[i].classList.add('on'); stage.classList.add('s' + (i + 1));
    paint();
  }
  function tick() { timer = setTimeout(function () { show(i + 1 < scenes.length ? i + 1 : 0); tick(); }, waits[i]); }
  function run() { if (!timer && visible && !document.hidden) tick(); }
  function stop() { clearTimeout(timer); timer = null; }
  stage.classList.add('s1'); paint();

  var mq = matchMedia('(max-width:720px)'), slot = document.getElementById('ceHvSlot'), home = document.getElementById('ceHvHome');
  var wrap = document.getElementById('ceHvWrap') || stage;
  function place() { (mq.matches ? slot : home).appendChild(wrap); }
  place();
  mq.addEventListener ? mq.addEventListener('change', place) : mq.addListener(place);

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { show(3); return; }
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? run() : stop(); }, { threshold: 0.25 }).observe(stage);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : run(); });
})();


/* Hero rotating line: "Automatically handles ___" and highlights the matching list item. */
(function () {
  var rot = document.getElementById('obRot'), li = document.querySelectorAll('#obList li');
  if (!rot || !li.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { li.forEach(function (x) { x.classList.add('done'); }); return; }
  var words = ['calls & texts', 'notes & dates', 'sales stages', 'follow-up calls', 'bookings', 'reminders', 'after-visit care'];
  var i = 0, timer = null, visible = true;
  function step() {
    rot.classList.add('out');
    var k = i;
    setTimeout(function () { rot.textContent = words[k]; rot.classList.remove('out'); }, 200);
    li.forEach(function (x, n) { x.classList.toggle('on', n === k); x.classList.toggle('done', n < k); });
    i = (i + 1) % words.length;
  }
  function run() { if (!timer && visible && !document.hidden) { step(); timer = setInterval(step, 1800); } }
  function stop() { clearInterval(timer); timer = null; }
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; visible ? run() : stop(); }).observe(rot);
  document.addEventListener('visibilitychange', function () { document.hidden ? stop() : run(); });
})();
