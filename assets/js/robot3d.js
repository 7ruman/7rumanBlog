// 首页：整屏「线条 3D」机器人（Three.js 线框全息风，纯几何体程序化生成）
// CDN 三级回退；加载/WebGL 失败则回退到内置 SVG 机器人
(function () {
  const canvas = document.getElementById("robot3d");
  const fallback = document.getElementById("robotFallback");
  if (!canvas) return;

  const CDNS = [
    "https://cdn.jsdelivr.net/npm/three@0.140.0/build/three.min.js",
    "https://cdn.staticfile.net/three.js/0.140.0/three.min.js",
    "https://unpkg.com/three@0.140.0/build/three.min.js"
  ];
  function loadScript(urls) {
    return new Promise((resolve) => {
      let i = 0;
      (function next() {
        if (i >= urls.length) return resolve(false);
        const s = document.createElement("script");
        s.src = urls[i++];
        s.onload = () => resolve(true);
        s.onerror = () => { s.remove(); next(); };
        document.head.appendChild(s);
      })();
    });
  }
  function showFallback() {
    canvas.style.display = "none";
    if (fallback) fallback.hidden = false;
  }

  loadScript(CDNS)
    .then((ok) => {
      if (!ok || !window.THREE) return showFallback();
      try { start(window.THREE); } catch (e) { showFallback(); }
    })
    .catch(showFallback);

  function pal() {
    const light = document.documentElement.getAttribute("data-theme") === "light";
    return light
      ? { accent: 0x2f63d8, accent2: 0x6b3ff0, accent3: 0x0b7f96, grid: 0xb9c4da }
      : { accent: 0x7aa2f7, accent2: 0xbb9af7, accent3: 0x7dcfff, grid: 0x2b3652 };
  }

  function start(THREE) {
    let light = document.documentElement.getAttribute("data-theme") === "light";
    let P = pal();

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return showFallback(); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 0, 6.2);

    /* ---------- 用线条构建零件（主线 + 微弱光晕） ---------- */
    const mats = []; // { mat, role } 供主题联动
    const colOf = (role) => (role === "eye" ? P.accent3 : role === "accent2" ? P.accent2 : P.accent);

    function addPart(parent, geo, role, haloScale) {
      const wg = new THREE.WireframeGeometry(geo);
      const mainOp = role === "eye" ? 1 : 0.9;
      const haloOp = role === "eye" ? 0.3 : 0.15;
      const mMain = new THREE.LineBasicMaterial({ color: colOf(role), transparent: true, opacity: mainOp, depthWrite: false });
      const mHalo = new THREE.LineBasicMaterial({ color: colOf(role), transparent: true, opacity: haloOp, depthWrite: false });
      mats.push({ mat: mMain, role, base: mainOp }, { mat: mHalo, role, base: haloOp });
      const main = new THREE.LineSegments(wg, mMain);
      const halo = new THREE.LineSegments(wg, mHalo);
      halo.scale.setScalar(haloScale || 1.035);
      parent.add(main, halo);
    }

    /* ---------- 地面网格 + 辉光盘 ---------- */
    const grid = new THREE.GridHelper(80, 80, P.grid, P.grid);
    grid.position.y = -3.2;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    grid.material.depthWrite = false;
    scene.add(grid);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 56),
      new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0.06, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -3.18;
    scene.add(disc);

    /* ---------- 机器人（低模几何 → 线框） ---------- */
    const robot = new THREE.Group();
    robot.scale.setScalar(1.12);
    scene.add(robot);
    const head = new THREE.Group();
    robot.add(head);

    // 头 / 面罩
    addPart(head, new THREE.SphereGeometry(1, 20, 14), "body", 1.03);
    const visorGeo = new THREE.SphereGeometry(0.78, 16, 12);
    const visor = new THREE.Group();
    visor.scale.set(1.12, 0.66, 0.44);
    visor.position.set(0, 0.02, 0.52);
    addPart(visor, visorGeo, "eye", 1.05);
    head.add(visor);

    // 眼睛 + 瞳孔
    const eyes = new THREE.Group();
    const eyeGeo = new THREE.SphereGeometry(0.15, 12, 9);
    const eyeL = new THREE.Group(); eyeL.position.set(-0.3, 0.06, 0.85); addPart(eyeL, eyeGeo, "eye", 1.12); eyes.add(eyeL);
    const eyeR = new THREE.Group(); eyeR.position.set(0.3, 0.06, 0.85); addPart(eyeR, eyeGeo, "eye", 1.12); eyes.add(eyeR);
    head.add(eyes);
    const pupGeo = new THREE.SphereGeometry(0.062, 9, 7);
    const pupL = new THREE.Group(); pupL.position.set(-0.3, 0.06, 0.985); addPart(pupL, pupGeo, "body", 1.1); head.add(pupL);
    const pupR = new THREE.Group(); pupR.position.set(0.3, 0.06, 0.985); addPart(pupR, pupGeo, "body", 1.1); head.add(pupR);

    // 天线
    const ant = new THREE.Group(); ant.position.set(0, 1.02, 0);
    addPart(ant, new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8, 1), "body", 1.08);
    head.add(ant);
    const antBall = new THREE.Group(); antBall.position.set(0, 1.27, 0);
    addPart(antBall, new THREE.SphereGeometry(0.1, 12, 9), "accent2", 1.15);
    head.add(antBall);

    // 耳
    for (const sx of [-1, 1]) {
      const ear = new THREE.Group(); ear.position.set(sx * 1.0, 0, 0);
      addPart(ear, new THREE.CylinderGeometry(0.17, 0.17, 0.14, 14), "body", 1.06);
      head.add(ear);
      const dot = new THREE.Group(); dot.position.set(sx * 1.1, 0, 0);
      addPart(dot, new THREE.SphereGeometry(0.05, 9, 7), "eye", 1.2);
      head.add(dot);
    }

    // 颈 / 躯干 / 胸口核心
    const neck = new THREE.Group(); neck.position.y = -1.02;
    addPart(neck, new THREE.CylinderGeometry(0.26, 0.32, 0.36, 14), "body", 1.06);
    robot.add(neck);

    const torso = new THREE.Group(); torso.position.y = -1.88;
    addPart(torso, new THREE.CylinderGeometry(0.85, 1.05, 1.35, 18, 2), "body", 1.03);
    robot.add(torso);

    const ringG = new THREE.Group(); ringG.position.set(0, -1.82, 0.98);
    addPart(ringG, new THREE.TorusGeometry(0.34, 0.05, 8, 30), "eye", 1.1);
    robot.add(ringG);
    const core = new THREE.Group(); core.position.set(0, -1.82, 1.0);
    addPart(core, new THREE.SphereGeometry(0.14, 12, 10), "accent2", 1.15);
    robot.add(core);

    // 手臂
    for (const sx of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(sx * 1.12, -1.95, 0); arm.rotation.z = -sx * 0.22;
      addPart(arm, new THREE.CylinderGeometry(0.13, 0.13, 1.1, 10), "body", 1.06);
      robot.add(arm);
      const hand = new THREE.Group(); hand.position.set(sx * 1.25, -2.5, 0);
      addPart(hand, new THREE.SphereGeometry(0.17, 12, 9), "accent2", 1.1);
      robot.add(hand);
    }

    /* ---------- 交互 ---------- */
    let px = 0, py = 0, tpx = 0, tpy = 0;
    function onPointer(e) {
      const t = e.touches && e.touches.length ? e.touches[0] : e;
      if (!t || t.clientX == null) return;
      tpx = (t.clientX / window.innerWidth) * 2 - 1;
      tpy = (t.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener("mousemove", onPointer, { passive: true });
    window.addEventListener("touchmove", onPointer, { passive: true });

    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w < 640 ? 8.8 : (w < 1024 ? 7.2 : 6.2);
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);
    resize();

    const clock = new THREE.Clock();
    function tick() {
      requestAnimationFrame(tick);
      const t = clock.getElapsedTime();
      px += (tpx - px) * 0.06;
      py += (tpy - py) * 0.06;

      if (!reduce) {
        robot.position.y = Math.sin(t * 1.1) * 0.1;
        robot.rotation.y = px * 0.42;
        head.rotation.y = px * 0.34;
        head.rotation.x = py * 0.2;
        head.position.y = Math.sin(t * 1.1 + 0.6) * 0.03;
        torso.rotation.z = Math.sin(t * 0.7) * 0.02;
        const s = 1 + Math.sin(t * 3.2) * 0.1;
        antBall.scale.set(s, s, s);
        ringG.rotation.z = t * 0.5;
      }
      pupL.position.x = -0.3 + px * 0.055;
      pupR.position.x = 0.3 + px * 0.055;
      pupL.position.y = pupR.position.y = 0.06 - py * 0.045;

      camera.position.x = px * 0.32;
      camera.lookAt(0, -0.8, 0);

      renderer.render(scene, camera);
    }
    tick();

    /* ---------- 主题联动（深色用叠加发光，浅色用实线） ---------- */
    function applyTheme() {
      light = document.documentElement.getAttribute("data-theme") === "light";
      P = pal();
      mats.forEach(({ mat, role, base }) => {
        mat.color.setHex(colOf(role));
        mat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
        mat.opacity = Math.min(1, base * (light ? 1.16 : 1));
        mat.needsUpdate = true;
      });
      grid.material.color.setHex(P.grid);
      grid.material.opacity = light ? 0.42 : 0.3;
      disc.material.color.setHex(P.accent);
      disc.material.opacity = light ? 0.05 : 0.06;
    }
    applyTheme();
    new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
})();
