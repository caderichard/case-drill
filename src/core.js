/* ================= STATE ================= */
const KEY='cd5';
const DEF={v:5,xp:0,combo:0,best:0,streak:{last:null,n:0,freeze:1},daily:{date:null,xp:0,goal:150},items:{},levels:{},badges:[],log:[],totals:{q:0,ok:0},sessions:0,gen:[],rubric:{},persona:'coach',theme:'light',apiKey:'',model:'claude-sonnet-5-5',updated:0,liveGrade:true};
let S=load();
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.xp!==undefined)return Object.assign({},DEF,s);}catch(e){}
 // migrate v4 progress if present
 try{const o=JSON.parse(localStorage.getItem('cd4'));if(o&&o.xp!==undefined){const s=Object.assign({},DEF,{xp:o.xp,best:o.best,streak:o.streak,daily:o.daily,items:o.items,levels:o.levels,badges:o.badges,totals:o.totals,sessions:o.sessions});return s;}}catch(e){}
 return JSON.parse(JSON.stringify(DEF));}
function save(){S.updated=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}Sync.push();}
const today=()=>new Date().toISOString().slice(0,10);
const now=()=>Date.now();
const TYPES=D.types.slice().sort((a,b)=>a.order-b.order);
const T=id=>TYPES.find(t=>t.id===id);
const FAMN={diag:'Diagnose',grow:'Grow',eval:'Evaluate',ops:'Operate'};
const RANKS=[[0,'Analyst'],[400,'Consultant'],[1200,'Case Leader'],[2800,'Project Leader'],[5500,'Principal'],[9500,'Partner'],[15000,'Senior Partner']];
function rank(){let r=RANKS[0],nx=null;for(let i=0;i<RANKS.length;i++){if(S.xp>=RANKS[i][0]){r=RANKS[i];nx=RANKS[i+1]||null;}}return{name:r[1],from:r[0],to:nx?nx[0]:null,next:nx?nx[1]:null};}
const STAGES=[
 {k:1,name:'Buckets',sub:'Name them, in order',pass:5},
 {k:2,name:'The MECE cut',sub:'Why these buckets and no others',pass:3},
 {k:3,name:'Click-downs',sub:'Two or three under every bucket',pass:.8},
 {k:4,name:'Trap & start',sub:'The predictable mistake; where you go first',pass:3},
 {k:5,name:'Blank recall',sub:'Whole tree from nothing — 3 days to master',pass:.85},
 {k:6,name:'Boss case',sub:'Apply it to a real client',pass:2},
];
function lv(id){if(!S.levels[id])S.levels[id]={stage:1,passed:{},recall:[],boss:0,perfect:{}};return S.levels[id];}
function unlocked(i){if(i===0)return true;const prev=TYPES[i-1];return !!lv(prev.id).passed[5];}
function mastered(id){return lv(id).recall.length>=3;}
function stageOpen(id,k){return k<=lv(id).stage;}
function allCases(){return D.cases.concat(S.gen||[]);}
function logEvent(e){e.at=now();S.log.push(e);if(S.log.length>300)S.log=S.log.slice(-300);}

