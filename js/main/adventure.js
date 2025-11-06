/* KQ — Adventure (Pixel) v3
   - Smooth grid tweening (one tile per step)
   - Interconnected regions (attempting to step off-screen loads neighbor and spawns you at opposite border)
   - In-canvas parchment world map (locked areas, keys, fast travel)
   - Arena overlay (Prodigy-style quiz battles with HP + Stamina)
*/
import { addXP, addCoins } from "./state.js";

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const L = "kq-adv-overworld-v3";
const mem = {
  get:(k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } },
  set:(k,v)=>localStorage.setItem(k, JSON.stringify(v))
};

// ---------- Persistent page state ----------
const S = mem.get(L, {
  coins: 120, gems: 2, xp: 0,
  skin: "Default",
  inv: [],            // {id,name,kind:'item'|'skin'}
  keys: 0,            // boss keys
  discovered: ["Town"],
  unlocked: ["Town"], // fast travel to these
  wheelLast: 0,
  quest: { id:"q1", title:"Meet the Merchant", desc:"Walk to a shop (red roof) and press E.", progress:0, target:1, done:false },
  world: { rx:0, ry:0 } // region coords
});
const save=()=>mem.set(L,S);

// ---------- Currency + Quest ----------
const coinsEl=$("#coins"), gemsEl=$("#gems"), xpEl=$("#xp");
function updCurrency(){ coinsEl.textContent=S.coins; gemsEl.textContent=S.gems; xpEl.textContent=S.xp; }

const qTitle=$("#questTitle"), qDesc=$("#questDesc"), qInner=$("#progressInner"), qTxt=$("#progressText");
function updQuest(){
  qTitle.textContent=`Quest: ${S.quest.title}`;
  qDesc.textContent=S.quest.desc;
  const pct=Math.min(100, Math.floor(100*(S.quest.progress/S.quest.target)));
  qInner.style.width=pct+"%";
  qTxt.textContent=S.quest.done?"Done!":`${pct}%`;
}
function completeIfReady(){
  if(!S.quest.done && S.quest.progress>=S.quest.target){
    S.quest.done=true; S.coins+=50; S.xp+=25; addCoins(50); addXP(25);
    toast("Quest complete! +25 XP +50🪙");
    setTimeout(()=>{ S.quest={id:"q2",title:"Collect 5 Coins",desc:"Pick up 5 ground coins on Market Row.",progress:0,target:5,done:false}; save(); updQuest(); },800);
  }
}

// ---------- Panels ----------
const close = sel => $(sel).classList.add("hidden");
$("#btnEquip").onclick = ()=>{ $("#panelEquip").classList.remove("hidden"); renderEquip(); };
$("#btnBackpack").onclick=()=>{ $("#panelBackpack").classList.remove("hidden"); renderBackpack(); };
$("#btnWheel").onclick   =()=>{ $("#panelWheel").classList.remove("hidden"); updWheel(); };
$("#btnHelp").onclick    =()=>  $("#panelHelp").classList.remove("hidden");
$("#btnMap").onclick     =()=>  toggleMapOverlay();
$$(".panel .btn.secondary[data-close]").forEach(b=>b.onclick=()=>close(b.dataset.close));

// ---------- Equip / Backpack ----------
function renderBackpack(){
  const el=$("#backpackGrid"); el.innerHTML="";
  if(!S.inv.length){ el.innerHTML=`<div class="muted">Your backpack is empty.</div>`; return; }
  for(const it of S.inv){ const d=document.createElement("div"); d.className="chip"; d.textContent=(it.kind==="skin"?"Skin: ":"")+it.name; el.appendChild(d); }
}
function renderEquip(){
  const list=$("#skinList"), cur=$("#equippedSkin"); list.innerHTML="";
  const skins=S.inv.filter(i=>i.kind==="skin").map(i=>i.name);
  if(!skins.length) list.innerHTML=`<div class="muted">No extra skins yet.</div>`;
  for(const name of skins){
    const b=document.createElement("button"); b.className="btn secondary"; b.textContent=name;
    b.onclick=()=>{ S.skin=name; save(); cur.textContent=name; toast(`Equipped ${name}`); };
    list.appendChild(b);
  }
  cur.textContent=S.skin||"Default";
}

