// كل سطر: {t: النص, l: المستوى (من غير حد), n: نص عادي بدل فرع, c: مطوي}
// السطر 0 هو العنوان: دايماً فرع في المستوى 0
var L=[{t:'',l:0}],cur=0,MK=['•','–','◦','▪'],lvSel=null;
var fh=null,dirty=false,tm,fname='',full=false,st=document.getElementById('st'),fnm=document.getElementById('fnm');

// الكراسات: كل كراسة في مفتاح لوحدها، وفهرس فيه بياناتها (الاسم وآخر تعديل)
// الفهرس بيتقري من التخزين قبل أي تعديل، علشان التاب واللوحة الجانبية ما يمسحوش تعديلات بعض
var IK='warqati-index',LK='warqati-last',OK_LAST='warqati-open-last',NB=null;
function nbKey(id){return 'warqati-nb-'+id}
function newId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function readIdx(){try{var a=JSON.parse(localStorage.getItem(IK));return Array.isArray(a)?a:[]}catch(e){return []}}
function writeIdx(a){localStorage.setItem(IK,JSON.stringify(a))}
function readNb(id){try{var a=JSON.parse(localStorage.getItem(nbKey(id)));if(Array.isArray(a)&&a.length)return a}catch(e){}return [{t:'',l:0}]}
function isEmpty(a){return a.every(function(x){return !x.t.trim()})}
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
// أول مرة: الورقة القديمة (من النسخ اللي فاتت) بتبقى أول كراسة
(function migrate(){
  if(lsGet(IK)!==null)return;var old=null,a=[];
  try{old=JSON.parse(localStorage.getItem('mindlines-v1'))}catch(e){}
  if(!Array.isArray(old)||!old.length){old=[];try{var t=JSON.parse(localStorage.getItem('mindtree-v1'));if(t)(function flat(n,d){old.push({t:n.t||'',l:d});(n.c||[]).forEach(function(c){flat(c,d+1)})})(t,0)}catch(e){}}
  if(old.length&&!isEmpty(old)){var id=newId(),now=Date.now();lsSet(nbKey(id),JSON.stringify(old));a.push({id:id,title:old[0].t.trim(),created:now,updated:now});lsSet(LK,id)}
  try{writeIdx(a)}catch(e){}})();
function storeNb(touch){
  if(!NB)return true;
  try{localStorage.setItem(nbKey(NB),JSON.stringify(L));
    if(touch){var a=readIdx(),e=a.find(function(x){return x.id===NB});
      if(!e){e={id:NB,created:Date.now()};a.unshift(e)}
      e.title=L[0].t.trim();e.updated=Date.now();writeIdx(a);if(typeof syOnChange==='function')syOnChange()}
    full=false;return true}
  catch(e){full=true;return false}}
function save(){storeNb(true);dirty=true;setSt();if(fh){clearTimeout(tm);tm=setTimeout(writeFile,600)}}
function saveLocal(){storeNb(false)}
// السطر ما ينفعش يبعد عن اللي قبله بأكتر من مستوى
function fit(i){if(i===0){L[0].l=0;L[0].n=false}else L[i].l=Math.max(0,Math.min(L[i].l,L[i-1].l+1))}
function normalize(from){for(var j=Math.max(0,from);j<L.length;j++)fit(j)}
function hasKids(i){return !!(L[i+1]&&L[i+1].l>L[i].l)}
function blockEnd(i){var q=i+1;while(L[q]&&L[q].l>L[i].l)q++;return q}
function countKids(i){var n=0;for(var j=i+1;j<L.length&&L[j].l>L[i].l;j++)if(L[j].t.trim())n++;return n}
function hid(){var h=[],lv=null;for(var i=0;i<L.length;i++){if(lv!==null){if(L[i].l>lv){h[i]=true;continue}lv=null}if(L[i].c&&hasKids(i))lv=L[i].l}return h}
function prevVisible(i){var H=hid(),j=i-1;while(j>0&&H[j])j--;return j}
function toggleCollapse(i){L[i].c=!L[i].c;lvSel=null;saveLocal();render()}
// فيه فرع تاني في المستوى k جاي بعد السطر j؟ (علشان نكمّل خط التوصيل)
function hasNext(j,k){for(var m=j+1;m<L.length;m++){if(L[m].l<k)return false;if(L[m].l===k&&!L[m].n)return true}return false}
function caretAt(i){var a=document.activeElement;return a&&a.dataset&&+a.dataset.i===i?a.selectionStart:null}
function mkLine(t,l,n){var o={t:t,l:l};if(n)o.n=true;return o}
// التراجع: صورة من الكراسة قبل كل تعديل (الكتابة المتواصلة في نفس السطر بتتحسب خطوة واحدة)
var UNDO=[],REDO=[],snapLine=-1,snapAt=0;
function state(){return {L:JSON.stringify(L),f:cur,p:caretAt(cur)}}
function snap(typing,i){var now=Date.now();if(typing&&snapLine===i&&now-snapAt<1500){snapAt=now;return}
  UNDO.push(state());if(UNDO.length>200)UNDO.shift();REDO=[];snapLine=typing?i:-1;snapAt=now}