/* ================= UTIL ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=(a,n)=>shuffle(a).slice(0,n);
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),1800);}
function buzz(p){try{navigator.vibrate&&navigator.vibrate(p||12);}catch(e){}}
function fly(txt){const e=document.createElement('div');e.className='fly';e.textContent=txt;e.style.left=(window.innerWidth/2-20)+'px';e.style.top=(window.innerHeight/2)+'px';document.body.appendChild(e);setTimeout(()=>e.remove(),1000);}
function confetti(n=120,col){const c=$('#confetti'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;const cols=col?[col,'#F0B429','#fff']:['#2457F5','#12A86A','#8A4DFF','#F2742B','#F0B429'];const P=[];for(let i=0;i<n;i++)P.push({x:innerWidth/2,y:innerHeight/2.5,vx:(Math.random()-.5)*14,vy:-Math.random()*14-3,r:Math.random()*6+3,c:rnd(cols),a:Math.random()*6});let f=0;(function step(){x.clearRect(0,0,c.width,c.height);P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.35;p.a+=.1;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.fillStyle=p.c;x.fillRect(-p.r/2,-p.r/2,p.r,p.r*1.6);x.restore();});if(++f<90)requestAnimationFrame(step);else x.clearRect(0,0,c.width,c.height);})();}
const thinking=(t)=>`<span class="thinking">${esc(t||'Thinking')} <i></i><i></i><i></i></span>`;
const STOP=new Set(['the','and','for','with','from','into','that','this','what','which','than','then','our','their','your','they','them','are','not','its','per','out','all','any','one','two','vs','new','each','who','how','why','where','when','more','less','most','also','only','both','over','under','same','other','unit','units']);
const norm=s=>String(s).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9 ]+/g,' ').split(/\s+/).filter(Boolean);
function keysOf(s){const w=norm(String(s).replace(/\(.*?\)/g,' ')).filter(x=>x.length>=3&&!STOP.has(x));const u=[];w.forEach(x=>{const st=x.slice(0,5);if(!u.some(y=>y.slice(0,5)===st))u.push(x);});return u.slice(0,4);}
const SYN={price:['pricing','prices'],volume:['quantity','units','customers'],competitor:['competition','competitors','rival','rivals'],regulation:['regulatory','regulator','rules','law','laws','policy'],synerg:['synergy','synergies'],breakeven:['break','payback'],cannibal:['cannibalization','cannibalisation'],bottleneck:['bottleneck','constraint'],capab:['capabilities','capability'],channel:['channels'],geograph:['geographies','geography','geos','regions','countries','markets'],segment:['segments','segmentation'],integrat:['integration'],invest:['investment','capex','upfront'],alternat:['alternatives','alternative','options'],stakeh:['stakeholders'],timeline:['timing','time'],benchmark:['benchmarks','peers'],elastic:['elasticity','sensitivity'],switching:['switching','lock'],differenti:['differentiation','differentiate'],runrate:['run-rate','runrate','recurring'],downside:['downside','risk','risks'],productiv:['productivity','efficiency'],procure:['procurement','suppliers','negotiate','renegotiate']};
function hitKey(key,userWords){const st=key.slice(0,5);if(userWords.some(w=>w.startsWith(st)||(st.startsWith(w.slice(0,5))&&w.length>=4)))return true;for(const k in SYN){if(key.startsWith(k)||k.startsWith(key.slice(0,5))){if(SYN[k].some(s=>userWords.some(w=>w.startsWith(s.slice(0,5)))))return true;}}return false;}
function matchText(expected,text){const uw=norm(text);const ks=keysOf(expected);if(!ks.length)return{hit:false,ks:[]};const hits=ks.map(k=>hitKey(k,uw));const need=Math.max(1,Math.ceil(ks.length/2));return{hit:hits.filter(Boolean).length>=need,ks,hits};}
const bname=b=>b.name.replace(/\s*\(.*?\)\s*/g,'').trim();
function parseJSON(text){if(typeof text!=='string')return text;let s=text.trim().replace(/^```(?:json)?/i,'').replace(/```$/,'').trim();const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a>=0&&b>a)s=s.slice(a,b+1);return JSON.parse(s);}
function fmtTime(s){return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function treeHTML(t,hi){return `<div class="tree fam-${t.fam}">`+t.buckets.map((b,i)=>`<div class="bk" style="${hi===i?'background:var(--soft);border-radius:0 8px 8px 0;padding:6px 8px':''}"><b>${i+1}. ${esc(b.name)}</b><ul>${b.subs.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div>`).join('')+'</div>';}
function treeText(t){return t.buckets.map((b,i)=>`${i+1}. ${b.name}: ${b.subs.join('; ')}`).join('\n');}

/* ================= LIVE LAYER ================= */
const Live={mode:null,sample:null,db:null,user:null,ready:false,busy:false,
 async init(){try{if(window.claude&&typeof claude.use==='function'){const [s,db,u]=await Promise.all([claude.use('sample'),claude.use('db'),claude.use('user')]);if(s){this.sample=s;this.mode='artifact';}if(db){this.db=db;this.user=u;}}}catch(e){}
  if(!this.mode&&S.apiKey)this.mode='key';this.ready=true;renderTop();if(this.db)await Sync.pull();if(V==='home')go('home');},
 get on(){return !!this.mode;},
 label(){return this.mode==='artifact'?'Live · Claude':this.mode==='key'?'Live · API key':'Offline';},
 async ask(messages,o={}){if(!this.mode)throw{code:'offline',message:'No live connection'};if(typeof messages==='string')messages=[{role:'user',content:messages}];
  let text;
  if(this.mode==='artifact'){const input=o.system?[{role:'user',content:o.system+'\n\n---\n\n'+messages[0].content},...messages.slice(1)]:messages;const opts={modelTier:o.tier||'default',cache:false};if(o.onText)opts.onText=o.onText;const r=await this.sample(input,opts);text=r&&r.text!==undefined?r.text:String(r);}
  else{const body={model:S.model||'claude-sonnet-5-5',max_tokens:o.max||2000,messages:messages.map(m=>({role:m.role,content:m.content}))};if(o.system)body.system=o.system;
   const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':S.apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify(body)});
   if(!r.ok){const t=await r.text();throw{code:r.status,message:t.slice(0,300)};}const j=await r.json();text=(j.content||[]).map(c=>c.text||'').join('');if(o.onText)o.onText({text});}
  if(o.json){try{return parseJSON(text);}catch(e){const fix=await this.ask([{role:'user',content:'Convert the following into valid JSON only, no prose, keeping all content:\n\n'+text}],{tier:'quick'});return parseJSON(fix);}}
  return text;},
 errMsg(e){if(!e)return 'Something went wrong.';if(e.code==='not_granted')return 'Live access not granted — allow it when prompted.';if(e.code==='rate_limited'||e.code===429)return 'Rate limited — give it a minute.';if(e.code===401)return 'API key rejected — check it under Coach → Settings.';if(e.code==='offline')return 'No live connection.';return (e.message||String(e)).slice(0,160);}
};
const Sync={t:null,
 async pull(){if(!Live.db)return;try{const d=await Promise.race([Live.db.doc('data/progress').get(),new Promise((_,rej)=>setTimeout(()=>rej('timeout'),10000))]);const r=d&&(typeof d.data==='function'?d.data():d.data||d);if(r&&r.xp!==undefined&&(r.updated||0)>(S.updated||0)){const keep={apiKey:S.apiKey,model:S.model,theme:S.theme};S=Object.assign({},DEF,r,keep);try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}toast('Progress synced');}}catch(e){}},
 push(){if(!Live.db)return;clearTimeout(this.t);this.t=setTimeout(async()=>{try{const o=Object.assign({},S);delete o.apiKey;await Live.db.doc('data/progress').set(o);}catch(e){}},2500);}
};

