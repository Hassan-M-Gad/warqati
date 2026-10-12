// اللغات: العربي هو الأساس (مكتوب في الصفحة نفسها)، والإنجليزي بيتطبّق فوقه
// t('key', a, b) بترجع النص باللغة الحالية، و {0} {1} بيتبدلوا بالقيم
var LANG=(function(){var v=null;try{v=localStorage.getItem('warqati-lang')}catch(e){}
  return v==='ar'||v==='en'?v:(/^ar\b/i.test(navigator.language||'')?'ar':'en')})();
var LOC=LANG==='ar'?'ar-EG':'en-US';
var T={
  ar:{appName:'ورقتي',untitled:'كراسة بدون عنوان',untitledShort:'بدون عنوان',toggleKids:'اضغط لطي/فتح الفروع',
    phTitle:'اكتب العنوان هنا...',phText:'اكتب...',phNode:'فرع جديد...',page:'صفحة {0} من {1}',
    toNode:'حوّله لفرع',toText:'حوّله لنص عادي',mkClosed:'◂',
    themeAuto:'تلقائي',themeLight:'فاتح',themeDark:'داكن',txtFile:'ملف نصي',
    full:'⚠ المساحة امتلت، اعمل نسخة احتياطية',fileDirty:'غير محفوظ في الملف',fileSaved:'✓ محفوظ في الملف',localSaved:'✓ محفوظة على الجهاز',
    fileErr:'تعذر الحفظ في الملف - استخدم حفظ باسم',unsaved:'فيه تعديلات غير محفوظة',
    today:'النهارده {0}',yesterday:'امبارح {0}',restored:'رجعت كراسة «{0}»',trashEmpty:'السلة فاضية.',
    deletedAt:'اتمسحت {0} · هتتمسح نهائي بعد {1} يوم',restore:'رجّعها',deleteForever:'امسح نهائي',
    confirmForever:'تمسح «{0}» نهائي؟ مش هينفع ترجعها.',confirmEmptyTrash:'تفضّي السلة؟ الكراسات اللي فيها هتتمسح نهائي.',
    unpin:'📌 فكّ التثبيت',pin:'📌 ثبّتها فوق',changeColor:'غيّر اللون',del:'🗑 امسحها',movedToTrash:'اتنقلت للسلة',undo:'تراجع',options:'خيارات',
    morning:'صباح الخير ☀️',evening:'مساء الخير 🌙',trashBtn:'🗑 السلة',trashBtnN:'🗑 السلة ({0})',noNotebooks:'لسه مفيش كراسات. ابدأ أول كراسة!',
    noMatch:'مفيش كراسة فيها "{0}"',resume:'كمّل من حيث وقفت',backupName:'كراساتي-{0}.json',notBackup:'الملف ده مش نسخة احتياطية من ورقتي.',
    restoredN:'اترجّع {0} كراسة.',nothingNew:'كل الكراسات اللي في الملف موجودة عندك بالفعل.',start:'يلا نبدأ ✍️',next:'التالي',
    otherCopy:' (نسخة من جهاز تاني)',syIdle:'متزامنة مع Google Drive',syBusy:'بيزامن…',syAuth:'محتاج تسجيل دخول تاني علشان المزامنة تكمّل، اضغط هنا',
    syError:'المزامنة وقفت، اضغط للتفاصيل',syOffline:'مفيش إنترنت، هنزامن لما يرجع',syNeedId:'حط الـ Client ID الأول',syFailed:'الربط ما كملش ({0})',
    syNow:'بيزامن دلوقتي…',syOk:'✓ متزامنة',syLast:'. آخر مزامنة {0}',syStop:'توقف المزامنة على الجهاز ده؟ الكراسات هتفضل موجودة هنا وفي Drive.',
    copied:'✓ اتنسخ',copy:'نسخ',lvAll:'الكل',importErr:'ما قدرتش أفتح: {0}\nالملفات اللي بتتفتح: XMind و txt و md و opml.',importedN:'اتفتح {0} كراسة',continued:'تابع:',
    guide:[['دليل ورقتي ✍️',0],
      ['دي كراسة للتجربة. اكتب وامسح فيها براحتك، ولما تخلص ارجع للرئيسية من 🏠 فوق.',0,1],
      ['ده فرع. اضغط Enter في آخره يطلعلك فرع جديد جنبه',1],
      ['Tab بيدخّل السطر جوه اللي فوقه، و Shift+Tab بيطلّعه',2],
      ['ومفيش حد للتفريع، كمّل لحد ما تحب',3],
      ['ده سطر عادي من غير علامة، زي الكتابة في الكراسة بالظبط.',0,1],
      ['اكتب - ومسافة في أول سطر عادي يتحوّل لفرع.',0,1],
      ['و Backspace في أول الفرع بيرجّعه سطر عادي',1],
      ['اضغط على العلامة اللي جنب الفرع علشان تطوي اللي تحته',1],
      ['السطر ده هيستخبى لما تطوي',2],
      ['اضغط Alt مع السهم لفوق أو لتحت علشان تحرّك السطر بفروعه',1],
      ['ولو غلطت، Ctrl+Z بيرجّع أي حاجة',1],
      ['الأزرار اللي تحت بتعمل نفس الحاجات بالماوس أو على الموبايل.',0,1],
      ['كل حرف بيتحفظ لوحده، ومفيش زرار حفظ.',0,1]]},
  en:{appName:'Warqati',untitled:'Untitled notebook',untitledShort:'Untitled',toggleKids:'Click to fold/unfold',
    phTitle:'Write the title here...',phText:'Write...',phNode:'New branch...',page:'Page {0} of {1}',
    toNode:'Make it a branch',toText:'Make it plain text',mkClosed:'▸',
    themeAuto:'Auto',themeLight:'Light',themeDark:'Dark',txtFile:'Text file',
    full:'⚠ Storage is full, make a backup',fileDirty:'Not saved to file',fileSaved:'✓ Saved to file',localSaved:'✓ Saved on this device',
    fileErr:"Couldn't save to the file - use Save as",unsaved:'You have unsaved changes',
    today:'Today {0}',yesterday:'Yesterday {0}',restored:'Restored “{0}”',trashEmpty:'Trash is empty.',
    deletedAt:'Deleted {0} · gone for good in {1} days',restore:'Restore',deleteForever:'Delete forever',
    confirmForever:'Delete “{0}” forever? This can’t be undone.',confirmEmptyTrash:'Empty the trash? Notebooks in it will be deleted forever.',
    unpin:'📌 Unpin',pin:'📌 Pin to top',changeColor:'Change color',del:'🗑 Delete',movedToTrash:'Moved to trash',undo:'Undo',options:'Options',
    morning:'Good morning ☀️',evening:'Good evening 🌙',trashBtn:'🗑 Trash',trashBtnN:'🗑 Trash ({0})',noNotebooks:'No notebooks yet. Start your first one!',
    noMatch:'No notebook contains "{0}"',resume:'Pick up where you left off',backupName:'warqati-backup-{0}.json',notBackup:'This file is not a Warqati backup.',
    restoredN:'Restored {0} notebook(s).',nothingNew:'All notebooks in this file are already here.',start:'Let’s start ✍️',next:'Next',
    otherCopy:' (copy from another device)',syIdle:'Synced with Google Drive',syBusy:'Syncing…',syAuth:'Sign in again to keep syncing, click here',
    syError:'Sync stopped, click for details',syOffline:'No internet, will sync when it’s back',syNeedId:'Enter the Client ID first',syFailed:'Connection didn’t finish ({0})',
    syNow:'Syncing now…',syOk:'✓ Synced',syLast:'. Last sync {0}',syStop:'Stop syncing on this device? Notebooks stay here and in Drive.',
    copied:'✓ Copied',copy:'Copy',lvAll:'All',importErr:"Couldn't open: {0}\nSupported files: XMind, txt, md and opml.",importedN:'Opened {0} notebooks',continued:'Continued:',
    guide:[['Warqati guide ✍️',0],
      ['This is a practice notebook. Write and delete freely, then go back Home with 🏠 at the top.',0,1],
      ['This is a branch. Press Enter at its end to get a new branch next to it',1],
      ['Tab moves a line inside the one above, and Shift+Tab moves it back out',2],
      ['There is no limit to branching, go as deep as you like',3],
      ['This is a plain line without a mark, just like writing in a notebook.',0,1],
      ['Type - and a space at the start of a plain line to turn it into a branch.',0,1],
      ['And Backspace at the start of a branch turns it back into plain text',1],
      ['Click the mark next to a branch to fold what is under it',1],
      ['This line hides when you fold',2],
      ['Press Alt with the up or down arrow to move a line with its branches',1],
      ['Made a mistake? Ctrl+Z undoes anything',1],
      ['The buttons at the bottom do the same with the mouse or on a phone.',0,1],
      ['Every letter saves itself. There is no save button.',0,1]]}};
