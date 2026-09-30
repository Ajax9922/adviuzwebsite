/* Adviuz booking widget: renders inline into #bkHost, or as a pop-up on pages without it. */
(function(){
var BK_TPL = "      <div id=\"bkStep1\">\n        <p class=\"bk-label\">PICK A DAY &amp; TIME</p>\n        <div class=\"bk-cal-wrap\">\n          <div>\n            <div class=\"cal-head\">\n              <b id=\"calMonth\"></b>\n              <div class=\"cal-nav\">\n                <button type=\"button\" id=\"calPrev\" aria-label=\"Previous month\">\u2039</button>\n                <button type=\"button\" id=\"calNext\" aria-label=\"Next month\">\u203a</button>\n              </div>\n            </div>\n            <div class=\"cal-grid\" id=\"calGrid\" role=\"grid\" aria-label=\"Choose a demo day\"></div>\n          </div>\n          <div class=\"bk-slot-col\">\n            <p class=\"bk-label\" id=\"bkDayLabel\">AVAILABLE TIMES</p>\n            <div class=\"bk-slots\" id=\"bkSlots\" style=\"margin-top:0\"></div>\n            <p class=\"tz-row\"><span class=\"tz-lbl\">Times shown in</span><select id=\"bkTz\" aria-label=\"Times shown in this timezone\"></select></p>\n            <p class=\"bk-today-note\" id=\"bkTodayNote\">Today's remaining times are shown \u2014 later days show the full schedule.</p>\n            <p class=\"bk-note\">Demos run about 30 minutes, on a video call or phone \u2014 your choice. Weekends are not bookable.</p>\n          </div>\n        </div>\n      </div>\n      <form id=\"bkForm\" novalidate>\n        <div class=\"bk-step\" id=\"bkStep3\">\n          <p class=\"bk-label\">YOUR DETAILS</p>\n          <p class=\"bk-picked\" id=\"bkPicked\"></p>\n          <div class=\"field-row\">\n            <div class=\"field\"><label for=\"bkBiz\">Business name</label><input id=\"bkBiz\" name=\"business\" type=\"text\" autocomplete=\"organization\"></div>\n            <div class=\"field\"><label for=\"bkName\">Your name</label><input id=\"bkName\" name=\"name\" type=\"text\" autocomplete=\"name\" required></div>\n          </div>\n          <div class=\"field-row\">\n            <div class=\"field\"><label for=\"bkPhone\">Phone</label><div class=\"phone-wrap\"><select id=\"bkCC\" autocomplete=\"tel-country-code\" aria-label=\"Country code\"></select><input id=\"bkPhone\" name=\"phone\" type=\"tel\" inputmode=\"tel\" autocomplete=\"tel-national\" required></div></div>\n            <div class=\"field\"><label for=\"bkEmail\">Email</label><input id=\"bkEmail\" name=\"email\" type=\"email\" autocomplete=\"email\"></div>\n          </div>\n          <div class=\"hp\" aria-hidden=\"true\"><label>Website<input name=\"website\" type=\"text\" tabindex=\"-1\" autocomplete=\"off\"></label></div>\n          <div class=\"consent-box\">\n          <label class=\"consent\"><input type=\"checkbox\" id=\"bkConsent\">\n            <span>I agree to receive calls \u2014 including automated and AI voice calls \u2014 texts and emails from Adviuz about my request and its services, in Canada or the United States. Consent is not a condition of purchase. Message &amp; data rates may apply; message frequency varies. Reply STOP to opt out, HELP for help.</span></label>\n          <p class=\"consent-fine\">Adviuz (Instad Web Services Ltd.) \u00b7 Scotiabank Building, 111 2nd Ave S Unit 400, Saskatoon SK \u00b7 <a href=\"/privacy.html\" target=\"_blank\" rel=\"noopener\">Privacy Policy</a> \u00b7 <a href=\"/terms.html\" target=\"_blank\" rel=\"noopener\">Terms of Service</a>. You can withdraw consent at any time.</p>\n          </div>\n          <button class=\"button button-grad bk-submit\" type=\"submit\">Book my demo</button>\n          <p class=\"bk-error\" id=\"bkError\"></p>\n        </div>\n      </form>\n      <div class=\"bk-confirm\" id=\"bkConfirm\">\n        <div class=\"big\">\u2713</div>\n        <h3>Demo requested!</h3>\n        <p style=\"color:var(--muted);font-size:15px\" id=\"bkConfirmText\">We'll confirm your time by text and email shortly.</p>\n      </div>";

/* ---- Shared form intelligence ---- */
var COUNTRIES=[['CA','Canada','1','🇨🇦'],['US','United States','1','🇺🇸'],
 ['GB','United Kingdom','44','🇬🇧'],['AU','Australia','61','🇦🇺'],
 ['IN','India','91','🇮🇳'],['MX','Mexico','52','🇲🇽'],
 ['DE','Germany','49','🇩🇪'],['FR','France','33','🇫🇷'],
 ['AE','UAE','971','🇦🇪'],['PH','Philippines','63','🇵🇭'],
 ['BR','Brazil','55','🇧🇷'],['CN','China','86','🇨🇳']];
var CA_TZ=['Regina','Swift_Current','Toronto','Vancouver','Edmonton','Winnipeg','Halifax','St_Johns','Moncton','Whitehorse','Yellowknife','Iqaluit','Montreal','Creston','Dawson','Glace_Bay','Goose_Bay'];
function detectISO(){
  try{
    var tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    if(tz.indexOf('America/')===0){
      var city=tz.split('/').pop();
      if(CA_TZ.indexOf(city)>=0)return 'CA';
      if(tz.indexOf('Mexico')>=0||city==='Cancun'||city==='Tijuana'||city==='Monterrey')return 'MX';
      return 'US';
    }
    if(tz.indexOf('Europe/London')===0)return 'GB';
    if(tz.indexOf('Australia/')===0)return 'AU';
    if(tz==='Asia/Kolkata'||tz==='Asia/Calcutta')return 'IN';
    if(tz.indexOf('Asia/Dubai')===0)return 'AE';
    if(tz.indexOf('Asia/Manila')===0)return 'PH';
    if(tz.indexOf('Asia/Shanghai')===0)return 'CN';
    if(tz.indexOf('Europe/Berlin')===0)return 'DE';
    if(tz.indexOf('Europe/Paris')===0)return 'FR';
  }catch(e){}
  return 'CA';
}
function buildCC(sel){
  if(!sel)return;
  COUNTRIES.forEach(function(c){
    var o=document.createElement('option');
    o.value=c[0];o.dataset.dial=c[2];
    o.textContent=c[3]+' +'+c[2];
    o.title=c[1];
    sel.appendChild(o);
  });
  sel.value=detectISO();
}
function fieldOf(el){var p=el.closest?el.closest('.field'):null;return p;}
function showErr(el,msg){
  clearErr(el);
  var f=fieldOf(el);if(!f)return;
  f.classList.add('err');
  var e=document.createElement('p');e.className='f-err';e.textContent=msg;
  f.appendChild(e);
}
function clearErr(el){
  var f=fieldOf(el);if(!f)return;
  f.classList.remove('err');
  var e=f.querySelector('.f-err');if(e)e.remove();
}
var FAKE_TOKENS=['test','testing','tester','tests','fake','asdf','asd','sdf','qwe','qwer','qwerty','zxc','zxcv','abc','abcd','abcde','xyz','aaa','bbb','na','n/a','none','nil','xxx','demo','sample','asdasd','dsa','lol','hi','hello','hey','me','you'];
function looksFake(s){
  var t=String(s||'').trim().toLowerCase();
  if(t.replace(/[^a-z]/g,'').length<2)return true;
  if(/(.)\1{3,}/.test(t))return true; // aaaa
  var words=t.split(/[^a-z0-9]+/).filter(Boolean);
  for(var i=0;i<words.length;i++){
    var w=words[i];
    if(FAKE_TOKENS.indexOf(w)>=0)return true;
    if(w.length>=4&&(/^[asdfghjkl]+$/.test(w)||/^[qwertyuiop]+$/.test(w)||/^[zxcvbnm]+$/.test(w)))return true; // keyboard mash
    if(w.length>=7&&!/[aeiouy]/.test(w))return true; // long vowelless mash
  }
  return false;
}

var DD_DOMAINS=['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com'];
function attachNameFilter(el){
  if(!el)return;
  el.addEventListener('input',function(){
    var v=el.value;
    var f=v.replace(/[0-9]/g,'');
    if(f!==v){var p=el.selectionStart-1;el.value=f;try{el.setSelectionRange(p,p);}catch(e){}}
  });
}
function attachPhoneFilter(input,ccSel){
  if(!input)return;
  function maxFor(){var o=ccSel&&ccSel.selectedOptions[0];return (o&&o.dataset.dial==='1')?10:14;}
  function fmt(){
    var d=input.value.replace(/\D/g,'').slice(0,maxFor());
    var o=ccSel&&ccSel.selectedOptions[0];
    if(o&&o.dataset.dial==='1'&&d.length>3){
      input.value=d.length>6?d.slice(0,3)+'-'+d.slice(3,6)+'-'+d.slice(6):d.slice(0,3)+'-'+d.slice(3);
    }else input.value=d;
  }
  input.addEventListener('input',fmt);
  if(ccSel)ccSel.addEventListener('change',fmt);
}
function attachEmailDropdown(input){
  if(!input)return;
  var f=fieldOf(input);if(!f)return;
  f.classList.add('has-dd');
  var dd=document.createElement('div');dd.className='mail-dd';dd.hidden=true;f.appendChild(dd);
  function hide(){dd.hidden=true;dd.innerHTML='';}
  function show(){
    var v=input.value.trim();
    var at=v.indexOf('@');
    if(at<1){hide();return;}
    var local=v.slice(0,at),part=v.slice(at+1).toLowerCase();
    if(part&&DD_DOMAINS.indexOf(part)>=0){hide();return;} // complete already
    var hits=DD_DOMAINS.filter(function(d){return d.indexOf(part)===0;});
    if(!hits.length){hide();return;}
    dd.innerHTML='';
    hits.forEach(function(d){
      var b=document.createElement('button');b.type='button';b.textContent=local+'@'+d;
      b.addEventListener('mousedown',function(e){e.preventDefault();input.value=local+'@'+d;hide();
        var s=f.querySelector('.f-sug');if(s)s.remove();clearErr(input);});
      dd.appendChild(b);
    });
    dd.hidden=false;
  }
  input.addEventListener('input',show);
  input.addEventListener('focus',show);
  input.addEventListener('blur',function(){setTimeout(hide,150);});
  input.addEventListener('keydown',function(e){if(e.key==='Escape')hide();});
}

function nameIssue(s){
  var t=String(s||'').trim();
  if(!t)return 'Please enter your name.';
  if(/\d/.test(t))return 'Please enter your name without numbers.';
  if(looksFake(t))return 'Please enter your real name.';
  return null;
}
function validPhone(iso,dial,raw){
  var d=String(raw||'').replace(/\D/g,'');
  if(dial==='1'){
    if(d.length===11&&d.charAt(0)==='1')d=d.slice(1);
    if(d.length!==10)return null;
    if(/^([2-9])\1{9}$/.test(d)||/^(\d)\1{9}$/.test(d))return null; // 5555555555
    if(d==='1234567890'||d==='0123456789')return null;
    if(!/[2-9]/.test(d.charAt(0))||!/[2-9]/.test(d.charAt(3)))return null; // NANP
    return '+1 '+d.slice(0,3)+'-'+d.slice(3,6)+'-'+d.slice(6);
  }
  if(d.length<6||d.length>14)return null;
  if(/^(\d)\1+$/.test(d))return null;
  return '+'+dial+' '+d;
}
var MAIL_DOMAINS=['gmail.com','yahoo.com','yahoo.ca','hotmail.com','outlook.com','icloud.com','live.com','aol.com','me.com','protonmail.com','shaw.ca','telus.net','sasktel.net','bell.net','rogers.com'];
function lev(a,b){
  var m=[],i,j;
  for(i=0;i<=a.length;i++)m[i]=[i];
  for(j=0;j<=b.length;j++)m[0][j]=j;
  for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)
    m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return m[a.length][b.length];
}
function emailCheck(v){
  v=String(v||'').trim();
  if(!v)return {ok:true};
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))return {ok:false};
  var dom=v.split('@')[1].toLowerCase();
  if(MAIL_DOMAINS.indexOf(dom)>=0)return {ok:true};
  var best=null,bd=3;
  MAIL_DOMAINS.forEach(function(d){var x=lev(dom,d);if(x<bd){bd=x;best=d;}});
  if(best&&bd<=2)return {ok:true,suggest:v.split('@')[0]+'@'+best};
  return {ok:true};
}
function attachEmailSuggest(input){
  if(!input)return;
  var deb;
  input.addEventListener('input',function(){
    clearTimeout(deb);
    var f=fieldOf(input);if(f){var o=f.querySelector('.f-sug');if(o)o.remove();}
    clearErr(input);
    deb=setTimeout(function(){
      var v=input.value.trim();
      if(!v||v.indexOf('@')<0)return;
      var r=emailCheck(v);
      if(r.ok&&r.suggest){
        var f2=fieldOf(input);if(!f2)return;
        var p=document.createElement('p');p.className='f-sug';
        p.appendChild(document.createTextNode('Did you mean '));
        var b=document.createElement('button');b.type='button';b.textContent=r.suggest;
        b.addEventListener('click',function(){input.value=r.suggest;p.remove();});
        p.appendChild(b);p.appendChild(document.createTextNode('?'));
        f2.appendChild(p);
      }
    },600);
  });
  input.addEventListener('blur',function(){
    clearErr(input);
    var f=fieldOf(input);if(!f)return;
    var old=f.querySelector('.f-sug');if(old)old.remove();
    var v=input.value.trim();if(!v)return;
    var r=emailCheck(v);
    if(!r.ok){showErr(input,'That email address doesn\\u2019t look right.');return;}
    if(r.suggest){
      var p=document.createElement('p');p.className='f-sug';
      p.appendChild(document.createTextNode('Did you mean '));
      var b=document.createElement('button');b.type='button';b.textContent=r.suggest;
      b.addEventListener('click',function(){input.value=r.suggest;p.remove();});
      p.appendChild(b);p.appendChild(document.createTextNode('?'));
      f.appendChild(p);
    }
  });
}

