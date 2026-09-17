// 零依赖 Markdown 解析器（支持 标题/列表/引用/代码块/表格/链接/图片/粗斜体）
(function (global) {
  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inline(text) {
    // 图片
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      (m, alt, src) => `<img src="${src}" alt="${alt}">`);
    // 链接
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      (m, t, href) => `<a href="${href}" target="_blank" rel="noopener">${t}</a>`);
    // 行内代码（text 已转义，勿重复转义）
    text = text.replace(/`([^`]+)`/g, (m, c) => `<code>${c}</code>`);
    // 粗体 / 斜体
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return text;
  }

  function splitRow(line) {
    return line.replace(/^\||\|$/g, "").split("|").map((s) => s.trim());
  }

  function parse(md) {
    const lines = md.replace(/\r\n/g, "\n").split("\n");
    let html = "";
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // 代码围栏
      if (/^```/.test(line)) {
        const lang = line.slice(3).trim();
        i++;
        let code = "";
        while (i < lines.length && !/^```/.test(lines[i])) { code += lines[i] + "\n"; i++; }
        i++; // 跳过结束围栏
        const src = code.replace(/\n$/, "");
        const hi = global.HL && global.HL.highlight ? global.HL.highlight(src, lang) : escapeHtml(src);
        html += `<pre><code class="lang-${lang}">${hi}</code></pre>`;
        continue;
      }

      // 标题
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { const lvl = h[1].length; html += `<h${lvl}>${inline(escapeHtml(h[2]))}</h${lvl}>`; i++; continue; }

      // 分隔线
      if (/^---+\s*$/.test(line)) { html += "<hr>"; i++; continue; }

      // 引用
      if (/^>\s?/.test(line)) {
        const q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
        html += `<blockquote>${parse(q.join("\n"))}</blockquote>`;
        continue;
      }

      // 无序列表
      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, "")); i++; }
        html += "<ul>" + items.map((it) => `<li>${inline(escapeHtml(it))}</li>`).join("") + "</ul>";
        continue;
      }

      // 有序列表
      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
        html += "<ol>" + items.map((it) => `<li>${inline(escapeHtml(it))}</li>`).join("") + "</ol>";
        continue;
      }

      // 表格
      if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        html += "<table><thead><tr>" + head.map((c) => `<th>${inline(escapeHtml(c))}</th>`).join("") + "</tr></thead><tbody>" +
          rows.map((r) => "<tr>" + r.map((c) => `<td>${inline(escapeHtml(c))}</td>`).join("") + "</tr>").join("") + "</tbody></table>";
        continue;
      }

      // 空行
      if (/^\s*$/.test(line)) { i++; continue; }

      // 段落（聚合到下一个空行或块级元素）
      const para = [];
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^(#{1,6}\s|```|>\s?|[-*]\s+|\d+\.\s+|---+\s*$)/.test(lines[i]) &&
        !/^\|.*\|\s*$/.test(lines[i])
      ) { para.push(lines[i]); i++; }
      if (para.length) html += "<p>" + inline(escapeHtml(para.join(" "))) + "</p>";
    }
    return html;
  }

  global.MD = { parse };
})(window);
