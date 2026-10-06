import { pillars } from "../data/pillars.js";
import { cssVar, prefersReducedMotion } from "../utils/dom.js";

/**
 * Hero WebGL scene: one white beam (the brief) enters a glass prism and
 * leaves as five colored rays, one per service pillar. Each ray carries an
 * HTML label button that jumps to that pillar in the services section.
 *
 * On wide screens the scene becomes a space you can move through: the
 * camera follows the pointer and dollies in on scroll, dust sits in depth
 * layers, and the rays themselves can be hovered and clicked.
 *
 * Uses the global THREE (r128 UMD build loaded in index.html).
 * Returns null if WebGL is unavailable so the page can show its SVG fallback.
 */

const RAY_ANGLES = [3, -6, -15, -24, -33].map((d) => (d * Math.PI) / 180);
const BEAM_ANGLE = (-6 * Math.PI) / 180;
const R = 1.9; // prism circumradius (local units)
const DEPTH = 1.5;
const CAM_Z = 16;
const HIT_PX = 22; // how close the pointer must be to a ray to grab it

const BEAM_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const BEAM_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uHead;
  uniform float uTail;
  uniform float uSoft;
  uniform float uTime;
  uniform float uLen;
  uniform float uFlow;
  varying vec2 vUv;
  void main() {
    float across = 1.0 - abs(vUv.y - 0.5) * 2.0;
    across = pow(clamp(across, 0.0, 1.0), uSoft);
    float along = smoothstep(0.0, uHead, vUv.x) * (1.0 - smoothstep(1.0 - uTail, 1.0, vUv.x));
    // Pulses of light travel along the beam, away from its source
    float pulse = smoothstep(0.55, 1.0, sin(vUv.x * uLen * 0.55 - uTime * 2.2));
    gl_FragColor = vec4(uColor, uOpacity * across * along * (1.0 + uFlow * pulse));
  }`;

const GLASS_VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vP = position;
    gl_Position = projectionMatrix * mv;
  }`;

