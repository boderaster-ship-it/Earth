/*
  Physics parameters (tweakable)
  k: trampoline stiffness
  c: damping
  airDrag: drag in air for velocity and rotation
  maxCompression: max trampoline deflection in px
*/
const k = 1500;
const c = 25;
const airDrag = 0.01;
const maxCompression = 150;
const gravity = 2000; // px/s^2

// Player dimensions
const bodyWidth = 20;
const bodyHeight = 60;
const headRadius = 15;
const upperArmLength = 25;
const lowerArmLength = 20;
const upperLegLength = 30;
const lowerLegLength = 30;
const armWidth = 6;
const legWidth = 8;
const jointRadius = 3;
// distance from body center to feet
const bodyCenterOffset = upperLegLength + lowerLegLength + bodyHeight/2;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let width, height;
function resize(){
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// State
let pos = 0; // vertical position (0 at rest, up positive)
let vel = 0;
let rot = 0;
let omega = 0;
let compression = 0;
let charging = false;
let inAir = false;
let score = 0;
let combo = 1;
let timer = 60;
let trick = false;
let lastSwipe = {x:0,y:0};
let touchStart = {x:0,y:0};

const hud = {
  score: document.getElementById('score'),
  combo: document.getElementById('combo'),
  timer: document.getElementById('timer'),
  rating: document.getElementById('rating'),
  tips: document.getElementById('tips'),
  tipText: document.getElementById('tip-text'),
  pause: document.getElementById('pause'),
  restart: document.getElementById('restart'),
  mute: document.getElementById('mute')
};

let muted = false;
function beep(freq=440, dur=0.1){
  if(muted) return;
  const ctx = new (window.AudioContext||window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  osc.frequency.value = freq;
  osc.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime+dur);
}

function vibrate(ms){
  if(navigator.vibrate) navigator.vibrate(ms);
}

// Touch handling
canvas.addEventListener('touchstart', e => {
  if(e.touches.length===1){
    charging = true;
    touchStart.x = e.touches[0].clientX;
    touchStart.y = e.touches[0].clientY;
    lastSwipe.x = touchStart.x;
    lastSwipe.y = touchStart.y;
  }
  if(e.touches.length===2){
    if(inAir){
      trick = true;
    }
  }
  e.preventDefault();
});

canvas.addEventListener('touchmove', e => {
  if(charging && e.touches.length){
    lastSwipe.x = e.touches[0].clientX;
    lastSwipe.y = e.touches[0].clientY;
  }
  e.preventDefault();
});

canvas.addEventListener('touchend', e => {
  if(charging){
    const dx = lastSwipe.x - touchStart.x;
    const dy = lastSwipe.y - touchStart.y;
    const threshold = 30;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold){
      omega += (dx>0?1:-1)*5;
    }else if(Math.abs(dy) > threshold){
      vel += (-dy/threshold)*300;
    }
    charging = false;
    // release spring
  }
  e.preventDefault();
});

// HUD buttons
hud.pause.addEventListener('click', () => running = !running);
hud.restart.addEventListener('click', () => location.reload());
hud.mute.addEventListener('click', () => {muted=!muted; hud.mute.textContent = muted?'🔈':'🔇';});

// Tooltips
const tips = ['Tippen/Halten: Springen', 'Wischen: Impuls/Rotation', 'Zweitfinger: Trick'];
let tipIndex = 0;
function showNextTip(){
  if(tipIndex >= tips.length) return hud.tips.classList.add('hidden');
  hud.tipText.textContent = tips[tipIndex++];
  hud.tips.classList.remove('hidden');
  setTimeout(showNextTip, 4000);
}
showNextTip();

