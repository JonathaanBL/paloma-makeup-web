const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
const SHADES = { lila: 'Lila Paloma', rosa: 'Rosa té', nude: 'Nude novia', rojo: 'Rojo Santiago' };
const shadeName = document.getElementById('shade-name');
const swatches = document.querySelectorAll('[data-shade-pick]');
swatches.forEach((b) => b.addEventListener('click', () => {
  const key = b.dataset.shadePick;
  shadeName.textContent = SHADES[key];
  swatches.forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
  document.dispatchEvent(new CustomEvent('shade', { detail: key }));
}));

/* Work index: the cover follows the cursor and leans with its speed */
const work = document.querySelector('.work');
const cover = work.querySelector('.cover');
const coverImg = cover.querySelector('img');
const rows = [...work.querySelectorAll('.index a')];
let lastX = 0;
function place(x, y) {
  const r = work.getBoundingClientRect();
  const w = cover.offsetWidth, h = cover.offsetHeight;
  const cx = Math.min(Math.max(x - r.left + 32, 0), r.width - w);
  cover.style.setProperty('--x', `${cx}px`);
  cover.style.setProperty('--y', `${y - r.top - h / 2}px`);
  if (!reduced) cover.style.setProperty('--r', `${Math.max(-6, Math.min(6, (x - lastX) * 0.4))}deg`);
  lastX = x;
}
rows.forEach((a) => {
  const show = () => { coverImg.src = a.dataset.cover; cover.classList.add('is-on'); };
  a.addEventListener('pointerenter', (e) => { show(); place(e.clientX, e.clientY); });
  a.addEventListener('pointermove', (e) => place(e.clientX, e.clientY));
  a.addEventListener('pointerleave', () => cover.classList.remove('is-on'));
  a.addEventListener('focus', () => {
    const b = a.getBoundingClientRect();
    show(); place(b.right - cover.offsetWidth - 120, b.top + b.height / 2);
  });
  a.addEventListener('blur', () => cover.classList.remove('is-on'));
  // Rows with a before/after open that pair in the comparison
  a.addEventListener('click', () => { if (a.dataset.compare) choose(Number(a.dataset.compare)); });
});

/* Before / after with a chooser */
const PAIRS = [
  { before: 'img/natural-antes.webp', after: 'img/natural-despues.webp', b: 'Antes: rostro sin maquillaje', a: 'Después: piel pareja, ojos delineados y labios nude', caption: 'Maquillaje de día: piel pareja, ojos delineados y labios nude.' },
  { before: 'img/video-2021-06b.webp', after: 'img/video-2021-06a.webp', b: 'Antes: rostro sin maquillaje', a: 'Después: cejas definidas, piel pareja y labios nude', caption: 'Clase de automaquillaje: cejas, piel pareja y labios nude.' },
  { before: 'img/foto-2020-08c-antes.webp', after: 'img/foto-2020-08c-despues.webp', b: 'Antes: cabello negro largo con frizz', a: 'Después: cabello negro largo, liso y brillante', caption: 'Alisado en cabello negro largo: sin frizz y con brillo.' },
  { before: 'img/foto-2020-08b-antes.webp', after: 'img/foto-2020-08b-despues.webp', b: 'Antes: cabello castaño ondulado y esponjoso', a: 'Después: cabello castaño oscuro liso hasta media espalda', caption: 'De ondas esponjosas a liso, en cabello castaño.' },
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
  choices.forEach((c) => c.setAttribute('aria-pressed', String(Number(c.dataset.pair) === i)));
  caption.textContent = p.caption;
  ba.classList.add('is-swapping');
  setTimeout(() => {
    before.src = p.before; before.alt = p.b;
    after.src = p.after; after.alt = p.a;
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