// ---------- Shop ----------
const STOCK=[
  {id:"potion_s",name:"Small Potion",price:30,kind:"item",desc:"+20 XP now",effect:{xp:20}},
  {id:"skin_mint",name:"Skin: Mint",price:120,kind:"skin",desc:"Minty fresh fit"},
  {id:"skin_violet",name:"Skin: Violet",price:160,kind:"skin",desc:"Royal vibes"},
  {id:"loot_bag",name:"Loot Bag",price:80,kind:"item",desc:"Random +25~100🪙",effect:{rngCoins:[25,100]}},
  {id:"gem_trade",name:"Gem → 200🪙",priceGem:1,kind:"item",desc:"Spend 1💎 for 200🪙",effect:{coins:200,costGem:1}},
];
function populateShop(){
  const grid=$("#shopItems"); if(!grid) return;
  grid.innerHTML="";
  for(const s of STOCK){
    const card=document.createElement("div"); card.className="card shop-item";
    card.innerHTML=`<h4>${s.name}</h4><div class="muted">${s.desc||""}</div>
      <div class="muted" style="margin-top:6px;">${s.price? s.price+"🪙": s.priceGem+"💎"}</div>
      <button class="btn" type="button">Buy</button>`;
    card.querySelector("button").onclick=()=>buyItem(s);
    grid.appendChild(card);
  }
}
function buyItem(s){
  const owns = s.kind==="skin" && S.inv.some(i=>i.kind==="skin"&&i.name===s.name.replace("Skin: ",""));
  if(owns) return toast("You already own that skin.");
  if(s.priceGem){ if(S.gems<s.priceGem) return toast("Not enough gems."); S.gems-=s.priceGem; }
  else { if(S.coins<s.price) return toast("Not enough coins."); S.coins-=s.price; }
  if(s.kind==="skin"){ const nm=s.name.replace("Skin: ",""); S.inv.push({id:s.id,name:nm,kind:"skin"}); toast(`Purchased skin: ${nm}`); }
  else{
    if(s.effect?.xp){ S.xp+=s.effect.xp; addXP(s.effect.xp); }
    if(s.effect?.coins){ S.coins+=s.effect.coins; addCoins(s.effect.coins); }
    if(s.effect?.rngCoins){ const [lo,hi]=s.effect.rngCoins; const v=lo+Math.floor(Math.random()*(hi-lo+1)); S.coins+=v; toast(`Loot: +${v}🪙`); }
    S.inv.push({id:s.id,name:s.name,kind:"item"});
  }
  save(); updCurrency(); renderBackpack(); renderEquip();
}

// ---------- Wheel ----------
const wheelBtn=$("#spinWheel"), wheelStatus=$("#wheelStatus");
function updWheel(){ const can=Date.now()-S.wheelLast>=86400000; wheelBtn.disabled=!can; wheelStatus.textContent=can?"You can spin now!":"Come back tomorrow."; }
wheelBtn?.addEventListener("click",()=>{
  const R=[{t:"+50🪙",coins:50},{t:"+1💎",gems:1},{t:"+100🪙",coins:100},{t:"+200🪙",coins:200},{t:"+2💎",gems:2},{t:"+500🪙",coins:500},{t:"Skin",skin:"Mint"},{t:"+1000🪙",coins:1000}];
  const r=R[Math.floor(Math.random()*R.length)];
  if(r.coins){ S.coins+=r.coins; addCoins(r.coins); }
  if(r.gems){ S.gems+=r.gems; }
  if(r.skin){
    if(!S.inv.some(i=>i.kind==="skin"&&i.name===r.skin)){ S.inv.push({id:"skin_"+r.skin,name:r.skin,kind:"skin"}); toast("Won skin: "+r.skin); }
    else { S.coins+=200; addCoins(200); toast("Duplicate skin → +200🪙"); }
  } else toast("Wheel reward: "+r.t);
  S.wheelLast=Date.now(); save(); updCurrency(); updWheel(); renderBackpack(); renderEquip();
});

// ---------- Toast ----------
const toastEl=$("#toast");
function toast(t,ms=1400){ toastEl.textContent=t; toastEl.classList.remove("hidden"); setTimeout(()=>toastEl.classList.add("hidden"),ms); }

// ---------- Canvas + World ----------
const canvas=$("#game"), ctx=canvas.getContext("2d"); ctx.imageSmoothingEnabled=false;
const TW=16, TH=16, W=16, H=12; // tiles across canvas