function t(k){var s=(T[LANG]&&T[LANG][k]!=null)?T[LANG][k]:T.ar[k];if(typeof s!=='string')return s;
  for(var i=1;i<arguments.length;i++)s=s.split('{'+(i-1)+'}').join(arguments[i]);return s}

// نصوص الصفحة بالإنجليزي: data-i (النص)، data-it (التلميح)، data-ip (النص الباهت)، data-ih (فيه تنسيق)
var H={
  appNameH:'Warqati',menu:'Menu',home:'Home',levels:'Levels',lv0:'Top level only',lv1:'2 levels',lv2:'3 levels',lv3:'4 levels',lvAllT:'Unfold everything',openTab:'Open in a full tab',
  mHome:'Home',mNew:'New notebook',mOpen:'Open a file (XMind, Markdown…)',mSave:'Save to file',mSaveAs:'Save as…',mMd:'Export Markdown',mOpml:'Export OPML',mPrint:'Print / PDF',mText:'Plain-text copy',
  mSync:'Sync with Google Drive',mTheme:'Theme',mHelp:'How to write & shortcuts',mLang:'العربية',mAbout:'About Warqati',mDelete:'Delete this notebook',
  newNb:'＋ New notebook',search:'🔍 Search your notebooks…',shelf:'My notebooks',
  fOpen:'📂 Open file (XMind…)',fBackup:'⇩ Backup',fRestore:'⇧ Restore backup',fHelp:'⌨ How to write',fGuide:'✍️ Warqati guide',fTour:'👋 Welcome tour',
  openLast:'When I open the app, go straight to my last notebook',
  storeNote:'Your notebooks are saved on this device with every letter. Turn on Google Drive sync from ☰ to have them on all your devices.',
  tip:'✍️ This is a practice notebook, try anything here. When you are done, go back Home.',tipHome:'🏠 Go Home',
  dockT:'Line tools',outT:'Move out a level (Shift+Tab)',inT:'Move in a level (Tab)',kdT:'Make it plain text',upT:'Move up (Alt+↑)',downT:'Move down (Alt+↓)',
  txtIntro:'This text is your notebook. Copy it to keep it, or paste an old copy and let it convert (space/Tab = sub-level, and > at the start of a line = plain text):',apply:'Apply',close:'Close',
  hpTitle:'How to write',
  hp1:'New line of the same kind. In the middle of the text it splits the line',hp2:'Move in / out a level (the line and its branches together, with no depth limit)',
  hp3k:'- then space',hp3:'At the start of a plain line: turns it into a branch',hp4k:'Backspace at line start',hp4:'Removes the branch mark and makes it plain text; the next press moves it out a level',
  hp5k:'Enter on an empty line',hp5:'Moves out a level; at the start it leaves the branches for plain text',hp6:'Under a branch: a plain line to explain it. Under text: a new branch',
  hp7:'Move the line and its branches up or down',hp8:'Undo / Redo (any change, even deleting or moving lines)',hp9:'New notebook',hp10:'Save to file',hp11:'Bigger / smaller text (in the app)',
  hpFoot:'Click a branch mark (▾ or •) to fold its branches. The buttons at the bottom do the same on a phone.',ok:'Got it',
  syTitle:'Sync with Google Drive',syIntro:'Your notebooks will be saved in a <b>“Warqati”</b> folder in your Google Drive and stay the same on all your devices. The app only sees the files it created.',
  syWeb:'You need to create a <b>Client ID</b> in Google Cloud once (steps in the README). Add these two addresses to it:',
  syDesk:'In Google Cloud create a new client of type <b>Desktop app</b> (same project), and paste its Client ID and Client secret here. Signing in opens your browser only once.',
  syRedir:'Authorized redirect URI',syOrigin:'Authorized JavaScript origin',syId:'Client ID',sySecret:'Client secret',syConnect:'Connect Google account',
  sySyncNow:'Sync now',syRelogin:'Sign in again',syStopB:'Stop syncing',
  trTitle:'🗑 Trash',trHint:'Deleted notebooks stay here for 30 days, and you can restore them.',trEmpty:'Empty trash',
  welAria:'Welcome to Warqati',w1t:'Welcome to Warqati',w1p:'Pen and paper on your device. Write your thoughts and arrange them in branches, without the fuss.',
  wm1:'Plan for the week',wm2:'A few things for today:',wm3:'• Work',wm4:'– Hand in the design',wm5:'• Home',
  w2t:'Write like a notebook',w2p:'Just write, and Tab makes a branch inside a branch. There is no depth limit, and you can go back to plain text any time.',
  w3t:'Nothing gets lost',w3p:'Every letter saves itself, deleted notebooks stay in the trash for 30 days, and Ctrl+Z undoes anything. You can also sync with Google Drive.',
  skip:'Skip',wLang:'العربية',
  abTitle:'About Warqati',abBody:'Pen and paper for your ideas. Notebooks are stored on your device, and in your own Google Drive only if you turn on sync.',abPrivacy:'Privacy policy',abFont:'Font: Playpen Sans Arabic (SIL Open Font License).'};
