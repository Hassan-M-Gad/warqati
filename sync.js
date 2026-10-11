// مزامنة الكراسات مع Google Drive
// كل كراسة ملف JSON في فولدر "ورقتي" في Drive (صلاحية drive.file: التطبيق يشوف الملفات اللي هو عملها بس)
// الأحدث بيكسب، ولو الكراسة اتعدلت في جهازين قبل ما يتزامنوا بنحتفظ بالنسختين
var SY={CK:'warqati-gcid',SK:'warqati-sync',TK:'warqati-token',TOMB:'warqati-tomb',LOCK:'warqati-sync-lock',
  SCOPE:'https://www.googleapis.com/auth/drive.file',FOLDER:'Warqati',
  API:'https://www.googleapis.com/drive/v3',UP:'https://www.googleapis.com/upload/drive/v3',
  state:'off',msg:'',timer:null,again:false,running:false};
var EXT=!!(window.chrome&&chrome.runtime&&chrome.runtime.id),DESK=window.warqatiDesktop||null;
function syGet(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function sySet(k,v){try{if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function syCfg(){return syGet(SY.SK,{})}
function sySetCfg(p){sySet(SY.SK,Object.assign(syCfg(),p))}
function syClientId(){return syGet(SY.CK,'')}
function syOn(){return !!(syCfg().on&&syClientId())}
function syRedirect(){return EXT&&chrome.identity?chrome.identity.getRedirectURL():new URL('oauth.html',location.href).href}
function syErr(kind,m){var e=new Error(m||kind);e.kind=kind;return e}

// ===== تسجيل الدخول (OAuth من غير سيرفر: التوكن صالح ساعة) =====
function syToken(){var t=syGet(SY.TK,null);return t&&t.exp>Date.now()+60000?t.v:null}
function syAuthUrl(silent,state){var p=new URLSearchParams({client_id:syClientId(),redirect_uri:syRedirect(),response_type:'token',scope:SY.SCOPE,include_granted_scopes:'true',state:state});
  if(silent)p.set('prompt','none');return 'https://accounts.google.com/o/oauth2/v2/auth?'+p}
function syTakeHash(h,state){var p=new URLSearchParams(String(h||'').replace(/^#/,''));
  if(p.get('state')!==state)throw syErr('auth','state');if(p.get('error'))throw syErr('auth',p.get('error'));
  var v=p.get('access_token');if(!v)throw syErr('auth','no token');
  sySet(SY.TK,{v:v,exp:Date.now()+(+p.get('expires_in')||3600)*1000});return v}
function syLogin(interactive){
  var state=Math.random().toString(36).slice(2);
  // برنامج الويندوز: الدخول بيفتح المتصفح مرة واحدة، وبعدها البرنامج بيجدد لوحده
  if(DESK){var p=interactive?DESK.login(syClientId(),(document.getElementById('sye').value||'').trim()||null):DESK.token();
    return p.then(function(t){if(!t||!t.access_token)throw syErr('auth','needs login');sySet(SY.TK,{v:t.access_token,exp:Date.now()+(t.expires_in||3600)*1000});return t.access_token},function(e){throw syErr('auth',e&&e.message)})}
  // الإضافة: المتصفح بيفتح صفحة جوجل ويرجّع التوكن، وينفع من غير ما يظهر حاجة لو الحساب متسجل
  if(EXT)return new Promise(function(res,rej){chrome.identity.launchWebAuthFlow({url:syAuthUrl(!interactive,state),interactive:!!interactive},function(u){
    if(chrome.runtime.lastError||!u)return rej(syErr('auth',(chrome.runtime.lastError||{}).message||'cancel'));
    try{res(syTakeHash(new URL(u).hash,state))}catch(e){rej(e)}})});
  // الموقع: نافذة صغيرة بتفتح oauth.html وهي بتبعت التوكن هنا
  if(!interactive)return Promise.reject(syErr('auth','needs click'));
  return new Promise(function(res,rej){
    var bc=null,done=false,to;
    function finish(h){if(done)return;done=true;clearTimeout(to);window.removeEventListener('message',onMsg);if(bc)bc.close();try{res(syTakeHash(h,state))}catch(e){rej(e)}}
    function onMsg(e){if(e.origin===location.origin&&e.data&&e.data.type==='warqati-oauth')finish(e.data.hash)}
    window.addEventListener('message',onMsg);
    try{bc=new BroadcastChannel('warqati-oauth');bc.onmessage=function(e){if(e.data&&e.data.type==='warqati-oauth')finish(e.data.hash)}}catch(e){}
    to=setTimeout(function(){if(!done){done=true;window.removeEventListener('message',onMsg);if(bc)bc.close();rej(syErr('auth','timeout'))}},180000);
    if(!window.open(syAuthUrl(false,state),'warqati-auth','width=480,height=640')){done=true;clearTimeout(to);rej(syErr('auth','popup'))}})}
async function gfetch(url,opt){
  opt=opt||{};var t=syToken();
  if(!t){try{t=await syLogin(false)}catch(e){throw syErr('auth')}}
  var o=Object.assign({},opt,{headers:Object.assign({Authorization:'Bearer '+t},opt.headers||{})}),r;
  try{if(DESK){var x=await DESK.fetch(url,{method:o.method,headers:o.headers,body:o.body});r={ok:x.status>=200&&x.status<300,status:x.status,json:function(){return Promise.resolve(JSON.parse(x.body))}}}else r=await fetch(url,o)}catch(e){throw syErr('offline')}
  if(r.status===401){sySet(SY.TK,null);if(!opt.retried)return gfetch(url,Object.assign({},opt,{retried:true}));throw syErr('auth')}
  if(!r.ok)throw syErr(r.status===404?'missing':'error','Drive '+r.status);
  return r}

// ===== Google Drive =====
var DRIVE={
  folder:async function(){
    var c=syCfg();
    if(c.folder){try{var j0=await (await gfetch(SY.API+'/files/'+c.folder+'?fields=id,trashed')).json();if(!j0.trashed)return c.folder}catch(e){if(e.kind!=='missing')throw e}}
    // الفولدر القديم كان اسمه بالعربي، فبندوّر على الاسمين علشان كل الأجهزة توصل لنفس الكراسات
    var q="mimeType='application/vnd.google-apps.folder' and (name='"+SY.FOLDER+"' or name='ورقتي') and trashed=false";
    var j=await (await gfetch(SY.API+'/files?q='+encodeURIComponent(q)+'&orderBy=createdTime&fields=files(id)')).json(),id=j.files&&j.files[0]&&j.files[0].id;
    if(!id)id=(await (await gfetch(SY.API+'/files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:SY.FOLDER,mimeType:'application/vnd.google-apps.folder'})})).json()).id;
    sySetCfg({folder:id});return id},
  list:async function(folder){var out=[],tok='';
    do{var q="'"+folder+"' in parents and trashed=false";
      var j=await (await gfetch(SY.API+'/files?pageSize=1000&q='+encodeURIComponent(q)+'&fields=nextPageToken,files(id,appProperties)'+(tok?'&pageToken='+tok:''))).json();
      out=out.concat(j.files||[]);tok=j.nextPageToken}while(tok);
    return out},
  get:async function(fid){return (await gfetch(SY.API+'/files/'+fid+'?alt=media')).json()},
  put:async function(fid,folder,meta,body){
    var m={name:meta.name,appProperties:meta.appProperties,mimeType:'application/json'};if(!fid)m.parents=[folder];
    var b='warqati'+Math.random().toString(36).slice(2),data='--'+b+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(m)+'\r\n--'+b+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+body+'\r\n--'+b+'--';
    var r=await gfetch(SY.UP+'/files'+(fid?'/'+fid:'')+'?uploadType=multipart&fields=id',{method:fid?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body:data});
    return (await r.json()).id},
  // المسح بيودّي الملف لسلة المهملات في Drive، فينفع يترجع من هناك
  trash:async function(fid){try{await gfetch(SY.API+'/files/'+fid+'?fields=id',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({trashed:true})})}catch(e){if(e.kind!=='missing')throw e}}};

// ===== المزامنة =====
function syClean(a){var r=(Array.isArray(a)?a:[]).filter(function(x){return x&&typeof x.t==='string'}).map(function(x){var o=mkLine(x.t,Math.max(0,x.l|0),!!x.n);if(x.c)o.c=true;return o});
  return normLines(r.length?r:[{t:'',l:0}])}
function idxPatch(id,p){var a=readIdx(),e=a.find(function(x){return x.id===id});if(!e)return null;Object.assign(e,p);writeIdx(a);return e}
function syFileName(t){return (t||'Untitled').replace(/[\\/:*?"<>|]+/g,' ').slice(0,80)+'.json'}
async function syUpload(id,fid,folder){
  var e=readIdx().find(function(x){return x.id===id});if(!e)return;
  var lines=readNb(id),title=lines[0].t.trim(),body=JSON.stringify({app:'warqati',version:1,id:id,title:title,created:e.created,updated:e.updated,lines:lines});
  var nf=await DRIVE.put(fid,folder,{name:syFileName(title),appProperties:{nb:id,updated:String(e.updated||0)}},body);
  idxPatch(id,{fid:nf,synced:e.updated||0})}
// تنزيل نسخة أحدث، بشرط إن الكراسة ما اتعدلتش هنا وإحنا بنزامن
function syApply(id,d,fid,ru,expect){
  var cur=readIdx().find(function(x){return x.id===id});if(!cur||(cur.updated||0)!==expect){SY.again=true;return}
  var lines=syClean(d.lines);localStorage.setItem(nbKey(id),JSON.stringify(lines));
  idxPatch(id,{title:lines[0].t.trim(),updated:ru,synced:ru,fid:fid});
  if(id===NB){L=readNb(id);if(!isLib()){rerender();setSt()}}}
function syAdd(id,d,fid,ru){
  var lines=syClean(d.lines),a=readIdx();if(a.some(function(x){return x.id===id}))return;
  localStorage.setItem(nbKey(id),JSON.stringify(lines));
  a.push({id:id,title:lines[0].t.trim(),created:d.created||ru,updated:ru,synced:ru,fid:fid});writeIdx(a)}
// نسخة تانية لما الكراسة تتعدل في جهازين في نفس الوقت
function syKeepCopy(d){
  var lines=syClean(d.lines),id=newId(),now=Date.now();lines[0].t=(lines[0].t.trim()||t('untitledShort'))+t('otherCopy');
  localStorage.setItem(nbKey(id),JSON.stringify(lines));var a=readIdx();a.push({id:id,title:lines[0].t,created:now,updated:now});writeIdx(a);SY.again=true}
// اتمسحت من جهاز تاني: بتروح للسلة هنا كمان، فينفع ترجع
function syDropLocal(id){trashNb(id,true);if(id===NB){NB=null;showLibrary()}}
async function syncNow(){
  if(!syOn())return;
  if(SY.running){SY.again=true;return}
  // قفل بسيط علشان التاب واللوحة الجانبية ما يزامنوش في نفس اللحظة
  var lk=syGet(SY.LOCK,0);if(lk&&Date.now()-lk<60000){syLater(15000);return}
  SY.running=true;sySet(SY.LOCK,Date.now());syShow('busy');
  try{
    var folder=await DRIVE.folder(),remote=await DRIVE.list(folder),R={},dup=[];
    remote.forEach(function(f){var p=f.appProperties||{};if(!p.nb)return;f.upd=+p.updated||0;var o=R[p.nb];
      if(!o||f.upd>o.upd){if(o)dup.push(o);R[p.nb]=f}else dup.push(f)});
    for(var k=0;k<dup.length;k++)await DRIVE.trash(dup[k].id);
    // كراسات اتمسحت على الجهاز ده
    var tomb=syGet(SY.TOMB,[]),done={};
    for(k=0;k<tomb.length;k++){if(R[tomb[k]]){await DRIVE.trash(R[tomb[k]].id);delete R[tomb[k]]}done[tomb[k]]=1}
    sySet(SY.TOMB,syGet(SY.TOMB,[]).filter(function(x){return !done[x]}));
    var local=readIdx();
    for(k=0;k<local.length;k++){
      var e=local[k],f=R[e.id],lu=e.updated||0,ls=e.synced||0;delete R[e.id];
      if(f){var ru=f.upd;
        if(ru===lu){if(e.fid!==f.id||ls!==lu)idxPatch(e.id,{fid:f.id,synced:lu});continue}
        if(lu>ls&&ru>ls){
          // اتعدلت هنا وهناك: لو المحتوى مختلف بنحتفظ بنسخة الجهاز التاني ككراسة لوحدها
          var d=await DRIVE.get(f.id);
          if(JSON.stringify(syClean(d.lines))!==JSON.stringify(syClean(readNb(e.id))))syKeepCopy(d);
          await syUpload(e.id,f.id,folder)}
        else if(ru>lu)syApply(e.id,await DRIVE.get(f.id),f.id,ru,lu);
        else await syUpload(e.id,f.id,folder)}
      else if(e.fid&&ls===lu)syDropLocal(e.id);            // اتمسحت من جهاز تاني
      else if(!isEmpty(readNb(e.id)))await syUpload(e.id,null,folder)}
    // كراسات جديدة من أجهزة تانية
    for(var id in R)syAdd(id,await DRIVE.get(R[id].id),R[id].id,R[id].upd);
    sySetCfg({last:Date.now()});syShow('idle');
    if(isLib())renderLib()}
  catch(err){syShow(err.kind==='missing'?'error':(err.kind||'error'),err.message);if(err.kind==='offline')syLater(60000)}
  finally{SY.running=false;sySet(SY.LOCK,0);if(SY.again){SY.again=false;syLater(1500)}}}
function syLater(ms){clearTimeout(SY.timer);SY.timer=setTimeout(syncNow,ms)}
// app.js بينادي دول مع كل تعديل أو مسح
function syOnChange(){if(syOn())syLater(4000)}
function syOnDelete(id){if(!syOn())return;var t=syGet(SY.TOMB,[]);if(t.indexOf(id)<0)t.push(id);sySet(SY.TOMB,t);syLater(2000)}

// ===== الواجهة =====
var syb=document.getElementById('sy'),syd=document.getElementById('syd');
var SYS={idle:['☁',t('syIdle')],busy:['⟳',t('syBusy')],auth:['🔑',t('syAuth')],
  error:['⚠',t('syError')],offline:['☁',t('syOffline')]};
function syShow(s,m){SY.state=s;SY.msg=m||'';
  syb.hidden=!syOn();if(syOn()){var v=SYS[s]||SYS.idle;syb.textContent=v[0];syb.title=v[1];syb.className='ib sy-'+s}
  if(syd.open)syDialog()}
async function syConnect(){
  var id=document.getElementById('syc').value.trim();if(id)sySet(SY.CK,id);
  if(!syClientId()){syShow(SY.state,t('syNeedId'));syDialog();return}
  try{await syLogin(true);sySetCfg({on:true});syShow('busy');syDialog();await syncNow()}
  catch(e){syShow(syOn()?'auth':'off');SY.msg=t('syFailed',e.message);syDialog()}}
function syDialog(){
  var on=syOn(),c=syCfg();
  document.getElementById('sy-setup').hidden=on;document.getElementById('sy-on').hidden=!on;
  document.getElementById('syc').value=syClientId();
  document.getElementById('syr').value=syRedirect();
  document.getElementById('syo').value=location.origin;document.getElementById('syo-row').hidden=EXT||!!DESK;
  document.getElementById('syr-row').hidden=!!DESK;document.getElementById('sye-row').hidden=!DESK;
  document.getElementById('sy-web').hidden=!!DESK;document.getElementById('sy-desk').hidden=!DESK;
  document.getElementById('sys').textContent=on?(SY.state==='busy'?t('syNow'):SY.state==='idle'?t('syOk')+(c.last?t('syLast',when(c.last)):''):(SYS[SY.state]||SYS.error)[1]):'';
  document.getElementById('sym').textContent=SY.msg;
  document.getElementById('syl').hidden=!on||SY.state!=='auth'}
document.getElementById('syb').onclick=function(){syDialog();syd.showModal()};
syb.onclick=function(){if(SY.state==='auth')syConnect();else{syDialog();syd.showModal()}};
document.getElementById('syk').onclick=syConnect;
document.getElementById('syl').onclick=syConnect;
document.getElementById('syn').onclick=function(){syncNow()};
document.getElementById('syx').onclick=function(){if(confirm(t('syStop'))){sySetCfg({on:false});sySet(SY.TK,null);if(DESK)DESK.logout();syShow('off');syDialog()}};
document.getElementById('syq').onclick=function(){syd.close()};
document.querySelectorAll('#syd .cp').forEach(function(b){b.onclick=function(){var i=document.getElementById(b.dataset.for);i.select();
  (navigator.clipboard?navigator.clipboard.writeText(i.value):Promise.reject()).catch(function(){document.execCommand('copy')});b.textContent=t('copied');setTimeout(function(){b.textContent=t('copy')},1500)}});

// إمتى نزامن: أول ما نفتح، ولما نرجع للصفحة، ولما النت يرجع، وكل دقيقتين
syShow(syOn()?'idle':'off');
if(syOn())syLater(800);
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&syOn())syLater(500)});
window.addEventListener('online',function(){if(syOn())syLater(500)});
setInterval(function(){if(document.visibilityState==='visible'&&syOn()&&SY.state!=='auth')syncNow()},120000);