// Game loop with fixed timestep
let last = performance.now();
let acc = 0;
const dt = 1/60;
let running = true;
function frame(now){
  acc += (now - last)/1000;
  last = now;
  while(acc > dt){
    update(dt);
    acc -= dt;
  }
  render();
  if(running) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function update(dt){
  timer -= dt;
  if(timer <= 0){ running=false; }
  if(charging && !inAir){
    compression = Math.min(maxCompression, compression + 200*dt);
    pos = -compression;
  }
  if(!charging && !inAir){
    // spring dynamics
    const force = -k*pos - c*vel;
    const accY = force; // mass =1
    vel += accY*dt;
    pos += vel*dt;
    compression = -Math.min(0,pos);
    if(pos>=0 && vel>0){
      inAir = true;
      pos = 0;
      vibrate(10);
    }
  } else if(inAir){
    vel -= gravity*dt;
    vel *= (1-airDrag);
    pos += vel*dt;
    omega *= (1-airDrag);
    rot += omega*dt;
    if(pos<=0 && vel<0){
      inAir = false;
      land();
      pos = 0;
    }
  }
}

function land(){
  const angle = Math.abs((rot% (2*Math.PI)) * 180/Math.PI);
  const landing = angle < 20 ? 'Perfect' : angle < 45 ? 'Good' : angle < 90 ? 'Bad' : 'Fail';
  hud.rating.textContent = landing;
  hud.rating.style.color = landing==='Perfect'?'#0f0':landing==='Good'?'#ff0':landing==='Bad'?'#f80':'#f00';
  setTimeout(()=>hud.rating.textContent='',800);
  if(landing==='Fail'){
    combo = 1;
    vibrate([100,50,100]);
  }else{
    score += Math.round(Math.abs(vel) + angle);
    combo += trick ? 1 : 0;
    vibrate(20);
    beep(landing==='Perfect'?880:440,0.05);
  }
  trick=false;
  hud.score.textContent = score;
  hud.combo.textContent = 'x'+combo;
}

function drawArm(side){
  ctx.save();
  const shoulderX = side * bodyWidth/2;
  const shoulderY = -bodyHeight/2 + 10;
  ctx.translate(shoulderX, shoulderY);
  ctx.rotate(side * 0.1);
  ctx.fillRect(-armWidth/2, 0, armWidth, upperArmLength);
  ctx.beginPath();
  ctx.arc(0, upperArmLength, jointRadius, 0, Math.PI*2);
  ctx.fill();
  ctx.fillRect(-armWidth/2, upperArmLength, armWidth, lowerArmLength);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(shoulderX, shoulderY, jointRadius, 0, Math.PI*2);
  ctx.fill();
}

function drawLeg(side){
  ctx.save();
  const hipX = side * bodyWidth/4;
  const hipY = bodyHeight/2;
  ctx.translate(hipX, hipY);
  ctx.rotate(side * 0.05);
  ctx.fillRect(-legWidth/2, 0, legWidth, upperLegLength);
  ctx.beginPath();
  ctx.arc(0, upperLegLength, jointRadius, 0, Math.PI*2);
  ctx.fill();
  ctx.fillRect(-legWidth/2, upperLegLength, legWidth, lowerLegLength);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(hipX, hipY, jointRadius, 0, Math.PI*2);
  ctx.fill();
}

function drawPlayer(){
  ctx.fillStyle = '#0af';
  // body
  ctx.fillRect(-bodyWidth/2, -bodyHeight/2, bodyWidth, bodyHeight);
  // head
  ctx.beginPath();
  ctx.arc(0, -bodyHeight/2 - headRadius, headRadius, 0, Math.PI*2);
  ctx.fill();
  // limbs
  drawArm(-1);
  drawArm(1);
  drawLeg(-1);
  drawLeg(1);
}

function render(){
  ctx.clearRect(0,0,width,height);
  ctx.save();
  ctx.translate(width/2,height-50);
  // Trampoline
  ctx.fillStyle = '#333';
  ctx.fillRect(-200,0,400,20);
  ctx.fillStyle = '#555';
  ctx.fillRect(-200,-compression,400,20);
  // Player
  ctx.save();
  ctx.translate(0,-pos - bodyCenterOffset);
  ctx.rotate(rot);
  drawPlayer();
  ctx.restore();
  ctx.restore();
  hud.timer.textContent = Math.ceil(timer);
}

// Service worker registration
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js');
}