function runWizard(){
(function(){
  const grid=document.getElementById('calGrid');
  if(!grid)return;
  const monthEl=document.getElementById('calMonth'),prevB=document.getElementById('calPrev'),nextB=document.getElementById('calNext'),
        slotsEl=document.getElementById('bkSlots'),dayLabel=document.getElementById('bkDayLabel'),tzSelEl=document.getElementById('bkTz'),
        step3=document.getElementById('bkStep3'),
        picked=document.getElementById('bkPicked'),form=document.getElementById('bkForm'),
        err=document.getElementById('bkError'),confirmEl=document.getElementById('bkConfirm'),
        todayNote=document.getElementById('bkTodayNote');
  const DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],DOW=['S','M','T','W','T','F','S'],
        MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        MNF=['January','February','March','April','May','June','July','August','September','October','November','December'];
  // Business hours run on the Saskatchewan clock (CST, UTC-6 all year); shown in the chosen timezone.
  const SLOTS=[{t:'10:00 AM',h:10},{t:'11:00 AM',h:11},{t:'1:00 PM',h:13},{t:'2:00 PM',h:14},{t:'3:00 PM',h:15},{t:'4:00 PM',h:16},{t:'5:00 PM',h:17}];
  const cstNow=new Date(Date.now()-6*3600*1000);
  const curMin=cstNow.getUTCHours()*60+cstNow.getUTCMinutes();
  const T={y:cstNow.getUTCFullYear(),m:cstNow.getUTCMonth(),d:cstNow.getUTCDate()};
  const todayNum=Date.UTC(T.y,T.m,T.d);
  const maxNum=todayNum+30*86400000;
  const key=(y,m,d)=>Date.UTC(y,m,d);
  const isToday=(y,m,d)=>key(y,m,d)===todayNum;

  // --- Timezone picker: shown as provinces/states, mapped to real timezones ---
  const CA_PROV=[
    ['Alberta','America/Edmonton'],['British Columbia','America/Vancouver'],['Manitoba','America/Winnipeg'],
    ['New Brunswick','America/Moncton'],['Newfoundland and Labrador','America/St_Johns'],['Nova Scotia','America/Halifax'],
    ['Ontario','America/Toronto'],['Prince Edward Island','America/Halifax'],['Quebec','America/Toronto'],
    ['Saskatchewan','America/Regina'],['Northwest Territories','America/Yellowknife'],['Nunavut','America/Iqaluit'],['Yukon','America/Whitehorse']
  ];
  const US_STATE=[
    ['Alabama','America/Chicago'],['Alaska','America/Anchorage'],['Arizona','America/Phoenix'],['Arkansas','America/Chicago'],
    ['California','America/Los_Angeles'],['Colorado','America/Denver'],['Connecticut','America/New_York'],['Delaware','America/New_York'],
    ['Florida','America/New_York'],['Georgia','America/New_York'],['Hawaii','Pacific/Honolulu'],['Idaho','America/Denver'],
    ['Illinois','America/Chicago'],['Indiana','America/New_York'],['Iowa','America/Chicago'],['Kansas','America/Chicago'],
    ['Kentucky','America/New_York'],['Louisiana','America/Chicago'],['Maine','America/New_York'],['Maryland','America/New_York'],
    ['Massachusetts','America/New_York'],['Michigan','America/New_York'],['Minnesota','America/Chicago'],['Mississippi','America/Chicago'],
    ['Missouri','America/Chicago'],['Montana','America/Denver'],['Nebraska','America/Chicago'],['Nevada','America/Los_Angeles'],
    ['New Hampshire','America/New_York'],['New Jersey','America/New_York'],['New Mexico','America/Denver'],['New York','America/New_York'],
    ['North Carolina','America/New_York'],['North Dakota','America/Chicago'],['Ohio','America/New_York'],['Oklahoma','America/Chicago'],
    ['Oregon','America/Los_Angeles'],['Pennsylvania','America/New_York'],['Rhode Island','America/New_York'],['South Carolina','America/New_York'],
    ['South Dakota','America/Chicago'],['Tennessee','America/Chicago'],['Texas','America/Chicago'],['Utah','America/Denver'],
    ['Vermont','America/New_York'],['Virginia','America/New_York'],['Washington','America/Los_Angeles'],['Washington, DC','America/New_York'],
    ['West Virginia','America/New_York'],['Wisconsin','America/Chicago'],['Wyoming','America/Denver']
  ];
  const FRIENDLY={'America/Regina':'Saskatchewan Time','America/Swift_Current':'Saskatchewan Time','America/Toronto':'Eastern Time',
    'America/New_York':'Eastern Time','America/Winnipeg':'Central Time','America/Chicago':'Central Time','America/Edmonton':'Mountain Time',
    'America/Denver':'Mountain Time','America/Vancouver':'Pacific Time','America/Los_Angeles':'Pacific Time','America/Halifax':'Atlantic Time',
    'America/Moncton':'Atlantic Time','America/St_Johns':'Newfoundland Time','America/Phoenix':'Arizona Time','America/Anchorage':'Alaska Time',
    'Pacific/Honolulu':'Hawaii Time','America/Whitehorse':'Yukon Time','America/Yellowknife':'Mountain Time','America/Iqaluit':'Eastern Time'};
  let intlOK=true,tzSel='America/Regina';
  try{
    new Intl.DateTimeFormat('en-US',{hour:'numeric',timeZone:'America/Regina'}).format(new Date());
    const det=(Intl.DateTimeFormat().resolvedOptions().timeZone)||'America/Regina';
    tzSel=det;
    if(tzSelEl){
      let friendly=FRIENDLY[det];
      if(!friendly){
        try{
          const parts=new Intl.DateTimeFormat('en-US',{timeZoneName:'long',timeZone:det}).formatToParts(new Date());
          const z=parts.find(p=>p.type==='timeZoneName');friendly=z?z.value:det.replace(/_/g,' ');
        }catch(e){friendly=det.replace(/_/g,' ');}
      }
      const auto=document.createElement('option');auto.value=det;auto.textContent=(FRIENDLY[det]?FRIENDLY[det].replace(/ Time$/,''):det.split('/').pop().replace(/_/g,' '))+' (your time)';tzSelEl.appendChild(auto);
      function grp(label,list){const g=document.createElement('optgroup');g.label=label;
        list.forEach(p=>{try{new Intl.DateTimeFormat('en-US',{timeZone:p[1]});}catch(e){return;}
          const o=document.createElement('option');o.value=p[1];o.textContent=p[0];o.dataset.prov=p[2]||p[0];g.appendChild(o);});
        tzSelEl.appendChild(g);}
      grp('Canada',CA_PROV.map(p=>[p[0],p[1],p[0]+', Canada']));
      grp('United States',US_STATE.map(p=>[p[0],p[1],p[0]+', USA']));
      grp('Australia',[['New South Wales','Australia/Sydney'],['Victoria','Australia/Melbourne'],['Queensland','Australia/Brisbane'],['South Australia','Australia/Adelaide'],['Western Australia','Australia/Perth'],['Tasmania','Australia/Hobart'],['Northern Territory','Australia/Darwin'],['Australian Capital Territory','Australia/Sydney']].map(p=>[p[0],p[1],p[0]+', Australia']));
      grp('Other countries',[
        ['Bangladesh','Asia/Dhaka'],['Brazil (São Paulo)','America/Sao_Paulo'],['China','Asia/Shanghai'],['Colombia','America/Bogota'],['Egypt','Africa/Cairo'],
        ['France','Europe/Paris'],['Germany','Europe/Berlin'],['Hong Kong','Asia/Hong_Kong'],['India','Asia/Kolkata'],['Indonesia (Jakarta)','Asia/Jakarta'],
        ['Ireland','Europe/Dublin'],['Italy','Europe/Rome'],['Japan','Asia/Tokyo'],['Kenya','Africa/Nairobi'],['Malaysia','Asia/Kuala_Lumpur'],
        ['Mexico (Mexico City)','America/Mexico_City'],['Nepal','Asia/Kathmandu'],['Netherlands','Europe/Amsterdam'],['New Zealand','Pacific/Auckland'],
        ['Nigeria','Africa/Lagos'],['Pakistan','Asia/Karachi'],['Philippines','Asia/Manila'],['Qatar','Asia/Qatar'],['Saudi Arabia','Asia/Riyadh'],
        ['Singapore','Asia/Singapore'],['South Africa','Africa/Johannesburg'],['South Korea','Asia/Seoul'],['Spain','Europe/Madrid'],['Sri Lanka','Asia/Colombo'],
        ['Thailand','Asia/Bangkok'],['Turkey','Europe/Istanbul'],['United Arab Emirates','Asia/Dubai'],['United Kingdom','Europe/London'],['Vietnam','Asia/Ho_Chi_Minh']
      ]);
      tzSelEl.selectedIndex=0;
      tzSelEl.addEventListener('change',()=>{
        tzSel=tzSelEl.value;
        if(sel)renderSlots();update();
      });
    }
  }catch(e){intlOK=false;if(tzSelEl)tzSelEl.parentElement.style.display='none';}
  function zoneAbbr(){
    if(!intlOK)return 'CST';
    try{
      const parts=new Intl.DateTimeFormat('en-US',{timeZoneName:'short',timeZone:tzSel}).formatToParts(new Date());
      const z=parts.find(p=>p.type==='timeZoneName');return z?z.value:'';
    }catch(e){return '';}
  }
  const slotUtc=(y,m,d,h)=>Date.UTC(y,m,d,h+6,0,0);
  function slotTime(y,m,d,s){ // time only, in chosen zone
    if(!intlOK)return s.t;
    try{return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:tzSel}).format(new Date(slotUtc(y,m,d,s.h)));}
    catch(e){return s.t;}
  }
  function slotsAvail(y,m,d){
    const w=new Date(key(y,m,d)).getUTCDay();
    if(w===0||w===6)return [];
    if(isToday(y,m,d))return SLOTS.filter(s=>s.h*60>curMin+60);
    return SLOTS;
  }
  function bookable(y,m,d){
    const k=key(y,m,d);
    return k>=todayNum&&k<=maxNum&&slotsAvail(y,m,d).length>0;
  }
  let view={y:T.y,m:T.m},sel=null,selSlot=null,bkT0=0;
  buildCC(document.getElementById('bkCC'));
  attachEmailSuggest(document.getElementById('bkEmail'));
  attachEmailDropdown(document.getElementById('bkEmail'));
  attachNameFilter(document.getElementById('bkName'));
  attachPhoneFilter(document.getElementById('bkPhone'),document.getElementById('bkCC'));
  function firstBookable(){
    for(let i=0;i<40;i++){
      const dt=new Date(todayNum+i*86400000);
      const y=dt.getUTCFullYear(),m=dt.getUTCMonth(),d=dt.getUTCDate();
      if(bookable(y,m,d))return{y,m,d};
    }
    return null;
  }
  function renderCal(){
    monthEl.textContent=MNF[view.m]+' '+view.y;
    grid.innerHTML='';
    DOW.forEach(x=>{const s=document.createElement('span');s.className='cal-dow';s.textContent=x;grid.appendChild(s);});
    const firstW=new Date(key(view.y,view.m,1)).getUTCDay();
    const dim=new Date(Date.UTC(view.y,view.m+1,0)).getUTCDate();
    for(let i=0;i<firstW;i++)grid.appendChild(document.createElement('span'));
    for(let d=1;d<=dim;d++){
      const b=document.createElement('button');b.type='button';b.className='cal-day';b.textContent=d;
      if(isToday(view.y,view.m,d))b.classList.add('today');
      if(sel&&sel.y===view.y&&sel.m===view.m&&sel.d===d)b.classList.add('sel');
      if(!bookable(view.y,view.m,d))b.disabled=true;
      else b.addEventListener('click',()=>{sel={y:view.y,m:view.m,d:d};renderCal();renderSlots();if(matchMedia('(max-width:720px)').matches)bkScrollTo(dayLabel,0.72);});
      grid.appendChild(b);
    }
    const nowK=key(T.y,T.m,1),maxD=new Date(maxNum);
    prevB.disabled=key(view.y,view.m,1)<=nowK;
    nextB.disabled=key(view.y,view.m,1)>=key(maxD.getUTCFullYear(),maxD.getUTCMonth(),1);
  }
  function selWeekday(){return new Date(key(sel.y,sel.m,sel.d)).getUTCDay();}
  function renderSlots(){
    slotsEl.innerHTML='';selSlot=null;
    const t=isToday(sel.y,sel.m,sel.d);
    dayLabel.textContent=(t?'TODAY':DN[selWeekday()].toUpperCase())+' · '+MN[sel.m].toUpperCase()+' '+sel.d;
    slotsAvail(sel.y,sel.m,sel.d).forEach(s=>{
      const b=document.createElement('button');b.type='button';b.textContent=slotTime(sel.y,sel.m,sel.d,s);
      b.addEventListener('click',()=>{selSlot=s;[...slotsEl.children].forEach(x=>x.classList.remove('on'));b.classList.add('on');
        const first=!step3.classList.contains('on');
        step3.classList.add('on');bkT0=bkT0||Date.now();update();
        const mob=matchMedia('(max-width:720px)').matches;
        if(mob)bkScrollTo(step3,0.30);
        else if(first){step3.scrollIntoView({behavior:'smooth',block:'center'});
          const bz=document.getElementById('bkBiz');if(bz)bz.focus({preventScroll:true});}});
      slotsEl.appendChild(b);
    });
    todayNote.style.display=t?'block':'none';
    if(picked&&step3.classList.contains('on'))picked.textContent='Pick a time above for your new day.';
  }
  sel=firstBookable();
  if(sel){view={y:sel.y,m:sel.m};}
  renderCal();if(sel)renderSlots();
  prevB.addEventListener('click',()=>{view.m--;if(view.m<0){view.m=11;view.y--;}renderCal();});
  nextB.addEventListener('click',()=>{view.m++;if(view.m>11){view.m=0;view.y++;}renderCal();});
  function dayStr(){return isToday(sel.y,sel.m,sel.d)?'Today ('+MN[sel.m]+' '+sel.d+')':DN[selWeekday()]+', '+MN[sel.m]+' '+sel.d;}
  function slotLabel(){ // visitor-facing
    const ab=zoneAbbr();
    return dayStr()+' — '+slotTime(sel.y,sel.m,sel.d,selSlot)+(ab?' '+ab:'');
  }
  function slotLabelFull(){ // hub-facing: chosen zone + CST anchor
    const loc=slotLabel();
    return (tzSel==='America/Regina'||!intlOK)?dayStr()+' — '+selSlot.t+' CST'
      :loc+' ('+selSlot.t+' CST)';
  }
  function update(){if(selSlot)picked.textContent='📅 '+slotLabel();}
  form.addEventListener('submit',async e=>{
    e.preventDefault();err.style.display='none';
    const bizEl=document.getElementById('bkBiz'),nameEl=document.getElementById('bkName'),
          phoneEl=document.getElementById('bkPhone'),emailEl=document.getElementById('bkEmail'),
          ccEl=document.getElementById('bkCC');
    [bizEl,nameEl,phoneEl,emailEl].forEach(clearErr);
    if(!selSlot){err.textContent='Please pick a day and time above.';err.style.display='block';return;}
    let bad=false;
    if(!bizEl.value.trim()||looksFake(bizEl.value)){showErr(bizEl,'Please enter your real business name.');bad=true;}
    var ni=nameIssue(nameEl.value);
    if(ni){showErr(nameEl,ni);bad=true;}
    const dial=ccEl&&ccEl.selectedOptions[0]?ccEl.selectedOptions[0].dataset.dial:'1';
    const iso=ccEl?ccEl.value:'CA';
    const phoneFmt=validPhone(iso,dial,phoneEl.value);
    if(!phoneFmt){showErr(phoneEl,'Please enter a valid phone number.');bad=true;}
    const em=emailEl.value.trim();
    if(em&&!emailCheck(em).ok){showErr(emailEl,'That email address doesn’t look right.');bad=true;}
    if(bad)return;
    const btn=form.querySelector('.bk-submit');btn.disabled=true;btn.textContent='Booking…';
    // Bots fill instantly; humans can't complete this form in under 3 seconds.
    if(bkT0&&Date.now()-bkT0<3000){
      document.getElementById('bkConfirmText').textContent='Your demo is requested for '+slotLabel()+'. We’ll confirm by text and email shortly.';
      form.style.display='none';document.getElementById('bkStep1').style.display='none';
      confirmEl.style.display='block';return;
    }
    try{
      const res=await fetch('https://crhvvfomwkrgwlnfruad.supabase.co/functions/v1/website-lead',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          name:nameEl.value.trim(),phone:phoneFmt,
          email:em,
          business:bizEl.value.trim(),
          location:(function(){var o=tzSelEl&&tzSelEl.options[tzSelEl.selectedIndex];return (o&&o.dataset&&o.dataset.prov)?o.dataset.prov:'';})(),
          country:iso,
          requested_slot:slotLabelFull(),
          timezone:(function(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(x){return ''}})(),
          consent:document.getElementById('bkConsent').checked,
          website:form.querySelector('[name=website]').value,
          page:location.pathname
        })
      });
      const out=await res.json().catch(()=>({}));
      if(!res.ok||!out.success)throw new Error(out.error||'Request failed');
      document.getElementById('bkConfirmText').textContent='Your demo is requested for '+slotLabel()+'. We’ll confirm by text and email shortly.';
      form.style.display='none';document.getElementById('bkStep1').style.display='none';
      confirmEl.style.display='block';
    }catch(ex){
      err.textContent='Something went wrong sending your request. Please try again, or call us at +1 647 250 1152.';
      err.style.display='block';btn.disabled=false;btn.textContent='Book my demo';
    }
  });
})();
}
function initWizard(host){
  host.innerHTML = BK_TPL;
  runWizard();
}
function closeModal(){
  var m = document.getElementById('bkModal');
  if(m){ m.classList.remove('on'); document.documentElement.style.overflow = ''; }
}
function openModal(){
  var m = document.getElementById('bkModal');
  if(!m){
    m = document.createElement('div');
    m.className = 'bk-modal';
    m.id = 'bkModal';
    m.innerHTML = '<div class="bk-modal-dialog" role="dialog" aria-modal="true" aria-label="Book a demo">'
      + '<button type="button" class="bk-modal-close" aria-label="Close">\u2715</button>'
      + '<h3 class="bk-modal-title">Book a demo</h3>'
      + '<div id="bkHostModal"></div></div>';
    document.body.appendChild(m);
    initWizard(document.getElementById('bkHostModal'));
    m.addEventListener('click', function(e){ if(e.target === m) closeModal(); });
    m.querySelector('.bk-modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
  }
  m.classList.add('on');
  document.documentElement.style.overflow = 'hidden';
}

function bkScrollTo(el,frac){
  var p=el.parentElement,sp=null;
  while(p){var s=getComputedStyle(p);if(/(auto|scroll)/.test(s.overflowY)){sp=p;break;}p=p.parentElement;}
  var vh=sp?sp.clientHeight:window.innerHeight;
  var top=el.getBoundingClientRect().top-(sp?sp.getBoundingClientRect().top:0);
  var delta=top-vh*frac;
  (sp||window).scrollBy({top:delta,behavior:'smooth'});
}
function bindContact(){
  var form=document.getElementById('ctForm');
  if(!form)return;
  var err=document.getElementById('ctError'),confirmEl=document.getElementById('ctConfirm');
  buildCC(document.getElementById('ctCC'));
  attachEmailSuggest(document.getElementById('ctEmail'));
  attachEmailDropdown(document.getElementById('ctEmail'));
  attachNameFilter(document.getElementById('ctName'));
  attachPhoneFilter(document.getElementById('ctPhone'),document.getElementById('ctCC'));
  var t0=0;
  form.addEventListener('focusin',function(){t0=t0||Date.now();});
  form.addEventListener('submit',async function(e){
    e.preventDefault();err.style.display='none';
    var nameEl=document.getElementById('ctName'),bizEl=document.getElementById('ctBiz'),
        phoneEl=document.getElementById('ctPhone'),emailEl=document.getElementById('ctEmail'),
        ccEl=document.getElementById('ctCC');
    [nameEl,bizEl,phoneEl,emailEl].forEach(clearErr);
    var bad=false;
    var ni=nameIssue(nameEl.value);
    if(ni){showErr(nameEl,ni);bad=true;}
    if(bizEl.value.trim()&&looksFake(bizEl.value)){showErr(bizEl,'Please enter your real business name.');bad=true;}
    var dial=ccEl&&ccEl.selectedOptions[0]?ccEl.selectedOptions[0].dataset.dial:'1';
    var phoneFmt=validPhone(ccEl?ccEl.value:'CA',dial,phoneEl.value);
    if(!phoneFmt){showErr(phoneEl,'Please enter a valid phone number.');bad=true;}
    var em=emailEl.value.trim();
    if(em&&!emailCheck(em).ok){showErr(emailEl,'That email address doesn’t look right.');bad=true;}
    if(bad)return;
    var btn=form.querySelector('.bk-submit');btn.disabled=true;btn.textContent='Sending…';
    if(t0&&Date.now()-t0<3000){form.style.display='none';confirmEl.style.display='block';return;}
    var tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch(x){}
    try{
      var res=await fetch('https://crhvvfomwkrgwlnfruad.supabase.co/functions/v1/website-lead',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          name:nameEl.value.trim(),phone:phoneFmt,email:em,
          business:bizEl.value.trim(),
          message:document.getElementById('ctMsg').value.trim(),
          country:ccEl?ccEl.value:'',
          timezone:tz,
          consent:document.getElementById('ctConsent').checked,
          website:form.querySelector('[name=website]').value,
          page:location.pathname
        })
      });
      var out=await res.json().catch(function(){return {};});
      if(!res.ok||!out.success)throw new Error(out.error||'Request failed');
      form.style.display='none';confirmEl.style.display='block';
    }catch(ex){
      err.textContent='Something went wrong sending your message. Please try again, or call us at +1 647 250 1152.';
      err.style.display='block';btn.disabled=false;btn.textContent='Send message';
    }
  });
}

function boot(){
  bindContact();
  var host = document.getElementById('bkHost');
  if(host){ initWizard(host); return; } // homepage: inline calendar, anchors scroll to it
  document.querySelectorAll('a[href$="#book-demo"]').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); openModal(); });
  });
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
})();