function restore(s){L=JSON.parse(s.L);snapLine=-1;save();render(Math.min(s.f,L.length-1),s.p)}
function undo(){if(!UNDO.length)return;REDO.push(state());restore(UNDO.pop())}
function redo(){if(!REDO.length)return;UNDO.push(state());restore(REDO.pop())}

// الورقة المتصلة: عرض مرن من غير صفحات A4 ولا تصغير
// بتشتغل في اللوحة الجانبية دايماً، وعلى الشاشات الضيقة (الموبايل) لوحدها
var PANEL=/panel\.html$/.test(location.pathname)||/[?&]panel\b/.test(location.search),NARROW=matchMedia('(max-width: 600px)');
var FLOW,CAP,SW=794,IN0,STEP;
function setFlow(on){FLOW=on;CAP=on?Infinity:1008;IN0=on?30:56;STEP=on?20:26;document.documentElement.classList.toggle('flow',on)}
setFlow(PANEL||NARROW.matches);
if(PANEL)document.documentElement.classList.add('panel');
function wantFlow(){return PANEL||NARROW.matches}
// إعادة الرسم مع الحفاظ على مكان الكتابة
function rerender(){var a=document.activeElement,ix=a&&a.dataset&&a.dataset.i!=null?+a.dataset.i:null;if(ix!=null&&ix>=L.length)ix=L.length-1;render(ix,ix!=null?a.selectionStart:null)}
function fitStage(){if(FLOW)return;var sg=document.getElementById('stage'),p=document.getElementById('p'),s=Math.min(1,(sg.clientWidth-12)/SW);p.style.transform='scale('+s+')';sg.style.height=Math.ceil(p.offsetHeight*s)+'px'}
function newSheet(p){var s=document.createElement('div');s.className='sheet';var b=document.createElement('div');b.className='sb';s.append(b);p.append(s);return b}
function chk(i,inp){if(String(inp.offsetHeight)!==inp.dataset.h)render(i,inp.selectionStart)}
function grow(t){t.style.height='42px';t.style.height=Math.max(42,Math.ceil(t.scrollHeight/42)*42)+'px'}
function render(f,pos){
  var p=document.getElementById('p');p.innerHTML='';var H=hid();if(f!=null){while(f>0&&H[f])f--}
  // التفريع من غير حد: لو الفروع عمقت، المسافة بين المستويات بتصغر علشان النص يفضل له مكان
  var D=0;L.forEach(function(x,i){if(!H[i]&&x.l>D)D=x.l});
  var W=FLOW?document.getElementById('stage').clientWidth:SW,S=D?Math.max(10,Math.min(STEP,(W*.45-IN0)/D)):STEP;
  var B=newSheet(p);
  L.forEach(function(x,i){
    if(H[i])return;
    var d=document.createElement('div');d.dataset.li=i;d.className='line'+(x.n?' txt':(x.l?'':' l0'))+(i===0?' title':'');
    d.style.setProperty('--lc',x.n?'var(--ink)':'var(--c'+(x.l?(x.l-1)%5+1:0)+')');
    d.style.paddingInlineStart=(IN0+x.l*S)+'px';
    var kids=hasKids(i),m=document.createElement('span');m.className='mk'+(kids?' k':'');
    m.textContent=kids&&x.c?t('mkClosed'):(x.n||!x.l?(kids?'▾':''):MK[(x.l-1)%MK.length]);
    if(kids){m.title=t('toggleKids');m.onclick=function(){toggleCollapse(i)}}
    var inp=document.createElement('textarea');inp.rows=1;inp.value=x.t;inp.dataset.i=i;
    inp.placeholder=i===0?t('phTitle'):x.n?t('phText'):t('phNode');inp.dir='auto';
    inp.onfocus=function(){cur=i;updDock()};
    inp.oninput=function(e){
      if(/\n/.test(inp.value))inp.value=inp.value.replace(/\s*\n\s*/g,' ');
      // "- " في أول سطر عادي تحوّله لفرع
      if(L[i].n&&/^[-*•]\s/.test(inp.value)){snap();L[i].n=false;L[i].t=inp.value.replace(/^[-*•]\s+/,'');save();render(i,0);return}
      snap(true,i);L[i].t=inp.value;grow(inp);save();if(!(e&&e.isComposing))chk(i,inp)};
    inp.oncompositionend=function(){chk(i,inp)};
    inp.onkeydown=function(e){key(e,i,inp)};
    inp.onpaste=function(e){var s=(e.clipboardData||window.clipboardData).getData('text');if(!/\n/.test(s))return;e.preventDefault();paste(i,inp,s)};
    for(var k=1;k<=x.l;k++){var gx=(IN0+(k-1)*S+9)+'px',nx=hasNext(i,k);
      if(k===x.l&&!x.n){var e=document.createElement('span');e.className='g';e.style.insetInlineStart=gx;e.style.width=Math.max(5,S-11)+'px';e.style.height='21px';
        e.style.borderInlineStart='2px solid var(--guide)';e.style.borderBottom='2px solid var(--guide)';e.style.borderEndStartRadius='10px';d.append(e)}
      if(k<x.l||nx){if(k<x.l&&!nx)continue;var v=document.createElement('span');v.className='g';v.style.insetInlineStart=gx;v.style.height='100%';v.style.borderInlineStart='2px solid var(--guide)';d.append(v)}}
    d.append(m,inp);
    if(kids&&x.c){var bg=document.createElement('span');bg.className='cnt';var cn=countKids(i);bg.textContent=cn?'+'+cn:'…';bg.onclick=function(){toggleCollapse(i)};d.append(bg)}
    B.append(d);grow(inp);
    if(B.children.length>1&&B.scrollHeight>CAP){B.removeChild(d);var nb=newSheet(p),mv=[],top=x.l;
      // العناوين اللي في آخر الصفحة وكل واحد فيهم أبو اللي بعده بينزلوا مع فروعهم (لحد ٣ سطور)
      while(mv.length<3&&B.children.length>1){var pv=B.lastElementChild,pl=L[+pv.dataset.li].l;if(pl>=top)break;B.removeChild(pv);mv.unshift(pv);top=pl}
      mv.forEach(function(m){nb.append(m)});B=nb;B.append(d);grow(inp)}
    inp.dataset.h=inp.offsetHeight});
  var sh=FLOW?[]:p.querySelectorAll('.sheet');sh.forEach(function(sx,k){var pn=document.createElement('div');pn.className='pn';pn.textContent=t('page',k+1,sh.length);sx.append(pn);
    var fl=sx.querySelector('.line');if(k>0&&fl){var cr=crumbs(+fl.dataset.li,'cont');if(cr)sx.append(cr)}});fitStage();
  document.querySelectorAll('#lv button').forEach(function(b){b.classList.toggle('on',b.dataset.n===String(lvSel))});
  if(f!=null){var el=p.querySelector('textarea[data-i="'+f+'"]');if(el){el.focus();var n=pos!=null?Math.min(pos,el.value.length):el.value.length;el.setSelectionRange(n,n)}}
  updDock()}

