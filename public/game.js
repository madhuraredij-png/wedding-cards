(() => {
'use strict';
const SUITS = [
  {k:'D', sym:'♦', name:'Diamonds', red:true,  cer:'The Engagement',     recess:['#F3BFCD','#D9879F'], rim:'#6F8F4E', sh:'110,30,60'},
  {k:'C', sym:'♣', name:'Clubs',    red:false, cer:'Satyanarayan Pooja', recess:['#F7A96A','#D9662A'], rim:'#6F8F4E', sh:'120,40,10'},
  {k:'H', sym:'♥', name:'Hearts',   red:true,  cer:'The Wedding',        recess:['#F8DC8A','#D3A02C'], rim:'#A8322E', sh:'120,80,10'},
  {k:'S', sym:'♠', name:'Spades',   red:false, cer:'Wedding Reception',  recess:['#A9C0DE','#5F7FAE'], rim:'#C44D78', sh:'20,35,70'}
];
const SUIT = Object.fromEntries(SUITS.map(s => [s.k, s]));
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const RANK_NAME = {A:'Ace',J:'Jack',Q:'Queen',K:'King'};
const TBD = 'Meaning to come.';
// Card content lives in cards.json so it can be edited without touching code.
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rich = t => esc(t).replace(/\*([^*]+)\*/g, '<i>$1</i>');
let CARDS = [], BY_ID = {};
function buildCards(json) {
  const DATA = Object.fromEntries((json.cards || []).map(d => [d.card, d]));
  CARDS = [];
  SUITS.forEach(s => RANKS.forEach(r => {
    const id = r + s.k, d = DATA[id] || {}, royal = r === 'K' || r === 'Q';
    const full = (RANK_NAME[r] || r) + ' of ' + s.name;
    const meaning = d.meaning ? rich(d.meaning) : TBD;
    CARDS.push({id, rank:r, suit:s.k, royal, img:d.image ? esc(d.image) : null, label:d.label ? rich(d.label) : full, full,
      alt:d.alt ? esc(d.alt) : full, meaning});
  }));
  BY_ID = Object.fromEntries(CARDS.map(c => [c.id, c]));
}
const cardsReady = fetch('cards.json')
  .then(r => { if (!r.ok) throw new Error('cards.json: HTTP ' + r.status); return r.json(); })
  .then(buildCards);
cardsReady.catch(err => console.error('Could not load card data.', err));

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const stage = $('#stage');
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function fit() {
  const box = $('#fit').getBoundingClientRect();
  const s = Math.min(box.width / 1440, box.height / 900);
  stage.style.transform = `translate(${(box.width - 1440 * s) / 2}px, ${(box.height - 900 * s) / 2}px) scale(${s})`;
  stage.dataset.scale = s;
}
addEventListener('resize', fit); fit();

function face(c) {
  if (c.img) return `<img src="cards/${c.img}" alt="${c.alt}">`;
  const s = SUIT[c.suit];
  return `<div class="ph${s.red ? ' red' : ''}" role="img" aria-label="${c.full}"><span class="ix">${c.rank}<br>${s.sym}</span><div class="art"><span class="pip">${s.sym}</span><span class="note">Art coming</span></div><span class="ix b">${c.rank}<br>${s.sym}</span></div>`;
}
function stripHTML(c) {
  if (!c) return `<span class="txt quiet">Hover or tap a card to read what it shows.</span>`;
  const s = SUIT[c.suit];
  return `<span class="sym${s.red ? ' red' : ''}" aria-label="${c.full}">${c.rank} ${s.sym}</span><span class="txt">${c.meaning}</span>`;
}

// Decorative builds
$$('[data-dias]').forEach(el => { el.innerHTML = '<span class="dia"><i></i></span>'.repeat(+el.dataset.dias); });
$$('.flank').forEach(el => {
  el.innerHTML = '<div class="stem" style="left:70px;height:520px"></div>' +
    [[30,700,-30],[74,640,30],[30,580,-30],[74,520,30],[30,460,-30]].map(([l,t,r]) => `<div class="leaf" style="left:${l}px;top:${t}px;transform:rotate(${r}deg)"></div>`).join('') +
    [[82,400,20],[46,418,-35],[64,380,60]].map(([l,t,r]) => `<div class="bract" style="left:${l}px;top:${t}px;transform:rotate(${r}deg)"></div>`).join('') +
    '<div class="mari" style="left:24px;top:224px"><i></i></div>';
});
$$('.corner').forEach(el => {
  el.innerHTML = '<div class="cl-stem" style="left:78px;top:126px;width:4px;height:76px"></div>' +
    '<div class="cl-leaf" style="left:38px;top:165px;width:40px;height:14px;transform:rotate(35deg)"></div>' +
    '<div class="cl-leaf" style="left:82px;top:165px;width:40px;height:14px;transform:rotate(-35deg)"></div>' +
    '<div class="cl-dot" style="left:26px;top:168px;width:12px;height:12px"></div><div class="cl-dot" style="left:122px;top:168px;width:12px;height:12px"></div>' +
    '<div class="cl-bract" style="left:49px;top:139px;transform:rotate(15deg)"></div><div class="cl-bract" style="left:89px;top:139px;transform:rotate(75deg)"></div>' +
    '<div class="cl-mari" style="left:53px;top:97px;width:54px;height:54px"><i></i></div>';
});

// ---------- Game state ----------
let G;
function newGame() {
  const royals = CARDS.filter(c => c.royal), plain = CARDS.filter(c => !c.royal);
  G = { ordinary: shuffle(plain.slice()), aside: [], royalPool: shuffle(royals.slice()), spread: [],
        placed: {}, locked: [], selected: null, pinned: null, hover: null };
  SUITS.forEach(s => G.placed[s.k] = {K:false, Q:false});
  deal();
}
function deal() {
  G.spread.forEach(c => { if (c.royal) G.royalPool.push(c); else G.aside.push(c); });
  G.spread = []; G.selected = null; G.pinned = null; G.hover = null;
  const n = 6, avail = G.royalPool.length;
  const k = avail === 0 ? 0 : (avail >= 2 && Math.random() < 0.3 ? 2 : 1);
  shuffle(G.royalPool);
  const roys = G.royalPool.splice(0, k);
  if (G.ordinary.length < n - k) { G.ordinary = G.ordinary.concat(shuffle(G.aside)); G.aside = []; }
  G.spread = shuffle(roys.concat(G.ordinary.splice(0, n - k)));
}

// ---------- Rendering ----------
const LEFTS = [20,180,340,500,660,820], TOPS = [88,58,40,40,58,88], ROTS = [-10,-6,-2,2,6,10];
function renderNiches() {
  $('#niches').innerHTML = SUITS.map(s => {
    const p = G.placed[s.k], locked = G.locked.includes(s.k);
    const slot = r => {
      const filled = p[r], c = BY_ID[r + s.k];
      const glow = !filled && G.selected && G.selected.rank === r;
      return `<button type="button" class="slot ${r.toLowerCase()}${filled ? ' filled' : ''}${glow ? ' glow' : ''}" data-suit="${s.k}" data-rank="${r}" aria-label="${filled ? c.full + ', placed' : (r === 'K' ? 'King' : 'Queen') + ' slot for ' + s.cer}">${filled ? (c.img ? `<img src="cards/${c.img}" alt="">` : face(c)) : r}</button>`;
    };
    return `<div class="niche${locked ? ' locked' : ''}" data-suit="${s.k}">
      <div class="n-rim"><div class="n-rim2" style="background:${s.rim}"><div class="n-recess" style="background:radial-gradient(ellipse at 50% 90%, ${s.recess[0]}, ${s.recess[1]} 75%);box-shadow:inset 0 18px 26px rgba(${s.sh},.45),inset 8px 0 14px rgba(${s.sh},.2),inset -8px 0 14px rgba(${s.sh},.2)">${slot('K')}${slot('Q')}</div></div></div>
      <div class="sill-top"></div><div class="sill-front"></div>
      <p class="caps cer">${s.cer.toUpperCase()}</p></div>`;
  }).join('');
  $('#progress').textContent = `${G.locked.length} of 4 ceremonies complete`;
}
function renderSpread(animate) {
  const n = G.spread.length, off = (6 - n) * 80;
  $('#spread').innerHTML = G.spread.map((c, i) => {
    const idx = Math.min(5, i + Math.floor((6 - n) / 2));
    return `<div class="spot${animate ? ' deal' : ''}" data-id="${c.id}" style="--i:${i};left:${LEFTS[i] + off}px;top:${TOPS[idx]}px;transform:rotate(${ROTS[idx]}deg)">
      <button type="button" class="card${c.royal ? ' royal' : ''}" data-id="${c.id}" aria-label="${c.full}${c.royal ? ', royal card' : ''}">${face(c)}${c.royal ? '<div class="foil"></div>' : ''}</button>
      <p class="lbl">${c.label}</p></div>`;
  }).join('');
  refreshLift();
}
function focused() { return G.selected || G.hover || G.pinned; }
function refreshLift() {
  const f = focused();
  $$('#spread .spot').forEach(el => el.classList.toggle('lifted', !!f && el.dataset.id === f.id));
  $('#strip').innerHTML = stripHTML(f);
}

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

function show(id) { ['intro','play','lock','finale'].forEach(s => $('#' + s).hidden = s !== id); }

// ---------- Play interactions ----------
const spreadEl = $('#spread');
spreadEl.addEventListener('pointerover', e => { const s = e.target.closest('.spot'); if (s && e.pointerType === 'mouse') { G.hover = BY_ID[s.dataset.id]; refreshLift(); } });
spreadEl.addEventListener('pointerleave', () => { G.hover = null; refreshLift(); });
spreadEl.addEventListener('focusin', e => { const b = e.target.closest('.card'); if (b) { G.hover = BY_ID[b.dataset.id]; refreshLift(); } });
spreadEl.addEventListener('focusout', () => { G.hover = null; refreshLift(); });

function choose(c) {
  if (c.royal) {
    G.selected = G.selected === c ? null : c;
    G.pinned = null;
    if (G.selected) toast('Now tap the right ceremony’s ' + (c.rank === 'K' ? 'K' : 'Q') + ' slot, or drag the card there.');
  } else {
    G.selected = null;
    G.pinned = G.pinned === c ? null : c;
  }
  renderNiches(); refreshLift();
}

function tryPlace(c, suit, rank) {
  if (!c) { toast('Pick up a king or queen from the spread first.'); return; }
  if (G.placed[suit][rank]) return;
  const spotBtn = spreadEl.querySelector(`.card[data-id="${c.id}"]`);
  if (c.suit !== suit || c.rank !== rank) {
    if (spotBtn) { spotBtn.classList.remove('shake'); void spotBtn.offsetWidth; spotBtn.classList.add('shake'); }
    toast(c.rank !== rank ? (c.rank === 'K' ? 'Kings go in the K slot.' : 'Queens go in the Q slot.') : 'Not quite. This outfit was worn at a different ceremony.');
    return;
  }
  G.placed[suit][rank] = true;
  G.spread = G.spread.filter(x => x !== c);
  G.selected = null; G.hover = null; G.pinned = null;
  renderNiches(); renderSpread(false);
  if (G.placed[suit].K && G.placed[suit].Q) {
    G.locked.push(suit);
    renderNiches();
    setTimeout(() => openLock(suit), 650);
  }
}

spreadEl.addEventListener('click', e => {
  if (dragJustEnded) return;
  const b = e.target.closest('.card'); if (b) choose(BY_ID[b.dataset.id]);
});
$('#niches').addEventListener('click', e => {
  const s = e.target.closest('.slot'); if (!s) return;
  tryPlace(G.selected, s.dataset.suit, s.dataset.rank);
});
$('#dealBtn').addEventListener('click', () => { deal(); renderNiches(); renderSpread(true); });

// Drag royals onto a niche
let drag = null, dragJustEnded = false;
spreadEl.addEventListener('pointerdown', e => {
  const b = e.target.closest('.card'); if (!b) return;
  const c = BY_ID[b.dataset.id]; if (!c.royal) return;
  drag = { c, x: e.clientX, y: e.clientY, started: false, el: b.closest('.spot'), ghost: null };
});
addEventListener('pointermove', e => {
  if (!drag) return;
  const sc = +stage.dataset.scale, r = stage.getBoundingClientRect();
  if (!drag.started) {
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    drag.started = true; G.selected = drag.c; renderNiches(); refreshLift();
    drag.el.classList.add('dragging');
    drag.ghost = document.createElement('div'); drag.ghost.className = 'ghost';
    drag.ghost.innerHTML = face(drag.c); stage.appendChild(drag.ghost);
  }
  drag.ghost.style.left = ((e.clientX - r.left) / sc - 70) + 'px';
  drag.ghost.style.top = ((e.clientY - r.top) / sc - 98) + 'px';
});
addEventListener('pointerup', e => {
  if (!drag) return;
  const d = drag; drag = null;
  if (!d.started) return;
  d.ghost.remove(); d.el.classList.remove('dragging');
  dragJustEnded = true; setTimeout(() => dragJustEnded = false, 0);
  const hit = document.elementFromPoint(e.clientX, e.clientY);
  const slot = hit && hit.closest('.slot');
  const niche = hit && hit.closest('.niche');
  if (slot) tryPlace(d.c, slot.dataset.suit, slot.dataset.rank);
  else if (niche) tryPlace(d.c, niche.dataset.suit, d.c.rank);
  else { G.selected = null; renderNiches(); refreshLift(); }
});

// ---------- Lock moment ----------
function lockFace(sel, c) {
  // Swap the lock card's face in place: the illustration, or the "Art coming" face when there is none.
  const el = $(sel), alt = c.full + ': ' + c.meaning.replace(/<[^>]+>/g, '');
  if (c.img) {
    const img = document.createElement('img');
    img.id = el.id; img.src = 'cards/' + c.img; img.alt = alt;
    el.replaceWith(img);
  } else {
    const tmp = document.createElement('div'); tmp.innerHTML = face(c);
    const ph = tmp.firstElementChild; ph.id = el.id; ph.setAttribute('aria-label', alt);
    el.replaceWith(ph);
  }
}
function openLock(suit) {
  const s = SUIT[suit];
  $('#lockRim2').style.background = s.rim;
  $('#lockRecess').style.background = `radial-gradient(ellipse at 50% 80%, ${s.recess[0]}, ${s.recess[1]} 72%)`;
  $('#lockRecess').style.boxShadow = `inset 0 28px 44px rgba(${s.sh},.45),inset 14px 0 24px rgba(${s.sh},.2),inset -14px 0 24px rgba(${s.sh},.2)`;
  const K = BY_ID['K' + suit], Q = BY_ID['Q' + suit];
  lockFace('#lockK', K); lockFace('#lockQ', Q);
  $('#lockTitle').textContent = suit === 'H' ? 'Just Married!' : s.cer;
  const last = G.locked.length === 4;
  $('#continueBtn').textContent = last ? 'See the whole deck' : 'Continue';
  $('#toast').classList.remove('show');
  const lock = $('#lock'); lock.hidden = false; lock.classList.remove('show'); void lock.offsetWidth; lock.classList.add('show');
  $('#continueBtn').focus({preventScroll:true});
}
(function garland() {
  const out = [];
  for (let i = 0; i <= 30; i++) {
    const a = Math.PI + Math.PI * i / 30, pink = i % 3 === 1;
    const x = Math.round(720 + 254 * Math.cos(a) - 11), y = Math.round(384 + 254 * Math.sin(a) - 11);
    out.push(pink ? `<div class="br" style="left:${x}px;top:${y}px;transform:rotate(${(i * 41) % 90}deg)"></div>` : `<div class="bead" style="left:${x}px;top:${y}px"></div>`);
  }
  for (let k = 0; k <= 22; k++) {
    const t = k / 22, x = Math.round(600 + 240 * t - 11), y = Math.round(484 + 240 * t * (1 - t) - 11), pink = k % 4 === 2;
    out.push(pink ? `<div class="br" style="left:${x}px;top:${y}px;transform:rotate(${(k * 37) % 90}deg)"></div>` : `<div class="bead" style="left:${x}px;top:${y}px"></div>`);
  }
  $('#garland').innerHTML = out.join('');
})();
$('#continueBtn').addEventListener('click', () => {
  $('#lock').hidden = true;
  if (G.locked.length === 4) { openFinale(true); return; }
  if (!G.spread.some(c => c.royal)) { deal(); renderNiches(); renderSpread(true); }
});

// ---------- Finale / deck view ----------
let finFrom = 'intro';
function openFinale(win) {
  finFrom = win ? 'intro' : (!$('#play').hidden ? 'play' : 'intro');
  $('#finTitle').textContent = win ? 'The wedding is complete.' : 'The whole deck';
  $('#finSub').textContent = win ? 'Ketaki and Prasanna made it to every ceremony. Hover any card to read it.' : 'Fifty-two cards, one wedding. Hover any card to read it.';
  $('#finBack').textContent = win ? 'Back to start' : 'Back';
  $('#couples').innerHTML = SUITS.map(s => {
    const q = BY_ID['Q' + s.k], k = BY_ID['K' + s.k];
    return `<div class="couple"><div class="pair"><button type="button" class="mini" data-id="${q.id}">${face(q)}</button><button type="button" class="mini" data-id="${k.id}">${face(k)}</button></div><span class="name">${s.cer}</span></div>`;
  }).join('');
  $('#fans').innerHTML = SUITS.map(s => {
    const cards = CARDS.filter(c => c.suit === s.k && !c.royal);
    return `<div class="fan-row"><span class="caps" style="font-size:12px">${s.sym}&nbsp; ${s.name.toUpperCase()}</span><div class="fan">${cards.map((c, i) =>
      `<button type="button" class="mini${c.img ? '' : ' ph-mini'}" data-id="${c.id}" style="transform:rotate(${((i - 5) * 1.6).toFixed(1)}deg)">${face(c)}</button>`).join('')}</div></div>`;
  }).join('');
  $('#finStrip').innerHTML = stripHTML(null);
  if (!$('#lock').hidden) $('#lock').hidden = true;
  show('finale');
}
let finPinned = null;
function finFocus(id) {
  $$('#finale .mini').forEach(m => m.classList.toggle('on', m.dataset.id === id));
  $('#finStrip').innerHTML = stripHTML(id ? BY_ID[id] : null);
}
const fin = $('#finale');
fin.addEventListener('pointerover', e => { const m = e.target.closest('.mini'); if (m && e.pointerType === 'mouse') finFocus(m.dataset.id); });
fin.addEventListener('pointerout', e => { if (e.pointerType === 'mouse' && !e.relatedTarget?.closest?.('.mini')) finFocus(finPinned); });
fin.addEventListener('focusin', e => { const m = e.target.closest('.mini'); if (m) finFocus(m.dataset.id); });
fin.addEventListener('click', e => { const m = e.target.closest('.mini'); if (m) { finPinned = finPinned === m.dataset.id ? null : m.dataset.id; finFocus(finPinned); } });
$('#finBack').addEventListener('click', () => { show(finFrom === 'play' && G && G.locked.length < 4 ? 'play' : 'intro'); });

// ---------- Navigation ----------
async function start() { await cardsReady; newGame(); show('play'); renderNiches(); renderSpread(true); }
$('#startBtn').addEventListener('click', start);
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (!g) return;
  if (g.dataset.go === 'deck') cardsReady.then(() => openFinale(false));
  if (g.dataset.go === 'restart') { $('#lock').hidden = true; start(); }
});
addEventListener('keydown', e => { if (e.key === 'Escape' && G && G.selected) { G.selected = null; renderNiches(); refreshLift(); } });

window.__game = { get state() { return G; }, newGame, deal, tryPlace, get BY_ID() { return BY_ID; }, get CARDS() { return CARDS; }, ready: cardsReady };
})();
