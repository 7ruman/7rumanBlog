// 首页：全屏 3D 机器人（Three.js，纯几何体程序化生成，无外部模型）
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
      ? { body: 0xffffff, body2: 0xdde5f2, dark: 0x151a26, accent: 0x3d6fe3, accent2: 0x7c5cff,
          accent3: 0x0e93ad, grid: 0xc2cce0, floor: 0xe7ecf6 }
      : { body: 0x27303f, body2: 0x1b2230, dark: 0x090d15, accent: 0x7aa2f7, accent2: 0xbb9af7,
          accent3: 0x7dcfff, grid: 0x2c3752, floor: 0x0d1119 };
  }

  function start(THREE) {
    const P = pal();
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch (e) { return showFallback(); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 0.1, 6.6);

    /* ---------- 灯光 ---------- */
    scene.add(new THREE.HemisphereLight(0xffffff, P.floor, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 8, 6); scene.add(key);
    const fill = new THREE.PointLight(P.accent, 1.5, 50); fill.position.set(-6, 1.5, 4); scene.add(fill);
    const rim = new THREE.PointLight(P.accent2, 1.6, 50); rim.position.set(6, -1, -5); scene.add(rim);

    /* ---------- 地面网格 ---------- */
    const grid = new THREE.GridHelper(70, 70, P.grid, P.grid);
    grid.position.y = -3.2;
    grid.material.transparent = true;
    grid.material.opacity = 0.32;
    scene.add(grid);
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(2.4, 48),
      new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0.07 })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -3.18;
    scene.add(disc);

    /* ---------- 材质 ---------- */
    const matBody = new THREE.MeshStandardMaterial({ color: P.body, roughness: 0.36, metalness: 0.45 });
    const matBody2 = new THREE.MeshStandardMaterial({ color: P.body2, roughness: 0.5, metalness: 0.3 });
    const matDark = new THREE.MeshStandardMaterial({ color: P.dark, roughness: 0.16, metalness: 0.7 });
    const matGlow = new THREE.MeshStandardMaterial({ color: P.accent3, emissive: P.accent3, emissiveIntensity: 1.1, roughness: 0.3 });
    const matGlow2 = new THREE.MeshStandardMaterial({ color: P.accent2, emissive: P.accent2, emissiveIntensity: 0.9, roughness: 0.3 });
    const matEdge = new THREE.MeshStandardMaterial({ color: P.accent, emissive: P.accent, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.2 });

    /* ---------- 机器人 ---------- */
    const robot = new THREE.Group();
    scene.add(robot);
    const head = new THREE.Group();
    robot.add(head);

    // 头
    const skull = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), matBody);
    skull.scale.set(1.05, 0.9, 0.95);
    head.add(skull);
    // 面罩
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.78, 40, 40), matDark);
    visor.scale.set(1.12, 0.66, 0.42);
    visor.position.set(0, 0.02, 0.52);
    head.add(visor);
    // 眼睛 + 瞳孔
    const eyeGeo = new THREE.SphereGeometry(0.145, 24, 24);
    const eyeL = new THREE.Mesh(eyeGeo, matGlow); eyeL.position.set(-0.3, 0.06, 0.85); head.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, matGlow); eyeR.position.set(0.3, 0.06, 0.85); head.add(eyeR);
    const pupGeo = new THREE.SphereGeometry(0.062, 16, 16);
    const pupMat = new THREE.MeshBasicMaterial({ color: 0x06080d });
    const pupL = new THREE.Mesh(pupGeo, pupMat); pupL.position.set(-0.3, 0.06, 0.985); head.add(pupL);
    const pupR = new THREE.Mesh(pupGeo, pupMat); pupR.position.set(0.3, 0.06, 0.985); head.add(pupR);
    // 天线
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.42, 12), matBody2);
    ant.position.set(0, 1.02, 0); head.add(ant);
    const antBall = new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 20), matGlow2);
    antBall.position.set(0, 1.27, 0); head.add(antBall);
    // 耳
    const earGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.14, 24);
    const earL = new THREE.Mesh(earGeo, matBody2); earL.rotation.z = Math.PI / 2; earL.position.set(-1.0, 0, 0); head.add(earL);
    const earR = new THREE.Mesh(earGeo, matBody2); earR.rotation.z = Math.PI / 2; earR.position.set(1.0, 0, 0); head.add(earR);
    const dGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const dotL = new THREE.Mesh(dGeo, matGlow); dotL.position.set(-1.09, 0, 0); head.add(dotL);
    const dotR = new THREE.Mesh(dGeo, matGlow); dotR.position.set(1.09, 0, 0); head.add(dotR);

    // 颈 + 躯干
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.36, 24), matBody2);
    neck.position.y = -1.02; robot.add(neck);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 1.35, 40), matBody);
    torso.position.y = -1.88; robot.add(torso);
    // 胸口发光核心
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 16, 44), matGlow);
    ring.position.set(0, -1.82, 1.0); robot.add(ring);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), matGlow2);
    core.position.set(0, -1.82, 1.02); robot.add(core);

    // 手臂
    const armGeo = new THREE.CylinderGeometry(0.13, 0.13, 1.1, 20);
    const armL = new THREE.Mesh(armGeo, matBody2); armL.position.set(-1.12, -1.95, 0); armL.rotation.z = 0.22; robot.add(armL);
    const armR = new THREE.Mesh(armGeo, matBody2); armR.position.set(1.12, -1.95, 0); armR.rotation.z = -0.22; robot.add(armR);
    const handGeo = new THREE.SphereGeometry(0.17, 20, 20);
    const handL = new THREE.Mesh(handGeo, matEdge); handL.position.set(-1.25, -2.5, 0); robot.add(handL);
    const handR = new THREE.Mesh(handGeo, matEdge); handR.position.set(1.25, -2.5, 0); robot.add(handR);

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
      camera.position.z = w < 640 ? 9.4 : (w < 1024 ? 7.8 : 6.6);
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
        robot.position.y = Math.sin(t * 1.1) * 0.09;
        robot.rotation.y = px * 0.42;
        head.rotation.y = px * 0.34;
        head.rotation.x = py * 0.2;
        head.position.y = Math.sin(t * 1.1 + 0.6) * 0.028;
        torso.rotation.z = Math.sin(t * 0.7) * 0.02;
        const s = 1 + Math.sin(t * 3.2) * 0.09;
        antBall.scale.set(s, s, s);
      }
      antBall.material.emissiveIntensity = 0.85 + Math.sin(t * 3.2) * 0.45;
      core.material.emissiveIntensity = 0.9 + Math.sin(t * 2.2 + 1) * 0.4;

      pupL.position.x = -0.3 + px * 0.055;
      pupR.position.x = 0.3 + px * 0.055;
      pupL.position.y = pupR.position.y = 0.06 - py * 0.045;

      camera.position.x = px * 0.35;
      camera.lookAt(0, -1.0, 0);
      fill.position.x = -6 + px * 2;
      rim.position.x = 6 + px * 2;

      renderer.render(scene, camera);
    }
    tick();

    /* ---------- 主题联动 ---------- */
    new MutationObserver(() => {
      const Q = pal();
      matBody.color.setHex(Q.body);
      matBody2.color.setHex(Q.body2);
      matDark.color.setHex(Q.dark);
      matGlow.color.setHex(Q.accent3); matGlow.emissive.setHex(Q.accent3);
      matGlow2.color.setHex(Q.accent2); matGlow2.emissive.setHex(Q.accent2);
      matEdge.color.setHex(Q.accent); matEdge.emissive.setHex(Q.accent);
      fill.color.setHex(Q.accent);
      rim.color.setHex(Q.accent2);
      grid.material.color.setHex(Q.grid);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
})();