function applyLang(){
  var r=document.documentElement;r.lang=LANG;r.dir=LANG==='ar'?'rtl':'ltr';
  if(window.warqatiDesktop&&warqatiDesktop.setLang)warqatiDesktop.setLang(LANG);
  if(LANG==='ar')return;
  document.querySelectorAll('[data-i]').forEach(function(e){var v=H[e.dataset.i];if(v!=null)e.textContent=v});
  document.querySelectorAll('[data-ih]').forEach(function(e){var v=H[e.dataset.ih];if(v!=null)e.innerHTML=v});
  document.querySelectorAll('[data-it]').forEach(function(e){var v=H[e.dataset.it];if(v!=null){e.title=v;if(e.hasAttribute('aria-label'))e.setAttribute('aria-label',v)}});
  document.querySelectorAll('[data-ip]').forEach(function(e){var v=H[e.dataset.ip];if(v!=null)e.placeholder=v});
  // في الإنجليزي الأسهم بتتعكس، والأرقام بتبقى إنجليزي
  document.getElementById('ou').textContent='←';document.getElementById('in').textContent='→';
  document.querySelectorAll('#lv button[data-n]').forEach(function(b){b.textContent=b.dataset.n==='all'?t('lvAll'):String(+b.dataset.n+1)})}
// تغيير اللغة بيعيد فتح الصفحة على نفس الكراسة
function setLang(l){try{localStorage.setItem('warqati-lang',l)}catch(e){}
  if(typeof NB!=='undefined'&&NB&&!document.documentElement.classList.contains('lib'))location.hash='nb='+NB;else history.replaceState(null,'',location.pathname);
  location.reload()}
applyLang();
