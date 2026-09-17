// 轻量脚本：仅负责主题切换与年份（首页这类无列表页使用）
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  if (saved) root.setAttribute("data-theme", saved);

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("theme", next);
    });
  }
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
