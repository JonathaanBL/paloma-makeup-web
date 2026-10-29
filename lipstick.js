import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.querySelector('.stage');
const canvas = stage.querySelector('.stage__canvas');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const SHADE_HEX = { lila: '#b993d6', rosa: '#d98c98', nude: '#c48f77', rojo: '#a3243b' };

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
} catch {
  // No WebGL: the photograph under the canvas stays as the stage
}

if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.4, 10);

  // Each page can recolour the case and the rim light through data attributes on the stage
  const { caseColor = '#4a2440', rimColor = '#c9a2e0' } = stage.dataset;

  const key = new THREE.DirectionalLight('#fff1ea', 2.2);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(rimColor, 2.5);
  rim.position.set(-4, 2, -3);
  scene.add(key, rim, new THREE.AmbientLight('#edccbe', 0.35));

  // Materials: lacquer case, warm gold metal, satin bullet
  const lacquer = new THREE.MeshPhysicalMaterial({ color: caseColor, metalness: 0.5, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const gold = new THREE.MeshStandardMaterial({ color: '#d9b48c', metalness: 1, roughness: 0.18 });
  const satin = new THREE.MeshPhysicalMaterial({ color: SHADE_HEX.lila, roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.3, sheen: 0.6, sheenColor: new THREE.Color('#ffffff') });

  const R = 0.62;
  const lipstick = new THREE.Group();

  const base = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1.9, 96), lacquer);
  base.position.y = -0.95;
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.015, R + 0.015, 0.14, 96), gold);
  ring.position.y = 0.0;

  // Inner tube and bullet twist up together
  const riser = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.1, 96, 1, true), gold);
  tube.position.y = -0.55;

  // Bullet: a cylinder whose top is sheared into the classic slanted tip
  const BR = 0.42, BH = 1.25;
  const bulletGeo = new THREE.CylinderGeometry(BR, BR, BH, 96, 12);
  const pos = bulletGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const t = (y + BH / 2) / BH;
    const top = BH / 2 - (x + BR) * 0.58;
    pos.setY(i, -BH / 2 + t * (top + BH / 2));
  }
  bulletGeo.computeVertexNormals();
  const bullet = new THREE.Mesh(bulletGeo, satin);
  bullet.position.y = BH / 2;
  riser.add(tube, bullet);

  lipstick.add(base, ring, riser);
  lipstick.rotation.z = -0.08;

  // The cap floats beside it, open
  const cap = new THREE.Group();
  const inside = new THREE.MeshStandardMaterial({ color: '#1c0d17', roughness: 0.7 });
  // Cylinder groups are side, top, bottom: the bottom is the open mouth of the cap
  const capBody = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.03, R + 0.03, 1.8, 96), [lacquer, lacquer, inside]);
  const capRing = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.045, R + 0.045, 0.1, 96), gold);
  capRing.position.y = -0.86;
  cap.add(capBody, capRing);

  const rig = new THREE.Group();
  rig.add(lipstick, cap);
  scene.add(rig);

  // Layout depends on the stage's shape: side by side when wide, smaller when narrow
  function layout() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Keep the pair in the top two thirds, clear of the shade picker
    const landscape = w / h > 1;
    camera.position.z = landscape ? 8.5 : 13;
    lipstick.position.set(landscape ? -1.1 : -0.35, landscape ? 0.85 : 0.95, 0);
    cap.position.set(landscape ? 1.3 : 0.95, landscape ? 0.6 : -0.35, -1.2);
    cap.rotation.set(0.35, 0, -0.75);
    rig.scale.setScalar(landscape ? 0.8 : 0.95);
  }
  new ResizeObserver(layout).observe(stage);
  layout();

  // Shade changes ease toward the new colour
  const target = new THREE.Color(SHADE_HEX.lila);
  document.addEventListener('shade', (e) => { if (SHADE_HEX[e.detail]) target.set(SHADE_HEX[e.detail]); });

  // Drag to turn, with inertia; the pointer also tilts the whole rig
  let spin = 0, vel = reduced ? 0 : 0.35, dragging = false, lastX = 0;
  let tiltX = 0, tiltY = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    tiltY = ((e.clientX - r.left) / r.width - 0.5) * 0.5;
    tiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.3;
    if (!dragging) return;
    const dx = e.clientX - lastX; lastX = e.clientX;
    spin += dx * 0.012; vel = dx * 0.6;
  });
  const release = () => { dragging = false; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { tiltX = tiltY = 0; });

  // Twist-up on arrival, then the scroll keeps turning it
  let rise = reduced ? 1 : 0;
  let scrollTurn = 0;
  addEventListener('scroll', () => { scrollTurn = scrollY * 0.0025; }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;
    const t = clock.elapsedTime;

    rise += (1 - rise) * dt * 1.6;
    riser.position.y = -0.85 + rise * 0.95;
    riser.rotation.y = (1 - rise) * 3;

    if (!dragging) { vel += ((reduced ? 0 : 0.35) - vel) * dt * 1.5; spin += vel * dt; }
    lipstick.rotation.y = spin + scrollTurn;
    cap.rotation.y = -spin * 0.6;
    if (!reduced) {
      cap.position.y += Math.sin(t * 1.1) * 0.0015;
      lipstick.position.y += Math.sin(t * 0.9 + 1) * 0.0008;
    }
    rig.rotation.x += (tiltX - rig.rotation.x) * dt * 3;
    rig.rotation.y += (tiltY - rig.rotation.y) * dt * 3;

    satin.color.lerp(target, Math.min(1, dt * 4));
    renderer.render(scene, camera);
  }
  frame();
  stage.classList.add('is-3d');
}