// Areas (grid of regions)
const AREAS = [
  { name:"Town",   rx:0,  ry:0,  boss:{x:12,y:8}, flavor:"Safe hub" },
  { name:"Market", rx:-1, ry:0,  boss:{x:3,y:6},  flavor:"Shops & coins" },
  { name:"Forest", rx:1,  ry:0,  boss:{x:8,y:3},  flavor:"Creaky pines" },
  { name:"Ruins",  rx:0,  ry:-1, boss:{x:10,y:4}, flavor:"Echoing halls" },
  { name:"Harbor", rx:0,  ry:1,  boss:{x:5,y:9},  flavor:"Salty breeze" },
];
const areaBy = (rx,ry)=>AREAS.find(a=>a.rx===rx && a.ry===ry);

// Tiles: 0 grass, 1 path, 2 water, 3 shop roof, 4 monument, 5 boss
function makeRegionMap(rx,ry){
  const a=Array.from({length:H},()=>Array(W).fill(0));
  for(let x=0;x<W;x++) a[6][x]=1;
  for(let y=0;y<H;y++) a[y][8]=1;
  const area=areaBy(rx,ry);
  if(area?.name==="Town"){ a[8][12]=4; [[3,6],[5,6],[10,6]].forEach(([x,y])=>a[y-1][x]=3); }
  if(area?.name==="Market"){ [[2,6],[4,6],[6,6],[9,6],[12,6]].forEach(([x,y])=>a[y-1][x]=3); }
  if(area?.name==="Forest"){ for(let y=2;y<=4;y++) for(let x=11;x<=14;x++) a[y][x]=2; }
  if(area?.name==="Ruins"){ a[3][12]=4; }
  if(area?.name==="Harbor"){ for(let x=1;x<=14;x++) a[10][x]=2; }
  if(area?.boss){ const {x,y}=area.boss; a[y][x]=5; }
  return a;
}
let map = makeRegionMap(S.world.rx,S.world.ry);

// Player + coins
const player={ x:8, y:6, facing:"down", tx:8, ty:6, moving:false, t0:0 };
const STEP_MS = 140; // step tween duration (ms)
function regionCoins(rx,ry){
  const arr=[]; const base=(rx+5)*13 + (ry+5)*17;
  for(let i=0;i<5;i++){ const x=3+((base+i*7)%10), y=4+((base+i*11)%4); arr.push({x,y,taken:false}); }
  return arr;
}
let coinsGround=regionCoins(S.world.rx,S.world.ry);

// Drawing
function rect(x,y,w,h,f,st){ if(f){ctx.fillStyle=f; ctx.fillRect(x,y,w,h);} if(st){ctx.strokeStyle=st; ctx.strokeRect(x,y,w,h);} }
function drawTile(tx,ty,t){
  const x=tx*TW,y=ty*TH;
  if(t===0){ rect(x,y,TW,TH,"#1e3b22"); ctx.fillStyle="#254b2a"; for(let i=0;i<8;i++) ctx.fillRect(x+((i*2)%TW), y+((i*3)%TH), 1,1); }
  if(t===1){ rect(x,y,TW,TH,"#6e5a3a"); ctx.fillStyle="#8a6d47"; for(let i=0;i<5;i++) ctx.fillRect(x+2*i, y+(i%2?8:6), 6,2); }
  if(t===2){ rect(x,y,TW,TH,"#1c3b7a"); ctx.fillStyle="#2b56b0"; for(let i=0;i<6;i++) ctx.fillRect(x+((i*3)%TW), y+((i*2)%TH), 2,1); }
  if(t===3){ rect(x,y,TW,TH,"#a32020","#6c1414"); rect(x+5,y+10,6,3,"#ffe3a6","#c8a35f"); }
  if(t===4){ rect(x,y,TW,TH,"#2b2b3e","#454565"); rect(x+5,y+5,6,6,"#7cc2ff","#375a7e"); }
  if(t===5){ rect(x,y,TW,TH,"#3b1f3f","#5a2a64"); rect(x+6,y+6,4,4,"#ffd166","#b88400"); }
}
function drawPlayer(){
  const fx = player.x*TW + (player.tx-player.x)*TW*ease();
  const fy = player.y*TH + (player.ty-player.y)*TH*ease();
  const pal = ({
    "Default":["#ffd19c","#2a2a2a","#4a9eff"],
    "Mint":["#d6fff2","#1e2a28","#67e6c5"],
    "Violet":["#f0dcff","#2a2238","#a57cff"]
  })[S.skin] || ["#ffd19c","#2a2a2a","#4a9eff"];
  rect(fx+6,fy+2,4,4,pal[0],"#000");
  rect(fx+5,fy+6,6,6,pal[2],"#000");
  rect(fx+5,fy+12,2,3,pal[1],"#000"); rect(fx+9,fy+12,2,3,pal[1],"#000");
  if(player.facing==="up") rect(fx+7,fy+1,2,1,"#000");
  if(player.facing==="down") rect(fx+7,fy+6,2,1,"#000");
  if(player.facing==="left") rect(fx+5,fy+4,1,2,"#000");
  if(player.facing==="right") rect(fx+10,fy+4,1,2,"#000");
}
function ease(){ // cubic ease-out progress for tween
  if(!player.moving) return 1;
  const t = (performance.now()-player.t0)/STEP_MS;
  const clamped = Math.min(1,Math.max(0,t));
  return 1 - Math.pow(1-clamped,3);
}
function drawCoin(cx,cy){ const x=cx*TW,y=cy*TH; rect(x+6,y+5,4,4,"#f7c845","#d39a00"); rect(x+7,y+6,2,2,"#fff6"); }
function drawHUDHints(){
  const tx=player.tx, ty=player.ty;
  if(ty-1>=0 && map[ty-1][tx]===3){ ctx.fillStyle="#fff"; ctx.font="6px monospace"; ctx.fillText("Press E to Shop", tx*TW+2, ty*TH-2); }
  if(map[ty][tx]===5){ ctx.fillStyle="#ffd166"; ctx.font="6px monospace"; ctx.fillText("Press E to Fight", tx*TW-6, ty*TH-2); }
}

