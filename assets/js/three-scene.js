import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const host = document.querySelector(".hero, .page-hero");
if (!host || reduceMotion || !("WebGLRenderingContext" in window)) {
  // CSS glass treatment remains available when WebGL or motion is unavailable.
} else {
  const canvas = document.createElement("canvas");
  canvas.className = "three-scene";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, host.clientWidth / Math.max(host.clientHeight, 1), .1, 100);
  camera.position.set(0, 0, 9);

  scene.add(new THREE.AmbientLight(0xffffff, 1.5));
  const key = new THREE.DirectionalLight(0xf3dcae, 2.0);
  key.position.set(4, 5, 7);
  scene.add(key);
  const fill = new THREE.PointLight(0xa9c4b2, 22, 18);
  fill.position.set(-4, -2, 4);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);
  const material = new THREE.MeshPhysicalMaterial({
    color: 0x9fb3a5, metalness: .42, roughness: .18,
    transmission: .18, thickness: .8, transparent: true, opacity: .78,
    clearcoat: 1, clearcoatRoughness: .12
  });
  const orange = new THREE.MeshPhysicalMaterial({
    color: 0xC5A059, metalness: .62, roughness: .22,
    clearcoat: 1, transparent: true, opacity: .9
  });

  const shapes = [
    new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), material),
    new THREE.Mesh(new THREE.TorusKnotGeometry(.62, .19, 110, 14), orange),
    new THREE.Mesh(new THREE.OctahedronGeometry(.52, 0), material)
  ];
  shapes[0].position.set(2.8, .25, -1.4);
  shapes[1].position.set(4.15, -1.15, -2.2);
  shapes[2].position.set(1.25, -1.55, -.5);
  shapes.forEach((mesh, index) => { mesh.rotation.set(index * .7, index * .5, .2); group.add(mesh); });

  const wire = new THREE.Mesh(
    new THREE.TorusGeometry(2.25, .012, 8, 120),
    new THREE.MeshBasicMaterial({ color: 0xC5A059, transparent: true, opacity: .58 })
  );
  wire.position.set(3.0, -.1, -2);
  wire.rotation.set(.8, .25, .2);
  group.add(wire);

  const resize = () => {
    const width = host.clientWidth, height = host.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  let frame = 0;
  let active = !document.hidden;
  const visibility = () => { active = !document.hidden; };
  document.addEventListener("visibilitychange", visibility);

  const render = () => {
    if (!active) { frame = requestAnimationFrame(render); return; }
    const t = performance.now() * .00022;
    group.rotation.y = Math.sin(t) * .13;
    group.rotation.x = Math.cos(t * .8) * .06;
    shapes[0].rotation.x += .0018; shapes[0].rotation.y += .0024;
    shapes[1].rotation.x -= .0014; shapes[1].rotation.z += .002;
    shapes[2].rotation.y += .003;
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };
  render();

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    renderer.dispose();
    material.dispose(); orange.dispose();
    shapes.forEach(mesh => mesh.geometry.dispose());
    wire.geometry.dispose();
  }, { once: true });
}
