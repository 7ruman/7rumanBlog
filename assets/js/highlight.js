// 轻量语法高亮（js / py / c / cpp / bash / json），零依赖
(function (global) {
  const KW = {
    js: ["const","let","var","function","return","if","else","for","while","do","switch","case","break","continue","new","class","extends","import","export","from","async","await","try","catch","throw","typeof","instanceof","of","in","this","null","undefined","true","false"],
    py: ["def","return","if","elif","else","for","while","import","from","as","class","try","except","finally","with","lambda","yield","async","await","None","True","False","and","or","not","in","is","pass","break","continue","raise","global"],
    c: ["int","float","double","char","void","long","short","unsigned","signed","static","const","struct","typedef","enum","union","if","else","for","while","do","switch","case","break","continue","return","sizeof","volatile","register","extern","include","define"],
    cpp: ["int","float","double","char","void","bool","long","short","unsigned","signed","static","const","struct","class","typedef","enum","union","template","typename","namespace","using","public","private","protected","virtual","if","else","for","while","do","switch","case","break","continue","return","sizeof","new","delete","auto","nullptr","include","define"],
    bash: ["if","then","else","elif","fi","for","while","do","done","case","esac","function","echo","cd","export","source","return","local","read","set"]
  };

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlight(code, lang) {
    const map = { js:"js", javascript:"js", ts:"js", typescript:"js",
      py:"py", python:"py",
      c:"c", h:"c",
      cpp:"cpp", "c++":"cpp", hpp:"cpp", cc:"cpp", cxx:"cpp",
      bash:"bash", sh:"bash", shell:"bash", zsh:"bash",
      json:"json" };
    const lk = map[lang];
    if (!lk) return esc(code);

    const kws = KW[lk] || [];
    const kwRe = new RegExp("^(?:" + kws.join("|") + ")\\b");
    const commentRe = (lk === "py" || lk === "bash")
      ? /^#[^\n]*/
      : /^\/\/[^\n]*|^\/\*[\s\S]*?\*\//;
    const strRe = /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/;
    const numRe = /^\d+(?:\.\d+)?\b/;

    let out = "";
    let i = 0;
    const n = code.length;
    while (i < n) {
      const rest = code.slice(i);
      let m;
      if ((m = rest.match(commentRe))) { out += `<span class="tok-com">${esc(m[0])}</span>`; i += m[0].length; continue; }
      if ((m = rest.match(strRe)))    { out += `<span class="tok-str">${esc(m[0])}</span>`; i += m[0].length; continue; }
      if ((m = rest.match(numRe)))    { out += `<span class="tok-num">${esc(m[0])}</span>`; i += m[0].length; continue; }
      if (kws.length && (m = rest.match(kwRe))) { out += `<span class="tok-key">${esc(m[0])}</span>`; i += m[0].length; continue; }
      const fnM = rest.match(/^[A-Za-z_]\w*(?=\s*\()/);
      if (fnM) { out += `<span class="tok-fn">${esc(fnM[0])}</span>`; i += fnM[0].length; continue; }
      const idM = rest.match(/^[A-Za-z_]\w*/);
      if (idM) { out += esc(idM[0]); i += idM[0].length; continue; }
      out += esc(code[i]);
      i++;
    }
    return out;
  }

  global.HL = { highlight };
})(window);