// Movement (smooth step tweening) + region transition on attempted off-screen
const keys=new Set();
window.addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  if(["arrowup","w"].includes(k)) keys.add("up");
  if(["arrowdown","s"].includes(k)) keys.add("down");
  if(["arrowleft","a"].includes(k)) keys.add("left");
  if(["arrowright","d"].includes(k)) keys.add("right");
  if(k==="e") interact();
  if(k==="m") toggleMapOverlay();
  if(k==="i") $("#panelBackpack").classList.remove("hidden");
  if(k==="o") $("#panelEquip").classList.remove("hidden");
});
window.addEventListener("keyup",e=>{
  const k=e.key.toLowerCase();
  if(["arrowup","w"].includes(k)) keys.delete("up");
  if(["arrowdown","s"].includes(k)) keys.delete("down");
  if(["arrowleft","a"].includes(k)) keys.delete("left");
  if(["arrowright","d"].includes(k)) keys.delete("right");
});

function tickMovement(){
  if(player.moving) {
    if (performance.now()-player.t0 >= STEP_MS) {
      player.x = player.tx; player.y = player.ty; player.moving = false;
      afterStep(); // random encounters / coin pickup after we land
    }
    return;
  }
  // single-direction priority
  let dir=null;
  if(keys.has("up")) dir="up";
  else if(keys.has("down")) dir="down";
  else if(keys.has("left")) dir="left";
  else if(keys.has("right")) dir="right";
  if(!dir) return;

  let dx=0,dy=0;
  if(dir==="up") dy=-1; else if(dir==="down") dy=1; else if(dir==="left") dx=-1; else if(dir==="right") dx=1;
  if(dx<0) player.facing="left"; if(dx>0) player.facing="right";
  if(dy<0) player.facing="up";   if(dy>0) player.facing="down";

  const nx = player.x + dx;
  const ny = player.y + dy;

  // Attempted off-screen → transition BEFORE move; spawn at opposite border
  if (nx < 0)         return transitionTo(S.world.rx-1, S.world.ry, "right", player.y);
  if (nx >= W)        return transitionTo(S.world.rx+1, S.world.ry, "left",  player.y);
  if (ny < 0)         return transitionTo(S.world.rx,   S.world.ry-1,"bottom",player.x);
  if (ny >= H)        return transitionTo(S.world.rx,   S.world.ry+1,"top",   player.x);

  // Normal in-bounds step
  if (canWalk(nx,ny)) {
    player.tx = nx; player.ty = ny; player.t0 = performance.now(); player.moving = true;
  }
}
function canWalk(x,y){ const t=map[y]?.[x]; return t!==undefined && t!==2 && t!==4; }

