// غيّر رقم النسخة مع كل تحديث علشان الأجهزة تاخد الملفات الجديدة
var V='warqati-v13',CORE=['./','index.html','i18n.js','app.js','home.js','sync.js','fonts/fonts.css','manifest.webmanifest','icons/icon.svg','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(CORE)}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==V}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var u=new URL(e.request.url);
  // الخطوط: من الكاش أولاً، وتتحفظ أول مرة تتحمّل
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.open(V).then(function(c){return c.match(e.request).then(function(r){return r||fetch(e.request).then(function(n){c.put(e.request,n.clone());return n})})}));return}
  if(u.origin!==location.origin)return;
  // ملفات التطبيق: الشبكة أولاً علشان التحديثات توصل، والكاش لو مفيش نت
  e.respondWith(fetch(e.request).then(function(n){var cp=n.clone();caches.open(V).then(function(c){c.put(e.request,cp)});return n})
    .catch(function(){return caches.match(e.request,{ignoreSearch:true}).then(function(r){return r||caches.match('index.html')})}));
});