/* ================= XP ================= */
function award(base,fast){let m=1;if(S.combo>=6)m=2;else if(S.combo>=3)m=1.5;let xp=Math.round(base*m)+(fast?5:0);S.xp+=xp;const d=today();if(S.daily.date!==d){S.daily.date=d;S.daily.xp=0;}S.daily.xp+=xp;touchStreak();save();return xp;}
function touchStreak(){const d=today();if(S.streak.last===d)return;const y=new Date(Date.now()-864e5).toISOString().slice(0,10);if(S.streak.last===y||!S.streak.last)S.streak.n+=1;else{const y2=new Date(Date.now()-2*864e5).toISOString().slice(0,10);if(S.streak.last===y2&&S.streak.freeze>0){S.streak.freeze--;S.streak.n+=1;toast('Streak freeze used');}else S.streak.n=1;}S.streak.last=d;}
function badge(id,title,desc){if(S.badges.some(b=>b.id===id))return null;const b={id,title,desc,at:now()};S.badges.push(b);save();return b;}
function rubricMark(k,ok){if(!S.rubric[k])S.rubric[k]={ok:0,bad:0};S.rubric[k][ok?'ok':'bad']++;}

/* ================= ITEMS / SRS ================= */
const IV=[0,1,3,7,14,30];
function item(id){if(!S.items[id])S.items[id]={iv:0,due:0,fmt:0,reps:0,lapses:0,ok:0};return S.items[id];}
function itemsFor(t){const a=[{id:t.id+':b',kind:'buckets'},{id:t.id+':cut',kind:'cut'}];t.buckets.forEach((b,i)=>a.push({id:t.id+':c:'+i,kind:'clicks',bi:i}));a.push({id:t.id+':trap',kind:'trap'},{id:t.id+':start',kind:'start'});return a;}
function parse(id){const [tid,kind,bi]=id.split(':');return{t:T(tid),kind:kind==='b'?'buckets':kind==='c'?'clicks':kind,bi:bi!==undefined?+bi:undefined};}
function schedule(id,ok){const it=item(id);it.reps++;if(ok){it.ok++;it.iv=Math.min(it.iv+1,IV.length-1);}else{it.lapses++;it.iv=0;}const days=IV[it.iv];it.due=ok?(days===0?now()+10*60e3:now()+days*864e5):now()+10*60e3;it.fmt=(it.fmt+1)%4;}
function dueItems(){const out=[];TYPES.forEach((t,i)=>{if(!unlocked(i))return;itemsFor(t).forEach(x=>{const it=S.items[x.id];if(!it||!it.reps)return;if(it.due<=now())out.push(x);});});return out;}

/* ================= QUESTION GENERATORS ================= */
const FMT={buckets:['build','mcq','odd','type'],clicks:['select','mcq','odd','type'],cut:['mcq','cloze'],trap:['mcq','type'],start:['mcq','mcq']};
function otherBuckets(t,n){const pool=[];TYPES.forEach(o=>{if(o.id!==t.id)o.buckets.forEach(b=>pool.push(bname(b)));});return pick(pool.filter(x=>!t.buckets.some(b=>bname(b)===x)),n);}
function otherSubs(t,bi,n){const pool=[];t.buckets.forEach((b,i)=>{if(i!==bi)b.subs.forEach(s=>pool.push(s));});return pick(pool,n);}
function foreignSubs(t,n){const pool=[];TYPES.forEach(o=>{if(o.id!==t.id)o.buckets.forEach(b=>b.subs.forEach(s=>pool.push(s)));});return pick(pool,n);}
const pathLabel=(t,b)=>t.name+(b?' → '+bname(b):'');
function genBuckets(t,fmt){const names=t.buckets.map(bname);
 if(fmt==='build')return{kind:'build',path:t.name,prompt:'Put the buckets in order.',chips:shuffle(names.concat(otherBuckets(t,2))),answer:names};
 if(fmt==='mcq'){const i=Math.floor(Math.random()*names.length);return{kind:'mcq',path:t.name,prompt:`Bucket ${i+1} of ${names.length} is …`,opts:shuffle([{t:names[i],ok:true},...otherBuckets(t,3).map(x=>({t:x,ok:false}))]),after:treeHTML(t,i)};}
 if(fmt==='odd'){const x=otherBuckets(t,1)[0];return{kind:'mcq',path:t.name,prompt:'Which of these is NOT a bucket in this framework?',opts:shuffle([{t:x,ok:true},...pick(names,3).map(n=>({t:n,ok:false}))])};}
 return{kind:'type',path:t.name,prompt:`Type all ${names.length} buckets, in order.`,hint:'One per line. Key words are enough.',expect:names,lines:true};}