function transitionTo(newRx,newRy,fromEdge, preserve){
  S.world.rx=newRx; S.world.ry=newRy;
  map=makeRegionMap(S.world.rx,S.world.ry);
  coinsGround=regionCoins(S.world.rx,S.world.ry);
  // spawn at opposite border, same row/col
  if (fromEdge==="right"){ player.x=W-1; player.y=preserve; }
  if (fromEdge==="left") { player.x=0;   player.y=preserve; }
  if (fromEdge==="bottom"){player.y=H-1; player.x=preserve; }
  if (fromEdge==="top")  { player.y=0;   player.x=preserve; }
  player.tx=player.x; player.ty=player.y; player.moving=false;
  const area=areaBy(S.world.rx,S.world.ry) || {name:"Wilderness"};
  if(!S.discovered.includes(area.name)) S.discovered.push(area.name);
  toast(`${area.name}`);
  save();
}

function afterStep(){
  // pick coins if landed on them
  for(const c of coinsGround){
    if(!c.taken && c.x===player.x && c.y===player.y){
      c.taken=true; S.coins+=10; addCoins(10); toast("+10🪙");
      if(S.quest.id==="q2" && !S.quest.done){ S.quest.progress+=1; completeIfReady(); }
    }
  }
  // random encounter on GRASS (tile 0)
  if (map[player.y][player.x]===0 && Math.random() < 0.12) {
    startBattle({ name: pickEnemyName(), sprite: pickEnemySprite(), hp: 22 });
  }
  save(); updCurrency(); updQuest();
}

// Interact
function interact(){
  const tx=player.tx, ty=player.ty;
  if(ty-1>=0 && map[ty-1][tx]===3){ // shop
    $("#panelShop").classList.remove("hidden"); populateShop();
    if(S.quest.id==="q1" && !S.quest.done){ S.quest.progress=1; completeIfReady(); }
    return;
  }
  if(map[ty][tx]===5){ // boss tile
    startBattle({ name:"Boss", sprite:"👹", hp: 30, boss:true });
  }
}

// ---------- Parchment Map (overlay) ----------
let mapOverlay=false;
const areaRects=[];
function toggleMapOverlay(){ mapOverlay=!mapOverlay; }
canvas.addEventListener("click",(e)=>{
  if(!mapOverlay) return;
  const r=canvas.getBoundingClientRect();
  const x=(e.clientX-r.left), y=(e.clientY-r.top);
  const hit=areaRects.find(a=>x>=a.x && x<=a.x+a.w && y>=a.y && y<=a.y+a.h);
  if(!hit) return;
  if(!S.unlocked.includes(hit.name)){ toast("Locked — defeat its boss to get a key."); return; }
  transitionTo(hit.rx, hit.ry, "teleport", 6);
  mapOverlay=false;
});
function drawParchmentMap(){
  ctx.fillStyle="#3a2e21"; ctx.fillRect(16,16, canvas.width-32, canvas.height-32);
  ctx.strokeStyle="#ceb788"; ctx.strokeRect(16,16, canvas.width-32, canvas.height-32);
  ctx.fillStyle="#e8d6b0"; ctx.font="12px monospace";
  ctx.fillText("WORLD MAP — click unlocked area to travel", 28, 36);
  areaRects.length=0;
  let y=60;
  for(const a of AREAS){
    const unlocked=S.unlocked.includes(a.name);
    const label=`${unlocked?"🔓":"🔒"} ${a.name}`;
    const x=40; const w=ctx.measureText(label).width+12; const h=18;
    ctx.fillStyle= unlocked ? "#f0e4c6" : "#c6b89b";
    ctx.fillRect(x-6,y-12,w,h);
    ctx.strokeStyle="#7a674e"; ctx.strokeRect(x-6,y-12,w,h);
    ctx.fillStyle="#2a2218"; ctx.fillText(label,x,y);
    areaRects.push({x:x-6,y:y-12,w,h,name:a.name,rx:a.rx,ry:a.ry});
    y+=24;
  }
  ctx.fillStyle="#2a2218"; ctx.fillText(`🔑 Keys: ${S.keys}`, canvas.width-140, 36);
}