const GLASS_FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRim;
  uniform vec3 uGlintColor;
  uniform float uOpacity;
  uniform float uGlint;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vP;
  void main() {
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    float fres = pow(1.0 - clamp(abs(dot(n, normalize(vV))), 0.0, 1.0), 1.7);
    float grad = smoothstep(-2.0, 2.0, vP.y);
    vec3 col = mix(uBase, uRim, clamp(fres * 0.9 + grad * 0.18, 0.0, 1.0));
    float glint = 1.0 - smoothstep(0.0, 0.32, abs(vP.x * 0.8 + vP.y * 0.6 - uGlint));
    col += uGlintColor * glint * 0.55;
    float a = uOpacity + fres * 0.55 + glint * 0.22;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }`;

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const clamp01 = (x) => Math.min(1, Math.max(0, x));

function glowTexture(THREE) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

export function initPrismScene({ canvas, labelLayer, onSelect }) {
  const THREE = window.THREE;
  if (!THREE || !canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const reduced = prefersReducedMotion();
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const dense = window.innerWidth >= 1024; // more dust, in depth layers
  const hero = canvas.closest(".hero");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const rig = new THREE.Group(); // positioned + scaled per layout
  scene.add(rig);
  const prism = new THREE.Group(); // the part that tilts with the pointer
  rig.add(prism);

  /* ---------- Prism ---------- */
  const triPts = [0, 1, 2].map((k) => {
    const a = Math.PI / 2 + (k * 2 * Math.PI) / 3;
    return new THREE.Vector2(Math.cos(a) * R, Math.sin(a) * R);
  });
  const shape = new THREE.Shape(triPts);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.12,
    bevelSegments: 4,
  });
  bodyGeo.translate(0, 0, -DEPTH / 2);

  const glassUniforms = {
    uBase: { value: new THREE.Color() },
    uRim: { value: new THREE.Color() },
    uGlintColor: { value: new THREE.Color(1, 1, 1) },
    uOpacity: { value: 0.16 },
    uGlint: { value: -6 },
  };
  const makeGlass = (side, opacityScale) =>
    new THREE.ShaderMaterial({
      uniforms: { ...glassUniforms, uOpacity: { value: 0.16 * opacityScale } },
      vertexShader: GLASS_VERT,
      fragmentShader: GLASS_FRAG,
      transparent: true,
      depthWrite: false,
      side,
    });
  const glassBack = makeGlass(THREE.BackSide, 0.6);
  const glassFront = makeGlass(THREE.FrontSide, 1);
  const backMesh = new THREE.Mesh(bodyGeo, glassBack);
  const frontMesh = new THREE.Mesh(bodyGeo, glassFront);
  backMesh.renderOrder = 1;
  frontMesh.renderOrder = 3;
  prism.add(backMesh, frontMesh);

  const edgeGeo = new THREE.EdgesGeometry(new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false }));
  edgeGeo.translate(0, 0, -DEPTH / 2);
  const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.6, depthWrite: false });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  edges.renderOrder = 4;
  prism.add(edges);

  /* Entry point on the left face, exit points spread along the right face */
  const along = (a, b, t) => new THREE.Vector3(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 0);
  const [apex, left, right] = triPts;
  const entry = along(apex, left, 0.5);
  const exits = RAY_ANGLES.map((_, i) => along(apex, right, 0.4 + i * 0.05));

  /* Dispersion fan inside the glass */
  const fanPos = [];
  const fanCol = [];
  exits.forEach((ex, i) => {
    const next = along(apex, right, 0.4 + i * 0.05 + 0.045);
    fanPos.push(entry.x, entry.y, 0, ex.x, ex.y, 0, next.x, next.y, 0);
    fanCol.push(1, 1, 1, 1, 1, 1, 1, 1, 1);
  });
  const fanGeo = new THREE.BufferGeometry();
  fanGeo.setAttribute("position", new THREE.Float32BufferAttribute(fanPos, 3));
  fanGeo.setAttribute("color", new THREE.Float32BufferAttribute(fanCol, 3));
  const fanMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const fan = new THREE.Mesh(fanGeo, fanMat);
  fan.renderOrder = 2;
  prism.add(fan);

  /* ---------- Beams ---------- */
  const unitPlane = new THREE.PlaneGeometry(1, 1);
  unitPlane.translate(0.5, 0, 0); // grows from its start point

  const time = { value: 0 }; // shared by every beam layer

  function makeBeamLayer({ width, opacity, head, tail, soft, flow }) {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(1, 1, 1) },
        uOpacity: { value: opacity },
        uHead: { value: head },
        uTail: { value: tail },
        uSoft: { value: soft },
        uTime: time,
        uLen: { value: 1 },
        uFlow: { value: flow },
      },
      vertexShader: BEAM_VERT,
      fragmentShader: BEAM_FRAG,
      transparent: true,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(unitPlane, mat);
    mesh.userData.width = width;
    mesh.userData.baseOpacity = opacity;
    mesh.renderOrder = 0;
    return mesh;
  }

  function makeBeam(opts) {
    const group = new THREE.Group();
    const glow = makeBeamLayer({ width: opts.glow, opacity: opts.glowOpacity, head: opts.head, tail: opts.tail, soft: 1.6, flow: 0.6 });
    const core = makeBeamLayer({ width: opts.core, opacity: opts.coreOpacity, head: opts.head, tail: opts.tail, soft: 0.6, flow: 0.25 });
    group.add(glow, core);
    group.userData = { layers: [glow, core], length: 1, heat: 1 };
    rig.add(group);
    return group;
  }

  const inBeam = makeBeam({ core: 0.07, glow: 0.55, coreOpacity: 0.95, glowOpacity: 0.28, head: 0.45, tail: 0.0 });
  const rays = pillars.map(() =>
    makeBeam({ core: 0.06, glow: 0.42, coreOpacity: 1, glowOpacity: 0.32, head: 0.02, tail: 0.55 })
  );

  const setBeamGeometry = (beam, start, angle, length) => {
    beam.position.set(start.x, start.y, 0.01);
    beam.rotation.z = angle;
    beam.userData.length = length;
  };
  // heat > 1 brightens and widens a beam (hovered), < 1 dims it
  const setBeamProgress = (beam, p) => {
    const len = Math.max(0.0001, beam.userData.length * p);
    const { heat, layers } = beam.userData;
    const [glow, core] = layers;
    const boost = 1 + (heat - 1) * hotGain;
    glow.scale.set(len, glow.userData.width * boost, 1);
    glow.material.uniforms.uOpacity.value = glow.userData.baseOpacity * boost;
    core.scale.set(len, core.userData.width, 1);
    core.material.uniforms.uOpacity.value = core.userData.baseOpacity * Math.min(1, 0.4 + 0.6 * heat);
    layers.forEach((l) => (l.material.uniforms.uLen.value = len));
    beam.visible = p > 0.001;
  };

  /* Glows where light enters and leaves the glass */
  const glowTex = glowTexture(THREE);
  const makeSprite = (scale) => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 })
    );
    s.scale.set(scale, scale, 1);
    s.renderOrder = 5;
    rig.add(s);
    return s;
  };
  const entryGlow = makeSprite(1.4);
  entryGlow.position.copy(entry);
  const exitGlow = makeSprite(1.8);
  exitGlow.position.copy(along(apex, right, 0.5));

  /* Dust motes catching the light. Wide screens get far, mid and near
     layers so the camera's movement reads as real depth. */
  const DUST_LAYERS = dense
    ? [
        { count: 320, size: 0.09, opacity: 0.5, x: 40, y: 22, z: [-16, -4] },
        { count: 170, size: 0.06, opacity: 0.6, x: 24, y: 13, z: [-4, 3] },
        { count: 26, size: 0.22, opacity: 0.2, x: 14, y: 8, z: [4, 9] },
      ]
    : [{ count: 140, size: 0.05, opacity: 0.55, x: 22, y: 12, z: [-3, 3] }];

  const dustLayers = DUST_LAYERS.map((d) => {
    const pos = new Float32Array(d.count * 3);
    for (let i = 0; i < d.count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * d.x;
      pos[i * 3 + 1] = (Math.random() - 0.5) * d.y;
      pos[i * 3 + 2] = d.z[0] + Math.random() * (d.z[1] - d.z[0]);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: d.size, map: glowTex, transparent: true, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    points.userData.baseOpacity = d.opacity;
    scene.add(points);
    return points;
  });

  /* ---------- Labels ---------- */
  const labels = pillars.map((p, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ray-label";
    btn.style.setProperty("--c", `var(${p.color})`);
    btn.innerHTML = '<span class="ray-label__dot" aria-hidden="true"></span>';
    btn.append(p.short);
    btn.setAttribute("aria-label", `See ${p.title} services`);
    btn.addEventListener("click", () => onSelect?.(i));
    btn.addEventListener("pointerenter", () => setLabelHover(i));
    btn.addEventListener("pointerleave", () => setLabelHover(-1));
    btn.addEventListener("focus", () => setLabelHover(i));
    btn.addEventListener("blur", () => setLabelHover(-1));
    labelLayer?.appendChild(btn);
    return btn;
  });

  /* ---------- Theme ---------- */
  let glowStrength = 1;
  let hotGain = 0.9; // how much hover widens a ray; normal blending on light needs less
  function applyTheme() {
    const dark = document.documentElement.dataset.theme !== "light";
    glowStrength = dark ? 1 : 0.35;
    hotGain = dark ? 0.9 : 0.4;
    const blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    const beamColor = new THREE.Color(cssVar("--beam") || "#ffffff");

    inBeam.userData.layers.forEach((l) => {
      l.material.uniforms.uColor.value.copy(beamColor);
      l.material.blending = blending;
      l.material.needsUpdate = true;
    });
    rays.forEach((ray, i) => {
      const c = new THREE.Color(cssVar(pillars[i].color));
      ray.userData.layers.forEach((l) => {
        l.material.uniforms.uColor.value.copy(c);
        l.material.blending = blending;
        l.material.needsUpdate = true;
      });
      // tint the fan triangle for this ray at its exit edge
      const col = fanGeo.attributes.color;
      col.setXYZ(i * 3, beamColor.r, beamColor.g, beamColor.b);
      col.setXYZ(i * 3 + 1, c.r, c.g, c.b);
      col.setXYZ(i * 3 + 2, c.r, c.g, c.b);
      col.needsUpdate = true;
    });

    fanMat.blending = blending;
    fanMat.needsUpdate = true;
    [entryGlow, exitGlow].forEach((s) => {
      s.material.blending = blending;
      s.material.color.set(dark ? "#ffffff" : cssVar("--accent"));
      s.material.needsUpdate = true;
    });

    const base = new THREE.Color(dark ? "#2a3080" : "#c9d2f5");
    const rim = new THREE.Color(dark ? "#cfd8ff" : "#4a58b8");
    [glassBack, glassFront].forEach((m) => {
      m.uniforms.uBase.value.copy(base);
      m.uniforms.uRim.value.copy(rim);
      m.uniforms.uGlintColor.value.set(dark ? "#ffffff" : "#ffffff");
    });
    edgeMat.color.set(dark ? "#e6ebff" : "#2a3170");
    edgeMat.opacity = dark ? 0.55 : 0.5;
    dustLayers.forEach((d) => {
      d.material.color.set(dark ? "#c7d2ff" : "#3d4690");
      d.material.opacity = d.userData.baseOpacity * (dark ? 1 : 0.64);
      d.material.blending = blending;
      d.material.needsUpdate = true;
    });
    requestRender();
  }

  /* ---------- Layout ---------- */
  const proj = new THREE.Vector3();
  const size = { w: 1, h: 1, top: 0 };
  const labelPts = exits.map(() => new THREE.Vector3());
  const rayEnds = exits.map(() => new THREE.Vector3());
  const raySegs = exits.map(() => [0, 0, 0, 0]); // screen-space, for hit testing
  let showLabels = false;
  let cinematic = false; // camera moves (wide screens only)

  function toScreen(local) {
    proj.copy(local);
    rig.localToWorld(proj);
    proj.project(camera);
    return [(proj.x * 0.5 + 0.5) * size.w, (-proj.y * 0.5 + 0.5) * size.h];
  }

  // Labels and hit areas follow the rays as the camera moves
  function placeLabels() {
    if (!showLabels) return;
    labels.forEach((label, i) => {
      const [x, y] = toScreen(labelPts[i]);
      label.style.setProperty("--x", `${x.toFixed(1)}px`);
      label.style.setProperty("--y", `${y.toFixed(1)}px`);
      const [x1, y1] = toScreen(exits[i]);
      const [x2, y2] = toScreen(rayEnds[i]);
      raySegs[i] = [x1, y1, x2, y2];
    });
  }

  function layout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    size.w = w;
    size.h = h;
    size.top = canvas.getBoundingClientRect().top + window.scrollY;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const vh = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const vw = vh * camera.aspect;
    const aspect = camera.aspect;

    // Screen-fraction placement of the prism, then convert to world units
    let fx = 0.5;
    let fy = 0.34;
    let radiusWorld = 0.17 * vh;
    if (aspect < 1.2) {
      fy = 0.27;
      radiusWorld = Math.min(0.15 * vw, 0.11 * vh);
    }
    if (aspect < 0.8) {
      // Portrait: phones keep the prism high; taller tablets center it in the open sky
      const tablet = aspect > 0.6;
      fx = 0.46;
      fy = tablet ? 0.32 : 0.27;
      radiusWorld = Math.min(0.22 * vw, (tablet ? 0.13 : 0.115) * vh);
    }
    const s = radiusWorld / R;
    rig.scale.setScalar(s);
    rig.position.set((fx - 0.5) * vw, (0.5 - fy) * vh, 0);
    rig.updateMatrixWorld();

    // Incoming beam: from beyond the left edge to the entry point
    const entryWorldX = rig.position.x + entry.x * s;
    const inLenWorld = (entryWorldX + vw / 2 + 1) / Math.cos(BEAM_ANGLE);
    const inLen = inLenWorld / s;
    const inStart = new THREE.Vector3(
      entry.x - Math.cos(BEAM_ANGLE) * inLen,
      entry.y - Math.sin(BEAM_ANGLE) * inLen,
      0
    );
    setBeamGeometry(inBeam, inStart, BEAM_ANGLE, inLen);

    // Rays: to beyond the right edge
    rays.forEach((ray, i) => {
      const ex = exits[i];
      const exWorldX = rig.position.x + ex.x * s;
      const lenWorld = (vw / 2 - exWorldX + 1.2) / Math.cos(RAY_ANGLES[i]);
      setBeamGeometry(ray, ex, RAY_ANGLES[i], lenWorld / s);

      // Label sits ~40% of the way to the right edge; hit area runs most of the ray
      const dir = new THREE.Vector3(Math.cos(RAY_ANGLES[i]), Math.sin(RAY_ANGLES[i]), 0);
      const d = ((vw / 2 - exWorldX) * 0.4) / s / dir.x;
      labelPts[i].copy(ex).addScaledVector(dir, d);
      rayEnds[i].copy(ex).addScaledVector(dir, (lenWorld / s) * 0.85);
    });

    showLabels = w > 900;
    cinematic = showLabels && !reduced;
    labels.forEach((label) => (label.tabIndex = showLabels ? 0 : -1));
    if (!cinematic) {
      camera.position.set(0, 0, CAM_Z);
      camera.lookAt(0, 0, 0);
    }
    camera.updateMatrixWorld();
    placeLabels();

    requestRender();
  }

  /* ---------- Ray hover (wide screens) ---------- */
  let rayHover = -1;
  let labelHover = -1;
  let hovered = -1;

  function syncHover() {
    const next = labelHover >= 0 ? labelHover : rayHover;
    hero?.classList.toggle("is-ray-hover", labelHover < 0 && rayHover >= 0);
    if (next === hovered) return;
    hovered = next;
    labels.forEach((l, k) => l.classList.toggle("is-hot", k === hovered));
    requestRender();
  }
  function setLabelHover(i) {
    labelHover = i;
    syncHover();
  }
  function rayAt(px, py) {
    let best = -1;
    let bestD = HIT_PX;
    raySegs.forEach(([x1, y1, x2, y2], i) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1);
      if (t < 0.08 || t > 1) return; // skip where the rays bunch up at the glass
      const dist = Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
      if (dist < bestD) {
        bestD = dist;
        best = i;
      }
    });
    return best;
  }

  /* ---------- Animation ---------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollFrac = 0;
  let start = performance.now();
  let running = false;
  let visible = true;
  let rafId = 0;
  const INTRO_END = 3.2;

  function update(t) {
    // Intro sequence: beam travels in, glass catches it, rays fan out
    const pIn = reduced ? 1 : easeOutCubic(clamp01((t - 0.35) / 0.9));
    setBeamProgress(inBeam, pIn);

    const hit = reduced ? 1 : clamp01((t - 1.05) / 0.5);
    entryGlow.material.opacity = glowStrength * 0.9 * hit;
    exitGlow.material.opacity = glowStrength * 0.7 * hit;
    fanMat.opacity = 0.32 * hit;
    const glintT = reduced ? 1 : clamp01((t - 1.0) / 1.1);
    glassFront.uniforms.uGlint.value = glassBack.uniforms.uGlint.value = -4 + glintT * 9;

    time.value = t;
    rays.forEach((ray, i) => {
      const p = reduced ? 1 : easeOutCubic(clamp01((t - 1.3 - i * 0.09) / 1.1));
      const target = hovered < 0 ? 1 : i === hovered ? 1.8 : 0.45;
      ray.userData.heat += (target - ray.userData.heat) * (running ? 0.12 : 1);
      setBeamProgress(ray, p);
      labels[i].classList.toggle("is-lit", showLabels && p > 0.55);
    });

    // Idle motion + pointer tilt
    if (!reduced) {
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      prism.rotation.y = pointer.x * 0.35 + Math.sin(t * 0.5) * 0.06 + scrollFrac * 1.1;
      prism.rotation.x = -pointer.y * 0.2 + Math.cos(t * 0.4) * 0.04;
      dustLayers.forEach((d, k) => {
        d.rotation.y = t * 0.012 * (1 + k * 0.6);
        d.position.y = Math.sin(t * 0.2 + k) * 0.15;
      });
    }

    // Wide screens: the camera eases in on load, drifts with the pointer
    // and pushes toward the prism as the page scrolls away
    if (cinematic) {
      const intro = 1 - easeOutCubic(clamp01(t / 3.2));
      camera.position.set(pointer.x * 0.8, -pointer.y * 0.45 + intro * 0.8, CAM_Z + intro * 5 - scrollFrac * 3.5);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld();
      placeLabels();
    }
  }

  function frame(now) {
    const t = (now - start) / 1000;
    update(t);
    renderer.render(scene, camera);
    if (running) rafId = requestAnimationFrame(frame);
  }

  function play() {
    if (running || reduced || !visible || document.hidden) return;
    running = true;
    rafId = requestAnimationFrame(frame);
  }
  function pause() {
    running = false;
    cancelAnimationFrame(rafId);
  }
  function requestRender() {
    if (running) return;
    update(reduced ? INTRO_END : (performance.now() - start) / 1000);
    renderer.render(scene, camera);
  }

  /* ---------- Events ---------- */
  const ro = new ResizeObserver(layout);
  ro.observe(canvas);

  if (!reduced) {
    window.addEventListener(
      "pointermove",
      (e) => {
        pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true }
    );
    window.addEventListener(
      "scroll",
      () => {
        scrollFrac = clamp01(window.scrollY / (canvas.clientHeight || 1));
        hero?.style.setProperty("--hero-p", scrollFrac.toFixed(3));
      },
      { passive: true }
    );
  }

  // Rays can be hovered and clicked directly when there's a mouse
  if (finePointer && hero) {
    window.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch") return;
        const inHero = showLabels && visible && e.target instanceof Element && hero.contains(e.target);
        rayHover = inHero ? rayAt(e.clientX, e.clientY + window.scrollY - size.top) : -1;
        syncHover();
      },
      { passive: true }
    );
    hero.addEventListener("click", (e) => {
      if (rayHover < 0 || e.target.closest("a, button")) return;
      onSelect?.(rayHover);
    });
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      rayHover = -1;
      syncHover();
    }
    visible ? play() : pause();
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? pause() : play()));
  window.addEventListener("themechange", applyTheme);

  applyTheme();
  layout();
  start = performance.now();
  play();
  if (reduced) requestRender();

  return { layout, applyTheme };
}