function genClicks(t,bi,fmt){const b=t.buckets[bi],subs=b.subs,pathL=pathLabel(t,b);
 if(fmt==='select'){const decoys=otherSubs(t,bi,2).concat(foreignSubs(t,1));return{kind:'select',path:pathL,prompt:`Tap the ${subs.length} click-downs that belong under ${bname(b)}.`,chips:shuffle(subs.concat(decoys)),answer:subs};}
 if(fmt==='mcq'){const i=Math.floor(Math.random()*subs.length);return{kind:'mcq',path:pathL,prompt:`Which is a click-down under ${bname(b)}?`,opts:shuffle([{t:subs[i],ok:true},...otherSubs(t,bi,2).map(x=>({t:x,ok:false})),...foreignSubs(t,1).map(x=>({t:x,ok:false}))]),after:treeHTML(t,bi)};}
 if(fmt==='odd'){const x=otherSubs(t,bi,1)[0];return{kind:'mcq',path:pathL,prompt:`Which does NOT belong under ${bname(b)}?`,opts:shuffle([{t:x,ok:true},...pick(subs,Math.min(3,subs.length)).map(s=>({t:s,ok:false}))]),after:treeHTML(t,bi)};}
 return{kind:'type',path:pathL,prompt:`Type the ${subs.length} click-downs under ${bname(b)}.`,hint:'One per line. Key words are enough.',expect:subs,lines:true};}
function genCut(t,fmt){if(fmt==='mcq')return{kind:'mcq',path:t.name,prompt:'Which statement is the MECE cut for this framework — why these buckets and no others?',opts:shuffle([{t:t.cut,ok:true},...pick(TYPES.filter(x=>x.id!==t.id),3).map(x=>({t:x.cut,ok:false}))])};
 const parts=t.cut.split(/[—·;:,.]/).map(s=>s.trim()).filter(s=>s.length>12);const gap=parts.sort((a,b)=>b.length-a.length)[0];const others=[];TYPES.forEach(x=>{if(x.id!==t.id)x.cut.split(/[—·;:,.]/).map(s=>s.trim()).filter(s=>s.length>12).forEach(s=>others.push(s));});return{kind:'mcq',path:t.name,prompt:'Fill the blank: “'+esc(t.cut.replace(gap,'______'))+'”',opts:shuffle([{t:gap,ok:true},...pick(others,3).map(x=>({t:x,ok:false}))])};}