// ---------- Arena (Prodigy-style) ----------
const arena = {
  el: $("#panelArena"),
  title: $("#arenaTitle"),
  pHP: $("#pHP"), pHPt: $("#pHPt"),
  pST: $("#pST"), pSTt: $("#pSTt"),
  eHP: $("#eHP"), eHPt: $("#eHPt"),
  qTitle: $("#qTitle"), qPrompt: $("#qPrompt"), qChoices: $("#qChoices"),
  speedFill: $("#speedFill"), qMsg: $("#qMsg"),
  state: null
};

const CONSONANTS = [
  { roman: "g/k", char: "ㄱ" }, { roman: "n", char: "ㄴ" }, { roman: "d/t", char: "ㄷ" }, { roman: "r/l", char: "ㄹ" },
  { roman: "m", char: "ㅁ" }, { roman: "b/p", char: "ㅂ" }, { roman: "s", char: "ㅅ" }, { roman: "", char: "ㅇ" },
  { roman: "j", char: "ㅈ" }, { roman: "ch", char: "ㅊ" }, { roman: "k", char: "ㅋ" }, { roman: "t", char: "ㅌ" },
  { roman: "p", char: "ㅍ" }, { roman: "h", char: "ㅎ" }
];
const VOCAB = [
  { ko: "학교", en: "school" }, { ko: "선생님", en: "teacher" }, { ko: "학생", en: "student" },
  { ko: "책", en: "book" }, { ko: "물", en: "water" }, { ko: "사과", en: "apple" },
  { ko: "친구", en: "friend" }, { ko: "시간", en: "time" }, { ko: "집", en: "house" },
  { ko: "버스", en: "bus" }, { ko: "공원", en: "park" }, { ko: "도서관", en: "library" },
  { ko: "병원", en: "hospital" }, { ko: "밥", en: "rice/meal" }, { ko: "커피", en: "coffee" },
  { ko: "아침", en: "morning" }, { ko: "저녁", en: "evening" }, { ko: "오늘", en: "today" },
  { ko: "내일", en: "tomorrow" }, { ko: "어제", en: "yesterday" }
];

function pickEnemyName(){ return ["Slime","Imp","Bat","Goblin","Golem","Wisp"][Math.floor(Math.random()*6)]; }
function pickEnemySprite(){ return ["👾","🧟","🦇","🧌","🪵","🌀"][Math.floor(Math.random()*6)]; }

function startBattle(cfg){
  arena.el.classList.remove("hidden");
  arena.title.textContent = `${cfg.name} appears!`;
  arena.state = {
    pHP:22, pHPMax:22, pST:10, pSTMax:10,
    eHP:cfg.hp||22, eHPMax:cfg.hp||22,
    streak:0, fastWindow:4000, boss: !!cfg.boss
  };
  renderBars();
  nextQuestion();
}
function endBattle(win){
  if (win){
    const xp = 18 + Math.floor(arena.state.streak*1.25);
    const coins = 12 + Math.floor(arena.state.streak/2);
    addXP(xp); addCoins(coins);
    if (arena.state.boss){
      S.keys += 1;
      S.unlocked.includes(areaBy(S.world.rx,S.world.ry)?.name) || S.unlocked.push(areaBy(S.world.rx,S.world.ry)?.name);
      toast(`Boss defeated! +${xp} XP, +${coins}🪙, +1 🔑`);
    } else {
      toast(`Victory! +${xp} XP, +${coins}🪙`);
    }
  } else {
    toast("You were defeated. Try again!");
  }
  save(); updCurrency();
  setTimeout(()=>arena.el.classList.add("hidden"), 800);
}

function renderBars(){
  const s=arena.state;
  arena.pHP.style.width = `${Math.round(100*s.pHP/s.pHPMax)}%`;
  arena.pHPt.textContent = `${s.pHP}/${s.pHPMax}`;
  arena.pST.style.width = `${Math.round(100*s.pST/s.pSTMax)}%`;
  arena.pSTt.textContent = `${s.pST}/${s.pSTMax}`;
  arena.eHP.style.width = `${Math.round(100*s.eHP/s.eHPMax)}%`;
  arena.eHPt.textContent = `${s.eHP}/${s.eHPMax}`;
}

