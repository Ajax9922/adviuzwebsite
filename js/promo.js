/* Black Friday promo: hides the top bar and booking-page box after 30 Nov 2026 (end of day, Saskatchewan time). */
(function(){if(Date.now()<Date.UTC(2026,11,1,6,0,0))return;
document.querySelectorAll('[data-promo]').forEach(function(e){e.remove()});})();