function genTrap(t,fmt){if(fmt==='mcq')return{kind:'mcq',path:t.name,prompt:'Which is the trap in this case type?',opts:shuffle([{t:t.trap,ok:true},...pick(TYPES.filter(x=>x.id!==t.id),3).map(x=>({t:x.trap,ok:false}))])};return{kind:'type',path:t.name,prompt:'Name the trap — the predictable mistake in this case type.',hint:'A sentence is fine.',expect:[t.trap],lines:false};}
function genStart(t){const names=t.buckets.map(bname);return{kind:'mcq',path:t.name,prompt:'Which bucket do you start with?',opts:shuffle(names.map(n=>({t:n,ok:n===bname({name:t.start})}))),after:t.startWhy?`<div class="tip"><b>Why</b>${esc(t.startWhy)}</div>`:''};}
function genRecall(t){const expect=[];t.buckets.forEach(b=>{expect.push(bname(b));b.subs.forEach(s=>expect.push(s));});return{kind:'type',path:t.name,prompt:'Blank recall: every bucket, in order, with its click-downs.',hint:'Example prompt: “'+esc(t.prompt)+'”. Buckets then click-downs, one per line.',expect,lines:true,recall:true};}
function genFor(id,fmtOverride){const {t,kind,bi}=parse(id);const it=item(id);const fmts=FMT[kind];const fmt=fmtOverride||fmts[it.fmt%fmts.length];let q;if(kind==='buckets')q=genBuckets(t,fmt);else if(kind==='clicks')q=genClicks(t,bi,fmt);else if(kind==='cut')q=genCut(t,fmt);else if(kind==='trap')q=genTrap(t,fmt);else q=genStart(t);q.id=id;q.t=t;return q;}
function genBoss(t){const pool=allCases().filter(c=>c.type===t.id);const c=rnd(pool);const qs=[];
 qs.push({kind:'mcq',path:'Boss · '+c.client,prompt:'<div class="sm mute" style="margin-bottom:8px">'+esc(c.prompt)+'</div>What type of case is this?',opts:shuffle([{t:t.name,ok:true},...pick(TYPES.filter(x=>x.id!==t.id),3).map(x=>({t:x.name,ok:false}))]),base:20});
 const tb=c.buckets.map(b=>b.name);qs.push({kind:'mcq',path:'Boss · '+c.client,prompt:'Which tailored bucket would you start with?',opts:shuffle(tb.map(n=>({t:n,ok:n===c.start}))),after:`<div class="tip"><b>Why</b>${esc(c.startWhy||'')}</div>`,base:20});
 const gi=Math.floor(Math.random()*c.buckets.length);const gb=c.buckets[gi];const gen=t.buckets.map(bname);let best=0,bi=0;gen.forEach((g,i)=>{const sc=keysOf(g+' '+t.buckets[i].subs.join(' ')).filter(k=>hitKey(k,norm(gb.name+' '+gb.subs.join(' ')))).length;if(sc>best){best=sc;bi=i;}});
 qs.push({kind:'mcq',path:'Boss · '+c.client,prompt:`The tailored bucket “${esc(gb.name)}” (${esc(gb.subs.join(' · '))}) is this client’s version of which generic bucket?`,opts:shuffle(gen.map((g,i)=>({t:g,ok:i===bi}))),after:`<div class="tip"><b>How it was tailored</b>${esc(c.tailored||'')}</div><div class="tip"><b>Hypothesis</b>${esc(c.hyp)}</div><div class="tip"><b>Trap</b>${esc(c.trap)}</div>`,base:20});
 return{qs,c};}
function genBonus(){const qs=[];pick(D.math,2).forEach(m=>qs.push({kind:'mcq',path:'Bonus · numbers cold',prompt:esc(m.q),opts:shuffle([{t:m.a,ok:true},...m.d.map(x=>({t:x,ok:false}))]),base:15,fastOnly:true}));const b=rnd(D.brain);const L=D.lenses.find(l=>l.id===b.lens);if(L)qs.push({kind:'mcq',path:'Bonus · brainstorm lens',prompt:'<div class="sm mute" style="margin-bottom:8px">'+esc(b.prompt)+'</div>Which lens structures this best?',opts:shuffle([{t:L.name,ok:true},...pick(D.lenses.filter(l=>l.id!==b.lens),3).map(l=>({t:l.name,ok:false}))]),after:`<div class="tip"><b>Why</b>${esc(b.why)}</div>`+b.model.map(m=>`<div class="tip"><b>${esc(m.bucket)}</b>${m.ideas.map(esc).join(' · ')}</div>`).join(''),base:15});return qs;}

/* ================= PATH PLAY ENGINE ================= */
let P=null;
function startStage(tid,k){const t=T(tid);let qs=[];
 if(k===1)qs=Array.from({length:6},(_,i)=>genFor(t.id+':b',FMT.buckets[i%4]));
 else if(k===2)qs=[genFor(t.id+':cut','mcq'),genFor(t.id+':cut','cloze'),genFor(t.id+':cut','mcq'),genFor(t.id+':cut','cloze')];
 else if(k===3){t.buckets.forEach((b,i)=>qs.push(genFor(t.id+':c:'+i,'select')));t.buckets.forEach((b,i)=>qs.push(genFor(t.id+':c:'+i,rnd(['mcq','odd']))));t.buckets.forEach((b,i)=>qs.push(genFor(t.id+':c:'+i,'type')));}
 else if(k===4)qs=[genFor(t.id+':trap','mcq'),genFor(t.id+':start'),genFor(t.id+':trap','type'),genFor(t.id+':start')];
 else if(k===5)qs=[Object.assign(genRecall(t),{id:t.id+':b'})];
 else if(k===6){qs=genBoss(t).qs;}
 P={qs,i:0,ok:0,t,stage:k,mode:'stage',results:[],started:now()};S.combo=0;go('play');}
function startReview(){let its=dueItems();if(!its.length){its=[];TYPES.forEach((t,i)=>{if(unlocked(i))itemsFor(t).forEach(x=>{if(item(x.id).reps)its.push(x);});});}its=pick(its,Math.min(10,its.length));if(!its.length){toast('Nothing to review yet — play a stage');return;}P={qs:its.map(x=>genFor(x.id)),i:0,ok:0,t:null,stage:0,mode:'review',results:[],started:now()};S.combo=0;go('play');}
function startBonus(){P={qs:genBonus(),i:0,ok:0,t:null,stage:0,mode:'bonus',results:[],started:now()};S.combo=0;go('play');}
function startNumbers(){P={qs:pick(D.math,10).map(m=>({kind:'mcq',path:'Numbers cold',prompt:esc(m.q),opts:shuffle([{t:m.a,ok:true},...m.d.map(x=>({t:x,ok:false}))]),base:10,fastOnly:true})),i:0,ok:0,t:null,stage:0,mode:'numbers',results:[],started:now()};S.combo=0;go('play');}

