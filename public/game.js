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

// Desktop: one 1440x900 stage scaled to fit. Phone (below 700px wide): a 390x844 stage scaled
// the same way, except the finale, which is a taller page scaled to the width and scrolled.
// The block-print frame is drawn around the whole window, not the stage, so it always meets the edges.
const PHONE = matchMedia('(max-width: 699px)');
const isPhone = () => PHONE.matches;
const PHONE_W = 390, PHONE_H = 844, PHONE_FINALE_H = 1234;
let sizer = null; // phone finale only: an in-flow spacer that gives #fit its scroll height
function fit() {
  const box = $('#fit'), W = box.clientWidth, H = box.clientHeight;
  const phone = isPhone(), tall = phone && stage.classList.contains('tall');
  const sw = phone ? PHONE_W : 1440, sh = phone ? (tall ? PHONE_FINALE_H : PHONE_H) : 900;
  const s = tall ? W / sw : Math.min(W / sw, H / sh);
  stage.style.transform = `translate(${(W - sw * s) / 2}px, ${tall ? 0 : (H - sh * s) / 2}px) scale(${s})`;
  stage.dataset.scale = s;
  let pageH = H;
  if (tall) {
    if (!sizer) { sizer = document.createElement('div'); sizer.setAttribute('aria-hidden', 'true'); box.appendChild(sizer); }
    sizer.style.height = Math.ceil(sh * s) + 'px';
    pageH = Math.max(H, Math.ceil(sh * s));
  } else if (sizer) sizer.style.height = '0px';
  // Band thickness follows the stage scale, so content (kept 66 stage px from its edges) never meets it.
  drawFrame(W, pageH, (phone ? 0.5 : 1) * s);
}

// The frame: border.svg's own bands and corner rosettes, redrawn for any size.
// k is the band scale: 1 draws the full 66px frame, 0.5 the phone's 33px frame.
let frameSrc = null, frameKey = '';
fetch('border.svg').then(r => r.text()).then(t => { frameSrc = t; frameKey = ''; fit(); }).catch(() => {});
function drawFrame(px, py, k) {
  const key = [px, py, k.toFixed(4)].join('x');
  if (!frameSrc || frameKey === key) return;
  frameKey = key;
  const W = px / k, H = py / k;
  const defs = frameSrc.slice(frameSrc.indexOf('<defs>'), frameSrc.indexOf('</defs>') + 7);
  const g0 = frameSrc.indexOf('<g transform="translate(0 0)">');
  const rosette = frameSrc.slice(frameSrc.indexOf('>', g0) + 1, frameSrc.indexOf('</g>', g0));
  const box = (i, extra) => `<rect x="${i}" y="${i}" width="${W - 2 * i}" height="${H - 2 * i}" fill="none"${extra}/>`;
  const band = (i, t, h, v) => `<rect x="${i}" y="${i}" width="${W - 2 * i}" height="${t}" fill="url(#${h})"/><rect x="${i}" y="${H - i - t}" width="${W - 2 * i}" height="${t}" fill="url(#${h})"/>` +
    `<rect x="${i}" y="${i}" width="${t}" height="${H - 2 * i}" fill="url(#${v})"/><rect x="${W - i - t}" y="${i}" width="${t}" height="${H - 2 * i}" fill="url(#${v})"/>`;
  const corners = [[0, 0], [W - 70, 0], [0, H - 70], [W - 70, H - 70]].map(([x, y]) => `<g transform="translate(${x} ${y})">${rosette}</g>`).join('');
  let el = $('.frame-view');
  if (!el) { el = document.createElement('div'); el.className = 'frame-view'; el.setAttribute('aria-hidden', 'true'); $('#fit').appendChild(el); }
  el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${py}" viewBox="0 0 ${W} ${H}">${defs}` +
    box(4, ' stroke="#8EA86E" stroke-width="8"') + box(8.5, ' stroke="#5F7F45" stroke-width="1"') + box(11, ' stroke="#C44D78" stroke-width="1.6"') +
    band(13, 14, 'chH', 'chV') + box(28.5, ' stroke="#8EA86E" stroke-width="1.6"') + band(30, 18, 'roH', 'roV') +
    box(49, ' stroke="#8EA86E" stroke-width="1.6"') + band(50, 10, 'diH', 'diV') + box(61, ' stroke="#C44D78" stroke-width="2"') +
    box(64.5, ' stroke="#8EA86E" stroke-width="1"') + corners + '</svg>';
}
function relayout() {
  fit(); buildGarland();
  if (G && !$('#play').hidden) { renderNiches(); renderSpread(false); }
  if (!$('#finale').hidden) openFinale(finWin);
}
addEventListener('resize', fit);
PHONE.addEventListener('change', relayout);
fit();