// تحريك السطر وفروعه مستوى لجوه أو لبره
function indent(i,dir){
  if(i===0)return;
  var before=L[i].l,c=caretAt(i),nl=Math.max(0,Math.min(before+dir,L[i-1].l+1));if(nl===before)return;
  snap();L[i].l=nl;var delta=nl-before;
  for(var j=i+1;j<L.length&&L[j].l>before;j++)L[j].l=Math.max(0,L[j].l+delta);
  save();render(i,c)}
// فرع ⇄ نص عادي
function toggleKind(i){if(i===0)return;var c=caretAt(i);snap();L[i].n=!L[i].n;save();render(i,c)}
// تبديل مكان السطر (مع فروعه) مع اللي فوقه أو تحته في نفس المستوى
function move(i,dir){
  if(i===0)return;var e=blockEnd(i),c=caretAt(i),blk;
  if(dir<0){var p=i-1;while(p>0&&L[p].l>L[i].l)p--;if(p<1||L[p].l!==L[i].l)return;
    snap();blk=L.splice(i,e-i);L.splice.apply(L,[p,0].concat(blk));save();render(p,c)}
  else{if(!L[e]||L[e].l!==L[i].l)return;snap();blk=L.splice(e,blockEnd(e)-e);L.splice.apply(L,[i,0].concat(blk));save();render(i+blk.length,c)}}