function renderPlay(){const q=P.qs[P.i];const t=q.t||P.t;const fam=t?t.fam:'eval';const title=P.mode==='stage'?`${P.t.short} · ${STAGES[P.stage-1].name}`:P.mode==='review'?'Review':P.mode==='numbers'?'Numbers cold':'Bonus round';
 let h=`<div class="fam-${fam}"><div class="playhead"><button class="ghost" onclick="quit()" style="color:var(--mute);font-size:22px;line-height:1">×</button><div class="prog"><i style="width:${P.i/P.qs.length*100}%"></i></div><span class="combo">${S.combo>=3?'×'+(S.combo>=6?2:1.5)+' '+S.combo+'🔥':''}</span></div>
 <div class="xs mute b" style="margin-bottom:4px">${esc(title)} · ${P.i+1}/${P.qs.length}</div><div class="q"><span class="path">${q.path}</span>${q.prompt}</div><div id="qbody">`;
 if(q.kind==='mcq')h+=q.opts.map((o,i)=>`<button class="opt" onclick="ansMcq(${i})"><span class="key">${i+1}</span>${esc(o.t)}</button>`).join('')+`<div class="kbd">Keys 1–${q.opts.length} to answer · Enter for next</div>`;
 else if(q.kind==='build')h+=`<div class="slots" id="slots"></div><div class="chips" id="chips">${q.chips.map((c,i)=>`<button class="chip" data-i="${i}" onclick="chipTap(${i})"><span class="key">${i+1}</span>${esc(c)}</button>`).join('')}</div><button class="btn" id="chk" onclick="ansBuild()" disabled>Check</button><div class="kbd">Keys 1–${q.chips.length} to add in order · Backspace undoes · Enter to check</div>`;
 else if(q.kind==='select')h+=`<div class="chips" id="chips">${q.chips.map((c,i)=>`<button class="chip" data-i="${i}" onclick="chipSel(${i})"><span class="key">${i+1}</span>${esc(c)}</button>`).join('')}</div><button class="btn" id="chk" onclick="ansSelect()" disabled>Check</button><div class="kbd">Keys 1–${q.chips.length} to toggle · Enter to check</div>`;
 else if(q.kind==='type')h+=`<textarea class="ans" id="ta" placeholder="${q.lines?'One per line…':'Type here…'}" autocapitalize="off" autocorrect="off"></textarea><div class="hint">${q.hint||''}${Live.on&&S.liveGrade?' · graded by Claude':''}</div><button class="btn" id="chk" onclick="ansType()">Check</button><div class="kbd">Ctrl/⌘ + Enter to check</div>`;
 h+=`</div><div id="fb"></div></div>`;$('#view').innerHTML=h;q._t0=now();P._sel=[];P._order=[];if(q.kind==='type')setTimeout(()=>{const ta=$('#ta');ta&&ta.focus();},50);window.scrollTo(0,0);}