function face(c) {
  if (c.img) return `<img src="cards/${c.img}" alt="${c.alt}">`;
  const s = SUIT[c.suit];
  return `<div class="ph${s.red ? ' red' : ''}" role="img" aria-label="${c.full}"><span class="ix">${c.rank}<br>${s.sym}</span><div class="art"><span class="pip">${s.sym}</span><span class="note">Art coming</span></div><span class="ix b">${c.rank}<br>${s.sym}</span></div>`;
}
function stripHTML(c) {
  if (!c) return `<span class="txt quiet">${isPhone() ? 'Tap' : 'Hover or tap'} a card to read what it shows.</span>`;
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
// Phone: two rows of up to three cards, each row on a gentle arc (center higher, outward tilt).
function phoneSpot(i, n) {
  const first = Math.min(3, n), row = i < first ? 0 : 1, m = row ? n - first : first, j = row ? i - first : i;
  const d = j - (m - 1) / 2;
  return { left: 153 + Math.round(d * 98), top: (row ? 150 : 0) + Math.round(10 * Math.abs(d)), rot: 5 * d };
}
// Niches are built once per game and then updated in place, so a celebration in progress
// is never cut short by a re-render.
function renderNiches() {
  const box = $('#niches');
  if (!box.children.length) {
    box.innerHTML = SUITS.map(s => `<div class="niche" data-suit="${s.k}" role="group">
      <div class="n-rim"><div class="n-rim2" style="background:${s.rim}"><div class="n-recess" style="background:radial-gradient(ellipse at 50% 90%, ${s.recess[0]}, ${s.recess[1]} 75%);box-shadow:inset 0 18px 26px rgba(${s.sh},.45),inset 8px 0 14px rgba(${s.sh},.2),inset -8px 0 14px rgba(${s.sh},.2)">` +
      ['K', 'Q'].map(r => `<button type="button" class="slot ${r.toLowerCase()}" data-suit="${s.k}" data-rank="${r}"></button>`).join('') +
      `</div></div><div class="foil shine"></div></div>
      <div class="sill-top"></div><div class="sill-front"></div>
      <div class="cer-wrap"><p class="caps cer">${s.cer.toUpperCase()}</p><p class="cheer" aria-hidden="true">${s.k === 'H' ? 'Just Married!' : 'Ceremony complete'}</p></div></div>`).join('');
  }
  SUITS.forEach(s => {
    const n = box.querySelector(`.niche[data-suit="${s.k}"]`), locked = G.locked.includes(s.k);
    n.classList.toggle('locked', locked);
    n.setAttribute('aria-label', s.cer + (locked ? ', complete' : ''));
    ['K', 'Q'].forEach(r => {
      const el = n.querySelector(`.slot[data-rank="${r}"]`), filled = G.placed[s.k][r], c = BY_ID[r + s.k];
      const glow = !filled && G.selected && G.selected.rank === r;
      el.className = `slot ${r.toLowerCase()}${filled ? ' filled' : ''}${glow ? ' glow' : ''}`;
      el.setAttribute('aria-label', `${s.cer}, ${r === 'K' ? 'king' : 'queen'} slot, ${filled ? c.full + ' placed' : 'empty'}`);
      if (el.dataset.filled !== String(filled)) {
        el.dataset.filled = String(filled);
        el.innerHTML = filled ? (c.img ? `<img src="cards/${c.img}" alt="">` : face(c)) + '<div class="foil"></div>' : r;
      }
    });
  });
  $('#progress').textContent = `${G.locked.length} of 4 ceremonies complete`;
}
function renderSpread(animate) {
  const n = G.spread.length, off = (6 - n) * 80, phone = isPhone();
  $('#spread').innerHTML = G.spread.map((c, i) => {
    const idx = Math.min(5, i + Math.floor((6 - n) / 2));
    const p = phone ? phoneSpot(i, n) : { left: LEFTS[i] + off, top: TOPS[idx], rot: ROTS[idx] };
    return `<div class="spot${animate ? ' deal' : ''}" data-id="${c.id}" style="--i:${i};left:${p.left}px;top:${p.top}px;transform:rotate(${p.rot}deg)">
      <button type="button" class="card${c.royal ? ' royal' : ''}" data-id="${c.id}" aria-label="${cardLabel(c)}"${c.royal ? ` aria-pressed="${G.selected === c}"` : ''}>${face(c)}${c.royal ? '<div class="foil"></div>' : ''}</button>
      <p class="lbl">${c.label}</p></div>`;
  }).join('');
  refreshLift();
}
// Screen-reader name for a card: what it is, what it shows, and whether it can be placed.
function cardLabel(c) {
  const plain = t => t.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const label = plain(c.label), parts = [c.full];
  if (label !== c.full) parts.push(label);
  if (c.meaning !== TBD) parts.push(plain(c.meaning));
  return esc(parts.join('. ') + (c.royal ? '. Royal card' : ''));
}
function focused() { return G.selected || G.hover || G.pinned; }
function refreshLift() {
  const f = focused();
  $$('#spread .spot').forEach(el => el.classList.toggle('lifted', !!f && el.dataset.id === f.id));
  $$('#spread .card.royal').forEach(b => b.setAttribute('aria-pressed', String(!!G.selected && G.selected.id === b.dataset.id)));
  $('#strip').innerHTML = stripHTML(f);
}

// Keyboard play. Focus is only moved for keyboard users, so mouse and touch play look exactly as before.
let keyboard = false;
addEventListener('keydown', e => { if (['Tab', 'Enter', ' ', 'Escape'].includes(e.key)) keyboard = true; }, true);
addEventListener('pointerdown', () => { keyboard = false; }, true);
function say(msg) { const a = $('#announce'); a.textContent = ''; setTimeout(() => { a.textContent = msg; }, 30); }
function cardBtn(c) { return c && $('#spread').querySelector(`.card[data-id="${c.id}"]`); }
function focusSpread() {
  // After placing a card: the next royal to place, else Deal again.
  const next = G.spread.find(c => c.royal);
  (cardBtn(next) || $('#dealBtn')).focus();
}
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

function show(id) {
  ['intro','play','married','finale'].forEach(s => $('#' + s).hidden = s !== id);
  stage.classList.toggle('tall', id === 'finale');
  $('#fit').scrollTop = 0;
  fit();
}

// ---------- Play interactions ----------
const spreadEl = $('#spread');
spreadEl.addEventListener('pointerover', e => { const s = e.target.closest('.spot'); if (s && e.pointerType === 'mouse') { G.hover = BY_ID[s.dataset.id]; refreshLift(); } });
// The tilted container ignores the pointer (see styles.css), so listen on its section, which covers the same area.
spreadEl.parentElement.addEventListener('pointerleave', () => { G.hover = null; refreshLift(); });
spreadEl.addEventListener('focusin', e => { const b = e.target.closest('.card'); if (b) { G.hover = BY_ID[b.dataset.id]; refreshLift(); } });
spreadEl.addEventListener('focusout', () => { G.hover = null; refreshLift(); });

function choose(c) {
  if (c.royal) {
    G.selected = G.selected === c ? null : c;
    G.pinned = null;
    if (G.selected) {
      const r = c.rank === 'K' ? 'K' : 'Q';
      toast(keyboard ? `Picked up. Tab to the right ceremony’s ${r} slot and press Enter. Escape puts it back.` : 'Now tap the right ceremony’s ' + r + ' slot, or drag the card there.');
    } else if (keyboard) say(c.full + ' put back.');
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
  const wasKeyboard = keyboard;
  renderNiches(); renderSpread(false);
  if (!(G.placed[suit].K && G.placed[suit].Q)) say(`${c.full} placed at ${SUIT[suit].cer}.`);
  if (G.placed[suit].K && G.placed[suit].Q) {
    G.locked.push(suit);
    renderNiches();
    const done = G.locked.length === 4;
    setTimeout(() => celebrate(suit), 300);
    say(`${c.full} placed. ${suit === 'H' ? 'Just married!' : 'Ceremony complete'}: ${SUIT[suit].cer}.`);
    // After the fourth pair: let its niche celebrate, then the Just Married screen.
    if (done) { setTimeout(openMarried, 1700); return; }
  }
  if (wasKeyboard) focusSpread();
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
  const half = isPhone() ? [42, 59] : [70, 98];
  drag.ghost.style.left = ((e.clientX - r.left) / sc - half[0]) + 'px';
  drag.ghost.style.top = ((e.clientY - r.top) / sc - half[1]) + 'px';
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

// ---------- Ceremony complete (in place) ----------
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
function celebrate(suit) {
  const n = $(`#niches .niche[data-suit="${suit}"]`); if (!n) return;
  n.classList.remove('celebrate'); void n.offsetWidth; n.classList.add('celebrate');
  clearTimeout(n._done); n._done = setTimeout(() => n.classList.remove('celebrate'), 2800);
  if (reduceMotion.matches) return;
  // A few bougainvillea petals and marigold beads drift out from the top of the arch.
  const spread = isPhone() ? 0.6 : 1;
  for (let i = 0; i < 9; i++) {
    const p = document.createElement('i');
    p.className = 'petal ' + (i % 3 === 1 ? 'bead' : 'br');
    const a = Math.PI * (0.1 + 0.8 * i / 8) + (Math.random() - 0.5) * 0.3;
    p.style.setProperty('--x', Math.round(-Math.cos(a) * (90 + Math.random() * 50) * spread) + 'px');
    p.style.setProperty('--y', Math.round((-30 + Math.random() * 90) * spread) + 'px');
    p.style.setProperty('--r', Math.round(Math.random() * 360 - 180) + 'deg');
    p.style.animationDelay = Math.round(Math.random() * 180) + 'ms';
    n.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

// ---------- Just married (after all four ceremonies) ----------
// The big arch in The Wedding's colours with the couple's wedding outfits, garland and varmala,
// and a full-window shower of petals.
function marriedFace(sel, c) {
  // The illustration, or the "Art coming" face when there is none.
  const el = $(sel), alt = c.full + ': ' + c.meaning.replace(/<[^>]+>/g, '');
  const tmp = document.createElement('div');
  tmp.innerHTML = c.img ? `<img src="cards/${c.img}" alt="">` : face(c);
  const node = tmp.firstElementChild; node.id = el.id;
  if (c.img) node.alt = alt; else node.setAttribute('aria-label', alt);
  el.replaceWith(node);
}
function openMarried() {
  if (!G || G.locked.length < 4 || $('#play').hidden) return;
  const s = SUIT.H;
  $('#marriedRim2').style.background = s.rim;
  $('#marriedRecess').style.background = `radial-gradient(ellipse at 50% 80%, ${s.recess[0]}, ${s.recess[1]} 72%)`;
  $('#marriedRecess').style.boxShadow = `inset 0 28px 44px rgba(${s.sh},.45),inset 14px 0 24px rgba(${s.sh},.2),inset -14px 0 24px rgba(${s.sh},.2)`;
  marriedFace('#marriedK', BY_ID.KH); marriedFace('#marriedQ', BY_ID.QH);
  $('#toast').classList.remove('show');
  show('married');
  const m = $('#married'); m.classList.remove('show'); void m.offsetWidth; m.classList.add('show');
  say('Just married! All four ceremonies are complete.');
  $('#marriedBtn').focus({ preventScroll: true });
  shower();
}
function shower() {
  clearShower();
  if (reduceMotion.matches) return;
  const layer = document.createElement('div'); layer.className = 'shower'; layer.setAttribute('aria-hidden', 'true');
  const k = +stage.dataset.scale * (isPhone() ? 0.9 : 1.25);
  const n = isPhone() ? 40 : 90;
  let html = '';
  for (let i = 0; i < n; i++) {
    const kind = i % 4 === 0 ? 'bead' : i % 4 === 2 ? 'br soft' : 'br';
    const w = Math.round((kind === 'bead' ? 16 : 20) * (0.7 + Math.random() * 0.8) * k);
    const wave = i < n * 0.6 ? 0 : 1600;
    html += `<i class="${kind}" style="--x:${(Math.random() * 100).toFixed(1)}%;--w:${w}px;--t:${(3.6 + Math.random() * 2.4).toFixed(2)}s;--d:${wave + Math.round(Math.random() * 1400)}ms;--sx:${Math.round((Math.random() - 0.5) * 220 * k)}px;--r:${Math.round(360 + Math.random() * 540)}deg"></i>`;
  }
  layer.innerHTML = html;
  $('#fit').appendChild(layer);
  layer._t = setTimeout(clearShower, 9000);
}
function clearShower() { const l = $('.shower'); if (l) { clearTimeout(l._t); l.remove(); } }
$('#marriedBtn').addEventListener('click', () => { clearShower(); openFinale(true); });

// Garland around the arch and varmala across the couple. Phone uses the same shapes on the smaller arch.
function buildGarland() {
  const g = isPhone()
    ? { cx: 195, cy: 280, r: 159, n: 24, bead: 7, vx: 131, vw: 128, vy: 368, sag: 200, vn: 16 }
    : { cx: 720, cy: 384, r: 254, n: 30, bead: 11, vx: 600, vw: 240, vy: 484, sag: 240, vn: 22 };
  const out = [], b = g.bead;
  for (let i = 0; i <= g.n; i++) {
    const a = Math.PI + Math.PI * i / g.n, pink = i % 3 === 1;
    const x = Math.round(g.cx + g.r * Math.cos(a) - b), y = Math.round(g.cy + g.r * Math.sin(a) - b);
    out.push(pink ? `<div class="br" style="left:${x}px;top:${y}px;transform:rotate(${(i * 41) % 90}deg)"></div>` : `<div class="bead" style="left:${x}px;top:${y}px"></div>`);
  }
  for (let k = 0; k <= g.vn; k++) {
    const t = k / g.vn, x = Math.round(g.vx + g.vw * t - b), y = Math.round(g.vy + g.sag * t * (1 - t) - b), pink = k % 4 === 2;
    out.push(pink ? `<div class="br" style="left:${x}px;top:${y}px;transform:rotate(${(k * 37) % 90}deg)"></div>` : `<div class="bead" style="left:${x}px;top:${y}px"></div>`);
  }
  $('#garland').innerHTML = out.join('');
}
buildGarland();

// ---------- Finale / deck view ----------
let finFrom = 'intro', finWin = false, finPinned = null;
function openFinale(win) {
  finWin = win;
  if ($('#finale').hidden) finPinned = null;
  const read = (isPhone() ? 'Tap' : 'Hover') + ' any card to read it.';
  if ($('#finale').hidden) finFrom = win ? 'intro' : (!$('#play').hidden ? 'play' : 'intro');
  $('#finTitle').textContent = win ? 'The wedding is complete.' : 'The whole deck';
  $('#finSub').textContent = win ? 'Ketaki and Prasanna made it to every ceremony. ' + read : 'Fifty-two cards, one wedding. ' + read;
  $('#finBack').textContent = win ? 'Back to start' : 'Back';
  $('#couples').innerHTML = SUITS.map(s => {
    const q = BY_ID['Q' + s.k], k = BY_ID['K' + s.k];
    return `<div class="couple"><div class="pair"><button type="button" class="mini" data-id="${q.id}" aria-label="${cardLabel(q)}">${face(q)}</button><button type="button" class="mini" data-id="${k.id}" aria-label="${cardLabel(k)}">${face(k)}</button></div><span class="name">${s.cer}</span></div>`;
  }).join('');
  $('#fans').innerHTML = SUITS.map(s => {
    const cards = CARDS.filter(c => c.suit === s.k && !c.royal);
    return `<div class="fan-row"><span class="caps fan-label">${s.sym}&nbsp; ${s.name.toUpperCase()}</span><div class="fan">${cards.map((c, i) =>
      `<button type="button" class="mini${c.img ? '' : ' ph-mini'}" data-id="${c.id}" aria-label="${cardLabel(c)}" style="transform:rotate(${((i - 5) * 1.6).toFixed(1)}deg)">${face(c)}</button>`).join('')}</div></div>`;
  }).join('');
  $('#finStrip').innerHTML = stripHTML(finPinned && BY_ID[finPinned]);
  if ($('#finale').hidden) show('finale');
  if (finPinned) finFocus(finPinned);
}
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
async function start() {
  await cardsReady; newGame();
  $('#niches').innerHTML = ''; clearShower();
  show('play'); renderNiches(); renderSpread(true);
}
$('#startBtn').addEventListener('click', start);
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (!g) return;
  if (g.dataset.go === 'deck') cardsReady.then(() => { clearShower(); openFinale(G && G.locked.length === 4); });
  if (g.dataset.go === 'restart') start();
});
addEventListener('keydown', e => {
  if (!G || $('#play').hidden) return;
  if (e.key === 'Escape' && G.selected) {
    const c = G.selected, onSlot = document.activeElement && document.activeElement.closest('.slot');
    G.selected = null; renderNiches(); refreshLift();
    if (onSlot) cardBtn(c)?.focus();
    say(c.full + ' put back.');
  }
  // While a royal is picked up, Tab cycles between it and the slots of its rank.
  if (e.key === 'Tab' && G.selected) {
    const ring = [cardBtn(G.selected), ...$$('#niches .slot.glow')].filter(Boolean);
    const i = ring.indexOf(document.activeElement);
    if (i === -1 || ring.length < 2) return;
    e.preventDefault();
    ring[(i + (e.shiftKey ? -1 : 1) + ring.length) % ring.length].focus();
  }
});

window.__game = { get state() { return G; }, newGame, deal, tryPlace, get BY_ID() { return BY_ID; }, get CARDS() { return CARDS; }, ready: cardsReady };
})();
