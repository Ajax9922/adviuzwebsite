/* Adviuz – "Ask AI about us": Gemini can't take a pre-filled question in its link,
   so clicking it copies the same question (from the ChatGPT link) and shows a short tip. */
(function () {
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-askai-copy]');
    if (!a) return;
    var src = document.querySelector('.ai-chips a[href^="https://chatgpt.com/?q="]');
    if (!src) return;
    var q = decodeURIComponent(src.getAttribute('href').split('?q=')[1] || '');
    try { navigator.clipboard && navigator.clipboard.writeText(q); } catch (err) {}
    var t = document.createElement('div');
    t.textContent = 'Question copied — paste it into Gemini';
    t.setAttribute('role', 'status');
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#17112b;color:#fff;padding:12px 18px;border-radius:999px;font:600 14px/1.2 Inter,system-ui,sans-serif;z-index:999;box-shadow:0 10px 30px rgba(0,0,0,.25)';
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3500);
  });
})();
