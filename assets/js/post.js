// 文章页：按 ?slug= 加载对应 Markdown 并渲染
(function () {
  const $ = (sel) => document.querySelector(sel);

  const saved = localStorage.getItem("theme");
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  $("#theme-toggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });
  $("#year").textContent = new Date().getFullYear();

  const article = $("#article");
  const slug = new URLSearchParams(location.search).get("slug");
  if (!slug) { article.innerHTML = '<p class="empty-tip">缺少文章参数。</p>'; return; }

  fetch("posts.json")
    .then((r) => r.json())
    .then((list) => {
      const meta = list.find((p) => p.slug === slug);
      if (!meta) { article.innerHTML = '<p class="empty-tip">未找到该文章。</p>'; return; }
      return fetch(meta.file)
        .then((r) => r.text())
        .then((md) => {
          const body = window.MD.parse(md);
          document.title = meta.title + " · 鲁高峰的技术博客";
          article.innerHTML =
            `<div class="post-meta"><span>${meta.date}</span>${(meta.tags || []).map((t) => `<span class="tag-chip" style="cursor:default">${t}</span>`).join("")}</div>` +
            `<h1>${meta.title}</h1>` + body;
        });
    })
    .catch((err) => { article.innerHTML = '<p class="empty-tip">加载失败：' + err.message + "</p>"; });
})();