// لصق كذا سطر: كل سطر يبقى سطر لوحده، والمسافات في أوله بتحدد التفريع
function paste(i,inp,s){snap();
  var a=inp.selectionStart,v=inp.value,tail=v.slice(inp.selectionEnd),x=L[i];
  var rows=s.replace(/\r/g,'').split('\n');while(rows.length>1&&!rows[rows.length-1].trim())rows.pop();
  function ind(r){var m=r.match(/^[\t ]*/)[0],lv=0;for(var k=0;k<m.length;k++)lv+=m[k]==='\t'?1:.25;return Math.floor(lv)}
  var rest=rows.slice(1),base=Math.min.apply(null,rest.filter(function(r){return r.trim()}).map(ind).concat([Infinity]));if(!isFinite(base))base=0;
  x.t=v.slice(0,a)+rows[0].trim();
  var add=rest.map(function(r){var t=r.trim(),n=x.n;
    if(/^[-*•]\s/.test(t)){n=false;t=t.replace(/^[-*•]\s+/,'')}else if(/^>\s?/.test(t)){n=true;t=t.replace(/^>\s?/,'')}
    return mkLine(t,x.l+ind(r)-base,n)});
  var last=add.length?add[add.length-1]:x,pos=last.t.length;last.t+=tail;
  L.splice.apply(L,[i+1,0].concat(add));normalize(i+1);save();render(i+add.length,pos)}

function key(e,i,inp){
  if(e.isComposing)return;
  var x=L[i],a=inp.selectionStart,b=inp.selectionEnd,v=inp.value;
  if(e.altKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();move(i,e.key==='ArrowUp'?-1:1);return}
  if(e.key==='Enter'){e.preventDefault();
    // Shift+Enter: سطر من النوع التاني تحته (فرع ← وصف نصي، نص ← فروع)
    if(e.shiftKey){snap();x.c=false;L.splice(i+1,0,mkLine('',x.l+1,!x.n));save();render(i+1);return}
    if(v===''&&i>0){
      if(x.l>0){indent(i,-1);return}
      if(!x.n){snap();x.n=true;save();render(i);return}}
    // Enter في نص السطر بيقسمه
    snap();var tail=v.slice(b).replace(/^\s+/,''),at,o;x.t=a<v.length?v.slice(0,a).replace(/\s+$/,''):v;
    if(x.c&&hasKids(i)){at=blockEnd(i);o=mkLine(tail,x.l,x.n)}
    else if(hasKids(i)){at=i+1;if(!x.n)while(L[at]&&L[at].n&&L[at].l===x.l+1)at++;o=mkLine(tail,x.l+1,x.n?L[i+1].n:false)}
    else if(i===0){at=1;o=mkLine(tail,1,false)}
    else{at=i+1;o=mkLine(tail,x.l,x.n)}
    L.splice(at,0,o);save();render(at,0)}
  else if(e.key==='Tab'){e.preventDefault();indent(i,e.shiftKey?-1:1)}
  else if(e.key==='Backspace'&&a===0&&b===0&&i>0){e.preventDefault();
    // زي جوجل دوكس: أول Backspace يشيل علامة الفرع، وبعدها يرجّع المستوى، وبعدها يدمج مع اللي فوق
    if(!x.n){snap();x.n=true;save();render(i,0);return}
    var pv=prevVisible(i);
    if(v===''){snap();L.splice(i,1);normalize(i);save();render(pv);return}
    if(x.l>0){indent(i,-1);return}
    snap();var n=L[pv].t.length;L[pv].t+=v;L.splice(i,1);normalize(i);save();render(pv,n)}
  else if(e.key==='ArrowUp'&&i>0&&(inp.scrollHeight<=44||a===0)){e.preventDefault();render(i-1)}
  else if(e.key==='ArrowDown'&&i<L.length-1&&(inp.scrollHeight<=44||a===v.length)){e.preventDefault();var H2=hid(),j2=i+1;while(j2<L.length&&H2[j2])j2++;if(j2<L.length)render(j2)}}

