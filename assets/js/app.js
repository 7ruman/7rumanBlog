// 首页：加载文章列表、标签筛选、搜索、主题切换
(function () {
  const $ = (sel) => document.querySelector(sel);

  // 主题
  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  $("#theme-toggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
  $("#year").textContent = new Date().getFullYear();

  let posts = [];
  let activeTag = null;
  let query = "";

  fetch("posts.json")
    .then((r) => r.json())
    .then((data) => { posts = data; renderTags(); render(); })
    .catch((err) => {
      $("#post-list").innerHTML = '<p class="empty-tip">加载文章列表失败：' + err.message + "</p>";
    });

  function renderTags() {
    const allTags = [...new Set(posts.flatMap((p) => p.tags || []))];
    const box = $("#tags");
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
    const list = $("#post-list");
    const q = query.trim().toLowerCase();
    const filtered = posts
      .filter((p) => {
        const tagOk = !activeTag || (p.tags || []).includes(activeTag);
        const qOk = !q || (p.title + p.excerpt + (p.tags || []).join(" ")).toLowerCase().includes(q);
        return tagOk && qOk;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
    $("#empty").hidden = filtered.length > 0;
    list.innerHTML = filtered
      .map(
        (p) => `
      <a class="post-card" href="post.html?slug=${p.slug}">
        <div class="meta"><span>${p.date}</span>${p.read ? "<span>· " + p.read + "</span>" : ""}</div>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <div class="card-tags">${(p.tags || []).map((t) => `<span>${t}</span>`).join("")}</div>
      </a>`
      )
      .join("");
  }

  $("#search").addEventListener("input", (e) => { query = e.target.value; render(); });
})();
