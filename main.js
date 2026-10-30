const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Folder of this script, so image paths also work from the /en/ page
const ROOT = document.currentScript.src.replace(/main\.js.*$/, '');
const EN = document.documentElement.lang === 'en';

/* Entrances: each section's parts rise in turn, once */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    // A fast jump can skip past an element without it ever intersecting
    if (!e.isIntersecting && e.boundingClientRect.top > 0) continue;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('section').forEach((sec) => {
  sec.querySelectorAll('[data-reveal]').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`));
});
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
window.revealReady = true;

/* Lipstick shades */
const SHADES = EN
  ? { lila: 'Paloma Lilac', rosa: 'Tea Rose', nude: 'Bridal Nude', rojo: 'Santiago Red' }
  : { lila: 'Lila Paloma', rosa: 'Rosa té', nude: 'Nude novia', rojo: 'Rojo Santiago' };
const shadeName = document.getElementById('shade-name');
const swatches = document.querySelectorAll('[data-shade-pick]');
swatches.forEach((b) => b.addEventListener('click', () => {
  const key = b.dataset.shadePick;
  shadeName.textContent = SHADES[key];
  swatches.forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
  document.dispatchEvent(new CustomEvent('shade', { detail: key }));
}));

/* The 3D lipstick (three.js) loads after the page: shortly after load on desktop,
   at the first touch or scroll on phones, so it never blocks the first paint */
let started3D = false;
const start3D = () => { if (!started3D) { started3D = true; import('./lipstick.js'); } };
if (matchMedia('(max-width: 900px), (pointer: coarse)').matches) {
  ['pointerdown', 'scroll', 'keydown'].forEach((t) => addEventListener(t, start3D, { once: true, passive: true }));
} else {
  addEventListener('load', () => setTimeout(start3D, 1200));
}

/* Portfolio reel: on wide screens the vertical scroll drives the horizontal track */
const reel = document.querySelector('.reel');
const reelStage = reel.querySelector('.reel__stage');
const track = reel.querySelector('.reel__track');
const pinned = matchMedia('(min-width: 901px)');
let travel = 0;
function moveReel() {
  if (!travel) { track.style.transform = ''; return; }
  const r = reelStage.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px, 0, 0)`;
}
function measureReel() {
  travel = pinned.matches && !reduced ? Math.max(0, track.scrollWidth - track.clientWidth) : 0;
  // Cards slide in by transform, which lazy loading notices too late: fetch them up front
  if (travel) track.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
  reel.style.setProperty('--travel', `${travel}px`);
  moveReel();
}
new ResizeObserver(measureReel).observe(track);
let reelTick = false;
addEventListener('scroll', () => { if (!reelTick) { reelTick = true; requestAnimationFrame(() => { reelTick = false; moveReel(); }); } }, { passive: true });
// Keyboard users: scroll the page so a focused card's link is on screen
track.addEventListener('focusin', (e) => {
  if (!travel) return;
  const card = e.target.closest('.card');
  const p = Math.min(1, card.offsetLeft / travel);
  scrollTo({ top: reelStage.getBoundingClientRect().top + scrollY + p * (reelStage.offsetHeight - innerHeight), behavior: 'instant' });
});

const filters = [...reel.querySelectorAll('[data-filter]')];
filters.forEach((f) => f.addEventListener('click', () => {
  filters.forEach((g) => g.setAttribute('aria-pressed', String(g === f)));
  track.querySelectorAll('.card').forEach((c) => { c.hidden = f.dataset.filter !== 'todo' && c.dataset.cat !== f.dataset.filter; });
  measureReel();
}));
// Cards with a before/after open that pair in the comparison
reel.querySelectorAll('[data-compare]').forEach((a) => a.addEventListener('click', () => choose(Number(a.dataset.compare))));

/* Before / after with a chooser */
const PAIRS = [
  { before: 'natural-antes-800', after: 'natural-despues-800',
    es: ['Antes: rostro sin maquillaje', 'Después: piel pareja, ojos delineados y labios nude', 'Maquillaje de día: piel pareja, ojos delineados y labios nude.'],
    en: ['Before: bare face', 'After: even skin, lined eyes and nude lips', 'Day makeup: even skin, lined eyes and nude lips.'] },
  { before: 'video-2021-06b', after: 'video-2021-06a',
    es: ['Antes: rostro sin maquillaje', 'Después: cejas definidas, piel pareja y labios nude', 'Clase de automaquillaje: cejas, piel pareja y labios nude.'],
    en: ['Before: bare face', 'After: defined brows, even skin and nude lips', 'Self-makeup class: brows, even skin and nude lips.'] },
  { before: 'foto-2020-08c-antes', after: 'foto-2020-08c-despues',
    es: ['Antes: cabello negro largo con frizz', 'Después: cabello negro largo, liso y brillante', 'Alisado en cabello negro largo: sin frizz y con brillo.'],
    en: ['Before: long black hair with frizz', 'After: long black hair, sleek and shiny', 'Straightening on long black hair: no frizz, all shine.'] },
  { before: 'foto-2020-08b-antes', after: 'foto-2020-08b-despues',
    es: ['Antes: cabello castaño ondulado y esponjoso', 'Después: cabello castaño oscuro liso hasta media espalda', 'De ondas esponjosas a liso, en cabello castaño.'],
    en: ['Before: frizzy wavy brown hair', 'After: sleek dark brown hair to mid-back', 'From frizzy waves to sleek, on brown hair.'] },
];
const ba = document.querySelector('.ba');
const range = ba.querySelector('.ba__range');
const before = ba.querySelector('.ba__before');
const after = ba.querySelector('.ba__after');
const caption = document.querySelector('.compare__caption');
const choices = [...document.querySelectorAll('[data-pair]')];
range.addEventListener('input', () => ba.style.setProperty('--pos', `${range.value}%`));
function choose(i) {
  const p = PAIRS[i];
  const [bAlt, aAlt, text] = EN ? p.en : p.es;
  choices.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.pair) === i)));
  caption.textContent = text;
  ba.classList.add('is-swapping');
  setTimeout(() => {
    before.src = `${ROOT}img/${p.before}.webp`; before.alt = bAlt;
    after.src = `${ROOT}img/${p.after}.webp`; after.alt = aAlt;
    range.value = 50; ba.style.setProperty('--pos', '50%');
    ba.classList.remove('is-swapping');
  }, reduced ? 0 : 250);
}
choices.forEach((c) => c.addEventListener('click', () => choose(Number(c.dataset.pair))));

/* Novias tabs, with arrow keys */
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    selectTab(next); next.focus();
  });
});

/* Booking photograph: a slow zoom out tied to the scroll */
const book = document.querySelector('.book');
const photo = book.querySelector('.book__photo');
if (!reduced) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const t = Math.min(1, Math.max(0, 1 - book.getBoundingClientRect().top / innerHeight));
    photo.style.setProperty('--zoom', (1.12 - t * 0.12).toFixed(4));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
