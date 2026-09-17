// 文章页：加载 Markdown → 渲染 → 增强（TOC/进度条/返回顶部/公式/图表/代码复制/图片灯箱）
(function () {
  const $ = (sel) => document.querySelector(sel);
  const root = document.documentElement;

  /* ---------- 主题 ---------- */
  const saved = localStorage.getItem("theme");
  if (saved) root.setAttribute("data-theme", saved);
  $("#theme-toggle").addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
  $("#year").textContent = new Date().getFullYear();

  /* ---------- CDN 三级回退加载 ---------- */
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
  function loadCSS(urls) {
    return new Promise((resolve) => {
      let i = 0;
      (function next() {
        if (i >= urls.length) return resolve(false);
        const l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = urls[i++];
        l.onload = () => resolve(true);
        l.onerror = () => { l.remove(); next(); };
        document.head.appendChild(l);
      })();
    });
  }

  const CDN = {
    katexCss: [
      "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css",
      "https://cdn.staticfile.net/KaTeX/0.16.9/katex.min.css",
      "https://unpkg.com/katex@0.16.11/dist/katex.min.css"
    ],
    katexJs: [
      "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js",
      "https://cdn.staticfile.net/KaTeX/0.16.9/katex.min.js",
      "https://unpkg.com/katex@0.16.11/dist/katex.min.js"
    ],
    katexAuto: [
      "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js",
      "https://cdn.staticfile.net/KaTeX/0.16.9/contrib/auto-render.min.js",
      "https://unpkg.com/katex@0.16.11/dist/contrib/auto-render.min.js"
    ],
    mermaid: [
      "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js",
      "https://unpkg.com/mermaid@11/dist/mermaid.min.js",
      "https://cdn.staticfile.net/mermaid/10.9.1/mermaid.min.js"
    ]
  };

  /* ---------- 加载文章 ---------- */
  const article = $("#article");
  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) { article.innerHTML = '<p class="empty-tip">缺少文章参数。</p>'; return; }

  fetch("posts.json")
    .then((r) => r.json())
    .then((list) => {
      const meta = list.find((p) => p.slug === slug);
      if (!meta) { article.innerHTML = '<p class="empty-tip">未找到该文章。</p>'; return; }
      return fetch(meta.file).then((r) => r.text()).then((md) => {
        const body = window.MD.parse(md);
        document.title = meta.title + " · 7ruman的技术博客";
        const tags = (meta.tags || []).map((t) => '<span class="tag-chip" style="cursor:default">' + t + "</span>").join("");
        article.innerHTML =
          '<div class="post-header"><div class="post-meta"><span>' + meta.date + "</span>" + tags + "</div>" +
          "<h1>" + meta.title + "</h1></div>" + body;
        enhance();
      });
    })
    .catch((err) => { article.innerHTML = '<p class="empty-tip">加载失败：' + err.message + "</p>"; });

  /* ---------- 渲染后增强 ---------- */
  function slugify(s) {
    return String(s).trim().toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "sec";
  }

  function enhance() {
    buildTOC();
    setupCodeCopy();
    setupLightbox();
    setupProgressAndTop();
    renderMath();
    renderMermaid();
  }

  /* ---------- 目录 TOC + 滚动高亮 ---------- */
  let tocLinks = [];
  function buildTOC() {
    const heads = article.querySelectorAll("h2, h3");
    if (!heads.length) return;
    const ul = $("#tocList");
    heads.forEach((h, idx) => {
      if (!h.id) h.id = "h-" + idx + "-" + slugify(h.textContent);
      const li = document.createElement("li");
      li.className = h.tagName === "H3" ? "lvl-3" : "lvl-2";
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      ul.appendChild(li);
    });
    $("#toc").hidden = false;
    tocLinks = Array.from(ul.querySelectorAll("a"));
    const spy = () => {
      if (!tocLinks.length) return;
      const y = window.scrollY + 120;
      let cur = tocLinks[0];
      for (const a of tocLinks) {
        const el = document.getElementById(a.getAttribute("href").slice(1));
        if (el && el.offsetTop <= y) cur = a; else break;
      }
      tocLinks.forEach((a) => a.classList.toggle("active", a === cur));
    };
    window.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  /* ---------- 代码复制 ---------- */
  function setupCodeCopy() {
    article.addEventListener("click", (e) => {
      const btn = e.target.closest(".code-copy");
      if (!btn) return;
      const code = btn.closest(".code-block").querySelector("pre code");
      const text = code ? code.innerText : "";
      const done = () => { const old = btn.textContent; btn.textContent = "已复制"; btn.classList.add("copied");
        setTimeout(() => { btn.textContent = old; btn.classList.remove("copied"); }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
      } else fallbackCopy(text, done);
    });
  }
  function fallbackCopy(text, cb) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); cb(); } catch (_) {}
    document.body.removeChild(ta);
  }

  /* ---------- 图片灯箱 ---------- */
  function setupLightbox() {
    const box = $("#lightbox"), img = $("#lightboxImg"), cap = $("#lightboxCap");
    const close = () => box.classList.remove("open");
    article.addEventListener("click", (e) => {
      const im = e.target.closest("img");
      if (!im) return;
      img.src = im.src; cap.textContent = im.alt || "";
      box.classList.add("open");
    });
    box.addEventListener("click", (e) => { if (e.target === box || e.target.id === "lightboxClose") close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* ---------- 阅读进度条 + 返回顶部 ---------- */
  function setupProgressAndTop() {
    const bar = $("#progressBar"), top = $("#backToTop");
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + "%";
      top.classList.toggle("show", window.scrollY > 420);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* ---------- 数学公式 KaTeX ---------- */
  function renderMath() {
    const text = article.textContent || "";
    if (text.indexOf("$") === -1) return;
    Promise.all([loadCSS(CDN.katexCss), loadScript(CDN.katexJs), loadScript(CDN.katexAuto)])
      .then(([cssOk, jsOk, autoOk]) => {
        if (!jsOk || !autoOk || !window.renderMathInElement) return;
        try {
          window.renderMathInElement(article, {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false }
            ],
            throwOnError: false
          });
        } catch (_) {}
      });
  }

  /* ---------- 图表 Mermaid ---------- */
  function renderMermaid() {
    const nodes = article.querySelectorAll(".mermaid");
    if (!nodes.length) return;
    loadScript(CDN.mermaid).then((ok) => {
      if (!ok || !window.mermaid) return;
      const dark = root.getAttribute("data-theme") !== "light";
      try {
        window.mermaid.initialize({ startOnLoad: false, securityLevel: "loose",
          theme: dark ? "dark" : "default" });
        window.mermaid.run({ nodes: Array.from(nodes) });
      } catch (_) {}
    });
  }
})();