function slotsHTML(q){return P._order.map((k,n)=>`<div class="slot"><span class="n">${n+1}</span>${esc(q.chips[k])}<button onclick="chipUndo(${k})" style="margin-left:auto;color:var(--mute)">×</button></div>`).join('');}
function chipTap(i){const q=P.qs[P.i];if(P._order.includes(i))return;P._order.push(i);document.querySelector(`.chip[data-i="${i}"]`).classList.add('ghost');$('#slots').innerHTML=slotsHTML(q);$('#chk').disabled=P._order.length!==q.answer.length;buzz(6);}
function chipUndo(k){P._order=P._order.filter(x=>x!==k);document.querySelector(`.chip[data-i="${k}"]`).classList.remove('ghost');$('#slots').innerHTML=slotsHTML(P.qs[P.i]);$('#chk').disabled=P._order.length!==P.qs[P.i].answer.length;}
function chipSel(i){const q=P.qs[P.i];const c=document.querySelector(`.chip[data-i="${i}"]`);if(P._sel.includes(i)){P._sel=P._sel.filter(x=>x!==i);c.classList.remove('pick');}else{P._sel.push(i);c.classList.add('pick');}$('#chk').disabled=P._sel.length!==q.answer.length;buzz(6);}
function ansMcq(i){const q=P.qs[P.i];const ok=q.opts[i].ok;document.querySelectorAll('.opt').forEach((b,k)=>{b.disabled=true;if(q.opts[k].ok)b.classList.add('ok');else if(k===i)b.classList.add('bad');});finish(ok,ok?1:0,q.after||'');}
function ansBuild(){const q=P.qs[P.i];$('#chk').classList.add('hide');const got=P._order.map(k=>q.chips[k]);let right=0;got.forEach((g,n)=>{if(g===q.answer[n])right++;});const ok=right===q.answer.length;document.querySelectorAll('.slot').forEach((s,n)=>s.classList.add(got[n]===q.answer[n]?'ok':'bad'));finish(ok,right/q.answer.length,ok?'':`<div class="sm">Correct order: ${q.answer.map((a,n)=>`<b>${n+1}.</b> ${esc(a)}`).join(' &nbsp; ')}</div>`);}
function ansSelect(){const q=P.qs[P.i];$('#chk').classList.add('hide');const got=P._sel.map(k=>q.chips[k]);let right=0;got.forEach(g=>{if(q.answer.includes(g))right++;});const ok=right===q.answer.length;document.querySelectorAll('.chip').forEach(c=>{const v=q.chips[+c.dataset.i];if(q.answer.includes(v))c.classList.add('ok');else if(P._sel.includes(+c.dataset.i))c.classList.add('bad');c.disabled=true;});finish(ok,right/q.answer.length,'');}
async function ansType(){const q=P.qs[P.i];const text=$('#ta').value;if(!text.trim())return;$('#ta').disabled=true;$('#chk').classList.add('hide');
 let hits=null,note='';
 if(Live.on&&S.liveGrade){$('#fb').innerHTML=`<div class="fb neutral">${thinking('Grading')}</div>`;try{const r=await Live.ask(`You are grading a case-interview framework recall drill. The student typed an answer; decide for EACH expected item whether the student's text covers it (same driver or idea in different words counts; a vague or missing idea does not).\nFramework: ${q.t.name}${q.path!==q.t.name?' — '+q.path:''}\nExpected items (in order):\n${q.expect.map((e,i)=>(i+1)+'. '+e).join('\n')}\n\nStudent text:\n"""${text}"""\n\nReturn JSON only: {"hits":[true/false, one per expected item in order],"note":"one short sentence of coaching, max 20 words"}`,{json:true,tier:'quick'});if(Array.isArray(r.hits)&&r.hits.length===q.expect.length){hits=r.hits.map(Boolean);note=r.note||'';}}catch(e){}}
 if(!hits){hits=q.expect.map(e=>matchText(e,text).hit);}
 const n=hits.filter(Boolean).length;const score=n/q.expect.length;const ok=score>=(q.recall?.85:.999);
 let html=`<div class="sm b">${n}/${q.expect.length} found${note?' · <span class="mute" style="font-weight:400">'+esc(note)+'</span>':''}</div><div class="kw">`+q.expect.map((e,i)=>`<span class="${hits[i]?'ok':'bad'}">${esc(e)}</span>`).join('')+'</div>';if(n<q.expect.length)html+=`<button class="btn ghost sm" onclick="override()">I said it differently — count it</button>`;
 finish(ok,score,html);}
function override(){P.results.pop();if(P._lastOk)P.ok--;S.combo=Math.max(S.combo,1);finish(true,1,'<div class="sm mute">Counted on your word.</div>',true);}
function finish(ok,score,extra,isOverride){const q=P.qs[P.i];const dt=(now()-q._t0)/1000;const fast=dt<8;if(ok){S.combo++;if(S.combo>S.best)S.best=S.combo;}else S.combo=0;
 const base=q.base||(q.kind==='type'?(q.recall?60:20):q.kind==='build'||q.kind==='select'?15:10);const xp=ok?award(base,fast&&!q.recall):(score>=.5?award(Math.round(base*score*.5),false):0);
 if(q.id&&!q.fastOnly&&!isOverride)schedule(q.id,ok);S.totals.q++;if(ok)S.totals.ok++;P.results.push({ok,score,id:q.id});P._lastOk=ok;if(ok)P.ok++;
 const tip=(!ok&&P.mode!=='bonus'&&P.mode!=='numbers')?coachTip(q):'';
 $('#fb').innerHTML=`<div class="fb ${ok?'ok':'bad'} pop"><h3>${ok?rnd(['Nailed it.','Clean.','That’s the structure.','Yes.','Locked in.']):score>=.5?'Partly there.':'Not yet.'}</h3>${xp?`<div class="xp">+${xp} XP${fast&&ok&&!q.recall?' · speed':''}${S.combo>=3?' · combo':''}</div>`:''}${extra||''}${tip}</div><button class="btn" onclick="next()">${P.i+1<P.qs.length?'Next':'Finish'}</button>`;
 if(ok){buzz([10,30,10]);fly('+'+xp+' XP');}else buzz(40);if(!isOverride)$('#fb').scrollIntoView({behavior:'smooth',block:'end'});save();renderTop();}
