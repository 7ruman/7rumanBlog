// 项目页：加载 projects.json，分类渲染卡片，支持标签筛选与搜索，主题切换
(function () {
  const $ = (sel) => document.querySelector(sel);
  const root = document.documentElement;

  // 主题（与 app.js 同 key）
  const saved = localStorage.getItem("theme");
  if (saved) root.setAttribute("data-theme", saved);
  $("#theme-toggle").addEventListener("click", () => {
    const cur = root.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
  $("#year").textContent = new Date().getFullYear();

  const CAT_ORDER = ["机器人系统", "电机与控制", "嵌入式 ECU", "AI 智能体", "Web 与工具", "博客"];
  const STATUS_LABEL = { active: "进行中", planning: "规划中", demo: "示例", tool: "工具" };

  let projects = [];
  let activeTag = null;
  let query = "";

  fetch("projects.json")
    .then((r) => r.json())
    .then((data) => { projects = data; renderTags(); render(); })
    .catch((err) => {
      $("#projects").innerHTML = '<p class="empty-tip">加载项目列表失败：' + err.message + "</p>";
    });

  function renderTags() {
    const allTags = [...new Set(projects.flatMap((p) => p.tags || []))].sort();
    const box = $("#proj-tags");
    box.innerHTML = "";
    allTags.forEach((t) => {
      const b = document.createElement("button");
      b.className = "tag-chip" + (t === activeTag ? " active" : "");
      b.textContent = t;
      b.onclick = () => { activeTag = activeTag === t ? null : t; renderTags(); render(); };
      box.appendChild(b);
    });
  }

  function render() {
    const q = query.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      const tagOk = !activeTag || (p.tags || []).includes(activeTag);
      const hay = (p.name + p.desc + (p.tags || []).join(" ") + p.path).toLowerCase();
      const qOk = !q || hay.includes(q);
      return tagOk && qOk;
    });

    $("#proj-count").textContent = "共 " + filtered.length + " / " + projects.length + " 个项目";
    $("#proj-empty").hidden = filtered.length > 0;

    const cats = CAT_ORDER.filter((c) => filtered.some((p) => p.category === c));
    // 不在预定义顺序里的分类放到末尾
    filtered.map((p) => p.category).filter((c, i, a) => a.indexOf(c) === i)
      .forEach((c) => { if (!cats.includes(c)) cats.push(c); });

    $("#projects").innerHTML = cats.map((cat) => {
      const cards = filtered.filter((p) => p.category === cat).map(cardHTML).join("");
      return '<h2 class="proj-cat">' + cat + "</h2>" + '<div class="proj-grid">' + cards + "</div>";
    }).join("");
  }

  function cardHTML(p) {
    const repo = p.repo
      ? '<a class="pc-path" href="' + p.repo + '" target="_blank" rel="noopener">' + esc(p.path) + " ↗</a>"
      : '<div class="pc-path">' + esc(p.path) + "</div>";
    const tags = (p.tags || []).map((t) => "<span>" + esc(t) + "</span>").join("");
    const status = STATUS_LABEL[p.status] || p.status;
    return (
      '<div class="proj-card">' +
        '<div class="pc-head"><h3>' + esc(p.name) + "</h3>" +
          '<span class="status-badge status-' + p.status + '">' + status + "</span></div>" +
        '<p class="pc-desc">' + esc(p.desc) + "</p>" +
        repo +
        '<div class="card-tags">' + tags + "</div>" +
      "</div>"
    );
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  $("#proj-search").addEventListener("input", (e) => { query = e.target.value; render(); });
})();
