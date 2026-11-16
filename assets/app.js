/* Naik — personal weight-gain journal. Offline-first; data is stored locally in this browser. */
(() => {
  'use strict';
  const STORE_KEY = 'naik-pwa-v1';
  const TODAY = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const dateFrom = value => { const [y,m,d] = String(value).split('-').map(Number); return new Date(y,m-1,d,12); };
  const dateShift = (iso, offset) => { const d = dateFrom(iso); d.setDate(d.getDate()+offset); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  const daysBetween = (a,b) => Math.round((Date.UTC(...a.split('-').map((v,i)=>i===1?Number(v)-1:Number(v))) - Date.UTC(...b.split('-').map((v,i)=>i===1?Number(v)-1:Number(v))))/86400000);
  const formatDate = (iso, options={day:'numeric',month:'long',year:'numeric'}) => dateFrom(iso).toLocaleDateString('id-ID',options);
  const nf = (n,max=0) => Number(n||0).toLocaleString('id-ID',{minimumFractionDigits:0,maximumFractionDigits:max});
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  const esc = text => String(text??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const presetFoods = [
    {id:'padang-ayam',name:'Nasi Padang ayam',emoji:'🍛',cal:730,protein:35,type:'lunch'},
    {id:'sarapan-komplet',name:'2 telur + pisang + susu',emoji:'🥚',cal:410,protein:22,type:'breakfast'},
    {id:'nasi-telur',name:'Nasi telur',emoji:'🍳',cal:510,protein:20,type:'dinner'},
    {id:'ayam-rica',name:'Nasi ayam rica-rica',emoji:'🍗',cal:680,protein:34,type:'lunch'},
    {id:'geprek',name:'Nasi ayam geprek',emoji:'🍚',cal:720,protein:34,type:'dinner'},
    {id:'sate-ayam',name:'Sate ayam + lontong',emoji:'🍢',cal:610,protein:31,type:'dinner'},
    {id:'bubur',name:'Bubur ayam',emoji:'🥣',cal:370,protein:16,type:'breakfast'},
    {id:'lontong',name:'Lontong sayur',emoji:'🥘',cal:500,protein:12,type:'breakfast'},
    {id:'telur',name:'2 telur rebus',emoji:'🥚',cal:150,protein:13,type:'breakfast'},
    {id:'susu',name:'Susu full cream 250 ml',emoji:'🥛',cal:155,protein:8,type:'late'},
    {id:'pisang',name:'Pisang ukuran sedang',emoji:'🍌',cal:105,protein:1,type:'breakfast'},
    {id:'roti',name:'Roti + selai kacang',emoji:'🍞',cal:340,protein:11,type:'snack'},
    {id:'tempe',name:'Tempe goreng 2 potong',emoji:'🌱',cal:180,protein:11,type:'snack'},
    {id:'yogurt',name:'Yogurt + kacang',emoji:'🥜',cal:290,protein:13,type:'late'},
    {id:'oat',name:'Oat + susu',emoji:'🥣',cal:315,protein:14,type:'late'},
  ];
  const foodById = id => [...presetFoods,...data.favoriteFoods].find(food=>food.id===id);
  const suggestedMeals = [
    {time:'09.30',label:'Sarapan',type:'breakfast',food:'sarapan-komplet',secondary:'2 telur + pisang + susu',kcal:'±410 kkal',icon:'🥚'},
    {time:'13.00',label:'Makan siang',type:'lunch',food:'padang-ayam',secondary:'Nasi Padang ayam + sayur',kcal:'±730 kkal',icon:'🍛'},
    {time:'16.30',label:'Camilan sore',type:'snack',food:'roti',secondary:'Roti dengan selai kacang',kcal:'±340 kkal',icon:'🍞'},
    {time:'19.30',label:'Makan malam',type:'dinner',food:'ayam-rica',secondary:'Nasi ayam rica-rica',kcal:'±680 kkal',icon:'🍗'},
    {time:'22.30',label:'Camilan malam',type:'late',food:'yogurt',secondary:'Yogurt dan kacang',kcal:'±290 kkal',icon:'🥜'},
  ];
  const typeLabels = {breakfast:'Sarapan',lunch:'Makan siang',snack:'Camilan sore',dinner:'Makan malam',late:'Camilan malam'};
  const exercises = [
    {id:'squat',name:'Bodyweight squat',prescription:'2 set × 10–12 repetisi',desc:'Turunkan pinggul dengan kontrol, jaga tumit tetap menapak.'},
    {id:'pushup',name:'Incline push-up',prescription:'2 set × 8–12 repetisi',desc:'Tangan pada meja yang kokoh; badan tetap lurus selama gerakan.'},
    {id:'row',name:'Backpack row',prescription:'2 set × 10–12 repetisi',desc:'Tarik tas berisi beban ringan, dekatkan siku ke badan.'},
    {id:'bridge',name:'Glute bridge',prescription:'2 set × 12 repetisi',desc:'Angkat pinggul perlahan sambil mengencangkan otot bokong.'},
    {id:'plank',name:'Plank',prescription:'2 set × 20–30 detik',desc:'Tahan tubuh lurus dan tetap bernapas secara normal.'},
  ];
  // Structured exercise library: assets are bundled locally for offline tutorial viewing.
  const trainingExercises = {
    floor_press:{id:'floor_press',name:'Dumbbell floor press',image:'floor_press.jpg',muscles:'Dada • trisep',gear:'2 dumbbell × 5 kg',sets:3,min:10,max:15,rest:90,load:5,
      cues:['Berbaring di lantai, tekuk lutut dan rapatkan telapak kaki pada lantai.','Pegang dumbbell sejajar dada, siku sekitar 30–45° dari badan.','Dorong ke atas sambil mengembuskan napas.','Turunkan perlahan sampai lengan atas menyentuh lantai dengan ringan.'],
      mistakes:['Jangan memantulkan siku pada lantai.','Hindari mengangkat pinggul dan melempar dumbbell.'],tip:'Jika 5 kg terlalu ringan, perlambat fase turun menjadi 3 detik.'},
    pushup:{id:'pushup',name:'Push-up biasa',image:'pushup.jpg',muscles:'Dada • trisep • core',gear:'Berat badan',sets:3,min:8,max:12,rest:90,load:0,
      cues:['Letakkan telapak tangan sedikit lebih lebar dari bahu.','Kencangkan perut dan jaga kepala, pinggul, tumit satu garis.','Turunkan dada perlahan, siku mengarah serong ke belakang.','Dorong kembali sampai lengan hampir lurus.'],
      mistakes:['Pinggul jangan melorot.','Jangan membuang siku terlalu melebar.'],tip:'Kamu sudah bisa 3 × 10; usahakan setiap repetisi memiliki teknik penuh.'},
    tempo_pushup:{id:'tempo_pushup',name:'Slow push-up (3 detik turun)',image:'pushup.jpg',muscles:'Dada • trisep • core',gear:'Berat badan',sets:3,min:6,max:10,rest:90,load:0,
      cues:['Mulai dari posisi push-up biasa yang stabil.','Turun perlahan sambil menghitung 1–2–3.','Tahan sebentar tanpa menyentuhkan seluruh badan ke lantai.','Dorong naik dengan kontrol.'],
      mistakes:['Jangan menahan napas.','Jangan mempercepat turunan ketika mulai lelah.'],tip:'Turunkan target repetisi daripada mengorbankan teknik.'},
    squeeze_press:{id:'squeeze_press',name:'Dumbbell squeeze press',image:'squeeze_press.jpg',muscles:'Dada • trisep',gear:'2 dumbbell × 5 kg',sets:2,min:10,max:15,rest:75,load:5,
      cues:['Berbaring dengan lutut ditekuk dan pegang kedua dumbbell di atas dada.','Dekatkan kedua dumbbell dengan pegangan yang aman.','Dorong ke atas sambil mempertahankan tekanan ringan ke arah tengah.','Turunkan perlahan; jaga pergelangan tangan tetap lurus.'],
      mistakes:['Jangan memaksakan kedua dumbbell bersentuhan bila bentuknya tidak stabil.','Jangan mengangkat beban bila pegangan terasa licin.'],tip:'Jika sulit menjaga kedua beban stabil, ganti dengan floor press biasa.'},
    bent_row:{id:'bent_row',name:'Bent-over dumbbell row',image:'bent_row.jpg',muscles:'Punggung • bisep',gear:'2 dumbbell × 5 kg',sets:3,min:10,max:15,rest:75,load:5,
      cues:['Berdiri selebar pinggul sambil memegang dua dumbbell.','Tekuk lutut sedikit dan dorong pinggul ke belakang; punggung tetap netral.','Tarik siku ke belakang menuju pinggang, tanpa mengangkat bahu.','Turunkan kedua dumbbell dengan perlahan.'],
      mistakes:['Jangan membulatkan punggung atau mengayun badan.','Jangan mendongakkan leher berlebihan.'],tip:'Jika 5 kg ringan, tahan 1 detik saat dumbbell dekat pinggang.'},
    goblet_squat:{id:'goblet_squat',name:'Goblet squat',image:'goblet_squat.jpg',muscles:'Paha • bokong • core',gear:'1 dumbbell 5 kg',sets:3,min:12,max:15,rest:90,load:5,
      cues:['Pegang satu dumbbell dekat dada dengan kedua tangan.','Posisikan kaki sekitar selebar bahu dan jaga tumit menapak.','Turunkan pinggul seolah duduk hingga kedalaman yang nyaman.','Dorong lantai dan berdiri kembali.'],
      mistakes:['Jangan biarkan tumit terangkat.','Jangan membungkuk tiba-tiba untuk mengejar kedalaman.'],tip:'Jika gerakan sudah mudah, tambah repetisi atau turunkan tubuh lebih lambat.'},
    rdl:{id:'rdl',name:'Dumbbell Romanian deadlift',image:'rdl.jpg',muscles:'Paha belakang • bokong',gear:'2 dumbbell × 5 kg',sets:3,min:10,max:15,rest:90,load:5,
      cues:['Berdiri tegak, lutut sedikit menekuk, dumbbell di depan paha.','Dorong pinggul ke belakang sambil menjaga tulang belakang netral.','Turunkan beban dekat paha dan tulang kering sampai terasa regangan nyaman.','Kencangkan bokong untuk kembali berdiri.'],
      mistakes:['Jangan membulatkan punggung.','Bukan squat: gerakan utama berasal dari sendi pinggul.'],tip:'Hentikan turunan sebelum posisi punggung berubah.'},
    reverse_lunge:{id:'reverse_lunge',name:'Reverse lunge',image:'reverse_lunge.jpg',muscles:'Paha • bokong • keseimbangan',gear:'Berat badan (opsional dumbbell)',sets:2,min:8,max:10,rest:75,load:0,unit:'per kaki',
      cues:['Berdiri tegak dengan kaki selebar pinggul.','Langkahkan satu kaki ke belakang dan tekuk kedua lutut.','Jaga lutut depan mengarah sejalan dengan jari kaki.','Dorong kaki depan untuk kembali berdiri, lalu ganti kaki.'],
      mistakes:['Jangan membenturkan lutut belakang ke lantai.','Jangan biarkan badan terlalu condong ke samping.'],tip:'Mulai tanpa dumbbell sampai keseimbangan stabil.'},
    glute_bridge:{id:'glute_bridge',name:'Glute bridge',image:'glute_bridge.jpg',muscles:'Bokong • paha belakang',gear:'Berat badan',sets:2,min:12,max:20,rest:60,load:0,
      cues:['Berbaring telentang dengan lutut ditekuk, kaki menapak.','Kencangkan bokong lalu angkat pinggul sampai badan membentuk garis lurus.','Tahan satu detik di atas.','Turunkan perlahan tanpa membanting pinggul.'],
      mistakes:['Jangan melengkungkan pinggang terlalu tinggi.','Jangan mendorong hanya dengan ujung kaki.'],tip:'Jika sudah mudah, tahan posisi puncak selama 2–3 detik.'},
    plank:{id:'plank',name:'Forearm plank',image:'plank.jpg',muscles:'Core • bahu',gear:'Matras',sets:2,min:20,max:40,rest:60,load:0,unit:'detik',timed:true,
      cues:['Letakkan siku tepat di bawah bahu.','Luruskan badan dari kepala sampai tumit.','Kencangkan perut dan bokong sambil bernapas normal.','Tahan selama target detik tanpa kehilangan posisi.'],
      mistakes:['Jangan biarkan pinggang turun atau bokong terlalu naik.','Jangan menahan napas.'],tip:'Utamakan postur, bukan durasi paling lama.'},
  };
  const weeklyPlan = [
    {id:'mon',day:1,name:'Dada + punggung',short:'Chest & back A',category:'strength',minutes:45,exercises:['floor_press','pushup','bent_row','squeeze_press']},
    {id:'tue',day:2,name:'Jalan cepat & mobilitas',short:'Pemulihan aktif',category:'active',minutes:30,steps:['Jalan cepat 25 menit dengan intensitas nyaman.','Gerakkan bahu, pinggul, dan punggung 5 menit.']},
    {id:'wed',day:3,name:'Kaki + core',short:'Legs & core',category:'strength',minutes:50,exercises:['goblet_squat','rdl','reverse_lunge','glute_bridge','plank']},
    {id:'thu',day:4,name:'Jalan cepat & mobilitas',short:'Pemulihan aktif',category:'active',minutes:30,steps:['Jalan cepat 25 menit.','Mobilitas bahu dan pinggul 5 menit.']},
    {id:'fri',day:5,name:'Dada + punggung B',short:'Chest & back B',category:'strength',minutes:50,exercises:['tempo_pushup','floor_press','bent_row','squeeze_press']},
    {id:'sat',day:6,name:'Jalan santai',short:'Gerak ringan',category:'active',minutes:30,steps:['Jalan santai 30 menit pada kecepatan nyaman.']},
    {id:'sun',day:0,name:'Istirahat total',short:'Recovery day',category:'rest',minutes:0,steps:['Prioritaskan tidur, nutrisi, dan pemulihan. Tidak ada latihan beban wajib.']},
  ];
  const WEEK_LABELS=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const weekMonday = iso => dateShift(iso,-(dateFrom(iso).getDay()+6)%7);
  const planForDate = iso => weeklyPlan.find(p=>p.day===dateFrom(iso).getDay());
  const planById = id => weeklyPlan.find(p=>p.id===id);
  const workoutProgramWeek = iso => clamp(Math.floor(daysBetween(iso,data.workoutSettings.programStart)/7)+1,1,8);
  const targetSets = (ex, week) => week===1?Math.min(2,ex.sets):ex.sets;
  const workoutTimeLabel = () => esc(data.workoutSettings.time || '17:30');
  const icons = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    meal:'<path d="M4 3v7a4 4 0 0 0 4 4h1V3M4 7h5M9 3v18M19 3c-3 3-4 6-4 10h4v8"/>',
    progress:'<path d="M3 3v18h18M7 16l4-5 4 3 5-8"/>',
    workout:'<path d="m6 6 12 12M3 8l5-5M2 12l10-10M16 21l5-5M12 22l10-10"/>',
    settings:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    left:'<path d="m15 18-6-6 6-6"/>',
    right:'<path d="m9 18 6-6-6-6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    flame:'<path d="M12 22c5 0 8-3 8-8 0-4-2-6-4-8 0 4-2 5-2 5 0-4-2-7-5-9 0 5-5 7-5 12 0 5 3 8 8 8z"/>',
    weight:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 5a4 4 0 0 1 8 0m-4 5 2-2"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    close:'<path d="M18 6 6 18M6 6l12 12"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',
    download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
    upload:'<path d="M12 21V9m-4 4 4-4 4 4M4 7V3h16v4"/>',
    edit:'<path d="m4 20 5-1 11-11-4-4L5 15l-1 5ZM14 6l4 4"/>',
    sparkle:'<path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>',
    shield:'<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z"/>',
    info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10h.01"/>',
    star:'<path d="m12 2 3 7 7 .6-5.5 4.7 1.8 7L12 17.4 5.7 21.3l1.8-7L2 9.6 9 9z"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    install:'<path d="M12 3v13m-4-4 4 4 4-4M5 18v3h14v-3"/>',
    leaf:'<path d="M20 4c-13 0-17 6-17 12a5 5 0 0 0 5 5c6 0 12-4 12-17ZM3 21c3-6 7-9 13-12"/>',
    refresh:'<path d="M20 7v5h-5M4 17v-5h5M5 11a8 8 0 0 1 14-4l1 5M4 12l1 5a8 8 0 0 0 14-4"/>',
  };
  const icon = (key, extra='') => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${icons[key]||icons.star}</svg>`;
  const tabs = [{id:'home',label:'Beranda',icon:'home'},{id:'meals',label:'Makan',icon:'meal'},{id:'progress',label:'Progres',icon:'progress'},{id:'workout',label:'Latihan',icon:'workout'},{id:'settings',label:'Profil',icon:'settings'}];
  const createDefault = () => ({
    version:2,
    profile:{name:'Haikal',height:174,startWeight:57.5,targetWeight:65,weeklyGain:.25,calorieGoal:2400,proteinGoal:95,startDate:TODAY()},
    weights:[{id:uid(),date:TODAY(),weight:57.5}],
    meals:[], favoriteFoods:[], theme:'light', workouts:{}, workoutSessions:[], activityLogs:[], activeWorkout:null, backupLastExport:0, reminders:{workout:false,lastDate:''}, workoutSettings:{time:'17:30',programStart:weekMonday(TODAY())},
  });
  function loadData() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return createDefault();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed!=='object' || !Array.isArray(parsed.weights) || !Array.isArray(parsed.meals) || !parsed.profile) throw Error('Invalid data');
      const defaults=createDefault();
      return {...defaults,...parsed,version:2,theme:parsed.theme==='dark'?'dark':'light',favoriteFoods:Array.isArray(parsed.favoriteFoods)?parsed.favoriteFoods.slice(0,30):[],backupLastExport:Number(parsed.backupLastExport)||0,reminders:{...defaults.reminders,...(parsed.reminders||{})},profile:{...defaults.profile,...parsed.profile},workouts:parsed.workouts&&typeof parsed.workouts==='object'&&!Array.isArray(parsed.workouts)?parsed.workouts:{},workoutSessions:Array.isArray(parsed.workoutSessions)?parsed.workoutSessions:[],activityLogs:Array.isArray(parsed.activityLogs)?parsed.activityLogs:[],activeWorkout:parsed.activeWorkout&&typeof parsed.activeWorkout==='object'?parsed.activeWorkout:null,workoutSettings:{...defaults.workoutSettings,...(parsed.workoutSettings||{})}};
    } catch(err) { console.warn('Data gagal dibaca; menggunakan data awal.',err); return createDefault(); }
  }
  let data = loadData();
  let ui = {tab:'home',mealDate:TODAY(),mealSearch:'',progressRange:'30',modal:null,installPrompt:null,workoutDate:TODAY(),workoutFocus:false,workoutProgressExercise:''};
  let toastTimeout;
  const save = () => { try { localStorage.setItem(STORE_KEY,JSON.stringify(data)); return true; } catch { showToast('Penyimpanan gagal. Periksa ruang browser.'); return false; } };
  function showToast(message) { const el=document.getElementById('toast'); el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3000); }
  const getWeights = () => data.weights.map((w,i)=>({...w,order:i})).filter(w=>Number.isFinite(Number(w.weight))&&w.date).sort((a,b)=>a.date.localeCompare(b.date)||a.order-b.order);
  const currentWeight = () => { const weights=getWeights();return weights.length?Number(weights.at(-1).weight):Number(data.profile.startWeight); };
  const currentBmi = () => currentWeight()/Math.pow(Number(data.profile.height)/100,2);
  const progressPct = () => clamp((currentWeight()-Number(data.profile.startWeight))/(Number(data.profile.targetWeight)-Number(data.profile.startWeight))*100||0,0,100);
  const entriesOn = day => data.meals.filter(m=>m.date===day);
  const totalsOn = day => entriesOn(day).reduce((acc,m)=>({cal:acc.cal+Number(m.cal||0),protein:acc.protein+Number(m.protein||0)}),{cal:0,protein:0});
  const dayStatus = day => suggestedMeals.map(m=>({ ...m,completed: entriesOn(day).some(x=>x.type===m.type)}));
  const workoutChecks = day => Array.isArray(data.workouts[day])?data.workouts[day]:[];
  const workoutDone = day => exercises.every(x=>workoutChecks(day).includes(x.id));
  const completedWorkoutDates = () => new Set([...(data.workoutSessions||[]).filter(s=>s&&s.completedAt).map(s=>s.date),...Object.keys(data.workouts||{}).filter(d=>workoutDone(d))]);
  const workoutDays = () => {const monday=weekMonday(TODAY()),dates=completedWorkoutDates();return Array.from({length:7},(_,i)=>dateShift(monday,i)).filter(day=>dates.has(day)).length;};
  const greeting = () => { const h=new Date().getHours();return h<11?'Selamat pagi':h<15?'Selamat siang':h<19?'Selamat sore':'Selamat malam';};
  const delta = () => currentWeight()-Number(data.profile.startWeight);
  const todayDone = () => dayStatus(TODAY()).filter(m=>m.completed).length;
  const backupDue = () => !data.backupLastExport || Date.now()-data.backupLastExport>=7*86400000;
  const weeklySummary = () => {
    const start=dateShift(TODAY(),-6),days=Array.from({length:7},(_,i)=>dateShift(start,i));
    const nutrition=days.filter(day=>{const total=totalsOn(day);return total.cal>=Number(data.profile.calorieGoal)&&total.protein>=Number(data.profile.proteinGoal);}).length;
    const workouts=days.filter(day=>completedWorkoutDates().has(day)).length;
    const activities=days.filter(activityOn).length;
    return {nutrition,workouts,activities};
  };
  const isTrainingDay = date => planForDate(date)?.category==='strength';
  const getTabFromHash = () => { const h=location.hash.slice(1);return tabs.some(t=>t.id===h)?h:null; };
  if(getTabFromHash())ui.tab=getTabFromHash();

  function renderNav() {
    document.getElementById('desktop-nav').innerHTML=tabs.map(t=>`<button class="nav-item ${ui.tab===t.id?'active':''}" type="button" data-action="navigate" data-tab="${t.id}" ${ui.tab===t.id?'aria-current="page"':''}>${icon(t.icon)}<span>${t.label}</span></button>`).join('');
    document.getElementById('mobile-nav').innerHTML=tabs.map(t=>`<button class="mobile-nav-item ${ui.tab===t.id?'active':''}" type="button" data-action="navigate" data-tab="${t.id}" ${ui.tab===t.id?'aria-current="page"':''}>${icon(t.icon)}<span>${t.label}</span></button>`).join('');
    document.querySelector('.header-avatar').textContent=String(data.profile.name||'H').trim().slice(0,1).toUpperCase();
  }
  function titleBlock(kicker,title,subtitle,extra='') {return `<div class="section-topline"><div><p class="eyebrow">${kicker}</p><h1 class="page-title">${title}</h1>${subtitle?`<p class="page-subtitle">${subtitle}</p>`:''}</div>${extra}</div>`;}
  function renderHome() {
    const w=currentWeight(),remaining=Math.max(0,Number(data.profile.targetWeight)-w),today=totalsOn(TODAY());
    const calPct=clamp(today.cal/Number(data.profile.calorieGoal)*100,0,100), proteinPct=clamp(today.protein/Number(data.profile.proteinGoal)*100,0,100);
    const weekly=weeklySummary();
    return `${titleBlock('MY WELLNESS SPACE',`${greeting()}, ${esc(data.profile.name.split(' ')[0])} <span style="font-size:.7em">🌿</span>`,'Sedikit demi sedikit, kamu makin dekat dengan targetmu.',`<span class="date-chip">${icon('calendar')}${formatDate(TODAY(),{day:'numeric',month:'short'})}</span>`)}
      <section class="hero" aria-label="Target berat badan">
        <div class="hero-topline">${icon('sparkle')} PERJALANAN BERAT BADANMU</div>
        <div class="hero-numbers"><strong>${nf(w,1)}</strong><small>kg</small><span class="hero-target">/ ${nf(data.profile.targetWeight,1)} kg</span></div>
        <p class="hero-copy">${remaining>0?`Tersisa <strong>${nf(remaining,1)} kg</strong> menuju versi dirimu yang lebih kuat.`:'Target tercapai! Pertahankan pola makan dan kebiasaan baikmu.'}</p>
        <div class="hero-progress"><span style="width:${progressPct()}%"></span></div>
        <div class="hero-progress-label"><span>Mulai ${nf(data.profile.startWeight,1)} kg</span><span>${nf(progressPct())}% perjalanan</span><span>Target ${nf(data.profile.targetWeight,1)} kg</span></div>
        <div class="hero-side">${icon('leaf')}</div>
      </section>
      <div class="metric-grid">
        <article class="card metric-card"><div class="card-head"><span class="card-title">Kalori hari ini</span><span class="icon-square orange">${icon('flame')}</span></div>
          <div class="metric-number">${nf(today.cal)} <span class="metric-unit">kkal</span></div>
          <div class="metric-meta">dari ${nf(data.profile.calorieGoal)} kkal target</div>
          <div class="progress-track peach"><span style="width:${calPct}%"></span></div><div class="metric-foot"><span>${nf(calPct)}% terpenuhi</span><span>${Math.max(0,data.profile.calorieGoal-today.cal)>0?nf(Math.max(0,data.profile.calorieGoal-today.cal))+' lagi':'Terpenuhi ✓'}</span></div>
        </article>
        <article class="card metric-card"><div class="card-head"><span class="card-title">Protein hari ini</span><span class="icon-square">${icon('target')}</span></div>
          <div class="metric-number">${nf(today.protein,1)} <span class="metric-unit">gram</span></div>
          <div class="metric-meta">dari ${nf(data.profile.proteinGoal)} g target</div>
          <div class="progress-track"><span style="width:${proteinPct}%"></span></div><div class="metric-foot"><span>${nf(proteinPct)}% terpenuhi</span><span>${Math.max(0,data.profile.proteinGoal-today.protein)>0?nf(Math.max(0,data.profile.proteinGoal-today.protein),1)+' g lagi':'Terpenuhi ✓'}</span></div>
        </article>
      </div>
      <section class="card flat"><div class="card-head"><div><h2 class="card-title">Ritme makan hari ini</h2><p class="card-subtitle">5 kesempatan mengisi energi</p></div><span class="tiny-tag">${todayDone()}/5 waktu</span></div>
        <div class="meal-list">${dayStatus(TODAY()).map(m=>`<div class="meal-row"><span class="food-icon ${m.type}">${m.icon}</span><div style="flex:1;min-width:0"><div class="meal-name">${m.label} <span style="color:#a5b0a5;font-size:10px;font-weight:500">${m.time}</span></div><div class="meal-type">${m.secondary}</div></div><button type="button" class="small-add ${m.completed?'added':''}" data-action="open-meal" data-food="${m.food}" data-type="${m.type}" aria-label="${m.completed?'Tambah lagi':'Catat'} ${m.label}">${m.completed?'✓ Dicatat':'+ Catat'}</button></div>`).join('')}</div>
      </section>
      <div class="section-heading"><div><h2>Terus bergerak</h2><p class="section-note">Jadwal terarah dengan 2 dumbbell 5 kg</p></div><button class="link-button" data-action="navigate" data-tab="workout">Lihat latihan ${icon('arrow')}</button></div>
       <section class="card flat"><div style="display:flex;align-items:center;gap:14px;"><span class="activity-icon" style="width:50px;height:50px">${icon('workout')}</span><div style="flex:1"><strong style="font-size:13px">${esc(planForDate(TODAY()).name)}</strong><p class="card-subtitle" style="margin:6px 0 0">${planForDate(TODAY()).category==='rest'?'Istirahat & pemulihan':workoutTimeLabel()+' WIB · ±'+planForDate(TODAY()).minutes+' menit'} · ${workoutDays()}/3 sesi beban minggu ini</p></div><button class="small-add" data-action="navigate" data-tab="workout">${data.activeWorkout?'Lanjut':'Buka'} ${icon('right')}</button></div></section>
      <section class="card flat weekly-summary"><div class="card-head"><div><h2 class="card-title">Ringkasan 7 hari</h2><p class="card-subtitle">${formatDate(dateShift(TODAY(),-6),{day:'numeric',month:'short'})} - ${formatDate(TODAY(),{day:'numeric',month:'short'})}</p></div></div><div><span><strong>${weekly.nutrition}/7</strong> target makan</span><span><strong>${weekly.workouts}/3</strong> latihan beban</span><span><strong>${weekly.activities}/3</strong> aktivitas ringan</span></div></section>
       <div class="bottom-cta"><button class="primary-btn" data-action="open-meal">${icon('plus')} Catat makanan</button><button class="outline-btn" data-action="open-weight">${icon('weight')} Timbang badan</button></div>
      <p class="muted-note" style="margin:20px 2px 0">Kalori dan protein makanan merupakan perkiraan. Porsi serta cara memasak dapat mengubah nilainya.</p>`;
  }
  function ring(pct) { const p=clamp(pct,0,100),circ=2*Math.PI*37;return `<div class="rings"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="37" fill="none" stroke="#d6e5d1" stroke-width="9"/><circle cx="50" cy="50" r="37" fill="none" stroke="#548e6d" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(circ*p/100).toFixed(2)} ${circ.toFixed(2)}"/></svg><div class="ring-center"><div>${nf(p)}%<small>terpenuhi</small></div></div></div>`;}
  function renderMeals() {
    const date=ui.mealDate,total=totalsOn(date),pct=total.cal/data.profile.calorieGoal*100;
    const isToday=date===TODAY();
    const query=ui.mealSearch.trim().toLocaleLowerCase('id-ID');
    const entries=entriesOn(date).filter(entry=>!query||entry.name.toLocaleLowerCase('id-ID').includes(query)).slice().reverse();
    const grouped=Object.entries(typeLabels).map(([type,name])=>({type,name,entries:entries.filter(x=>x.type===type)})).filter(g=>g.entries.length);
    return `${titleBlock('NUTRITION JOURNAL','Jurnal makan','Bukan soal makan sebanyak mungkin, tapi konsisten memenuhi kebutuhan.',`<button class="primary-btn" data-action="open-meal">${icon('plus')} <span>Tambah</span></button>`)}
      <div class="card flat" style="padding:15px 17px;display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px"><div><strong style="font-size:13px">${isToday?'Hari ini':formatDate(date,{day:'numeric',month:'long'})}</strong><p class="card-subtitle">${formatDate(date,{weekday:'long',year:'numeric'})}</p></div><div class="date-controls"><button class="circle-icon-btn" data-action="date-prev" aria-label="Hari sebelumnya">${icon('left')}</button><button class="circle-icon-btn" data-action="date-next" aria-label="Hari berikutnya" ${date>=TODAY()?'disabled':''}>${icon('right')}</button></div></div>
      <div class="nutrition-total"><div><p class="eyebrow" style="margin:0 0 7px;color:#75937e">TOTAL KALORI</p><div class="big">${nf(total.cal)} <small>/ ${nf(data.profile.calorieGoal)}</small></div><p>${nf(total.protein,1)} g protein dari target ${nf(data.profile.proteinGoal)} g</p></div>${ring(pct)}</div>
      <section class="card flat"><div class="card-head"><div><h2 class="card-title">Makanan tercatat</h2><p class="card-subtitle">${entries.length} makanan ditemukan</p></div></div><input class="meal-search" data-action="meal-search" type="search" value="${esc(ui.mealSearch)}" placeholder="Cari makanan hari ini" aria-label="Cari makanan" />
        ${grouped.length?grouped.map(g=>`<div class="group-heading"><span>${g.name}</span></div><div class="meal-list">${g.entries.map(entry=>{const favorite=data.favoriteFoods.some(food=>food.name.toLocaleLowerCase('id-ID')===entry.name.toLocaleLowerCase('id-ID'));return `<div class="meal-row"><span class="food-icon ${g.type}">${esc(entry.emoji||'🍽️')}</span><div class="meal-copy"><div class="meal-name">${esc(entry.name)}</div><div class="meal-type">${nf(entry.portions||1,1)} porsi</div></div><div class="meal-nutrition"><div class="meal-val">${nf(entry.cal)} kkal</div><div class="meal-protein">${nf(entry.protein,1)} g protein</div></div><div class="meal-actions"><button class="small-add" data-action="repeat-meal" data-id="${esc(entry.id)}" aria-label="Catat lagi ${esc(entry.name)}">+ Lagi</button><button class="favorite-btn ${favorite?'active':''}" data-action="toggle-favorite-meal" data-id="${esc(entry.id)}" aria-label="${favorite?'Hapus':'Simpan'} ${esc(entry.name)} ${favorite?'dari':'sebagai'} favorit" aria-pressed="${favorite}">${favorite?'♥':'♡'}</button><button class="trash-btn" data-action="delete-meal" data-id="${esc(entry.id)}" aria-label="Hapus ${esc(entry.name)}">${icon('trash')}</button></div></div>`;}).join('')}</div>`).join(''):`<div class="empty-state"><span class="empty-icon">${icon('meal')}</span><strong>${query?'Makanan tidak ditemukan':'Belum ada makanan'}</strong><p>${query?'Coba kata kunci lain.':'Mulai dari satu menu saja. Catat apa yang benar-benar kamu makan.'}</p><button class="soft-btn" data-action="open-meal">${icon('plus')} Catat makanan</button></div>`}
      </section>
      ${data.favoriteFoods.length?`<div class="section-heading"><div><h2>Favoritmu</h2><p class="section-note">Catat sekali tekan</p></div></div><div class="quick-grid">${data.favoriteFoods.map(food=>`<button class="quick-food" data-action="open-meal" data-food="${esc(food.id)}"><span class="emoji">${esc(food.emoji||'🍽️')}</span><strong>${esc(food.name)}</strong><small>±${nf(food.cal)} kkal · ${nf(food.protein)} g protein</small></button>`).join('')}</div>`:''}
      <div class="section-heading"><div><h2>Pilihan cepat</h2><p class="section-note">Berdasarkan menu yang sering kamu makan</p></div></div>
      <div class="quick-grid">${presetFoods.slice(0,10).map(food=>`<button class="quick-food" data-action="open-meal" data-food="${food.id}"><span class="emoji">${food.emoji}</span><strong>${food.name}</strong><small>±${nf(food.cal)} kkal · ${nf(food.protein)} g protein</small></button>`).join('')}</div>
      <p class="muted-note">Nilai makanan hanya estimasi per satu porsi umum. Koreksi kalori/protein dalam formulir sesuai porsi, label, atau hasil penimbangan makanan.</p>`;
  }
  function chartHtml() {
    const all=getWeights();
    const start=ui.progressRange==='30'?dateShift(TODAY(),-29):dateShift(TODAY(),-89);
    const pts=all.filter(w=>w.date>=start&&w.date<=TODAY());
    if(!pts.length)return '<div class="chart-empty">Belum ada data penimbangan untuk periode ini.</div>';
    const grouped={};pts.forEach(p=>grouped[p.date]=Number(p.weight));
    const values=Object.entries(grouped).sort((a,b)=>a[0].localeCompare(b[0]));
    const width=680,height=215,pad={top:19,right:26,bottom:32,left:37};
    const yvalues=values.map(x=>x[1]).concat([data.profile.targetWeight]);
    const lo=Math.floor(Math.min(...yvalues)-1),hi=Math.ceil(Math.max(...yvalues)+1),span=Math.max(1,hi-lo);
    const numDays=ui.progressRange==='30'?30:90;
    const xOf=day=>pad.left+clamp(daysBetween(day,start),0,numDays-1)/(numDays-1)*(width-pad.left-pad.right);
    const yOf=val=>pad.top+(hi-val)/span*(height-pad.top-pad.bottom);
    const points=values.map(([day,val])=>({x:xOf(day),y:yOf(val),day,val}));
    const line=points.length===1?`M ${Math.max(pad.left,points[0].x-7)} ${points[0].y} L ${Math.min(width-pad.right,points[0].x+7)} ${points[0].y}`:points.map((p,i)=>`${i===0?'M':'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
    const area=`${line} L ${points.at(-1).x} ${height-pad.bottom} L ${points[0].x} ${height-pad.bottom} Z`;
    const grid=[0,.25,.5,.75,1].map(k=>{const y=pad.top+k*(height-pad.top-pad.bottom),v=hi-k*span;return `<line class="chart-grid" x1="${pad.left}" y1="${y}" x2="${width-pad.right}" y2="${y}"/><text class="chart-axis" text-anchor="end" x="${pad.left-8}" y="${y+4}">${nf(v,1)}</text>`;}).join('');
    const ticks=[0,.33,.66,1].map(k=>{const date=dateShift(start,Math.round(k*(numDays-1))),x=xOf(date);return `<text class="chart-axis" text-anchor="middle" x="${x}" y="${height-10}">${formatDate(date,{day:'numeric',month:'short'})}</text>`;}).join('');
    return `<svg viewBox="0 0 ${width} ${height}" class="chart-surface" role="img" aria-label="Grafik berat badan ${ui.progressRange} hari dengan ${values.length} data"><defs><linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#a9d7ae" stop-opacity=".3"/><stop offset="1" stop-color="#a9d7ae" stop-opacity="0"/></linearGradient></defs>${grid}${ticks}<path class="chart-fill" d="${area}"/><path class="chart-path" d="${line}"/>${points.map(p=>`<circle class="chart-point" cx="${p.x}" cy="${p.y}" r="4"><title>${formatDate(p.day)}: ${nf(p.val,1)} kg</title></circle>`).join('')}</svg>`;
  }
  function trendInsight(){
    const w=getWeights();if(w.length<2)return 'Belum cukup data untuk menilai tren. Coba timbang 2–3 kali seminggu pada kondisi yang mirip.';
    const first=w[0],last=w.at(-1),days=daysBetween(last.date,first.date);
    if(days<7)return 'Data masih kurang dari satu minggu. Lanjutkan rutinitas dan lihat rata-rata perubahan antarminggu.';
    const perWeek=(last.weight-first.weight)/(days/7);
    if(Math.abs(perWeek)<.1)return 'Berat badan relatif stabil. Jika konsisten 2–3 minggu, pertimbangkan menambah 150–200 kkal/hari.';
    if(perWeek>0&&perWeek<=.5)return `Tren naik sekitar ${nf(perWeek,2)} kg/minggu. Lanjutkan dan evaluasi berdasarkan rata-rata mingguan.`;
    if(perWeek>.5)return `Tren naik sekitar ${nf(perWeek,2)} kg/minggu. Tinjau apakah kenaikannya terlalu cepat dan sesuaikan asupan bila perlu.`;
    return `Tren turun sekitar ${nf(Math.abs(perWeek),2)} kg/minggu. Periksa konsistensi asupan dan pertimbangkan konsultasi jika terus berlanjut.`;
  }
  function weeklyGainStatus(){
    const weights=getWeights();if(weights.length<2)return {label:'Butuh data',copy:'Catat setidaknya dua penimbangan dengan jarak satu minggu untuk membandingkan target.'};
    const first=weights[0],last=weights.at(-1),days=daysBetween(last.date,first.date);if(days<7)return {label:'Butuh waktu',copy:'Tren mingguan tersedia setelah minimal tujuh hari.'};
    const actual=(last.weight-first.weight)/(days/7),target=Number(data.profile.weeklyGain)||.25;
    if(actual<target-.12)return {label:'Lebih lambat',copy:`Tren ${nf(actual,2)} kg/minggu; target ${nf(target,2)} kg/minggu. Pertimbangkan tambah 150-200 kkal/hari bila konsisten 2-3 minggu.`};
    if(actual>target+.2)return {label:'Lebih cepat',copy:`Tren ${nf(actual,2)} kg/minggu; target ${nf(target,2)} kg/minggu. Tinjau asupan dan pemulihan.`};
    return {label:'Sesuai target',copy:`Tren ${nf(actual,2)} kg/minggu, dekat target ${nf(target,2)} kg/minggu.`};
  }
  function renderProgress() {
    const w=currentWeight(),remaining=Math.max(0,data.profile.targetWeight-w),weights=getWeights();
    const last7=weights.filter(x=>x.date>=dateShift(TODAY(),-6)&&x.date<=TODAY());
    const avg=last7.length?last7.reduce((sum,x)=>sum+Number(x.weight),0)/last7.length:null;
    const milestones=[60,62,65].filter(v=>v>Number(data.profile.startWeight)&&v<=Number(data.profile.targetWeight)),gain=weeklyGainStatus();
    return `${titleBlock('YOUR GROWTH STORY','Perjalanan beratmu','Pantau tren dari minggu ke minggu, bukan hanya naik-turun harian.',`<button class="primary-btn" data-action="open-weight">${icon('plus')} Timbang</button>`)}
      <div class="grid-two" style="margin-bottom:17px"><div class="stat-box"><div class="stat-label">Berat terkini</div><strong>${nf(w,1)} <small>kg</small></strong><p>${delta()>=0?'+':''}${nf(delta(),1)} kg dari awal</p></div><div class="stat-box"><div class="stat-label">Menuju target</div><strong>${nf(remaining,1)} <small>kg lagi</small></strong><p>${nf(progressPct())}% perjalanan selesai</p></div></div>
       <section class="card chart-card"><div class="card-head"><div><h2 class="card-title">Grafik perkembangan</h2><p class="card-subtitle">Catatan penimbanganmu</p></div><div class="tab-pills"><button class="tab-pill ${ui.progressRange==='30'?'active':''}" data-action="chart-range" data-range="30">30 hari</button><button class="tab-pill ${ui.progressRange==='90'?'active':''}" data-action="chart-range" data-range="90">90 hari</button></div></div>${chartHtml()}</section>
      <div class="gain-status"><strong>${gain.label}</strong><p>${gain.copy}</p></div>
      <div class="insight">${icon('sparkle')}<div><strong>Catatan untukmu</strong><p>${trendInsight()}</p>${avg!==null?`<p>Rata-rata catatan 7 hari terakhir: <strong>${nf(avg,2)} kg</strong> (${last7.length} data).</p>`:''}</div></div>
      <div class="section-heading"><div><h2>Milestone perjalanan</h2><p class="section-note">Rayakan kenaikan kecil yang konsisten</p></div></div>
      <section class="card flat">${milestones.map(v=>`<div class="milestone-row ${w>=v?'done':''}"><div class="milestone-number">${nf(v)}<span style="font-size:9px">kg</span></div><div><strong>${v===data.profile.targetWeight?'Target utama':`Checkpoint ${v} kg`}</strong><small>${w>=v?'Sudah tercapai!':`${nf(v-w,1)} kg lagi`}</small></div><div class="milestone-icon">${icon(w>=v?'check':'target')}</div></div>`).join('')}</section>
      <div class="section-heading"><div><h2>Riwayat timbang</h2><p class="section-note">Bisa dihapus jika ada salah input</p></div></div>
      <section class="card flat">${weights.length?weights.slice().reverse().slice(0,12).map(weight=>`<div class="meal-row"><div class="activity-icon">${icon('weight')}</div><div style="flex:1"><div class="meal-name">${nf(weight.weight,1)} kg</div><div class="meal-type">${formatDate(weight.date)}</div></div><button class="trash-btn" data-action="delete-weight" data-id="${esc(weight.id)}" aria-label="Hapus penimbangan ${formatDate(weight.date)}">${icon('trash')}</button></div>`).join(''):'<div class="empty-state"><strong>Belum ada penimbangan</strong><p>Catat berat pertama untuk mulai membuat grafik.</p></div>'}</section>`;
  }
  // ----- Planned workouts, exercise tutorials, guided sessions, and history -----
  const secondsLabel = sec => `${String(Math.floor(Math.max(0,sec)/60)).padStart(2,'0')}:${String(Math.max(0,sec)%60).padStart(2,'0')}`;
  const relevantSessions = () => (data.workoutSessions||[]).filter(s=>s&&s.completedAt&&planById(s.planId)).slice().sort((a,b)=>Number(b.completedAt)-Number(a.completedAt));
  const activityOn = date => (data.activityLogs||[]).some(x=>x?.date===date);
  function strengthPrescription(ex, week) {
    const unit=ex.timed?'detik':'repetisi';
    return `${targetSets(ex,week)} set × ${ex.min}–${ex.max} ${unit}${ex.unit?' '+ex.unit:''} · istirahat ${ex.rest} detik`;
  }
  const timetableMinutes = {
    mon:[['Pemanasan',7],['Dumbbell floor press',10],['Push-up biasa',8],['Bent-over dumbbell row',9],['Dumbbell squeeze press',6],['Pendinginan',5]],
    wed:[['Pemanasan',7],['Goblet squat',9],['Dumbbell Romanian deadlift',9],['Reverse lunge',10],['Glute bridge',5],['Forearm plank',5],['Pendinginan',5]],
    fri:[['Pemanasan',7],['Slow push-up',11],['Dumbbell floor press',10],['Bent-over dumbbell row',10],['Dumbbell squeeze press',7],['Pendinginan',5]],
  };
  const clockFromMinutes = minutes => `${String((Math.floor(minutes/60)%24+24)%24).padStart(2,'0')}:${String((minutes%60+60)%60).padStart(2,'0')}`;
  function renderWorkoutTimeline(plan) {
    let cursor=Number(data.workoutSettings.time.slice(0,2))*60+Number(data.workoutSettings.time.slice(3,5));
    const items=(timetableMinutes[plan.id]||[]).map(([label,minutes])=>{const start=cursor;cursor+=minutes;return `<div class="workout-timeline-row"><time>${clockFromMinutes(start)}–${clockFromMinutes(cursor)}</time><span>${esc(label)}</span><small>${minutes} menit</small></div>`;}).join('');
    return `<details class="workout-timeline" open><summary>${icon('calendar')} Detail waktu & urutan latihan <span>${icon('right')}</span></summary><div class="workout-timeline-list">${items}</div><p>Jam di atas hanya estimasi. Set dan istirahat nyata boleh menyesuaikan kemampuanmu.</p></details>`;
  }
  function workoutProgressHtml() {
    const logs=relevantSessions().flatMap(session=>(session.sets||[]).map(set=>({...set,date:session.date}))).filter(set=>trainingExercises[set.exerciseId]);
    const ids=[...new Set(logs.map(set=>set.exerciseId))];
    if(!ids.length)return '<section class="card flat"><div class="empty-state"><strong>Belum ada progres kekuatan</strong><p>Selesaikan workout untuk melihat tren repetisi, durasi, atau beban.</p></div></section>';
    const id=ids.includes(ui.workoutProgressExercise)?ui.workoutProgressExercise:ids[0],ex=trainingExercises[id];
    ui.workoutProgressExercise=id;
    const sessions=Object.values(logs.filter(set=>set.exerciseId===id).reduce((all,set)=>{(all[set.date]||=[]).push(set);return all;},{})).map(sets=>({date:sets[0].date,value:sets.reduce((sum,set)=>sum+Number(set.seconds||set.reps||0),0),load:Math.max(...sets.map(set=>Number(set.load)||0))})).sort((a,b)=>a.date.localeCompare(b.date)).slice(-8);
    const values=sessions.map(session=>session.value),min=Math.min(...values),max=Math.max(...values),range=Math.max(1,max-min);
    const points=sessions.map((session,index)=>`${sessions.length===1?50:5+index/(sessions.length-1)*90},${88-(session.value-min)/range*66}`).join(' ');
    const label=ex.timed?'detik total':'repetisi total';
    return `<section class="card flat workout-progress"><div class="card-head"><div><h2 class="card-title">Progres kekuatan</h2><p class="card-subtitle">Total ${label} setiap sesi</p></div></div><select class="progress-exercise-select" data-action="select-workout-progress" aria-label="Pilih gerakan">${ids.map(item=>`<option value="${item}" ${item===id?'selected':''}>${esc(trainingExercises[item].name)}</option>`).join('')}</select><div class="workout-progress-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Grafik ${esc(ex.name)}"><polyline points="${points}"/></svg></div><div class="workout-progress-values">${sessions.map(session=>`<span><strong>${nf(session.value)}</strong><small>${formatDate(session.date,{day:'numeric',month:'short'})}${session.load>0?' · '+nf(session.load,1)+' kg':''}</small></span>`).join('')}</div></section>`;
  }
  function renderWorkout() {
    if(ui.workoutFocus&&data.activeWorkout) return renderGuidedWorkout();
    ui.workoutFocus=false;
    const weekStart=weekMonday(TODAY());
    const chosen=ui.workoutDate&&daysBetween(ui.workoutDate,weekStart)>=0&&daysBetween(ui.workoutDate,weekStart)<7?ui.workoutDate:TODAY();
    ui.workoutDate=chosen;
    const plan=planForDate(chosen),week=workoutProgramWeek(TODAY()),finishedDates=completedWorkoutDates();
    const thisWeek=workoutDays(),selectedDone=plan.category==='strength'?finishedDates.has(chosen):activityOn(chosen);
    const active=data.activeWorkout;
    const weekAdvice=week===1?'Minggu adaptasi: mulai dari maksimal 2 set per gerakan.':week<=3?'Bangun konsistensi. Pertahankan teknik dan set sesuai rencana.':week<=5?'Upayakan repetisi mendekati batas atas tanpa merusak teknik.':week<=7?'Saat sudah mudah, perlambat fase turun menjadi 3 detik.':'Minggu evaluasi: ukur peningkatan repetisi, teknik, dan berat badan.';
    const plans=Array.from({length:7},(_,i)=>{const day=dateShift(weekStart,i),p=planForDate(day),isToday=day===TODAY(),done=p.category==='strength'?finishedDates.has(day):activityOn(day);return `<button type="button" class="workout-calendar-day ${chosen===day?'selected':''} ${isToday?'today':''}" data-action="select-workout-day" data-day="${day}" aria-pressed="${chosen===day}"><span>${WEEK_LABELS[dateFrom(day).getDay()]}</span><strong>${dateFrom(day).getDate()}</strong><small>${p.category==='strength'?'Beban':p.category==='active'?'Aktif':'Rest'}</small>${done?`<i aria-label="Selesai">${icon('check')}</i>`:''}</button>`;}).join('');
    const header=`${titleBlock('STRONGER EVERY WEEK','Program latihan','Workout terarah dengan dua dumbbell 5 kg dan target kenaikan massa otot.',`<span class="date-chip">${icon('clock')} ${workoutTimeLabel()} WIB</span>`)}
      <section class="workout-banner workout-banner-rich"><div><p class="eyebrow" style="color:#82a17b">PROGRAM 8 MINGGU · MINGGU ${week}</p><h2>Build your stronger self.</h2><p>${weekAdvice}</p></div><div class="icon-wrap">${icon('workout')}</div></section>
      <section class="card flat workout-calendar"><div class="card-head"><div><h2 class="card-title">Jadwal minggu ini</h2><p class="card-subtitle">${formatDate(weekStart,{day:'numeric',month:'short'})} – ${formatDate(dateShift(weekStart,6),{day:'numeric',month:'short',year:'numeric'})}</p></div><span class="tiny-tag">${thisWeek}/3 latihan beban</span></div><div class="workout-calendar-grid">${plans}</div><p class="muted-note" style="margin:14px 0 0">Ketuk hari untuk melihat latihan, jam, durasi, dan tutorialnya.</p></section>`;
    const activeBanner=active?`<section class="workout-resume" aria-label="Sesi yang belum selesai"><div><span class="tiny-tag orange">Belum selesai</span><strong>${esc(planById(active.planId)?.name||'Latihan')} · ${formatDate(active.date,{day:'numeric',month:'short'})}</strong><p>Sesi tersimpan otomatis. Lanjutkan dari set terakhir.</p></div><button class="primary-btn" data-action="resume-workout">Lanjutkan ${icon('right')}</button></section>`:'';
    const body=plan.category==='strength'?`<div class="workout-detail-head"><div><p class="eyebrow">${formatDate(chosen,{weekday:'long',day:'numeric',month:'long'})} · WORKOUT ${plan.id.toUpperCase()}</p><h2>${plan.name}</h2><p>${plan.short} • mulai ${workoutTimeLabel()} WIB • ±${plan.minutes} menit</p></div><span class="tiny-tag ${selectedDone?'':'orange'}">${selectedDone?'✓ Selesai':'Latihan beban'}</span></div>
      <div class="workout-steps-summary"><span>${icon('flame')} Pemanasan 7 menit</span><span>${icon('workout')} ${plan.exercises.length} gerakan</span><span>${icon('clock')} Pendinginan 5 menit</span></div>
      ${renderWorkoutTimeline(plan)}
      <section class="workout-exercise-list">${plan.exercises.map((id,i)=>{const ex=trainingExercises[id],sets=targetSets(ex,week);return `<article class="workout-exercise-card"><img src="./assets/exercises/${ex.image}" alt="Contoh posisi ${esc(ex.name)}" loading="lazy" width="210" height="139"/><div class="workout-exercise-body"><span class="exercise-kicker">GERAKAN ${i+1} · ${esc(ex.muscles)}</span><h3>${esc(ex.name)}</h3><p>${strengthPrescription(ex,week)}</p><small>${esc(ex.gear)}</small><button class="workout-tutorial-link" data-action="show-exercise" data-id="${id}">Lihat cara gerakan ${icon('right')}</button></div></article>`;}).join('')}</section>
      <div class="workout-start-actions"><div class="muted-note">${selectedDone?'Sesi pada tanggal ini sudah tercatat.':'Sesi dapat dijalankan hari ini, meski kamu melihat template dari hari lain.'} Istirahat cukup sebelum melatih dada lagi.</div><button class="primary-btn" data-action="start-workout" data-id="${plan.id}" ${active?'disabled':''}>${icon('workout')} Mulai workout ${plan.id.toUpperCase()}</button></div>`:
      `<section class="card flat recovery-card"><div class="recovery-icon">${icon(plan.category==='rest'?'leaf':'clock')}</div><div><p class="eyebrow">${formatDate(chosen,{weekday:'long',day:'numeric',month:'long'})}</p><h2>${esc(plan.name)}</h2><p class="card-subtitle">${plan.category==='rest'?'Tanpa workout wajib':'Pukul '+workoutTimeLabel()+' WIB · ±'+plan.minutes+' menit'}</p></div><ol>${plan.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>${plan.category==='active'?`<button class="${selectedDone?'outline-btn':'primary-btn'}" data-action="toggle-activity" data-day="${chosen}" ${chosen>TODAY()?'disabled':''}>${icon(selectedDone?'check':'plus')} ${selectedDone?'Batalkan tanda selesai':'Tandai aktivitas selesai'}</button>`:''}</section>`;
    const history=relevantSessions().slice(0,5).map(s=>{const p=planById(s.planId);return `<div class="history-row"><div class="history-badge">${icon('check')}</div><div><strong>${esc(p.name)}</strong><small>${formatDate(s.date,{day:'numeric',month:'short',year:'numeric'})} · ${s.sets?.length||0} set · ${nf(s.durationMinutes)} menit</small></div><button class="outline-btn compact" data-action="view-workout-history" data-id="${esc(s.id)}">Detail</button></div>`;}).join('');
    const legacyCount=Object.keys(data.workouts||{}).filter(d=>workoutDone(d)).length;
    const weeklySegments=Array.from({length:8},(_,i)=>`<span class="program-week ${i+1<week?'completed':i+1===week?'current':''}" title="Minggu ${i+1}">${i+1}</span>`).join('');
    return `${header}${activeBanner}<section class="workout-selected">${body}</section>
      <div class="section-heading"><div><h2>Perjalanan 8 minggu</h2><p class="section-note">Mulai ${formatDate(data.workoutSettings.programStart,{day:'numeric',month:'short',year:'numeric'})}</p></div><span class="tiny-tag">Minggu ${week}/8</span></div>
      <section class="card flat"><div class="program-weeks">${weeklySegments}</div><p class="muted-note" style="margin-bottom:0">Minggu 1 adaptasi 2 set; minggu 2–3 set normal; minggu 4–7 tingkatkan repetisi atau tempo secara bertahap; minggu 8 evaluasi. Jangan memaksakan gagal total setiap set.</p></section>
      <div class="section-heading"><div><h2>Riwayat latihan</h2><p class="section-note">Pencatatan repetisi dan beban aktual</p></div><span class="tiny-tag">${relevantSessions().length} sesi</span></div>
      <section class="card flat">${history||'<div class="empty-state"><strong>Belum ada sesi tersimpan</strong><p>Selesaikan workout pertama untuk melihat progres kekuatanmu di sini.</p></div>'}${legacyCount?`<p class="muted-note" style="margin:12px 0 0">${legacyCount} hari checklist workout dari versi lama tetap tersimpan dan dihitung dalam konsistensi mingguan.</p>`:''}</section>
      <div class="section-heading"><div><h2>Progres kekuatan</h2><p class="section-note">Bandingkan total per gerakan di setiap sesi</p></div></div>${workoutProgressHtml()}`;
  }
  function renderGuidedWorkout() {
    const a=data.activeWorkout,plan=planById(a?.planId);
    if(!a||!plan||!Array.isArray(plan.exercises)) {ui.workoutFocus=false;return '<section class="card">Sesi tidak ditemukan.</section>';}
    const ids=plan.exercises,index=clamp(Number(a.exerciseIndex)||0,0,ids.length-1),ex=trainingExercises[ids[index]];
    const expected=a.goals?.[ex.id]||targetSets(ex,a.week||1);
    const logs=(a.sets||[]).filter(x=>x.exerciseId===ex.id);
    const complete=logs.length>=expected,waiting=Number(a.restUntil||0)>Date.now()&&!complete;
    const targetTotal=ids.reduce((sum,id)=>sum+Number(a.goals?.[id]||targetSets(trainingExercises[id],a.week||1)),0);
    const achieved=(a.sets||[]).length,progress=clamp(achieved/Math.max(1,targetTotal)*100,0,100);
    const isLast=index===ids.length-1;
    const latest=relevantSessions().find(s=>s.planId===a.planId&&s.sets?.some(v=>v.exerciseId===ex.id));
    const previous=latest?.sets?.filter(v=>v.exerciseId===ex.id)||[];
    return `<div class="workout-focus-head"><button class="outline-btn compact" data-action="leave-workout">${icon('left')} Kembali</button><div><span class="eyebrow">WORKOUT BERJALAN</span><strong>${esc(plan.name)}</strong></div><button class="link-button danger-link" data-action="abandon-workout">Hentikan</button></div>
      <section class="focus-status"><div class="focus-stat"><span>Progres set</span><strong>${achieved} / ${targetTotal}</strong></div><div class="focus-stat"><span>Durasi sesi</span><strong id="elapsed-clock">${secondsLabel(Math.floor((Date.now()-a.startedAt)/1000))}</strong></div><div class="focus-stat"><span>Gerakan</span><strong>${index+1} / ${ids.length}</strong></div></section>
      <div class="progress-track workout-focus-progress"><span style="width:${progress}%"></span></div>
      <div class="focus-step-label">GERAKAN ${index+1} DARI ${ids.length} · ${esc(ex.muscles)}</div>
      <section class="card flat workout-now-card"><img class="workout-now-image" src="./assets/exercises/${ex.image}" alt="Contoh posisi ${esc(ex.name)}"/><h1>${esc(ex.name)}</h1><p>${strengthPrescription(ex,a.week||1)}</p><div class="focus-detail-chip">${icon('workout')} ${esc(ex.gear)}</div><button class="workout-tutorial-link" data-action="show-exercise" data-id="${ex.id}">Buka tutorial lengkap ${icon('right')}</button></section>
      <section class="card flat set-card"><div class="card-head"><div><h2 class="card-title">Set latihan</h2><p class="card-subtitle">Catat angka yang benar-benar kamu lakukan</p></div><span class="tiny-tag">${logs.length}/${expected} set</span></div>
      <div class="set-indicators">${Array.from({length:expected},(_,i)=>`<div class="set-indicator ${i<logs.length?'logged':''}"><span>${i<logs.length?icon('check'):i+1}</span><small>${i<logs.length?`${logs[i].seconds||logs[i].reps} ${ex.timed?'dtk':'rep'}`:'Belum'}</small></div>`).join('')}</div>
      ${complete?`<div class="set-complete">${icon('check')} Semua set ${esc(ex.name)} selesai.</div><button class="primary-btn full-btn" data-action="${isLast?'finish-workout':'next-workout-exercise'}">${isLast?'Selesaikan workout':'Lanjut gerakan berikutnya'} ${icon('arrow')}</button>`:
        waiting?`<div class="rest-timer-box"><span class="eyebrow">WAKTU ISTIRAHAT</span><strong id="rest-clock" aria-live="polite">${secondsLabel(Math.ceil((a.restUntil-Date.now())/1000))}</strong><p>Tarik napas, minum air bila perlu, lalu lanjutkan set ${logs.length+1}.</p><button class="outline-btn" data-action="skip-workout-rest">Lewati istirahat</button></div>`:
        `<form id="workout-set-form" class="workout-set-form"><div class="focus-form-sub">Set ${logs.length+1} dari ${expected}</div><div class="field-grid"><div class="field"><label for="actual-reps">${ex.timed?'Durasi aktual (detik)':'Repetisi aktual'+(ex.unit?' ('+ex.unit+')':'')}</label><input type="number" id="actual-reps" name="reps" min="1" max="300" step="1" value="${ex.min}" required inputmode="numeric"/></div>${ex.load>0?`<div class="field"><label for="actual-load">${ex.id==='goblet_squat'?'Beban dumbbell (kg)':'Beban per dumbbell (kg)'}</label><input type="number" id="actual-load" name="load" min="0" max="50" step="0.5" value="${ex.load}" inputmode="decimal" required /></div>`:'<div class="field"><label>Beban</label><div class="readonly-load">Berat badan</div></div>'}</div><button type="submit" class="primary-btn full-btn">${icon('check')} Simpan set ${logs.length+1}</button></form>`}
      ${previous.length?`<p class="muted-note">Sesi ${formatDate(latest.date,{day:'numeric',month:'short'})}: ${previous.map(x=>x.seconds?x.seconds+' dtk':x.reps+' rep').join(' · ')}. Gunakan sebagai pembanding, bukan kewajiban.</p>`:''}</section>
      <div class="session-guidance">${icon('info')} Awali dengan pemanasan 7 menit sebelum set pertama dan akhiri dengan pendinginan 5 menit. Istirahat otomatis mengikuti tiap gerakan.</div>`;
  }
  function showExerciseTutorial(id) {
    const ex=trainingExercises[id];if(!ex)return;
    const week=workoutProgramWeek(TODAY());
    openModal(`<div class="modal-top"><div><p class="eyebrow">TUTORIAL GERAKAN</p><h2>${esc(ex.name)}</h2><p class="modal-note">${esc(ex.muscles)} · ${esc(ex.gear)}</p></div><button class="close-btn" data-action="close-modal" aria-label="Tutup">${icon('close')}</button></div>
      <img class="tutorial-photo" src="./assets/exercises/${ex.image}" alt="Contoh ilustrasi posisi ${esc(ex.name)}"/>
      <div class="tutorial-tags"><span>${icon('workout')} ${targetSets(ex,week)} set</span><span>${icon('target')} ${ex.min}–${ex.max} ${ex.timed?'detik':'repetisi'}</span><span>${icon('clock')} ${ex.rest} dtk istirahat</span></div>
      <h3 class="tutorial-heading">Langkah demi langkah</h3><ol class="tutorial-steps">${ex.cues.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>
      <h3 class="tutorial-heading">Kesalahan yang perlu dihindari</h3><ul class="tutorial-mistakes">${ex.mistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      <div class="workout-tip">${icon('info')}<span>${esc(ex.tip)}</span></div><p class="muted-note">Foto adalah ilustrasi satu posisi, bukan animasi penuh. Hentikan gerakan jika timbul nyeri tajam atau gejala yang tidak biasa.</p>`);
  }
  function startWorkout(planId) {
    const plan=planById(planId);
    if(!plan||plan.category!=='strength')return showToast('Pilih sesi latihan beban.');
    if(data.activeWorkout){ui.workoutFocus=true;render();return;}
    const today=TODAY(),week=workoutProgramWeek(today);
    data.activeWorkout={id:uid(),date:today,planId,week,startedAt:Date.now(),exerciseIndex:0,sets:[],goals:Object.fromEntries(plan.exercises.map(id=>[id,targetSets(trainingExercises[id],week)])),restUntil:0};
    save();ui.workoutFocus=true;setTab('workout');showToast('Sesi dimulai. Lakukan pemanasan 7 menit dulu.');
  }
  function submitWorkoutSet(form) {
    const a=data.activeWorkout,plan=planById(a?.planId);if(!a||!plan)return;
    const id=plan.exercises[a.exerciseIndex],ex=trainingExercises[id];if(!ex)return;
    const previous=(a.sets||[]).filter(x=>x.exerciseId===id).length;
    if(previous>=Number(a.goals?.[id]||targetSets(ex,a.week||1)))return;
    const fd=new FormData(form),reps=Number(fd.get('reps')),load=ex.load>0?Number(fd.get('load')):0;
    if(!Number.isInteger(reps)||reps<1||reps>300||!Number.isFinite(load)||load<0||load>50)return showToast('Periksa repetisi/durasi dan berat beban.');
    a.sets.push({exerciseId:id,set:previous+1,reps:ex.timed?null:reps,seconds:ex.timed?reps:null,load,at:Date.now()});
    const total=Number(a.goals?.[id]||targetSets(ex,a.week||1));
    a.restUntil=previous+1<total?Date.now()+ex.rest*1000:0;
    save();render();showToast(`Set ${previous+1} tersimpan.`);
  }
  function finishWorkout() {
    const a=data.activeWorkout,plan=planById(a?.planId);if(!a||!plan)return;
    const done=plan.exercises.every(id=>(a.sets||[]).filter(x=>x.exerciseId===id).length>=Number(a.goals?.[id]||targetSets(trainingExercises[id],a.week||1)));
    if(!done)return showToast('Lengkapi semua set sebelum menyelesaikan sesi.');
    data.workoutSessions.push({id:a.id,date:a.date,planId:a.planId,week:a.week,startedAt:a.startedAt,completedAt:Date.now(),durationMinutes:Math.max(1,Math.round((Date.now()-a.startedAt)/60000)),sets:a.sets});
    data.activeWorkout=null;ui.workoutFocus=false;ui.workoutDate=TODAY();save();render();showToast('Workout selesai! Progresmu tersimpan. 🎉');
  }
  function showWorkoutHistory(id) {
    const s=relevantSessions().find(x=>x.id===id);if(!s)return;
    const p=planById(s.planId);
    const groups=p.exercises.map(exId=>{const ex=trainingExercises[exId],setEntries=(s.sets||[]).filter(x=>x.exerciseId===exId);if(!setEntries.length)return '';
      return `<div class="history-detail-line"><strong>${esc(ex.name)}</strong><small>${setEntries.map(x=>`${x.seconds||x.reps} ${x.seconds?'detik':'rep'}${Number(x.load)>0?' · '+nf(x.load,1)+' kg':''}`).join(' / ')}</small></div>`;}).join('');
    openModal(`<div class="modal-top"><div><p class="eyebrow">RIWAYAT WORKOUT</p><h2>${esc(p.name)}</h2><p class="modal-note">${formatDate(s.date)} · ${nf(s.durationMinutes)} menit · ${s.sets?.length||0} set</p></div><button class="close-btn" data-action="close-modal" aria-label="Tutup">${icon('close')}</button></div><div class="history-detail">${groups}</div><p class="muted-note">Beban dumbbell tercatat per dumbbell (kecuali goblet squat memakai satu dumbbell). Durasi dihitung dari waktu mulai hingga selesai sesi.</p>`);
  }
  function toggleActivity(day) {
    const p=planForDate(day);if(!p||p.category!=='active'||day>TODAY())return;
    const isDone=activityOn(day);
    data.activityLogs=isDone?data.activityLogs.filter(x=>x.date!==day):[...data.activityLogs,{id:uid(),date:day,planId:p.id}];
    save();render();showToast(isDone?'Tanda aktivitas dibatalkan.':'Aktivitas ringan dicatat. ✓');
  }
  function updateWorkoutClocks(){
    if(ui.tab!=='workout'||!ui.workoutFocus||!data.activeWorkout)return;
    const a=data.activeWorkout;
    const elapsed=document.getElementById('elapsed-clock');if(elapsed)elapsed.textContent=secondsLabel(Math.floor(Math.max(0,Date.now()-a.startedAt)/1000));
    const rest=document.getElementById('rest-clock');if(rest){const remaining=Math.ceil((a.restUntil-Date.now())/1000);if(remaining<=0){a.restUntil=0;save();render();}else rest.textContent=secondsLabel(remaining);}
  }
  async function toggleWorkoutReminder(){
    if(!('Notification' in window))return showToast('Notifikasi tidak didukung browser ini.');
    if(data.reminders.workout){data.reminders.workout=false;save();render();return;}
    const permission=Notification.permission==='default'?await Notification.requestPermission():Notification.permission;
    if(permission!=='granted')return showToast('Izin notifikasi diperlukan.');
    data.reminders.workout=true;data.reminders.lastDate='';save();render();showToast('Pengingat workout diaktifkan.');
  }
  function checkWorkoutReminder(){
    if(!data.reminders.workout||!('Notification' in window)||Notification.permission!=='granted')return;
    const now=new Date(),today=TODAY(),plan=planForDate(today),[hour,minute]=data.workoutSettings.time.split(':').map(Number);
    const scheduled=new Date(now);scheduled.setHours(hour,minute,0,0);
    if(plan?.category!=='strength'||data.reminders.lastDate===today||now<scheduled)return;
    new Notification('Waktunya workout', {body:`${plan.name} dimulai sekarang. Pemanasan 7 menit dulu.`});
    data.reminders.lastDate=today;save();
  }
  function renderSettings() {
    const backupText=data.backupLastExport?`Backup terakhir: ${new Date(data.backupLastExport).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}.`:'Belum ada backup JSON.';
    const notificationSupported='Notification' in window;
    return `${titleBlock('YOUR SPACE','Profil & target','Atur target sesuai kebutuhan dan simpan salinan jurnalmu.')}
      <form class="card flat" id="profile-form"><div class="card-head"><div><h2 class="card-title">Profil pribadi</h2><p class="card-subtitle">Personalisasi perjalananmu</p></div><span class="icon-square">${icon('settings')}</span></div>
        <div class="field-grid"><div class="field"><label for="profile-name">Nama panggilan</label><input id="profile-name" name="name" maxlength="50" required value="${esc(data.profile.name)}" /></div><div class="field"><label for="profile-height">Tinggi badan (cm)</label><input id="profile-height" name="height" type="number" min="100" max="230" step="1" required value="${esc(data.profile.height)}" /></div><div class="field"><label for="profile-start">Berat awal (kg)</label><input id="profile-start" name="startWeight" type="number" min="25" max="300" step="0.1" required value="${esc(data.profile.startWeight)}" /></div><div class="field"><label for="profile-target">Target berat (kg)</label><input id="profile-target" name="targetWeight" type="number" min="25" max="300" step="0.1" required value="${esc(data.profile.targetWeight)}" /></div></div>
        <hr class="separator"/><h3 class="card-title" style="margin-bottom:14px">Target asupan harian</h3>
        <div class="field-grid"><div class="field"><label for="profile-cal">Kalori (kkal)</label><input id="profile-cal" name="calorieGoal" type="number" min="1000" max="6000" step="50" required value="${esc(data.profile.calorieGoal)}" /></div><div class="field"><label for="profile-protein">Protein (gram)</label><input id="profile-protein" name="proteinGoal" type="number" min="30" max="300" step="1" required value="${esc(data.profile.proteinGoal)}" /></div><div class="field"><label for="profile-weekly-gain">Target naik per minggu (kg)</label><input id="profile-weekly-gain" name="weeklyGain" type="number" min="0.05" max="1" step="0.05" required value="${esc(data.profile.weeklyGain)}" /></div></div>
        <p class="muted-note">Angka awal 2.400 kkal dan 95 g protein adalah target sementara, bukan hasil perhitungan medis. Sesuaikan berdasarkan usia, aktivitas, pola makan, dan tren berat badan.</p>
        <hr class="separator"/><h3 class="card-title" style="margin-bottom:14px">Pengaturan workout</h3>
        <div class="field-grid"><div class="field"><label for="workout-time">Jam mulai (WIB)</label><input id="workout-time" type="time" name="workoutTime" required value="${workoutTimeLabel()}" /></div><div class="field"><label for="program-start">Tanggal mulai program 8 minggu</label><input id="program-start" type="date" name="programStart" max="${TODAY()}" required value="${esc(data.workoutSettings.programStart)}" /></div></div>
        <p class="field-hint">Tanggal program dibulatkan ke hari Senin pada minggu yang dipilih. Pengaturan waktu berlaku untuk semua hari latihan. Riwayat yang sudah disimpan tidak berubah.</p>
        <button type="submit" class="primary-btn" style="margin-top:11px">${icon('check')} Simpan pengaturan</button>
      </form>
      <div class="section-heading"><div><h2>Pengingat</h2><p class="section-note">Notifikasi latihan saat aplikasi terbuka</p></div></div>
      <section class="card flat"><div class="reminder-row"><div><strong>Workout ${workoutTimeLabel()} WIB</strong><p>${data.reminders.workout?'Aktif pada hari latihan beban.':'Belum aktif.'}</p></div>${notificationSupported?`<button class="${data.reminders.workout?'outline-btn':'primary-btn'}" data-action="toggle-workout-reminder">${data.reminders.workout?'Matikan':'Aktifkan'}</button>`:'<span class="muted-note">Browser tidak mendukung notifikasi.</span>'}</div><p class="muted-note" style="margin-bottom:0">Pengingat berjalan ketika Naik sedang terbuka. Notifikasi saat aplikasi tertutup memerlukan layanan push/server.</p></section>
      <div class="section-heading"><div><h2>Tampilan & laporan</h2><p class="section-note">Preferensi tersimpan di perangkat ini</p></div></div><section class="card flat"><div class="settings-actions"><button class="outline-btn" data-action="toggle-theme">${data.theme==='dark'?'☀ Mode terang':'◐ Mode gelap'}</button><button class="outline-btn" data-action="print-weekly-report">${icon('download')} Cetak ringkasan minggu</button></div></section>
      <div class="section-heading"><div><h2>Data & privasi</h2><p class="section-note">Semua data disimpan di perangkat ini</p></div></div>
      <section class="card flat"><div class="settings-actions"><button class="outline-btn" data-action="export-data">${icon('download')} Ekspor JSON</button><button class="outline-btn" data-action="import-data">${icon('upload')} Impor data</button><a class="outline-btn" href="./MANUAL_BOOK.md" download="Manual-Pengguna-Naik.md">${icon('download')} Unduh manual</a></div>${backupDue()?`<div class="backup-reminder">${icon('shield')}<div><strong>Waktunya backup</strong><p>Data hanya tersimpan di perangkat ini. Ekspor JSON sekarang.</p></div></div>`:`<p class="muted-note">${backupText}</p>`}
      <div class="insight" style="margin-top:17px">${icon('shield')}<div><strong>Privasi terjaga</strong><p>Tidak ada akun, server, atau pengiriman data ke pihak lain. Riwayat hanya tersedia di browser/perangkat ini. Ekspor JSON secara berkala agar tidak hilang saat data browser dihapus.</p></div></div>
      <hr class="separator"/><button class="outline-btn" data-action="install-app">${icon('install')} Pasang aplikasi di HP</button><p class="muted-note">Di iPhone: buka melalui Safari → Bagikan → Tambah ke Layar Utama. Di Chrome Android, gunakan menu Install app jika tersedia. PWA memerlukan HTTPS atau localhost.</p>
      <hr class="separator"/><button class="link-button" style="color:#ae735e" data-action="reset-data">${icon('refresh')} Hapus semua data & mulai ulang</button></section>
      <p class="muted-note" style="text-align:center;margin:23px 0">Naik v2.0 · Progress, not perfection. ♡</p>`;
  }
  function renderRail() {
    return `<div class="rail-top"><div><div class="rail-hello">Halo, ${esc(data.profile.name.split(' ')[0])} 👋</div><div class="rail-date">${formatDate(TODAY(),{weekday:'long',day:'numeric',month:'long'})}</div></div><div class="rail-avatar">${esc(data.profile.name.trim().slice(0,1).toUpperCase())}</div></div>
      <h2 class="rail-heading">Jadwal makan</h2><div class="rail-schedule">${dayStatus(TODAY()).map(m=>`<div class="rail-step"><div class="rail-dot ${m.completed?'done':''}">${m.completed?icon('check'):''}</div><div class="rail-text"><strong>${m.label} · ${m.time}</strong><small>${m.secondary}</small></div></div>`).join('')}</div>
      <div class="rail-tip"><span class="rail-tip-label">GOOD TO KNOW</span><strong>Yang penting konsisten.</strong><p>Tambahkan satu waktu makan dulu. Evaluasi kenaikan dari rata-rata berat mingguan, bukan satu kali timbang.</p></div>
      <h2 class="rail-heading">Aksi cepat</h2><button class="primary-btn full-btn" data-action="open-meal">${icon('plus')} Catat makanan</button><button class="outline-btn full-btn" style="margin-top:9px" data-action="open-weight">${icon('weight')} Tambah penimbangan</button>`;
  }
  function render() {
    document.body.dataset.theme=data.theme;
    renderNav();
    const main=document.getElementById('main-view');
    main.innerHTML=({home:renderHome,meals:renderMeals,progress:renderProgress,workout:renderWorkout,settings:renderSettings}[ui.tab]||renderHome)();
    document.body.classList.toggle('workout-focus-mode',ui.tab==='workout'&&ui.workoutFocus&&!!data.activeWorkout);
    document.getElementById('right-rail').innerHTML=renderRail();
  }
  function setTab(tab){if(!tabs.find(t=>t.id===tab))return; ui.tab=tab; location.hash=tab;render();window.scrollTo({top:0,behavior:'instant'});}
  const closeModal = () => {ui.modal=null;document.getElementById('modal-layer').innerHTML='';document.body.style.overflow='';};
  function openModal(inner) {
    ui.modal=true;document.body.style.overflow='hidden';
    document.getElementById('modal-layer').innerHTML=`<div class="modal-backdrop" data-action="backdrop-close"><section class="modal" role="dialog" aria-modal="true" aria-label="Form catatan">${inner}</section></div>`;
    document.querySelector('.modal input, .modal select, .modal button')?.focus();
  }
  function openMeal(foodId=null,type=null) {
    const food=foodById(foodId),date=ui.tab==='meals'?ui.mealDate:TODAY();
    const mealType=type||food?.type||(()=>{const h=new Date().getHours();return h<11?'breakfast':h<15?'lunch':h<18?'snack':h<22?'dinner':'late';})();
    openModal(`<div class="modal-top"><div><p class="eyebrow">FOOD JOURNAL</p><h2>Catat makanan 🍽️</h2><p class="modal-note">Estimasi bisa diubah sesuai porsi sebenarnya.</p></div><button class="close-btn" data-action="close-modal" aria-label="Tutup">${icon('close')}</button></div>
      <form class="modal-form" id="meal-form"><div class="field"><label for="meal-name">Nama makanan</label><input name="name" id="meal-name" maxlength="90" required placeholder="Contoh: Nasi Padang ayam" value="${esc(food?.name||'')}" /></div>
        <div class="field-grid"><div class="field"><label for="meal-date">Tanggal</label><input type="date" name="date" id="meal-date" max="${TODAY()}" required value="${date}" /></div><div class="field"><label for="meal-type">Waktu makan</label><select name="type" id="meal-type">${Object.entries(typeLabels).map(([id,label])=>`<option value="${id}" ${id===mealType?'selected':''}>${label}</option>`).join('')}</select></div></div>
        <div class="field"><label for="meal-portions">Jumlah porsi</label><select id="meal-portions" name="portions"><option value="0.5">½ porsi</option><option value="1" selected>1 porsi</option><option value="1.5">1½ porsi</option><option value="2">2 porsi</option><option value="3">3 porsi</option></select></div>
        <div class="field-grid"><div class="field"><label for="meal-cal">Kalori per porsi (kkal)</label><input type="number" id="meal-cal" name="cal" min="0" max="4000" step="1" value="${food?.cal??''}" required placeholder="Contoh: 650" /></div><div class="field"><label for="meal-protein">Protein per porsi (gram)</label><input type="number" id="meal-protein" name="protein" min="0" max="250" step="0.1" value="${food?.protein??''}" required placeholder="Contoh: 30" /></div></div>
        <input type="hidden" name="emoji" value="${food?.emoji||'🍽️'}"/><p class="field-hint">Nilai akhir = nilai per porsi × jumlah porsi. Data nutrisi di sini perkiraan, bukan database gizi terverifikasi.</p>
        <div class="modal-actions"><button type="button" class="outline-btn" data-action="close-modal">Batal</button><button type="submit" class="primary-btn">${icon('check')} Simpan makanan</button></div></form>`);
  }
  function openWeight() {
    openModal(`<div class="modal-top"><div><p class="eyebrow">BODY PROGRESS</p><h2>Catat berat badan ⚖️</h2><p class="modal-note">Paling konsisten saat pagi hari setelah ke toilet, sebelum makan.</p></div><button class="close-btn" data-action="close-modal" aria-label="Tutup">${icon('close')}</button></div>
      <form class="modal-form" id="weight-form"><div class="field-grid"><div class="field"><label for="weight-date">Tanggal</label><input type="date" name="date" id="weight-date" max="${TODAY()}" required value="${TODAY()}" /></div><div class="field"><label for="weight-weight">Berat badan (kg)</label><input type="number" name="weight" id="weight-weight" min="25" max="300" step="0.1" required value="${currentWeight()}" /></div></div><p class="field-hint">Boleh timbang 2–3 kali seminggu. Jika ada dua catatan pada tanggal sama, aplikasi menggunakan input terakhir untuk grafik.</p><div class="modal-actions"><button type="button" class="outline-btn" data-action="close-modal">Batal</button><button type="submit" class="primary-btn">${icon('check')} Simpan berat</button></div></form>`);
  }
  function printWeeklyReport(){
    const start=dateShift(TODAY(),-6),days=Array.from({length:7},(_,i)=>dateShift(start,i));
    const rows=days.map(day=>{const total=totalsOn(day);return `<tr><td>${formatDate(day,{weekday:'short',day:'numeric',month:'short'})}</td><td>${nf(total.cal)} kkal</td><td>${nf(total.protein,1)} g</td><td>${completedWorkoutDates().has(day)?'Workout':activityOn(day)?'Aktivitas':'-'}</td></tr>`;}).join('');
    const popup=window.open('','naik-weekly-report','width=720,height=760');if(!popup)return showToast('Izinkan pop-up untuk mencetak laporan.');
    popup.document.write(`<!doctype html><title>Ringkasan Naik</title><style>body{font:16px Arial;color:#25362f;padding:32px}h1{margin:0}p{color:#64736a}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:12px;border-bottom:1px solid #dde5da}th{background:#edf4e8}</style><h1>Ringkasan Mingguan Naik</h1><p>${esc(data.profile.name)} · ${formatDate(start,{day:'numeric',month:'long'})} - ${formatDate(TODAY(),{day:'numeric',month:'long',year:'numeric'})}</p><p>Berat terkini: <strong>${nf(currentWeight(),1)} kg</strong> · Target kenaikan: <strong>${nf(data.profile.weeklyGain,2)} kg/minggu</strong></p><table><thead><tr><th>Hari</th><th>Kalori</th><th>Protein</th><th>Aktivitas</th></tr></thead><tbody>${rows}</tbody></table><p>Dicetak dari Naik.</p>`);
    popup.document.close();popup.focus();popup.print();
  }
  function handleAction(el){
    const action=el.dataset.action;
    if(action==='navigate'){setTab(el.dataset.tab);return;}
    if(action==='open-meal'){openMeal(el.dataset.food||null,el.dataset.type||null);return;}
    if(action==='open-weight'){openWeight();return;}
    if(action==='toggle-workout-reminder'){toggleWorkoutReminder();return;}
    if(action==='toggle-theme'){data.theme=data.theme==='dark'?'light':'dark';save();render();return;}
    if(action==='print-weekly-report'){printWeeklyReport();return;}
    if(action==='repeat-meal'){const meal=data.meals.find(x=>x.id===el.dataset.id);if(!meal)return;data.meals.push({...meal,id:uid(),date:ui.mealDate});save();render();showToast(`${meal.name} dicatat lagi.`);return;}
    if(action==='toggle-favorite-meal'){const meal=data.meals.find(x=>x.id===el.dataset.id);if(!meal)return;const name=meal.name.toLocaleLowerCase('id-ID'),index=data.favoriteFoods.findIndex(food=>food.name.toLocaleLowerCase('id-ID')===name);if(index>=0){data.favoriteFoods.splice(index,1);showToast(`${meal.name} dihapus dari favorit.`);}else{data.favoriteFoods.push({id:`favorite-${uid()}`,name:meal.name,emoji:meal.emoji||'🍽️',cal:Math.round(Number(meal.cal)/Number(meal.portions||1)),protein:Math.round(Number(meal.protein)/Number(meal.portions||1)*10)/10,type:meal.type});showToast(`${meal.name} ditambahkan ke favorit.`);}save();render();return;}
    if(action==='close-modal'){closeModal();return;}
    if(action==='backdrop-close'){closeModal();return;}
    if(action==='date-prev'){ui.mealDate=dateShift(ui.mealDate,-1);render();return;}
    if(action==='date-next'){ui.mealDate=ui.mealDate<TODAY()?dateShift(ui.mealDate,1):TODAY();render();return;}
    if(action==='chart-range'){ui.progressRange=el.dataset.range;render();return;}
    if(action==='select-workout-day'){if(/^\d{4}-\d{2}-\d{2}$/.test(el.dataset.day||'')){ui.workoutDate=el.dataset.day;render();}return;}
    if(action==='show-exercise'){showExerciseTutorial(el.dataset.id);return;}
    if(action==='start-workout'){startWorkout(el.dataset.id);return;}
    if(action==='resume-workout'){if(!data.activeWorkout)return;ui.workoutFocus=true;setTab('workout');return;}
    if(action==='leave-workout'){ui.workoutFocus=false;render();return;}
    if(action==='abandon-workout'){if(!window.confirm('Hentikan sesi ini? Set yang belum diselesaikan akan dibuang, tetapi riwayat sesi sebelumnya tetap ada.'))return;data.activeWorkout=null;ui.workoutFocus=false;save();render();showToast('Sesi dibatalkan.');return;}
    if(action==='skip-workout-rest'){if(data.activeWorkout){data.activeWorkout.restUntil=0;save();render();}return;}
    if(action==='next-workout-exercise'){
      const a=data.activeWorkout,p=planById(a?.planId);if(!a||!p)return;
      const id=p.exercises[a.exerciseIndex],count=a.sets.filter(x=>x.exerciseId===id).length;
      if(count<(a.goals?.[id]||targetSets(trainingExercises[id],a.week)))return showToast('Lengkapi set dahulu.');
      if(a.exerciseIndex<p.exercises.length-1){a.exerciseIndex++;a.restUntil=0;save();render();}return;
    }
    if(action==='finish-workout'){finishWorkout();return;}
    if(action==='toggle-activity'){toggleActivity(el.dataset.day);return;}
    if(action==='view-workout-history'){showWorkoutHistory(el.dataset.id);return;}
    if(action==='delete-meal'){if(!window.confirm('Hapus catatan makanan ini?'))return;data.meals=data.meals.filter(x=>x.id!==el.dataset.id);save();render();showToast('Catatan makanan dihapus.');return;}
    if(action==='delete-weight'){if(!window.confirm('Hapus penimbangan ini?'))return;data.weights=data.weights.filter(x=>x.id!==el.dataset.id);save();render();showToast('Catatan berat dihapus.');return;}
    if(action==='export-data'){data.backupLastExport=Date.now();const content=JSON.stringify(data,null,2),blob=new Blob([content],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`naik-backup-${TODAY()}.json`;a.click();save();render();setTimeout(()=>URL.revokeObjectURL(url),3000);showToast('Backup JSON berhasil dibuat.');return;}
    if(action==='import-data'){document.getElementById('import-file').click();return;}
    if(action==='reset-data'){if(!window.confirm('PERINGATAN: Semua riwayat makan, latihan, dan timbang di perangkat ini akan dihapus. Lanjutkan?'))return;data=createDefault();save();ui.mealDate=TODAY();ui.workoutDate=TODAY();ui.workoutFocus=false;setTab('home');showToast('Program dimulai ulang.');return;}
    if(action==='install-app'){if(ui.installPrompt){ui.installPrompt.prompt();ui.installPrompt.userChoice.finally(()=>{ui.installPrompt=null;});}else{showToast('Gunakan menu browser: Install app atau Tambah ke Layar Utama.');}return;}
  }
  document.addEventListener('click', e=>{const el=e.target.closest('[data-action]');if(!el)return;if(el.dataset.action==='backdrop-close'&&e.target!==el)return;e.preventDefault();handleAction(el);});
  document.addEventListener('submit', e=>{
    if(!['meal-form','weight-form','profile-form','workout-set-form'].includes(e.target.id))return;
    e.preventDefault();
    const form=e.target,values=Object.fromEntries(new FormData(form));
    if(form.id==='workout-set-form') {submitWorkoutSet(form);return;}
    if(form.id==='meal-form') {
      const cal=Number(values.cal),protein=Number(values.protein),portions=Number(values.portions);
      if(!values.name.trim() || !typeLabels[values.type] || values.date>TODAY() || !/^\d{4}-\d{2}-\d{2}$/.test(values.date) || ![.5,1,1.5,2,3].includes(portions) || !Number.isFinite(cal)||cal<0||cal>4000||!Number.isFinite(protein)||protein<0||protein>250)return showToast('Periksa kembali data makanan.');
      data.meals.push({id:uid(),name:values.name.trim().slice(0,90),type:values.type,date:values.date,emoji:values.emoji||'🍽️',portions,cal:Math.round(cal*portions),protein:Math.round(protein*portions*10)/10});
      save();closeModal();render();showToast('Makanan berhasil dicatat. ✓');return;
    }
    if(form.id==='weight-form') {
      const weight=Number(values.weight);
      if(!Number.isFinite(weight)||weight<25||weight>300||values.date>TODAY() || !/^\d{4}-\d{2}-\d{2}$/.test(values.date))return showToast('Periksa berat dan tanggal.');
      data.weights.push({id:uid(),date:values.date,weight});save();closeModal();render();showToast('Berat badan berhasil dicatat. ✓');return;
    }
    if(form.id==='profile-form') {
      const height=Number(values.height),start=Number(values.startWeight),target=Number(values.targetWeight),cal=Number(values.calorieGoal),protein=Number(values.proteinGoal),weeklyGain=Number(values.weeklyGain);
      if(!values.name.trim()||!Number.isFinite(height)||height<100||height>230||!Number.isFinite(start)||start<25||start>300||!Number.isFinite(target)||target<=start||target>300||!Number.isFinite(cal)||cal<1000||cal>6000||!Number.isFinite(protein)||protein<30||protein>300||!Number.isFinite(weeklyGain)||weeklyGain<.05||weeklyGain>1)return showToast('Periksa target berat, asupan, dan kenaikan mingguan.');
      if(weeklyGain>.5&&!window.confirm('Target di atas 0,5 kg/minggu cukup cepat. Tetap simpan?'))return;
      if(cal<1500||protein>Math.max(250,start*3))showToast('Target disimpan. Tinjau kembali kalori/protein bila tidak sesuai kebutuhanmu.');
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(values.workoutTime||'')||!/^\d{4}-\d{2}-\d{2}$/.test(values.programStart||'')||values.programStart>TODAY()||!Number.isFinite(dateFrom(values.programStart).getTime()))return showToast('Periksa jam dan tanggal mulai workout.');
      data.profile={...data.profile,name:values.name.trim().slice(0,50),height,startWeight:start,targetWeight:target,weeklyGain,calorieGoal:cal,proteinGoal:protein};
      data.workoutSettings={time:values.workoutTime,programStart:weekMonday(values.programStart)};
      save();render();showToast('Profil dan target berhasil disimpan. ✓');return;
    }
  });
  document.addEventListener('input',e=>{if(e.target.dataset.action==='meal-search'){ui.mealSearch=e.target.value;render();document.querySelector('.meal-search')?.focus();}});
  document.addEventListener('change',e=>{if(e.target.dataset.action==='select-workout-progress'){ui.workoutProgressExercise=e.target.value;render();}});
  document.getElementById('import-file').addEventListener('change',async e=>{
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>5*1024*1024)return showToast('File terlalu besar (maksimal 5 MB).');
    try{
      const raw=JSON.parse(await file.text());
      if(!raw||![1,2].includes(raw.version)||!raw.profile||!Array.isArray(raw.weights)||!Array.isArray(raw.meals)||!raw.workouts||typeof raw.workouts!=='object'||Array.isArray(raw.workouts))throw Error('Format file tidak sesuai');
      if(typeof raw.profile.name!=='string'||!Number.isFinite(Number(raw.profile.targetWeight))||Number(raw.profile.targetWeight)<=Number(raw.profile.startWeight)||raw.weights.length>20000||raw.meals.length>50000||(raw.workoutSessions?.length||0)>10000||(raw.activityLogs?.length||0)>10000)throw Error('Data profil tidak valid');
      if(raw.workoutSessions!==undefined&&!Array.isArray(raw.workoutSessions)||raw.activityLogs!==undefined&&!Array.isArray(raw.activityLogs))throw Error('Format workout tidak valid');
      if(!window.confirm('Impor akan menggantikan SEMUA catatan yang ada di perangkat ini. Lanjutkan?'))return;
      const defaults=createDefault();
       data={version:2,profile:{...defaults.profile,...raw.profile},weights:raw.weights,meals:raw.meals,favoriteFoods:Array.isArray(raw.favoriteFoods)?raw.favoriteFoods.slice(0,30):[],theme:raw.theme==='dark'?'dark':'light',workouts:raw.workouts,workoutSessions:raw.workoutSessions||[],activityLogs:raw.activityLogs||[],activeWorkout:raw.activeWorkout&&typeof raw.activeWorkout==='object'?raw.activeWorkout:null,backupLastExport:Number(raw.backupLastExport)||0,reminders:{...defaults.reminders,...(raw.reminders||{})},workoutSettings:{...defaults.workoutSettings,...(raw.workoutSettings||{})}};
      if(!/^\d{4}-\d{2}-\d{2}$/.test(data.workoutSettings.programStart)||!Number.isFinite(dateFrom(data.workoutSettings.programStart).getTime()))data.workoutSettings.programStart=defaults.workoutSettings.programStart;
      if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.workoutSettings.time))data.workoutSettings.time='17:30';
      ui.workoutFocus=false;ui.workoutDate=TODAY();save();setTab('home');showToast('Data berhasil dipulihkan dari backup. ✓');
    }catch(err){console.warn(err);showToast('Impor gagal: format backup tidak valid.');}
    finally{e.target.value='';}
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.modal)closeModal();});
  window.addEventListener('hashchange',()=>{const tab=getTabFromHash();if(tab&&ui.tab!==tab){ui.tab=tab;render();}});
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ui.installPrompt=e;});
  const syncOnline=()=>{document.getElementById('offline-banner').hidden=navigator.onLine;};
  window.addEventListener('online',syncOnline);window.addEventListener('offline',syncOnline);
  document.body.dataset.theme=data.theme;syncOnline();render();
  setInterval(()=>{updateWorkoutClocks();checkWorkoutReminder();},1000);
  // Store initial default so refreshing the page does not reset the initial date.
  if(!localStorage.getItem(STORE_KEY))save();
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1')) {
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Service worker tidak terpasang:',err)));
  }
})();
