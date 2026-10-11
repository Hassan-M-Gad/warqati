// ===== الواجهة الرئيسية: الكراسات، السلة، والترحيب أول مرة =====
var TRK='warqati-trash',WK='warqati-welcomed',GK='warqati-guide',TRASH_DAYS=30;
var COVERS=['#b3261e','#1d4ed8','#15803d','#7e22ce','#c2410c','#0e7490','#a16207','#475569'];

function removeNb(id,quiet){if(!quiet&&typeof syOnDelete==='function')syOnDelete(id);
  try{localStorage.removeItem(nbKey(id));writeIdx(readIdx().filter(function(x){return x.id!==id}))}catch(e){}
  if(lsGet(LK)===id)try{localStorage.removeItem(LK)}catch(e){}}
function leaveNb(){if(NB&&isEmpty(L))removeNb(NB);NB=null}
function enter(id,focus){NB=id;L=readNb(id);fh=null;fname='';dirty=false;full=false;lvSel=null;UNDO=[];REDO=[];lsSet(LK,id);
  document.documentElement.classList.remove('lib');document.getElementById('tip').hidden=id!==lsGet(GK);
  setSt();render(focus!=null?focus:(L.length===1&&!L[0].t?0:null))}
function openNb(id){if(id===NB&&!isLib())return;leaveNb();enter(id)}
function newNb(lines){leaveNb();NB=newId();L=lines||[{t:'',l:0}];storeNb(true);enter(NB,lines?null:0)}
function isLib(){return document.documentElement.classList.contains('lib')}
function showLibrary(){leaveNb();menuOpen(false);document.documentElement.classList.add('lib');renderLib();window.scrollTo(0,0)}
function when(ts){if(!ts)return '';var d=new Date(ts),n=new Date(),y=new Date(n);y.setDate(n.getDate()-1);
  var tm=d.toLocaleTimeString(LOC,{hour:'numeric',minute:'2-digit'});
  if(d.toDateString()===n.toDateString())return t('today',tm);if(d.toDateString()===y.toDateString())return t('yesterday',tm);
  return d.toLocaleDateString(LOC,d.getFullYear()===n.getFullYear()?{day:'numeric',month:'long'}:{day:'numeric',month:'long',year:'numeric'})}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}
function patchNb(id,p){var a=readIdx(),e=a.find(function(x){return x.id===id});if(e){Object.assign(e,p);writeIdx(a)}}
function coverOf(e){if(e.color!=null)return COVERS[e.color%COVERS.length];var h=0;for(var i=0;i<e.id.length;i++)h=(h*31+e.id.charCodeAt(i))|0;return COVERS[Math.abs(h)%COVERS.length]}

// رسالة صغيرة تحت، ومعاها زرار تراجع
var toastT;
function toast(msg,label,fn){var t=document.getElementById('toast');t.innerHTML='';t.append(el('span','',msg));
  if(label){var b=el('button','',label);b.onclick=function(){t.hidden=true;fn()};t.append(b)}
  t.hidden=false;clearTimeout(toastT);toastT=setTimeout(function(){t.hidden=true},7000)}

// ===== السلة: الكراسة الممسوحة بتفضل ٣٠ يوم =====
function readTrash(){try{var a=JSON.parse(localStorage.getItem(TRK));return Array.isArray(a)?a:[]}catch(e){return []}}
function writeTrash(a){try{localStorage.setItem(TRK,JSON.stringify(a))}catch(e){}}
function trashNb(id,quiet){
  var e=readIdx().find(function(x){return x.id===id}),lines=readNb(id);
  if(e&&!isEmpty(lines)){var t=readTrash().filter(function(x){return x.id!==id});
    t.unshift({id:id,title:e.title,color:e.color,created:e.created,updated:e.updated,deleted:Date.now(),lines:lines});writeTrash(t)}
  removeNb(id,quiet)}
function restoreNb(id){
  var tr=readTrash(),it=tr.find(function(x){return x.id===id});if(!it)return;
  var nid=readIdx().some(function(x){return x.id===id})?newId():id;
  try{localStorage.setItem(nbKey(nid),JSON.stringify(normLines(it.lines)))}catch(e){return}
  // من غير رقم ملف Drive، فالمزامنة بترفعها من جديد
  var a=readIdx();a.push({id:nid,title:it.title,color:it.color,created:it.created,updated:Date.now()});writeIdx(a);
  writeTrash(tr.filter(function(x){return x!==it}));
  if(typeof syOnChange==='function')syOnChange();
  if(isLib())renderLib();if(document.getElementById('trd').open)renderTrash();
  toast(t('restored',it.title||t('untitledShort')))}