function nextQuestion(){
  arena.qMsg.textContent = "";
  arena.qChoices.innerHTML = "";
  startSpeedBar();
  const q = makeQuestion();
  arena.qTitle.textContent = q.title;
  arena.qPrompt.textContent = q.prompt;
  shuffle(q.choices).forEach(txt=>{
    const b=document.createElement("button"); b.className="btn"; b.textContent=txt;
    b.onclick=()=>answer(txt===q.answer, q);
    arena.qChoices.appendChild(b);
  });
}
function makeQuestion(){
  const types = ["roman_to_hangul","ko_to_en"];
  const kind = types[Math.floor(Math.random()*types.length)];
  if (kind==="roman_to_hangul"){
    let pool = CONSONANTS.filter(c=>c.roman);
    const choices = sample(pool,4);
    const ans = choices[Math.floor(Math.random()*choices.length)];
    return { kind, title:"Sounds → Hangul", prompt:`Which Hangul letter represents “${ans.roman}”?`, choices:choices.map(c=>c.char), answer:ans.char, meta:ans };
  }
  const choices = sample(VOCAB,4);
  const ans = choices[Math.floor(Math.random()*choices.length)];
  return { kind:"ko_to_en", title:"Vocabulary → Meaning", prompt:`What does “${ans.ko}” mean in English?`, choices:choices.map(v=>v.en), answer:ans.en, meta:ans };
}
function answer(ok,q){
  stopSpeedBar();
  [...arena.qChoices.children].forEach(b=>b.disabled=true);
  if (ok){
    if (arena.state.pST<=0){ arena.qMsg.textContent="You’re winded! (no stamina)"; setTimeout(nextQuestion,600); return; }
    arena.state.pST = Math.max(0, arena.state.pST-2);
    arena.state.streak++;
    const base=7, streak=Math.min(arena.state.streak-1,4), crit = speedPct>70?4:0;
    const dmg = base + streak + crit;
    arena.qMsg.textContent = `⚔️ Correct! -${dmg} HP ${crit?"(crit!)":""} ${streak?`(+${streak} streak)`: ""}`;
    arena.state.eHP = Math.max(0, arena.state.eHP - dmg);
    renderBars();
    if (arena.state.eHP<=0) return endBattle(true);
    setTimeout(nextQuestion, 500);
  } else {
    arena.state.streak=0;
    arena.state.pST = Math.min(arena.state.pSTMax, arena.state.pST+1);
    const edmg = 6;
    arena.state.pHP = Math.max(0, arena.state.pHP - edmg);
    arena.qMsg.textContent = q.kind==="roman_to_hangul"
      ? `😵 Wrong. ${q.answer} maps to /${q.meta.roman}/`
      : `😵 Wrong. “${q.meta.ko}” means “${q.meta.en}”`;
    renderBars();
    if (arena.state.pHP<=0) return endBattle(false);
    setTimeout(nextQuestion, 650);
  }
}
function shuffle(a){ return a.sort(()=>Math.random()-0.5); }
function sample(arr,n){ return shuffle(arr.slice()).slice(0,n); }

// speed timer
let spRAF=null, spStart=0, speedPct=100;
function startSpeedBar(){
  spStart=performance.now(); speedPct=100; arena.speedFill.style.width="100%";
  if (spRAF) cancelAnimationFrame(spRAF);
  const loop=(t)=>{ const dt=t-spStart; speedPct=Math.max(0,100-Math.round(100*dt/arena.state.fastWindow));
    arena.speedFill.style.width=`${speedPct}%`;
    spRAF = speedPct>0 ? requestAnimationFrame(loop) : null;
  };
  spRAF = requestAnimationFrame(loop);
}
function stopSpeedBar(){ if(spRAF) cancelAnimationFrame(spRAF); spRAF=null; }

// ---------- Render loop ----------
function render(){
  ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) drawTile(x,y,map[y][x]);
  for(const c of coinsGround){ if(!c.taken) drawCoin(c.x,c.y); }
  drawPlayer(); drawHUDHints();
  if(mapOverlay) drawParchmentMap();
}
function loop(){ tickMovement(); render(); requestAnimationFrame(loop); }

// ---------- Boot ----------
function init(){ updCurrency(); updQuest(); populateShop(); renderBackpack(); renderEquip(); updWheel(); loop(); }
document.readyState==="loading" ? document.addEventListener("DOMContentLoaded",init) : init();

// ---------- Map overlay toggle & click areas ----------
let mapOverlay=false;
function toggleMapOverlay(){ mapOverlay=!mapOverlay; }
const areaRects=[]; // reused in drawParchmentMap()

// ---------- Helpers ----------
function canWalk(x,y){ const t=map[y]?.[x]; return t!==undefined && t!==2 && t!==4; }
