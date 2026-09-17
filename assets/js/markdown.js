// 零依赖 Markdown 解析器
// 支持：标题 / 列表 / 引用 / 代码块(增强结构：语言标签+复制+行号) / 表格 / 链接 / 图片 / 粗斜体
// 新增：$...$ 行内数学与 $$...$$ 块级数学保护（交给 KaTeX 渲染）；```mermaid 输出为图表容器
(function (global) {
  function escHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escAttr(s) {
    return escHtml(s).replace(/"/g, "&quot;");
  }
  // 只转义会破坏 HTML 结构的字符，保留反斜杠等 LaTeX 语法
  function keepMath(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  // Mermaid 定义只需转义 & 与 <（保留 --> 等箭头，兼容读取 innerHTML 的旧版本）
  function escText(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  const CODE_TOKEN = "\u0000C"; // 行内代码占位
  const MATH_TOKEN = "\u0000M"; // 数学占位
  const END = "\u0000";

  // 行内渲染：先保护代码跨度与数学，再转义并做通用行内替换，最后还原
  function renderInline(raw) {
    const codes = [];
    const maths = [];
    let text = String(raw);

    // 1) 保护行内代码 `...`
    text = text.replace(/`([^`]+)`/g, (m, c) => {
      codes.push(c);
      return CODE_TOKEN + (codes.length - 1) + END;
    });
    // 2) 保护数学：块级 $$...$$ 优先，再行内 $...$
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (m, b) => {
      maths.push({ display: true, body: b });
      return MATH_TOKEN + (maths.length - 1) + END;
    });
    text = text.replace(/\$([^\s$][^$\n]*?[^\s$])\$/g, (m, b) => {
      maths.push({ display: false, body: b });
      return MATH_TOKEN + (maths.length - 1) + END;
    });

    // 3) 转义并做行内替换
    text = escHtml(text);
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,
      (m, alt, src) => `<img src="${escAttr(src)}" alt="${escAttr(alt)}" loading="lazy">`);
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
      (m, t, href) => `<a href="${escAttr(href)}" target="_blank" rel="noopener">${t}</a>`);
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

    // 4) 还原
    text = text.replace(new RegExp(CODE_TOKEN + "(\\d+)" + END, "g"),
      (m, i) => `<code>${escHtml(codes[+i])}</code>`);
    text = text.replace(new RegExp(MATH_TOKEN + "(\\d+)" + END, "g"),
      (m, i) => `<span class="math">$${keepMath(maths[+i].body)}$</span>`);
    return text;
  }

  function splitRow(line) {
    return line.replace(/^\||\|$/g, "").split("|").map((s) => s.trim());
  }
  const isBlank = (l) => /^\s*$/.test(l);
  const isBlockStart = (l) => /^(#{1,6}\s|```|>\s?|[-*]\s+|\d+\.\s+|---+\s*$|\s*\$\$)/.test(l) || /^\|.*\|\s*$/.test(l);

  function codeBlock(lang, code) {
    const label = (lang || "text").trim() || "text";
    const hi = global.HL && global.HL.highlight ? global.HL.highlight(code, label) : escHtml(code);
    const wrapped = hi.split("\n").map((l) => `<span class="code-line">${l === "" ? "&nbsp;" : l}</span>`).join("\n");
    return (
      '<div class="code-block" data-lang="' + escAttr(label) + '">' +
        '<div class="code-head">' +
          '<span class="code-lang">' + escHtml(label) + "</span>" +
          '<button class="code-copy" type="button" aria-label="复制代码">复制</button>' +
        "</div>" +
        '<pre><code class="lang-' + escAttr(label) + '">' + wrapped + "</code></pre>" +
      "</div>"
    );
  }

  function parse(md) {
    const lines = String(md).replace(/\r\n/g, "\n").split("\n");
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
        i++;
        const src = code.replace(/\n$/, "");
        if (lang === "mermaid") {
          html += '<div class="mermaid">' + escText(src) + "</div>";
        } else {
          html += codeBlock(lang, src);
        }
        continue;
      }

      // 块级数学 $$...$$
      if (/^\s*\$\$/.test(line)) {
        let body = line.replace(/^\s*\$\$\s*/, "");
        if (/\$\$\s*$/.test(body) && body.trim()) {
          html += '<div class="math-block">$$' + keepMath(body.replace(/\$\$\s*$/, "")) + "$$</div>";
          i++; continue;
        }
        const buf = body ? [body] : [];
        i++;
        while (i < lines.length && !/\$\$\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        if (i < lines.length) { buf.push(lines[i].replace(/\$\$\s*$/, "")); i++; }
        html += '<div class="math-block">$$' + keepMath(buf.join("\n").replace(/\s+$/, "")) + "$$</div>";
        continue;
      }

      // 标题
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { const lvl = h[1].length; html += "<h" + lvl + ">" + renderInline(h[2]) + "</h" + lvl + ">"; i++; continue; }

      // 分隔线
      if (/^---+\s*$/.test(line)) { html += "<hr>"; i++; continue; }

      // 引用
      if (/^>\s?/.test(line)) {
        const q = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, "")); i++; }
        html += "<blockquote>" + parse(q.join("\n")) + "</blockquote>";
        continue;
      }

      // 无序列表
      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, "")); i++; }
        html += "<ul>" + items.map((it) => "<li>" + renderInline(it) + "</li>").join("") + "</ul>";
        continue;
      }

      // 有序列表
      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, "")); i++; }
        html += "<ol>" + items.map((it) => "<li>" + renderInline(it) + "</li>").join("") + "</ol>";
        continue;
      }

      // 表格
      if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        html += "<table><thead><tr>" + head.map((c) => "<th>" + renderInline(c) + "</th>").join("") + "</tr></thead><tbody>" +
          rows.map((r) => "<tr>" + r.map((c) => "<td>" + renderInline(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table>";
        continue;
      }

      // 空行
      if (isBlank(line)) { i++; continue; }

      // 段落
      const para = [];
      while (i < lines.length && !isBlank(lines[i]) && !isBlockStart(lines[i])) { para.push(lines[i]); i++; }
      if (para.length) html += "<p>" + renderInline(para.join(" ")) + "</p>";
    }
    return html;
  }

  global.MD = { parse, renderInline };
})(window);