function purgeTrash(){var lim=Date.now()-TRASH_DAYS*864e5,t=readTrash(),k=t.filter(function(x){return x.deleted>lim});if(k.length!==t.length)writeTrash(k)}
function renderTrash(){
  var box=document.getElementById('trl'),tr=readTrash();box.innerHTML='';
  document.getElementById('tre').hidden=!tr.length;
  if(!tr.length){box.append(el('p','empty',t('trashEmpty')));return}
  tr.forEach(function(it){var r=el('div','trow'),info=el('div','');
    info.append(el('b','',it.title||t('untitled')),el('small','',t('deletedAt',when(it.deleted),Math.max(1,Math.ceil((it.deleted+TRASH_DAYS*864e5-Date.now())/864e5)))));
    var rb=el('button','pri',t('restore'));rb.onclick=function(){restoreNb(it.id)};
    var db=el('button','',t('deleteForever'));db.onclick=function(){if(confirm(t('confirmForever',it.title||t('untitledShort')))){writeTrash(readTrash().filter(function(x){return x.id!==it.id}));renderTrash();if(isLib())renderLib()}};
    r.append(info,rb,db);box.append(r)})}
document.getElementById('tre').onclick=function(){if(confirm(t('confirmEmptyTrash'))){writeTrash([]);renderTrash();renderLib()}};
document.getElementById('trc').onclick=function(){document.getElementById('trd').close()};

// ===== الواجهة الرئيسية =====
var cmenu=document.getElementById('cmenu'),cmenuFor=null;
function closeCmenu(){cmenu.hidden=true;cmenuFor=null}
document.addEventListener('click',function(e){if(!cmenu.hidden&&!cmenu.contains(e.target))closeCmenu()});
function openCmenu(e,btn){
  cmenuFor=e.id;cmenu.innerHTML='';
  var pin=el('button','',e.pinned?t('unpin'):t('pin'));pin.onclick=function(){patchNb(e.id,{pinned:!e.pinned});closeCmenu();renderLib()};
  var sw=el('div','sw');COVERS.forEach(function(c,i){var s=el('button','');s.style.background=c;s.title=t('changeColor');if(coverOf(e)===c)s.className='on';
    s.onclick=function(){patchNb(e.id,{color:i});closeCmenu();renderLib()};sw.append(s)});
  var del=el('button','danger',t('del'));del.onclick=function(){closeCmenu();trashNb(e.id);renderLib();toast(t('movedToTrash'),t('undo'),function(){restoreNb(e.id)})};
  cmenu.append(pin,sw,del);cmenu.hidden=false;
  var r=btn.getBoundingClientRect();cmenu.style.top=(r.bottom+window.scrollY+4)+'px';
  cmenu.style.left=Math.max(8,Math.min(r.left+window.scrollX,document.documentElement.clientWidth-cmenu.offsetWidth-8))+'px'}
function preview(lines,n){return lines.slice(1).filter(function(x){return x.t.trim()}).slice(0,n).map(function(x){return x.t.trim()})}
function cover(e){
  var lines=readNb(e.id),c=el('div','cover');c.style.setProperty('--cc',coverOf(e));c.tabIndex=0;c.setAttribute('role','button');
  c.append(el('div','ct',e.title||t('untitled')));
  var pv=el('div','cp');preview(lines,3).forEach(function(t){pv.append(el('div','',t))});c.append(pv);
  c.append(el('div','cm',when(e.updated)));
  if(e.pinned)c.append(el('span','pin','📌'));
  var more=el('button','more','⋯');more.title=t('options');more.onclick=function(ev){ev.stopPropagation();cmenuFor===e.id?closeCmenu():openCmenu(e,more)};c.append(more);
  c.onclick=function(){openNb(e.id)};c.onkeydown=function(ev){if(ev.key==='Enter'&&ev.target===c)openNb(e.id)};
  return c}
