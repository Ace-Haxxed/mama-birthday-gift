/* ═══════════════════════════════════════════════════════════════
   The Places That Made You — a cinematic 3D Earth (offline)

   Built from scratch with a locally-vendored Three.js (no CDN).
   All textures are stored in /assets/textures and load from disk,
   so the whole experience works with no internet connection.

   A realistic day/night Earth with city lights, drifting clouds,
   an atmospheric halo and a living starfield. On first view the
   camera drifts in space, the sun rises over India, then a golden
   light travels the globe from home to home, drawing glowing arcs
   and leaving a permanent marker at every place she has lived.
   ═══════════════════════════════════════════════════════════════ */

import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";

/* ─────────── Local texture assets ─────────────────────────────
   4K (4096×2048) day/night maps — NASA Blue Marble & Black Marble
   (public domain), vendored locally so the globe stays crisp when
   we zoom into a region and still works fully offline. 4096 is the
   largest size safely supported across GPUs (incl. mobile). */
const TEX = {
  day:      "assets/textures/earth_day_4096.jpg",    // 4096×2048
  night:    "assets/textures/earth_night_4096.jpg",  // 4096×2048
  clouds:   "assets/textures/earth_clouds_2048.jpg", // 2048×1024
  specular: "assets/textures/earth_specular_2048.jpg",
};

/* ─────────── The journey, in order ─────────── */
const STOPS = [
  { label: "Daggubadu",      region: "Andhra Pradesh, India",             lat: 15.8744037, lng: 80.2112291, desc: "Where your story began." },
  { label: "Grand Valley",   region: "Grand Valley State University, MI",  lat: 42.9639,    lng: -85.8892,   desc: "A new country, new dreams, and endless opportunities." },
  { label: "Eastern Illinois", region: "Eastern Illinois University, IL", lat: 39.4790,    lng: -88.1755,   desc: "Continuing your education and building the future." },
  { label: "Mesa",           region: "Mesa, Arizona",                      lat: 33.4152,    lng: -111.8315,  desc: "A new chapter beneath the Arizona sun." },
  { label: "Bellevue",       region: "Bellevue, Washington · Timberwood",  lat: 47.6101,    lng: -122.2015,  desc: "Creating a home and raising a family." },
  { label: "Redmond",        region: "Redmond, Washington · English Cove", lat: 47.6740,    lng: -122.1215,  desc: "More memories, laughter, and unforgettable moments." },
  { label: "Duvall",         region: "Duvall, Washington · Ridge at Big Rock", lat: 47.7423, lng: -121.9857, desc: "Surrounded by nature and peaceful beauty." },
  { label: "Woodinville",    region: "Woodinville, Washington",            lat: 47.7601,    lng: -122.1230,  desc: "Home. Where countless memories continue to be made." },
];

/* The last four stops cluster together in Washington — we descend into
   the state and tour them up close instead of pulling back to orbit. */
const isWA = (i) => /Washington/i.test(STOPS[i].region);
const STATE_ZOOM = 1.6; // camera distance for the close, state-level view

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const R = 1; // earth radius in world units
const DEG = Math.PI / 180;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* lat/lng → point on the standard equirectangular sphere (matches the texture) */
function llToVec3(lat, lng, radius = R) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return new THREE.Vector3(
    -radius * Math.cos(theta) * Math.sin(phi),
     radius * Math.cos(phi),
     radius * Math.sin(theta) * Math.sin(phi)
  );
}
/* inverse: world point → lat/lng (for clicking the globe) */
function vec3ToLL(p) {
  const r = p.length();
  const lat = 90 - Math.acos(p.y / r) / DEG;
  let lng = Math.atan2(p.z, -p.x) / DEG - 180;
  while (lng < -180) lng += 360;
  while (lng > 180) lng -= 360;
  return { lat, lng };
}
/* spherical interpolation between two unit direction vectors */
function slerpDir(a, b, t) {
  const dot = clamp(a.dot(b), -1, 1);
  const omega = Math.acos(dot);
  if (omega < 1e-4) return a.clone();
  const so = Math.sin(omega);
  return a.clone().multiplyScalar(Math.sin((1 - t) * omega) / so)
    .add(b.clone().multiplyScalar(Math.sin(t * omega) / so));
}

