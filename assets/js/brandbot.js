// 站标小机器人：把 .brand-mark 里的文字换成迷你机器人
// 瞳孔 + 头部转角 + 整体位移 三轴同时跟随鼠标；鼠标离开回正
(function () {
  const marks = document.querySelectorAll(".brand-mark");
  if (!marks.length) return;

  const SVG =
    '<svg class="brandbot" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">' +
      '<circle class="bb-led" cx="12" cy="1.5" r="1.5"/>' +
      '<line class="bb-ant" x1="12" y1="2.8" x2="12" y2="5"/>' +
      '<rect class="bb-head" x="3.2" y="4.6" width="17.6" height="13.4" rx="4.4"/>' +
      '<circle class="bb-socket" cx="8.6" cy="11.3" r="3.3"/>' +
      '<circle class="bb-socket" cx="15.4" cy="11.3" r="3.3"/>' +
      '<circle class="bb-pupil" cx="8.6" cy="11.3" r="1.5"/>' +
      '<circle class="bb-pupil" cx="15.4" cy="11.3" r="1.5"/>' +
      '<line class="bb-mouth" x1="9.6" y1="15.7" x2="14.4" y2="15.7"/>' +
    "</svg>";

  marks.forEach((m) => { m.innerHTML = SVG; });

  const bots = document.querySelectorAll(".brand-mark .brandbot");
  const pupils = Array.prototype.slice
    .call(document.querySelectorAll(".brand-mark .bb-pupil"))
    .map((el) => ({ el, x: parseFloat(el.getAttribute("cx")), y: parseFloat(el.getAttribute("cy")) }));
  if (!pupils.length) return;

  const MAX = 1.8;    // 瞳孔最大位移（viewBox 单位；眼窝 r3.3 - 瞳孔 r1.5 = 1.8，正好瞟到眼角）
  const TILT = 15;    // 头部最大转角（度）
  const SHIFT = 3.0;  // 整体最大位移（px）
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

  function apply() {
    raf = 0;
    cx += (tx - cx) * 0.3;
    cy += (ty - cy) * 0.3;
    pupils.forEach((p) => {
      p.el.setAttribute("transform", "translate(" + (cx * MAX).toFixed(2) + "," + (cy * MAX).toFixed(2) + ")");
    });
    const tr = "translate(" + (cx * SHIFT).toFixed(2) + "px," + (cy * SHIFT).toFixed(2) + "px) rotate(" + (cx * TILT).toFixed(2) + "deg)";
    bots.forEach((b) => { b.style.transform = tr; });
    if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(apply);
  }
  function onMove(e) {
    const t = e.touches && e.touches.length ? e.touches[0] : e;
    if (!t || t.clientX == null) return;
    tx = (t.clientX / window.innerWidth) * 2 - 1;   // -1 .. 1
    ty = (t.clientY / window.innerHeight) * 2 - 1;
    if (!raf) raf = requestAnimationFrame(apply);
  }
  function onLeave() { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(apply); }

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchstart", onMove, { passive: true });
  document.addEventListener("mouseleave", onLeave);
  window.addEventListener("blur", onLeave);
})();
