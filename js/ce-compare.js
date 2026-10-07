/* Compare demo: switches to "With AI" once, a moment after it scrolls into view, unless the visitor already tapped. */
(function(){var d=document.getElementById('cxDemo');if(!d||!('IntersectionObserver' in window))return;
var ai=document.getElementById('cxAi'),touched=false;d.addEventListener('change',function(){touched=true;});
var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){io.disconnect();setTimeout(function(){if(!touched)ai.checked=true;},2200);}},{threshold:.5});io.observe(d);})();