function coachTip(q){const t=q.t;if(!t||!q.id)return '';const r=parse(q.id);if(r.kind==='buckets'||r.kind==='clicks')return `<div class="tip"><b>The cut</b>${esc(t.cut)}</div>`;if(r.kind==='cut')return `<div class="tip"><b>Buckets</b>${t.buckets.map((b,i)=>(i+1)+'. '+esc(bname(b))).join(' · ')}</div>`;if(r.kind==='trap')return `<div class="tip"><b>Trap</b>${esc(t.trap)}</div>`;return '';}
function next(){P.i++;if(P.i<P.qs.length)renderPlay();else endPlay();}
function quit(){if(confirm('Leave this session? Progress on answered questions is kept.')){P=null;LC=null;go('home');}}
function endPlay(){S.sessions++;const n=P.qs.length,ok=P.ok;let h='',passed=false,newBadges=[];
 if(P.mode==='stage'){const st=STAGES[P.stage-1];const L=lv(P.t.id);const score=P.stage===5?P.results[0].score:ok;const need=P.stage===3?Math.ceil(n*st.pass):st.pass;passed=score>=need;
  if(passed){const first=!L.passed[P.stage];L.passed[P.stage]=true;if(ok===n&&P.stage!==5)L.perfect[P.stage]=true;if(P.stage===5){const d=today();if(!L.recall.includes(d))L.recall.push(d);}if(P.stage<6&&L.stage===P.stage)L.stage=P.stage+1;if(P.stage===6)L.boss++;
   const xb=award(P.stage===5?100:P.stage===6?150:50,false);h+=`<div class="xp b" style="color:#B8860B">+${xb} XP stage bonus</div>`;
   if(first){const b=badge(`${P.t.id}-s${P.stage}`,`${P.t.short}: ${st.name}`,`Passed ${st.name} on ${P.t.name}`);if(b)newBadges.push(b);}
   if(ok===n&&P.stage!==5){const b=badge(`${P.t.id}-p${P.stage}`,'Perfect run',`${P.t.name} · ${st.name} with no misses`);if(b)newBadges.push(b);}
   if(P.stage===5&&L.recall.length>=3){const b=badge(`${P.t.id}-master`,`Mastered ${P.t.name}`,'Blank recall on three separate days');if(b)newBadges.push(b);confetti(220,'#F0B429');}
   else if(P.stage===5&&L.recall.length===1){const idx=TYPES.findIndex(x=>x.id===P.t.id);if(idx+1<TYPES.length)h+=`<div class="badge"><div class="ic">🔓</div><div><b>${esc(TYPES[idx+1].name)} unlocked</b><div class="xs mute">Next level on the path</div></div></div>`;confetti();}
   else confetti(80);
   if(TYPES.slice(0,10).every(x=>mastered(x.id))){const b=badge('all10','The Ten','All ten standard frameworks mastered');if(b)newBadges.push(b);}}
  logEvent({k:'stage',t:P.t.id,s:P.stage,ok,n,score:+score.toFixed?+score.toFixed(2):score,passed});
  const pct=P.stage===5?Math.round(score*100)+'%':`${ok}/${n}`;
  h=`<div class="card" style="text-align:center"><div class="xs mute b">${esc(P.t.name)} · ${st.name}</div><div class="big" style="margin:8px 0">${pct}</div><h2 style="font-size:22px">${passed?'Stage passed':'Not yet — run it again'}</h2>${P.stage===5?`<div class="sm mute" style="margin-top:6px">Recall days: ${L.recall.length}/3${L.recall.length>=3?' · mastered':''}</div>`:''}${h}${newBadges.map(b=>`<div class="badge"><div class="ic">★</div><div><b>${esc(b.title)}</b><div class="xs mute">${esc(b.desc)}</div></div></div>`).join('')}</div>`;
  if(passed&&P.stage===6)h+=`<button class="btn" style="background:var(--gold);color:#fff" onclick="startBonus()">Bonus round · +45 XP</button>`;
  h+=`<button class="btn ${passed?'sec':''}" onclick="startStage('${P.t.id}',${P.stage})">${passed?'Replay stage':'Try again'}</button>`;
  if(passed&&P.stage<6)h+=`<button class="btn" onclick="startStage('${P.t.id}',${P.stage+1})">Next: ${STAGES[P.stage].name}</button>`;
  h+=`<button class="btn ghost" onclick="go('level','${P.t.id}')">Back to level</button>`;h=`<div class="fam-${P.t.fam}">${h}</div>`;}
 else{const acc=Math.round(ok/n*100);if(acc===100)confetti(80);logEvent({k:P.mode,ok,n});h=`<div class="card" style="text-align:center"><div class="xs mute b">${P.mode==='review'?'Review':P.mode==='numbers'?'Numbers cold':'Bonus round'}</div><div class="big" style="margin:8px 0">${ok}/${n}</div><div class="sm mute">${acc===100?'Perfect.':acc>=70?'Solid.':'Those come back today.'}</div></div>`;if(P.mode==='review')h+=`<button class="btn" onclick="startReview()">Another set</button>`;if(P.mode==='numbers')h+=`<button class="btn" onclick="startNumbers()">Another set</button>`;h+=`<button class="btn sec" onclick="go('home')">Back to path</button>`;}
 save();P=null;$('#view').innerHTML=h;renderTop();window.scrollTo(0,0);}
