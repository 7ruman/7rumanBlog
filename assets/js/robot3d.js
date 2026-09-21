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
    if (fallback) { fallback.hidden = false; fallback.style.display = ""; }
  }
  // 3D 正常时：用内联样式把降级机器人彻底按死（不依赖 CSS 是否被缓存/被其它规则覆盖）
  function hideFallback() {
    if (fallback) { fallback.hidden = true; fallback.style.display = "none"; }
  }

  loadScript(CDNS)
    .then((ok) => {
      if (!ok || !window.THREE) return showFallback();
      try { start(window.THREE); } catch (e) { showFallback(); }
    })
    .catch(showFallback);

  // 背景视频：按主题切换（暗夜=G1 人形崎岖地形 / 白天=ANYmal 四足）+ 静音自动播放兜底
  (function setupStageVideo() {
    const v = document.querySelector(".stage-video video");
    if (!v) return;

    const SRC = {
      dark: v.getAttribute("data-src-dark") || "assets/media/g1-rough.mp4?v=1",
      light: v.getAttribute("data-src-light") || "assets/media/anymal-rollout.mp4?v=1",
    };
    function tryPlay() { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    function syncVideo() {
      const theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      const want = SRC[theme];
      if (v.getAttribute("data-active") === want) return;
      v.setAttribute("data-active", want);
      v.src = want;
      v.load();
      // 每次换源都要重新挂播放兜底：once 监听器在上次加载时已被消耗，
      // 否则切主题后新视频加载完成却没人调用 play()，画面就停住了
      v.addEventListener("loadeddata", tryPlay, { once: true });
      v.addEventListener("canplay", tryPlay, { once: true });
      tryPlay();
      setTimeout(tryPlay, 400);
      setTimeout(tryPlay, 1000);
    }

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (v.readyState >= 2) tryPlay();
    v.addEventListener("loadeddata", tryPlay, { once: true });
    v.addEventListener("canplay", tryPlay, { once: true });
    const once = () => {
      tryPlay();
      window.removeEventListener("click", once);
      window.removeEventListener("touchstart", once);
      window.removeEventListener("keydown", once);
    };
    window.addEventListener("click", once);
    window.addEventListener("touchstart", once);
    window.addEventListener("keydown", once);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tryPlay(); });

    syncVideo();
    new MutationObserver(syncVideo).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  })();

  function pal() {
    const light = document.documentElement.getAttribute("data-theme") === "light";
    return light
      ? { accent: 0x2f63d8, accent2: 0x6b3ff0, accent3: 0x0b7f96 }
      : { accent: 0x7aa2f7, accent2: 0xbb9af7, accent3: 0x7dcfff };
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
    hideFallback(); // 3D 起来了 → 降级机器人立即隐藏

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    camera.position.set(0, 0, 6.2);

    /* ---------- 用线条构建零件（主线 + 微弱光晕） ---------- */
    const mats = []; // { mat, role } 供主题联动
    const colOf = (role) => (role === "eye" ? P.accent3 : role === "accent2" ? P.accent2 : P.accent);

    // 单层线条（去掉"光晕副本"，避免看起来像重影/两台机器人）
    function addPart(parent, geo, role) {
      const wg = new THREE.WireframeGeometry(geo);
      const op = 1; // 背景变亮后线条全不透明，保证对比度
      const mat = new THREE.LineBasicMaterial({ color: colOf(role), transparent: true, opacity: op, depthWrite: false });
      mats.push({ mat, role, base: op });
      parent.add(new THREE.LineSegments(wg, mat));
    }

    /* ---------- 地面辉光盘（原 GridHelper 已移除：会与背景视频里的地面网格重叠） ---------- */
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 56),
      new THREE.MeshBasicMaterial({ color: P.accent, transparent: true, opacity: 0.06, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = -3.52;
    scene.add(disc);

    /* ---------- 机器人（低模几何 → 线框） ---------- */
    const robot = new THREE.Group();
    robot.scale.setScalar(1.12);
    scene.add(robot);
    const head = new THREE.Group();
    robot.add(head);
    // 手绘兜底头部（真实模型线框加载失败时才显示）
    const handHead = new THREE.Group();
    head.add(handHead);

    /* ---------- 头部：钢铁侠头盔（面甲特征线 + 盔壳） ---------- */
    // 特征线工具：把脸面 2D 坐标 (x,y) 投影到头盔球面 (r=1, 正面朝 +z) 生成线条
    function facePoint(x, y) {
      const z2 = 1.0 - x * x - y * y;
      return new THREE.Vector3(x, y, Math.sqrt(Math.max(z2, 0.001)));
    }
    function faceLine(parent, pts, role, op) {
      const g = new THREE.BufferGeometry().setFromPoints(pts.map(([x, y]) => facePoint(x, y)));
      const mat = new THREE.LineBasicMaterial({ color: colOf(role), transparent: true, opacity: op || 1, depthWrite: false });
      mats.push({ mat, role, base: op || 1 });
      parent.add(new THREE.Line(g, mat));
    }

    // 盔壳（线框椭圆，提供头盔体积）
    const helm = new THREE.Group(); helm.scale.set(0.95, 1.1, 0.98);
    addPart(helm, new THREE.SphereGeometry(1, 24, 16), "body", 1.03);
    handHead.add(helm);

    // 面甲板（前脸扇区网格）
    const face = new THREE.Group(); face.scale.set(0.95, 1.1, 0.98);
    addPart(face, new THREE.SphereGeometry(1.012, 18, 12, Math.PI * 0.20, Math.PI * 0.60), "accent2", 1.05);
    handHead.add(face);

    // —— 面甲外轮廓：额角 → 太阳穴 → 颧骨 → 下颌 → 尖下巴（闭合）——
    faceLine(handHead, [
      [0.00, 0.72], [0.42, 0.62], [0.62, 0.30], [0.56, -0.08], [0.32, -0.52],
      [0.00, -0.76], [-0.32, -0.52], [-0.56, -0.08], [-0.62, 0.30], [-0.42, 0.62], [0.00, 0.72],
    ], "accent2", 1.0);

    // —— 面甲中央合缝（额头 → 下巴，脸甲左右两半的分缝）——
    faceLine(handHead, [[0.00, 0.72], [0.00, -0.76]], "accent2", 0.9);

    // —— 皱眉 V 形眉骨 ——
    faceLine(handHead, [[-0.06, 0.30], [-0.44, 0.37]], "accent2", 0.95);
    faceLine(handHead, [[0.06, 0.30], [0.44, 0.37]], "accent2", 0.95);

    // —— 鼻梁 + 鼻头 ——
    faceLine(handHead, [[0.00, 0.24], [0.00, -0.06]], "accent2", 0.95);
    faceLine(handHead, [[-0.07, -0.13], [0.07, -0.13], [0.00, -0.24], [-0.07, -0.13]], "accent2", 0.9);

    // —— 嘴缝 + 下唇线 ——
    faceLine(handHead, [[-0.16, -0.40], [0.16, -0.40]], "body", 1.0);
    faceLine(handHead, [[-0.10, -0.48], [0.10, -0.48]], "accent2", 0.85);

    // —— 发光眼缝（贴面线框 + 发光条），位于眉骨下方 ——
    const eyes = new THREE.Group(); handHead.add(eyes);
    let eyeL, eyeR;
    for (const sx of [-1, 1]) {
      const ex = sx * 0.25, w = 0.19, y0 = 0.06, y1 = 0.16;
      faceLine(handHead, [
        [ex - w, y1], [ex + w, y1], [ex + w + 0.04, y0 + 0.045],
        [ex + w, y0], [ex - w, y0], [ex - w - 0.04, y0 + 0.045], [ex - w, y1],
      ], "eye", 1.0);
      const eye = new THREE.Group();
      eye.position.set(sx * 0.25, 0.11, 0.94);
      eye.rotation.y = sx * 0.26;
      addPart(eye, new THREE.BoxGeometry(0.40, 0.055, 0.05), "eye", 1.25);
      eyes.add(eye);
      if (sx < 0) eyeL = eye; else eyeR = eye;
    }

    // 头顶脊线（头盔中缝）+ 耳部
    const crest = new THREE.Group(); crest.position.set(0, 1.05, 0);
    addPart(crest, new THREE.BoxGeometry(0.05, 0.06, 1.45), "accent2", 1.12);
    handHead.add(crest);
    for (const sx of [-1, 1]) {
      const ear = new THREE.Group(); ear.position.set(sx * 0.97, 0.02, 0);
      addPart(ear, new THREE.CylinderGeometry(0.18, 0.18, 0.13, 14), "body", 1.06);
      ear.rotation.z = Math.PI / 2;
      handHead.add(ear);
      const dot = new THREE.Group(); dot.position.set(sx * 1.07, 0.02, 0);
      addPart(dot, new THREE.SphereGeometry(0.05, 9, 7), "eye", 1.2);
      handHead.add(dot);
    }

    // 真实钢铁侠面甲：开源模型特征棱边（CC BY, github.com/alexespartano/ironman-helmet-stl）
    // 预提取的线段 JSON（~270KB），加载成功后替换手绘兜底头
    fetch("assets/media/ironman-edges.json?v=1")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        const arr = new Float32Array(data.e);
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        const mat = new THREE.LineBasicMaterial({ color: colOf("accent2"), transparent: true, opacity: 1.0, depthWrite: false });
        mats.push({ mat, role: "accent2", base: 1.0 });
        const helmet = new THREE.LineSegments(g, mat);
        helmet.scale.setScalar(0.75); helmet.position.y = 0.10;
        head.add(helmet);
        // 发光眼缝（位置按模型眼洞实测）
        const ironEyes = new THREE.Group();
        for (const sx of [-1, 1]) {
          const e = new THREE.Group();
          e.position.set(sx * 0.165, -0.28, 0.99);
          e.rotation.y = sx * 0.22;
          addPart(e, new THREE.BoxGeometry(0.32, 0.055, 0.05), "eye", 1.25);
          ironEyes.add(e);
        }
        head.add(ironEyes);
        handHead.visible = false; // 模型到位 → 隐藏手绘兜底
      })
      .catch(() => {}); // 加载失败 → 保留手绘兜底头

    // 颈甲 / 胸甲（六棱柱，装甲板块感）
    const neck = new THREE.Group(); neck.position.y = -1.32;
    addPart(neck, new THREE.CylinderGeometry(0.30, 0.36, 0.30, 10), "body", 1.06);
    robot.add(neck);

    const torso = new THREE.Group(); torso.position.y = -2.18;
    torso.rotation.y = Math.PI / 6;
    addPart(torso, new THREE.CylinderGeometry(0.82, 1.08, 1.35, 6), "body", 1.03);
    robot.add(torso);

    // 胸肌板（左右两块装甲，贴合胸甲斜面）
    for (const sx of [-1, 1]) {
      const pec = new THREE.Group();
      pec.position.set(sx * 0.40, -1.90, 0.80);
      pec.rotation.set(0.28, sx * 0.38, 0);
      const pg = new THREE.Group(); pg.scale.set(1, 0.70, 0.42);
      addPart(pg, new THREE.SphereGeometry(0.42, 14, 10), "body", 1.08);
      pec.add(pg);
      robot.add(pec);
    }

    // 方舟反应堆（双环 + 核心）
    const ringG = new THREE.Group(); ringG.position.set(0, -2.12, 0.98);
    addPart(ringG, new THREE.TorusGeometry(0.36, 0.05, 8, 30), "eye", 1.1);
    robot.add(ringG);
    const ring2 = new THREE.Group(); ring2.position.set(0, -2.12, 1.02);
    addPart(ring2, new THREE.TorusGeometry(0.21, 0.035, 8, 24), "accent2", 1.12);
    robot.add(ring2);
    const core = new THREE.Group(); core.position.set(0, -2.12, 1.05);
    addPart(core, new THREE.SphereGeometry(0.13, 12, 10), "accent2", 1.18);
    robot.add(core);

    // 腹部分节（装甲环）
    for (let i = 0; i < 2; i++) {
      const ab = new THREE.Group(); ab.position.y = -3.04 - i * 0.32; ab.rotation.x = Math.PI / 2;
      addPart(ab, new THREE.TorusGeometry(0.84 - i * 0.07, 0.03, 6, 26), "body", 1.05);
      robot.add(ab);
    }

    // 球形肩甲 + 双段手臂 + 手
    for (const sx of [-1, 1]) {
      const shoulder = new THREE.Group(); shoulder.position.set(sx * 1.14, -1.88, 0);
      const sg = new THREE.Group(); sg.scale.set(1, 0.85, 1);
      addPart(sg, new THREE.SphereGeometry(0.44, 14, 10), "body", 1.08);
      shoulder.add(sg);
      robot.add(shoulder);

      const arm = new THREE.Group(); arm.position.set(sx * 1.20, -2.58, 0); arm.rotation.z = -sx * 0.10;
      addPart(arm, new THREE.CylinderGeometry(0.15, 0.12, 1.0, 10), "body", 1.06);
      robot.add(arm);
      const hand = new THREE.Group(); hand.position.set(sx * 1.34, -3.16, 0);
      addPart(hand, new THREE.SphereGeometry(0.18, 12, 9), "accent2", 1.1);
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
      camera.position.z = w < 640 ? 9.6 : (w < 1024 ? 7.9 : 6.8);
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
        core.scale.set(s, s, s);
        ringG.rotation.z = t * 0.5;
        ring2.rotation.z = -t * 0.8;
      }
      eyeL.position.x = -0.25 + px * 0.05;
      eyeR.position.x = 0.25 + px * 0.05;
      eyeL.position.y = eyeR.position.y = 0.11 - py * 0.04;

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
      disc.material.color.setHex(P.accent);
      disc.material.opacity = light ? 0.05 : 0.06;
    }
    applyTheme();
    new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }
})();
