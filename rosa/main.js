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
document.querySelectorAll('section, .slip, .sheet').forEach((sec) => {
  sec.querySelectorAll(':scope [data-reveal]').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`));
});
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

/* Lipstick shades: the swatches and the sections both set the tone */
const SHADES = { lila: 'Lila Paloma', rosa: 'Rosa té', nude: 'Nude novia', rojo: 'Rojo Santiago' };
const shadeName = document.getElementById('shade-name');
const swatches = document.querySelectorAll('[data-shade-pick]');
function setShade(key) {
  if (!SHADES[key]) return;
  shadeName.textContent = SHADES[key];
  swatches.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shadePick === key)));
  document.dispatchEvent(new CustomEvent('shade', { detail: key }));
}
swatches.forEach((b) => b.addEventListener('click', () => setShade(b.dataset.shadePick)));
const shadeIO = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) setShade(e.target.dataset.shade);
}, { rootMargin: '-45% 0px -45% 0px' });
document.querySelectorAll('[data-shade]').forEach((s) => shadeIO.observe(s));

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

/* Work index: hover, focus or scroll position picks the project in the frame */
const projects = [...document.querySelectorAll('[data-project]')];
const wide = matchMedia('(min-width: 901px)');
function activate(p) { projects.forEach((q) => q.classList.toggle('is-active', q === p)); }
projects.forEach((p) => {
  const name = p.querySelector('.project__name');
  name.addEventListener('mouseenter', () => wide.matches && activate(p));
  name.addEventListener('focus', () => activate(p));
});
const workIO = new IntersectionObserver((entries) => {
  if (!wide.matches) return;
  for (const e of entries) if (e.isIntersecting) activate(e.target.closest('[data-project]'));
}, { rootMargin: '-40% 0px -55% 0px' });
projects.forEach((p) => workIO.observe(p.querySelector('.project__name')));

/* Before / after: the range input drives the seam */
document.querySelectorAll('.ba').forEach((fig) => {
  const range = fig.querySelector('.ba__range');
  range.addEventListener('input', () => fig.style.setProperty('--pos', `${range.value}%`));
});

/* The preview frame tilts toward the pointer */
if (!reduced) {
  document.querySelectorAll('.project__frame').forEach((f) => {
    f.addEventListener('pointermove', (e) => {
      if (!wide.matches) return;
      const r = f.getBoundingClientRect();
      f.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 10}deg`);
      f.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -10}deg`);
    });
    f.addEventListener('pointerleave', () => { f.style.removeProperty('--ry'); f.style.removeProperty('--rx'); });
  });
}

/* Contact photograph: a slow zoom out tied to the scroll */
const contact = document.querySelector('.contact');
const photo = contact.querySelector('.contact__photo');
if (!reduced) {
  let ticking = false;
  const update = () => {
    ticking = false;
    const r = contact.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, 1 - r.top / innerHeight));
    photo.style.setProperty('--zoom', (1.12 - t * 0.12).toFixed(4));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