function renderLib(){
  // كراسات فاضية فضلت من برنامج اتقفل فجأة
  readIdx().forEach(function(e){if(e.id!==NB&&isEmpty(readNb(e.id)))removeNb(e.id,true)});
  purgeTrash();closeCmenu();
  var h=new Date().getHours();document.getElementById('hi').textContent=h<12?t('morning'):t('evening');
  document.getElementById('today').textContent=new Date().toLocaleDateString(LOC,{weekday:'long',day:'numeric',month:'long'});
  var a=readIdx().sort(function(x,y){return (y.pinned?1:0)-(x.pinned?1:0)||(y.updated||0)-(x.updated||0)}),
      last=lsGet(LK),qi=document.getElementById('q'),q=qi.value.trim(),cont=document.getElementById('cont'),list=document.getElementById('list');
  cont.innerHTML='';list.innerHTML='';qi.hidden=a.length<4&&!q;
  var tn=readTrash().length;document.getElementById('trb').textContent=tn?t('trashBtnN',tn):t('trashBtn');
  if(!a.length){var em=el('div','empty big');em.append(el('div','ei','📓'),el('p','',t('noNotebooks')));cont.append(em);document.getElementById('shelf-h').hidden=true;return}
  if(q){var m=a.filter(function(e){return (e.title+' '+readNb(e.id).map(function(x){return x.t}).join(' ')).indexOf(q)>=0});
    document.getElementById('shelf-h').hidden=true;
    if(!m.length)list.append(el('div','empty',t('noMatch',q)));m.forEach(function(e){list.append(cover(e))});return}
  // كمّل من حيث وقفت
  var top=a.slice().sort(function(x,y){return (x.id===last?-1:0)-(y.id===last?-1:0)||(y.updated||0)-(x.updated||0)})[0];
  var k=el('div','resume');k.style.setProperty('--cc',coverOf(top));k.tabIndex=0;k.setAttribute('role','button');
  var kt=el('div','rt');kt.append(el('small','',t('resume')),el('b','',top.title||t('untitled')),el('span','',preview(readNb(top.id),2).join(' · ')||when(top.updated)));
  k.append(kt,el('span','go','←'));k.onclick=function(){openNb(top.id)};k.onkeydown=function(ev){if(ev.key==='Enter')openNb(top.id)};
  cont.append(k);
  document.getElementById('shelf-h').hidden=false;document.getElementById('shelf-n').textContent=a.length;
  a.forEach(function(e){list.append(cover(e))})}
document.getElementById('q').oninput=renderLib;
document.getElementById('nn').onclick=function(){newNb()};
document.getElementById('nw').onclick=function(){newNb()};
document.getElementById('lb').onclick=showLibrary;
document.getElementById('lbb').onclick=showLibrary;
document.getElementById('of').onclick=openFile;
document.getElementById('trb').onclick=function(){renderTrash();document.getElementById('trd').showModal()};
document.getElementById('hp2').onclick=function(){hpd.showModal()};
document.getElementById('rm').onclick=function(){if(!NB)return;var id=NB;trashNb(id);NB=null;showLibrary();toast(t('movedToTrash'),t('undo'),function(){restoreNb(id)})};
document.getElementById('tiph').onclick=showLibrary;
var ol=document.getElementById('ol');ol.checked=lsGet(OK_LAST)==='1';ol.onchange=function(){lsSet(OK_LAST,ol.checked?'1':'0')};

// ===== نسخة احتياطية لكل الكراسات في ملف واحد، واسترجاعها =====
document.getElementById('bk').onclick=function(){
  var a=readIdx().map(function(e){return Object.assign({},e,{lines:readNb(e.id)})});
  download(t('backupName',new Date().toISOString().slice(0,10)),JSON.stringify({app:'warqati',version:1,exported:Date.now(),notebooks:a},null,1),'application/json')};
document.getElementById('rs').onclick=function(){document.getElementById('fj').click()};
document.getElementById('fj').onchange=function(){var f=this.files[0];this.value='';if(!f)return;f.text().then(function(txt){
  var d;try{d=JSON.parse(txt)}catch(e){}
  if(!d||!Array.isArray(d.notebooks)){alert(t('notBackup'));return}
  var a=readIdx(),n=0;
  d.notebooks.forEach(function(b){if(!b||!b.id||!Array.isArray(b.lines)||!b.lines.length)return;
    var ex=a.find(function(x){return x.id===b.id});if(ex&&(ex.updated||0)>=(b.updated||0))return;
    var meta={id:String(b.id),title:String(b.title||''),created:b.created||Date.now(),updated:b.updated||Date.now()};
    var lines=b.lines.filter(function(x){return x&&typeof x.t==='string'}).map(function(x){return mkLine(x.t,Math.max(0,x.l|0),!!x.n)});
    if(!lines.length)return;
    try{localStorage.setItem(nbKey(meta.id),JSON.stringify(normLines(lines)))}catch(e){return}
    if(ex)Object.assign(ex,meta);else a.push(meta);n++});
  try{writeIdx(a)}catch(e){}
  if(n&&typeof syOnChange==='function')syOnChange();
  renderLib();alert(n?t('restoredN',n):t('nothingNew'))})};