// شريط أدوات السطر تحت
// المسار: الأفكار اللي السطر طالع منها (من غير عنوان الكراسة)، وكل جزء فيه بيوديك للسطر بتاعه
function parentOf(i){for(var j=i-1;j>=0;j--)if(L[j].l<L[i].l)return j;return -1}
function pathOf(i){var r=[];if(!L[i])return r;for(var j=parentOf(i);j>0;j=parentOf(j))r.unshift(j);return r}
function crumbs(i,cls){var a=pathOf(i);if(!a.length)return null;var e=document.createElement('div');e.className='crumb '+cls;
  if(cls==='cont'){var lb=document.createElement('span');lb.className='lbl';lb.textContent=t('continued');e.append(lb)}
  if(a.length>4){var m=document.createElement('span');m.className='more';m.textContent='…';e.append(m);a=a.slice(-4)}
  a.forEach(function(j){var b=document.createElement('button'),s=L[j].t.trim();b.textContent=s.length>30?s.slice(0,29)+'…':(s||'…');b.title=s;
    b.onmousedown=function(ev){ev.preventDefault()};b.onclick=function(){render(j)};e.append(b)});
  return e}
function updCrumb(){var c=document.getElementById('crumb');if(!c)return;c.innerHTML='';var cr=!isLib()&&NB?crumbs(cur,'bar'):null;
  if(cr)c.append(cr);c.hidden=!cr}
function updDock(){updCrumb();var x=L[cur],k=document.getElementById('kd');if(!x||!k)return;k.textContent=x.n?'•':'¶';k.title=x.n?t('toNode'):t('toText');k.disabled=cur===0}
[['in',function(){indent(cur,1)}],['ou',function(){indent(cur,-1)}],['kd',function(){toggleKind(cur)}],['mu',function(){move(cur,-1)}],['md',function(){move(cur,1)}]].forEach(function(z){
  var b=document.getElementById(z[0]);b.onpointerdown=function(e){e.preventDefault()};b.onclick=z[1]});

// عرض المستويات: الزرار k بيعرض k مستويات
function showLevel(n){L.forEach(function(x,i){x.c=n==='all'?false:(x.l===n&&hasKids(i))});lvSel=n;saveLocal();render()}
document.querySelectorAll('#lv button').forEach(function(b){b.onclick=function(){var v=b.dataset.n;showLevel(v==='all'?'all':+v)}});