/* ─────────── Canvas-drawn sprite textures (no external files) ─────────── */
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, "rgba(255,246,224,1)");
  grad.addColorStop(0.25, "rgba(255,221,150,0.85)");
  grad.addColorStop(0.6, "rgba(210,160,80,0.25)");
  grad.addColorStop(1.0, "rgba(210,160,80,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function makeHeartTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.translate(128, 118);
  g.scale(7.4, 7.4);
  g.shadowColor = "rgba(255,210,130,0.9)";
  g.shadowBlur = 6;
  g.beginPath();
  g.moveTo(0, 4);
  g.bezierCurveTo(0, 1, -3, -3, -7, -3);
  g.bezierCurveTo(-12, -3, -12, 4, -12, 4);
  g.bezierCurveTo(-12, 8, -8, 12, 0, 17);
  g.bezierCurveTo(8, 12, 12, 8, 12, 4);
  g.bezierCurveTo(12, 4, 12, -3, 7, -3);
  g.bezierCurveTo(3, -3, 0, 1, 0, 4);
  const grad = g.createLinearGradient(-12, -3, 12, 17);
  grad.addColorStop(0, "#fff3d4");
  grad.addColorStop(1, "#e6b25a");
  g.fillStyle = grad;
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ═══════════════════════════════════════════════════════════════
   Main entry
   ═══════════════════════════════════════════════════════════════ */
export function initJourney() {
  const stage = document.getElementById("globeStage");
  const loader = document.getElementById("globeLoader");
  const card = document.getElementById("journeyCard");
  const idxEl = document.getElementById("journeyIndex");
  const placeEl = document.getElementById("journeyPlace");
  const captionEl = document.getElementById("journeyCaption");
  const finale = document.getElementById("journeyFinale");
  const replayBtn = document.getElementById("journeyReplay");
  const timelineEl = document.getElementById("journeyTimeline");

  /* ─── Renderer ─── */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, stage.clientWidth / stage.clientHeight, 0.01, 100);
  camera.position.set(0, 0.6, 3.6);

  /* ─── Controls (drag / zoom / spin) ─── */
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.7;
  controls.enablePan = false;
  controls.minDistance = 1.5;
  controls.maxDistance = 6;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.28;
  controls.enabled = false; // taken over by the cinematic until it ends

  /* ─── Lights ─── */
  const sunLight = new THREE.DirectionalLight(0xfff2dc, 2.4);
  const ambient = new THREE.AmbientLight(0x223047, 0.5);
  scene.add(sunLight, ambient);

  /* ─── Texture loading ─── */
  const mgr = new THREE.LoadingManager();
  const tl = new THREE.TextureLoader(mgr);
  const dayTex = tl.load(TEX.day);
  const nightTex = tl.load(TEX.night);
  const cloudTex = tl.load(TEX.clouds);
  const specTex = tl.load(TEX.specular);
  dayTex.colorSpace = THREE.SRGBColorSpace;
  nightTex.colorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  [dayTex, nightTex, specTex, cloudTex].forEach((t) => {
    t.anisotropy = maxAniso;
    t.minFilter = THREE.LinearMipmapLinearFilter;
  });

  /* ─── Earth (custom day/night shader) ─── */
  const sunDir = new THREE.Vector3(1, 0, 0); // world space; animated in the intro
  const earthMat = new THREE.ShaderMaterial({
    uniforms: {
      dayTexture:   { value: dayTex },
      nightTexture: { value: nightTex },
      specTexture:  { value: specTex },
      sunDirection: { value: sunDir },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vPosW = (modelMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D dayTexture;
      uniform sampler2D nightTexture;
      uniform sampler2D specTexture;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vPosW;
      void main() {
        vec3 N = normalize(vNormalW);
        vec3 L = normalize(sunDirection);
        float d = dot(N, L);
        vec3 dayCol = texture2D(dayTexture, vUv).rgb;
        vec3 nightCol = texture2D(nightTexture, vUv).rgb;
        float dayAmt = smoothstep(-0.10, 0.30, d);
        float nightMask = 1.0 - smoothstep(-0.22, 0.02, d);
        // Ocean specular glint on the day side
        float ocean = 1.0 - texture2D(specTexture, vUv).r;
        vec3 V = normalize(cameraPosition - vPosW);
        vec3 Hh = normalize(L + V);
        float spec = pow(max(dot(N, Hh), 0.0), 60.0) * ocean * dayAmt * 0.6;
        vec3 col = mix(nightCol * nightMask * 2.1, dayCol, dayAmt);
        col += vec3(1.0, 0.92, 0.75) * spec;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }
    `,
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 96), earthMat);
  scene.add(earth);

  /* ─── Clouds (independent slow rotation) ─── */
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.006, 72, 72),
    new THREE.MeshStandardMaterial({
      alphaMap: cloudTex, color: 0xffffff, transparent: true,
      opacity: 0.55, depthWrite: false, roughness: 1, metalness: 0,
    })
  );
  scene.add(clouds);

  /* ─── Atmosphere (fresnel halo) ─── */
  const atmoMat = new THREE.ShaderMaterial({
    uniforms: { sunDirection: { value: sunDir } },
    transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vNormalW; varying vec3 vPosW;
      void main() {
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vPosW = (modelMatrix * vec4(position,1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 sunDirection;
      varying vec3 vNormalW; varying vec3 vPosW;
      void main() {
        vec3 N = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vPosW);
        float fres = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 4.5);
        float lit = clamp(dot(N, normalize(sunDirection)) + 0.30, 0.0, 1.0);
        vec3 col = mix(vec3(0.16,0.30,0.58), vec3(0.40,0.62,1.0), lit);
        gl_FragColor = vec4(col * fres * 1.1, fres * 0.9);
      }
    `,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(R * 1.03, 64, 64), atmoMat);
  scene.add(atmosphere);

  /* ─── Starfield (twinkle + drift) ─── */
  const starGroup = new THREE.Group();
  scene.add(starGroup);
  const STAR_COUNT = 2600;
  const starGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(STAR_COUNT * 3);
  const sPhase = new Float32Array(STAR_COUNT);
  const sSize = new Float32Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 25);
    sPos.set([v.x, v.y, v.z], i * 3);
    sPhase[i] = Math.random() * Math.PI * 2;
    sSize[i] = (Math.random() * 1.6 + 0.5);
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  starGeo.setAttribute("aPhase", new THREE.BufferAttribute(sPhase, 1));
  starGeo.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1));
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uFlash: { value: 0 }, uPix: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aPhase; attribute float aSize;
      uniform float uTime; uniform float uFlash; uniform float uPix;
      varying float vTw;
      void main() {
        vTw = 0.55 + 0.45 * sin(uTime * 1.6 + aPhase);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (1.0 + uFlash) * uPix * (120.0 / -mv.z) * (0.6 + 0.4 * vTw);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vTw; uniform float uFlash;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d) * (vTw * (0.7 + uFlash * 0.6));
        gl_FragColor = vec4(vec3(1.0, 0.96, 0.86), a);
      }
    `,
  });
  starGroup.add(new THREE.Points(starGeo, starMat));

  /* ─── Shared resources ─── */
  const glowTex = makeGlowTexture();
  const arcGroup = new THREE.Group();
  const markerGroup = new THREE.Group();
  scene.add(arcGroup, markerGroup);

  const markerMeshes = []; // raycast targets for click-to-fly
  const effects = [];      // one-shot animated effects (bursts, glows)
  const persistent = [];   // forever animations (marker pulses, particles)

  /* Build one permanent, gently pulsing marker with tiny drifting particles */
  function addMarker(i) {
    const pos = llToVec3(STOPS[i].lat, STOPS[i].lng, R * 1.008);
    const g = new THREE.Group();
    g.position.copy(pos);

    const core = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffe6ad, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    }));
    core.scale.setScalar(0.09);
    core.userData.index = i;
    g.add(core);
    markerMeshes.push(core);

    // tiny orbiting particles
    const P = 14;
    const pg = new THREE.BufferGeometry();
    const arr = new Float32Array(P * 3);
    const seeds = [];
    for (let k = 0; k < P; k++) {
      seeds.push({ ax: Math.random() * Math.PI * 2, ay: Math.random() * Math.PI * 2, r: 0.03 + Math.random() * 0.03, sp: 0.5 + Math.random() });
      arr.set([0, 0, 0], k * 3);
    }
    pg.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pts = new THREE.Points(pg, new THREE.PointsMaterial({
      size: 0.02, map: glowTex, color: 0xffdca0, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    g.add(pts);
    markerGroup.add(g);

    persistent.push((t) => {
      // heartbeat: double thump
      const beat = t * 1.4 % 1;
      const thump = Math.exp(-14 * beat) + 0.6 * Math.exp(-14 * ((beat + 0.28) % 1));
      core.scale.setScalar(0.075 + 0.04 * thump);
      const a = pg.attributes.position.array;
      for (let k = 0; k < P; k++) {
        const s = seeds[k];
        const ang = s.ay + t * s.sp;
        a[k * 3] = Math.cos(ang) * s.r;
        a[k * 3 + 1] = Math.sin(ang) * s.r * 0.6;
        a[k * 3 + 2] = Math.sin(s.ax + t * s.sp) * s.r;
      }
      pg.attributes.position.needsUpdate = true;
    });
    return pos;
  }

  /* Draw a glowing golden arc between two stops (progressive reveal) */
  function makeArc(aIdx, bIdx) {
    const a = llToVec3(STOPS[aIdx].lat, STOPS[aIdx].lng).normalize();
    const b = llToVec3(STOPS[bIdx].lat, STOPS[bIdx].lng).normalize();
    const ang = Math.acos(clamp(a.dot(b), -1, 1));
    const lift = 0.12 + ang * 0.16;
    const pts = [];
    const N = 96;
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const dir = slerpDir(a, b, t);
      pts.push(dir.multiplyScalar(R * (1 + lift * Math.sin(Math.PI * t))));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 120, 0.006, 8, false);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffcf7a, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const tube = new THREE.Mesh(geo, mat);
    arcGroup.add(tube);
    return { tube, curve, total: geo.index.count };
  }

  /* One-shot warm glow ring + sparkle burst when a place is reached */
  function burstAt(pos) {
    // expanding warm glow
    const ring = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xffcf85, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, opacity: 0.9,
    }));
    ring.position.copy(pos);
    scene.add(ring);
    let e = 0;
    effects.push((dt) => {
      e += dt;
      const t = e / 1.4;
      ring.scale.setScalar(0.1 + t * 0.55);
      ring.material.opacity = Math.max(0, 0.9 * (1 - t));
      if (t >= 1) { scene.remove(ring); ring.material.dispose(); return false; }
      return true;
    });

    // sparkle burst
    const SP = 26;
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(SP * 3);
    const vel = [];
    for (let k = 0; k < SP; k++) {
      arr.set([pos.x, pos.y, pos.z], k * 3);
      vel.push(new THREE.Vector3().randomDirection().multiplyScalar(0.4 + Math.random() * 0.6));
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pm = new THREE.PointsMaterial({
      size: 0.03, map: glowTex, color: 0xffe6ad, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const sparks = new THREE.Points(g, pm);
    scene.add(sparks);
    let se = 0;
    effects.push((dt) => {
      se += dt;
      const a = g.attributes.position.array;
      for (let k = 0; k < SP; k++) {
        a[k * 3] += vel[k].x * dt; a[k * 3 + 1] += vel[k].y * dt; a[k * 3 + 2] += vel[k].z * dt;
        vel[k].multiplyScalar(0.94);
      }
      g.attributes.position.needsUpdate = true;
      pm.opacity = Math.max(0, 1 - se / 1.1);
      if (se >= 1.1) { scene.remove(sparks); pm.dispose(); g.dispose(); return false; }
      return true;
    });

    // nearby stars briefly brighten
    starMat.uniforms.uFlash.value = 1.0;
  }

  /* Shooting stars — occasional streaks across space */
  let nextShooter = 3 + Math.random() * 4;
  const shooters = [];
  function spawnShooter() {
    const start = new THREE.Vector3().randomDirection().multiplyScalar(40);
    const end = start.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(14));
    const geo = new THREE.BufferGeometry().setFromPoints([start, start.clone()]);
    const mat = new THREE.LineBasicMaterial({ color: 0xfff0cf, transparent: true, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geo, mat);
    starGroup.add(line);
    shooters.push({ line, geo, mat, start, end, e: 0, dur: 0.8 + Math.random() * 0.5 });
  }

  /* ─── HTML: info card + timeline ─── */
  function showCard(i) {
    const s = STOPS[i];
    idxEl.textContent = `Chapter ${String(i + 1).padStart(2, "0")} · ${s.region}`;
    placeEl.textContent = s.label;
    captionEl.textContent = s.desc;
    card.classList.add("is-visible");
  }
  function hideCard() { card.classList.remove("is-visible"); }

  const timelineStops = STOPS.map((s, i) => {
    const b = document.createElement("button");
    b.className = "timeline-stop";
    b.type = "button";
    b.setAttribute("role", "listitem");
    b.setAttribute("aria-label", `Fly to ${s.label}`);
    b.innerHTML = `<span class="timeline-stop__dot" aria-hidden="true"></span><span class="timeline-stop__label">${s.label}</span>`;
    b.addEventListener("click", () => flyTo(i, true));
    timelineEl.appendChild(b);
    return b;
  });
  function markTimeline(current) {
    timelineStops.forEach((b, i) => {
      b.classList.toggle("is-done", i <= current);
      b.classList.toggle("is-current", i === current);
    });
  }

  /* ─── Camera helpers ─── */
  function camDir() { return camera.position.clone().normalize(); }
  // Tween the camera to look at a direction on the globe from a given distance.
  function flyCameraTo(dir, dist, dur, arcLift = 0) {
    const from = camDir();
    const fromDist = camera.position.length();
    return tween(dur, (t) => {
      const e = easeInOut(t);
      const d = slerpDir(from, dir, e);
      const dd = fromDist + (dist - fromDist) * e + arcLift * Math.sin(Math.PI * e);
      camera.position.copy(d).multiplyScalar(dd);
      camera.lookAt(0, 0, 0);
    });
  }
  // generic promise tween that steps outside the render loop
  function tween(dur, onUpdate) {
    if (REDUCED) { onUpdate(1); return Promise.resolve(); }
    return new Promise((resolve) => {
      const t0 = performance.now();
      (function step(now) {
        const t = clamp((now - t0) / (dur * 1000), 0, 1);
        onUpdate(t);
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      })(performance.now());
    });
  }

  /* ─── The golden traveller + camera follow for one hop ─── */
  async function travel(fromIdx, toIdx, opts = {}) {
    const { endDist = 2.0, lift = 0.7, dur = 3.0 } = opts;
    const { tube, curve, total } = makeArc(fromIdx, toIdx);
    tube.geometry.setDrawRange(0, 0);

    const head = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTex, color: 0xfff1cf, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
    }));
    head.scale.setScalar(0.14);
    scene.add(head);

    const a = llToVec3(STOPS[fromIdx].lat, STOPS[fromIdx].lng).normalize();
    const b = llToVec3(STOPS[toIdx].lat, STOPS[toIdx].lng).normalize();
    const fromDist = camera.position.length();

    await tween(dur, (t) => {
      const e = easeInOut(t);
      const p = curve.getPoint(e);
      head.position.copy(p);
      head.scale.setScalar(0.14 + 0.03 * Math.sin(t * Math.PI));
      tube.geometry.setDrawRange(0, Math.floor(total * e));
      // camera trails just behind the light, easing toward the target altitude
      const camd = slerpDir(a, b, Math.max(0, e - 0.05));
      const dist = fromDist + (endDist - fromDist) * e + lift * Math.sin(Math.PI * e);
      camera.position.copy(camd).multiplyScalar(dist);
      camera.lookAt(0, 0, 0);
    });
    tube.geometry.setDrawRange(0, total);
    scene.remove(head); head.material.dispose();
  }

  /* ─── Arrive at a stop ─── */
  async function arrive(i) {
    const pos = addMarker(i);
    burstAt(pos);
    markTimeline(i);
    showCard(i);
    await sleep(REDUCED ? 0 : 2400);
  }

  /* ═══════════ The full cinematic ═══════════ */
  let playing = false;
  async function play() {
    if (playing) return;
    playing = true;
    controls.enabled = false;
    controls.autoRotate = false;
    replayBtn.hidden = true;
    finale.classList.remove("is-visible");
    hideCard();

    // reset world
    [...arcGroup.children].forEach((c) => { c.geometry.dispose?.(); arcGroup.remove(c); });
    [...markerGroup.children].forEach((c) => markerGroup.remove(c));
    markerMeshes.length = 0; persistent.length = 0;
    heartActive = false;

    const india = llToVec3(STOPS[0].lat, STOPS[0].lng).normalize();

    // Intro: peaceful far rotation in near-darkness, India facing us
    sunDir.copy(india).applyAxisAngle(new THREE.Vector3(0, 1, 0), 2.6).normalize(); // sun behind → night
    sunLight.position.copy(sunDir).multiplyScalar(10);
    camera.position.copy(india).multiplyScalar(3.6);
    camera.lookAt(0, 0, 0);
    await sleep(2000);

    // Sunrise over India
    const startSun = sunDir.clone();
    await tween(2.6, (t) => {
      const e = easeInOut(t);
      sunDir.copy(slerpDir(startSun, india, e)).normalize();
      sunLight.position.copy(sunDir).multiplyScalar(10);
    });
    await sleep(500);

    // Descend to India (stop 1)
    await flyCameraTo(india, 1.95, 2.4);
    await arrive(0);

    // Travel the rest of the journey
    for (let i = 1; i < STOPS.length; i++) {
      hideCard();
      const enteringWA = isWA(i) && !isWA(i - 1); // arriving at the first WA city
      const withinWA   = isWA(i) &&  isWA(i - 1); // hopping between WA cities
      if (enteringWA) {
        // Descend from cross-country altitude down into Washington state
        await travel(i - 1, i, { endDist: STATE_ZOOM, lift: 0.5, dur: 3.2 });
      } else if (withinWA) {
        // Short, low, close-up hops between neighbouring WA cities
        await travel(i - 1, i, { endDist: STATE_ZOOM, lift: 0.05, dur: 1.7 });
      } else {
        await travel(i - 1, i);
      }
      await arrive(i);
    }

    // Ending: pull back to the whole Earth
    hideCard();
    await flyCameraTo(camDir(), 3.3, 3.6, 0.3);
    await sleep(500);

    // Golden heart over Washington, then dissolve into particles
    await heartFinale();

    finale.classList.add("is-visible");

    // Hand control back to the user
    controls.enabled = true;
    controls.autoRotate = true;
    controls.target.set(0, 0, 0);
    controls.update();
    replayBtn.hidden = false;
    playing = false;
  }

  /* ─── The golden heart finale ─── */
  let heartActive = false;
  const heartTex = makeHeartTexture();
  async function heartFinale() {
    const waDir = llToVec3(47.6, -122.1).normalize();
    const heartPos = waDir.clone().multiplyScalar(R * 1.6);
    const heart = new THREE.Sprite(new THREE.SpriteMaterial({
      map: heartTex, color: 0xffdd9a, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, opacity: 0,
    }));
    heart.position.copy(heartPos);
    heart.scale.setScalar(0.01);
    scene.add(heart);

    // grow
    await tween(2.2, (t) => {
      const e = easeInOut(t);
      heart.scale.setScalar(0.02 + e * 0.5);
      heart.material.opacity = Math.min(1, e * 1.4);
    });
    await sleep(500);

    // dissolve into ~800 golden particles spreading across the Earth
    const N = 800;
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(N * 3);
    const starts = [], targets = [];
    for (let k = 0; k < N; k++) {
      const s = heartPos.clone().add(new THREE.Vector3().randomDirection().multiplyScalar(0.12));
      starts.push(s);
      targets.push(new THREE.Vector3().randomDirection().multiplyScalar(R * 1.08));
      arr.set([s.x, s.y, s.z], k * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    const pm = new THREE.PointsMaterial({
      size: 0.03, map: glowTex, color: 0xffe0a4, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const cloud = new THREE.Points(g, pm);
    scene.add(cloud);
    heart.material.opacity = 0;
    scene.remove(heart);

    await tween(3.0, (t) => {
      const e = easeInOut(t);
      const a = g.attributes.position.array;
      for (let k = 0; k < N; k++) {
        const p = slerpDir(starts[k].clone().normalize(), targets[k].clone().normalize(), e)
          .multiplyScalar(R * (1.6 - 0.5 * e));
        a[k * 3] = p.x; a[k * 3 + 1] = p.y; a[k * 3 + 2] = p.z;
      }
      g.attributes.position.needsUpdate = true;
      pm.opacity = 1 - Math.pow(e, 2);
    });
    scene.remove(cloud); pm.dispose(); g.dispose();
  }

  /* ─── Click / timeline fly-to (after the cinematic) ─── */
  async function flyTo(i, fromUI) {
    if (playing) return;
    const dir = llToVec3(STOPS[i].lat, STOPS[i].lng).normalize();
    controls.enabled = false;
    controls.autoRotate = false;
    await flyCameraTo(dir, isWA(i) ? STATE_ZOOM : 1.95, 1.4);
    markTimeline(i);
    showCard(i);
    controls.enabled = true;
    controls.autoRotate = true;
    controls.update();
  }

  // pointer click on a marker (distinguish from drag)
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downXY = null;
  renderer.domElement.addEventListener("pointerdown", (e) => { downXY = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!downXY) return;
    const moved = Math.hypot(e.clientX - downXY[0], e.clientY - downXY[1]);
    downXY = null;
    if (moved > 6 || playing) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    raycaster.params.Sprite = { threshold: 0.05 };
    const hits = raycaster.intersectObjects(markerMeshes, false);
    if (hits.length) flyTo(hits[0].object.userData.index, false);
  });

  /* ─── Reduced-motion: skip the cinematic, show the finished globe ─── */
  function showCompleted() {
    const usa = llToVec3(38, -97).normalize();
    sunDir.copy(usa).normalize();
    sunLight.position.copy(sunDir).multiplyScalar(10);
    for (let i = 0; i < STOPS.length; i++) {
      const pos = addMarker(i);
      if (i > 0) { const { tube, total } = makeArc(i - 1, i); tube.geometry.setDrawRange(0, total); }
    }
    markTimeline(STOPS.length - 1);
    camera.position.copy(usa).multiplyScalar(3.3);
    camera.lookAt(0, 0, 0);
    controls.enabled = true;
    controls.autoRotate = true;
    controls.update();
    finale.classList.add("is-visible");
    replayBtn.hidden = false;
  }

  /* ─── Resize ─── */
  const ro = new ResizeObserver(() => {
    const w = stage.clientWidth, h = stage.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  ro.observe(stage);

  /* ─── Render loop (pauses when off-screen) ─── */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.01 }).observe(stage);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) { clock.getDelta(); return; } // keep clock fresh, skip render
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    clouds.rotation.y += dt * 0.012;         // clouds drift independently
    starGroup.rotation.y += dt * 0.004;      // stars slowly drift
    starMat.uniforms.uTime.value = t;
    starMat.uniforms.uFlash.value *= (1 - dt * 2.2); // decay the arrival flash

    persistent.forEach((fn) => fn(t));
    for (let k = effects.length - 1; k >= 0; k--) if (!effects[k](dt)) effects.splice(k, 1);

    // shooting stars
    nextShooter -= dt;
    if (nextShooter <= 0) { spawnShooter(); nextShooter = 4 + Math.random() * 5; }
    for (let k = shooters.length - 1; k >= 0; k--) {
      const s = shooters[k]; s.e += dt;
      const p = s.e / s.dur;
      if (p >= 1) { starGroup.remove(s.line); s.geo.dispose(); s.mat.dispose(); shooters.splice(k, 1); continue; }
      const tip = s.start.clone().lerp(s.end, p);
      const tail = s.start.clone().lerp(s.end, Math.max(0, p - 0.14));
      s.geo.setFromPoints([tail, tip]);
      s.mat.opacity = Math.sin(p * Math.PI);
    }

    if (controls.enabled) controls.update();
    renderer.render(scene, camera);
  }
  frame();

  /* ─── Kick off once textures are ready ─── */
  let started = false;
  const begin = () => {
    if (started) return; started = true;
    loader.classList.add("is-done");
    stage.classList.add("is-ready");
    replayBtn.addEventListener("click", () => play());
    if (REDUCED) showCompleted();
    else play();
  };
  mgr.onLoad = begin;
  setTimeout(begin, 8000); // safety net if a texture stalls
}