// ===== أول مرة: ترحيب، وبعدين كراسة تعليمية تجرّب فيها =====
function guideLines(l){return T[l].guide.map(function(g){return mkLine(g[0],g[1],!!g[2])})}
// الدليل بيتبع لغة البرنامج: لو ما اتعدلش بيتترجم مكانه، ولو اتعدل بيفضل كراسة عادية للمستخدم
function syncGuideLang(){var id=lsGet(GK);if(!id||!readIdx().some(function(x){return x.id===id}))return;
  var gl=lsGet(GK+'-lang');if(gl===LANG)return;
  var cur=JSON.stringify(readNb(id).map(function(x){return [x.t,x.l,!!x.n]})),same=function(l){return JSON.stringify(guideLines(l).map(function(x){return [x.t,x.l,!!x.n]}))===cur};
  var from=gl?(same(gl)?gl:null):(same('ar')?'ar':same('en')?'en':null);
  if(from){var lines=guideLines(LANG);try{localStorage.setItem(nbKey(id),JSON.stringify(lines))}catch(e){return}patchNb(id,{title:lines[0].t,updated:Date.now()});lsSet(GK+'-lang',LANG);if(typeof syOnChange==='function')syOnChange()}
  else{try{localStorage.removeItem(GK);localStorage.removeItem(GK+'-lang')}catch(e){}}}
function openGuide(){syncGuideLang();var id=lsGet(GK);
  if(id&&readIdx().some(function(x){return x.id===id})){openNb(id);return}
  newNb(guideLines(LANG));lsSet(GK,NB);lsSet(GK+'-lang',LANG);patchNb(NB,{color:1});document.getElementById('tip').hidden=false}
var wel=document.getElementById('wel'),ws=0;
function welShow(i){ws=i;var sl=wel.querySelectorAll('.slide');sl.forEach(function(s,k){s.hidden=k!==i});
  wel.querySelectorAll('.dots i').forEach(function(d,k){d.className=k===i?'on':''});
  document.getElementById('wnext').textContent=i===sl.length-1?t('start'):t('next')}
function welcome(){wel.hidden=false;welShow(0);document.getElementById('wnext').focus()}
function welDone(guide){wel.hidden=true;lsSet(WK,'1');if(guide)openGuide();else renderLib()}
document.getElementById('wnext').onclick=function(){if(ws<wel.querySelectorAll('.slide').length-1)welShow(ws+1);else welDone(true)};
document.getElementById('wskip').onclick=function(){welDone(false)};
wel.addEventListener('keydown',function(e){if(e.key==='Escape')welDone(false)});
document.getElementById('wl').onclick=function(){showLibrary();welcome()};
document.getElementById('gd').onclick=openGuide;
document.getElementById('wlang').onclick=function(){setLang(LANG==='ar'?'en':'ar')};
document.getElementById('lg').onclick=function(){setLang(LANG==='ar'?'en':'ar')};
var abd=document.getElementById('abd');
document.getElementById('ab').onclick=function(){abd.showModal()};
document.getElementById('abc').onclick=function(){abd.close()};
if(window.warqatiDesktop&&warqatiDesktop.version)warqatiDesktop.version().then(function(v){document.getElementById('abv').textContent=v});
else if(window.chrome&&chrome.runtime&&chrome.runtime.getManifest)document.getElementById('abv').textContent=chrome.runtime.getManifest().version;
// في البرنامج صفحة الخصوصية بتفتح جوه نفس النافذة
if(window.warqatiDesktop)document.getElementById('abp').onclick=function(e){e.preventDefault();location.href='privacy.html?back=1'};

// رابط فيه #nb=... بيفتح الكراسة دي على طول
function hashNb(){var m=/nb=([\w-]+)/.exec(location.hash);return m&&readIdx().some(function(x){return x.id===m[1]})?m[1]:null}
window.addEventListener('hashchange',function(){var id=hashNb();if(id)openNb(id)});

// البداية: أول مرة ترحيب، وبعد كده الواجهة الرئيسية (أو آخر كراسة لو اخترت كده)
(function start(){
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(function(){});
  syncGuideLang();
  var a=readIdx(),last=lsGet(LK),h=hashNb();
  if(h){enter(h);history.replaceState(null,'',location.pathname+location.search)}
  else if(lsGet(WK)!=='1'){showLibrary();welcome()}
  else if(ol.checked&&a.some(function(x){return x.id===last}))enter(last);
  else showLibrary()})();