// القائمة
var mb=document.getElementById('mb'),menu=document.getElementById('menu');
function menuOpen(on){menu.hidden=!on;mb.setAttribute('aria-expanded',on)}
mb.onclick=function(e){e.stopPropagation();menuOpen(menu.hidden)};
menu.onclick=function(e){if(e.target.closest('button')&&e.target.id!=='th')menuOpen(false)};
document.addEventListener('click',function(e){if(!menu.hidden&&!menu.contains(e.target))menuOpen(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape')menuOpen(false)});

// المظهر: تلقائي / فاتح / داكن
var THEMES={auto:t('themeAuto'),light:t('themeLight'),dark:t('themeDark')},theme='auto';try{theme=localStorage.getItem('warqati-theme')||'auto'}catch(e){}
function applyTheme(){if(theme==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',theme);document.getElementById('thv').textContent=THEMES[theme]}
document.getElementById('th').onclick=function(){theme={auto:'light',light:'dark',dark:'auto'}[theme];try{localStorage.setItem('warqati-theme',theme)}catch(e){}applyTheme()};
applyTheme();

var dlg=document.getElementById('dlg'),ta=document.getElementById('ta');
document.getElementById('tx').onclick=function(){ta.value=toText();dlg.showModal()};
document.getElementById('cl').onclick=function(){dlg.close()};
document.getElementById('ok').onclick=function(){load(ta.value);dlg.close()};
var hpd=document.getElementById('hpd');
document.getElementById('hp').onclick=function(){hpd.showModal()};
document.getElementById('hpc').onclick=function(){hpd.close()};

var TYPES=[{description:t('txtFile'),accept:{'text/plain':['.txt']}},{description:'Markdown',accept:{'text/markdown':['.md']}},{description:'OPML',accept:{'text/x-opml':['.opml']}},{description:'XMind',accept:{'application/vnd.xmind.workbook':['.xmind']}}];
function extOf(n){var m=/\.(\w+)$/.exec(n||''),e=m?m[1].toLowerCase():'txt';return e==='md'||e==='opml'?e:'txt'}
function esc(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function toText(){return L.map(function(x){return '\t'.repeat(x.l)+(x.n?'> ':'')+x.t}).join('\n')}
function ser(fmt){
  if(fmt==='md')return L.filter(function(x){return x.t.trim()}).map(function(x){return x.n?'  '.repeat(x.l)+x.t:x.l?'  '.repeat(x.l-1)+'- '+x.t:'# '+x.t}).join('\n')+'\n';
  if(fmt==='opml'){var o='<?xml version="1.0" encoding="UTF-8"?>\n<opml version="2.0"><head><title>Warqati</title></head><body>\n',d=-1;
    L.forEach(function(x){while(d>=x.l){o+='</outline>\n';d--}while(d<x.l-1){o+='<outline text="">';d++}o+='<outline text="'+esc(x.t)+'"'+(x.n?' _kind="text"':'')+'>';d=x.l});
    while(d>=0){o+='</outline>\n';d--}return o+'</body></opml>\n'}
  return '﻿'+toText()}
function parseTxt(str){var r=[];str.split(/\r?\n/).forEach(function(s){var m=s.match(/^[\t ]*/)[0],lv=0;
  for(var k=0;k<m.length;k++)lv+=m[k]==='\t'?1:0.25;
  if(s.trim()===''&&!r.length)return;var t=s.trim(),n=/^>/.test(t);if(n)t=t.replace(/^>\s*/,'');r.push(mkLine(t,Math.floor(lv),n))});return r}
function parseMd(str){var r=[],base=0,stack=[];str.split(/\r?\n/).forEach(function(s){
  if(!s.trim())return;var h=/^\s{0,3}(#{1,6})\s+(.*)$/.exec(s);
  if(h){base=h[1].length;r.push({t:h[2].trim(),l:base-1});stack=[];return}
  var it=/^([\t ]*)(?:[-*+]|\d+[.)])\s+(.*)$/.exec(s),w,t=s.trim();
  // سطر عادي: المسافات في أوله (كل مسافتين = مستوى) بتحدد مكانه
  if(!it){w=s.match(/^[\t ]*/)[0].replace(/\t/g,'  ').length;r.push(mkLine(t,Math.round(w/2),true));return}
  w=it[1].replace(/\t/g,'    ').length;t=it[2].trim();
  while(stack.length&&stack[stack.length-1]>=w)stack.pop();
  r.push({t:t,l:base+stack.length});stack.push(w)});return r}
function parseOpml(str){var r=[],doc=new DOMParser().parseFromString(str,'text/xml'),body=doc.querySelector('body');
  (function walk(el,d){for(var c=el.firstElementChild;c;c=c.nextElementSibling){if(c.tagName.toLowerCase()!=='outline')continue;
    r.push(mkLine((c.getAttribute('text')||c.getAttribute('title')||'').trim(),d,c.getAttribute('_kind')==='text'));
    var nt=c.getAttribute('_note');if(nt)nt.split(/\r?\n/).forEach(function(z){r.push(mkLine(z.trim(),d+1,true))});walk(c,d+1)}})(body||doc.documentElement,0);return r}
function normLines(a){var o=L;L=a;normalize(0);L=o;return a}
function parseAny(str,name){str=str.replace(/^﻿/,'');var e=extOf(name),r;
  try{r=e==='md'?parseMd(str):e==='opml'?parseOpml(str):parseTxt(str)}catch(x){r=[]}
  return normLines(r.length?r:[{t:'',l:0}])}
// النسخة النصية: بتستبدل محتوى الكراسة المفتوحة
function load(str,name){snap();L=parseAny(str,name);lvSel=null;save();render()}
function baseName(){return (L[0].t.trim()||'Warqati').replace(/[\\/:*?"<>|]+/g,' ').slice(0,60)}
function setSt(){fnm.textContent=fname||L[0].t.trim()||t('untitled');
  if(full){st.textContent=t('full');st.classList.add('warn');return}
  st.textContent=fname?(dirty?t('fileDirty'):t('fileSaved')):t('localSaved');st.classList.toggle('warn',!!fname&&dirty)}
async function writeFile(){try{var w=await fh.createWritable();await w.write(ser(extOf(fname)));await w.close();dirty=false;setSt()}catch(e){st.textContent=t('fileErr');st.classList.add('warn')}}
function download(name,text,type){var b=new Blob([text],{type:type+';charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(a.href)},5000)}
function dl(fmt,keep){var nm=(fname&&extOf(fname)===fmt)?fname:baseName()+'.'+fmt;
  download(nm,ser(fmt),{txt:'text/plain',md:'text/markdown',opml:'text/x-opml'}[fmt]);
  if(keep){fname=nm;dirty=false;setSt()}}
async function saveAs(){if(window.showSaveFilePicker){try{fh=await showSaveFilePicker({suggestedName:fname||baseName()+'.txt',types:TYPES});fname=fh.name;await writeFile()}catch(e){if(e&&e.name!=='AbortError')dl(extOf(fname),true)}}else dl(extOf(fname),true)}
async function saveNow(){if(!NB)return;if(fh)await writeFile();else await saveAs()}
// فتح ملف بيعمل منه كراسة جديدة، ومش بيكتب على الكراسة المفتوحة
function linkFile(h,name){fh=h;fname=name;dirty=false;setSt()}
async function openFile(){if(window.showOpenFilePicker){try{var h=(await showOpenFilePicker({types:TYPES}))[0],f=await h.getFile();if(isXmind(h.name)){await importFiles([f]);return}newNb(parseAny(await f.text(),h.name));linkFile(h,h.name)}catch(e){if(e&&e.name!=='AbortError')document.getElementById('fi').click()}}else document.getElementById('fi').click()}
document.getElementById('fi').onchange=function(){var fs=[].slice.call(this.files);this.value='';if(fs.length)importFiles(fs)};

// ===== XMind: ملف zip جواه content.json (الإصدارات الجديدة) أو content.xml (XMind 8) =====
function isXmind(n){return /\.xmind$/i.test(n||'')}
// قراءة ملف واحد من جوه الـ zip، والفك بأداة المتصفح نفسها (DecompressionStream)
async function unzipText(buf,name){
  var u=new Uint8Array(buf),dv=new DataView(buf),e=-1,dec=new TextDecoder();
  for(var i=u.length-22;i>=Math.max(0,u.length-65557);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break}
  if(e<0)throw new Error('zip');
  for(var k=0,n=dv.getUint16(e+10,true),p=dv.getUint32(e+16,true);k<n;k++){
    var method=dv.getUint16(p+10,true),size=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    if(dec.decode(u.subarray(p+46,p+46+nl))===name){
      var st=off+30+dv.getUint16(off+26,true)+dv.getUint16(off+28,true),data=u.subarray(st,st+size);
      if(method===0)return dec.decode(data);
      return await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text()}
    p+=46+nl+xl+cl}
  return null}
// فكرة واحدة وفروعها: العنوان اللي فيه كذا سطر أوله فرع، والسطور اللي عليها علامة (●) فروع تحته، والباقي نص عادي
var XB=/^[●•◦▪■◆\-*–]\s*/;
function xmAdd(title,note,d,out,kids){
  var ls=String(title||'').split(/\r?\n/).map(function(s){return s.trim()}).filter(Boolean);
  // فكرة كلها نقط (● … ● …): كل نقطة فرع في نفس المستوى
  if(d>0&&XB.test(ls[0]||''))ls.forEach(function(s){out.push(XB.test(s)?mkLine(s.replace(XB,''),d,false):mkLine(s,d+1,true))});
  else{out.push(mkLine(d===0?ls.join(' — '):(ls.shift()||''),d,false));
    if(d>0)ls.forEach(function(s){out.push(mkLine(s.replace(XB,''),d+1,!XB.test(s)))})}
  String(note||'').split(/\r?\n/).map(function(s){return s.trim()}).filter(Boolean).forEach(function(s){out.push(mkLine(s,d+1,true))});
  kids.forEach(function(k){k(d+1,out)})}
function xmJson(tp){return function(d,out){var c=tp.children||{},nt=tp.notes&&(tp.notes.plain&&tp.notes.plain.content||tp.notes.realHTML&&tp.notes.realHTML.content.replace(/<[^>]+>/g,'\n'))||'';
  xmAdd(tp.title,nt,d,out,(c.attached||[]).concat(c.detached||[]).map(xmJson))}}
function xmXml(el){return function(d,out){var kid=function(n){for(var c=el.firstElementChild;c;c=c.nextElementSibling)if(c.localName===n)return c;return null};
  var ch=kid('children'),ks=[];if(ch)for(var g=ch.firstElementChild;g;g=g.nextElementSibling)if(g.localName==='topics')for(var t=g.firstElementChild;t;t=t.nextElementSibling)if(t.localName==='topic')ks.push(xmXml(t));
  var ti=kid('title'),no=kid('notes'),pl=no&&no.getElementsByTagName('plain')[0];
  xmAdd(ti?ti.textContent:'',pl?pl.textContent:'',d,out,ks)}}
// كل ورقة (Sheet) في الملف بترجع كراسة
async function parseXmind(buf){
  var j=await unzipText(buf,'content.json');
  if(j)return JSON.parse(j).filter(function(s){return s.rootTopic}).map(function(s){var o=[];xmJson(s.rootTopic)(0,o);return normLines(o)});
  var x=await unzipText(buf,'content.xml');if(!x)throw new Error('xmind');
  var doc=new DOMParser().parseFromString(x,'text/xml'),sh=doc.getElementsByTagName('sheet'),r=[];
  for(var i=0;i<sh.length;i++){var tp=null;for(var c=sh[i].firstElementChild;c;c=c.nextElementSibling)if(c.localName==='topic'){tp=c;break}
    if(tp){var o=[];xmXml(tp)(0,o);r.push(normLines(o))}}
  if(!r.length)throw new Error('xmind');return r}
// فتح ملفات (من زرار الفتح أو بالسحب): كل ملف بيبقى كراسة جديدة
async function importFiles(files){
  var made=0,bad=[];
  for(var i=0;i<files.length;i++){var f=files[i];
    try{if(isXmind(f.name)){(await parseXmind(await f.arrayBuffer())).forEach(function(lines){newNb(lines);made++})}
      else if(/\.(txt|md|markdown|opml)$/i.test(f.name)){newNb(parseAny(await f.text(),f.name));if(files.length===1)linkFile(null,f.name);made++}
      else bad.push(f.name)}
    catch(e){bad.push(f.name)}}
  if(bad.length)alert(t('importErr',bad.join('، ')));
  else if(made>1){showLibrary();toast(t('importedN',made))}}
// اسحب ملف وارميه على البرنامج
document.addEventListener('dragover',function(e){if(e.dataTransfer&&[].indexOf.call(e.dataTransfer.types,'Files')>=0){e.preventDefault();e.dataTransfer.dropEffect='copy'}});
document.addEventListener('drop',function(e){if(!e.dataTransfer||!e.dataTransfer.files.length)return;e.preventDefault();importFiles([].slice.call(e.dataTransfer.files))});
document.getElementById('em').onclick=function(){dl('md')};document.getElementById('eo').onclick=function(){dl('opml')};document.getElementById('op').onclick=openFile;document.getElementById('sv').onclick=saveNow;document.getElementById('sa').onclick=saveAs;
// الاختصارات بالـ code مش بالحرف، علشان تشتغل والكيبورد عربي
document.addEventListener('keydown',function(e){if(!(e.ctrlKey||e.metaKey)||e.altKey)return;var c=e.code,ed=!isLib()&&!!NB;
  if(c==='KeyS'){e.preventDefault();saveNow()}
  else if(c==='KeyZ'&&ed){e.preventDefault();e.shiftKey?redo():undo()}
  else if(c==='KeyY'&&ed){e.preventDefault();redo()}
  else if(c==='KeyN'){e.preventDefault();newNb()}
  else if(c==='KeyO'){e.preventDefault();openFile()}
  else if(c==='KeyP'&&ed){e.preventDefault();document.getElementById('pr').click()}});
window.onbeforeunload=function(){if(dirty&&fname)return t('unsaved')};
// الكراسة اللي اتفتحت ومتكتبش فيها حاجة بتتمسح لوحدها لما تسيبها
window.addEventListener('pagehide',function(){if(NB&&isEmpty(L))removeNb(NB,true)});

window.addEventListener('resize',function(){if(!syncFlow())fitStage()});
// بنحوّل لصفحات A4 قبل الطباعة نفسها، لأن beforeprint مش مضمون على كل الموبايلات
document.getElementById('pr').onclick=function(){if(FLOW){setFlow(false);render()}window.print()};
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(!isLib())rerender()});
// لو الكراسات مفتوحة في مكانين (تاب ولوحة جانبية) التعديل يظهر في الاتنين
window.addEventListener('storage',function(e){
  if(e.key===IK){if(isLib())renderLib();else if(NB&&!readIdx().some(function(x){return x.id===NB})){NB=null;showLibrary()}return}
  if(NB&&e.key===nbKey(NB)&&e.newValue){var n;try{n=JSON.parse(e.newValue)}catch(x){return}if(!Array.isArray(n)||!n.length)return;L=n;if(!isLib()){rerender();setSt()}}});
// لف الموبايل أو تغيير عرض النافذة يبدّل بين الورقة المتصلة وصفحات A4
function syncFlow(){if(wantFlow()!==FLOW){setFlow(wantFlow());if(!isLib())rerender();return true}return false}
NARROW.addEventListener('change',syncFlow);
// الطباعة دايماً بصفحات A4 حتى لو الشاشة على الورقة المتصلة
window.addEventListener('beforeprint',function(){if(FLOW){setFlow(false);render()}});
window.addEventListener('afterprint',syncFlow);
// زرار فتح الكراسة في تاب كامل (جوه إضافة المتصفح بس)
var ft=document.getElementById('ft');if(ft&&PANEL&&window.chrome&&chrome.runtime&&chrome.runtime.id){ft.hidden=false;ft.onclick=function(){chrome.runtime.sendMessage({open:'tab',nb:NB})}}
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js');
