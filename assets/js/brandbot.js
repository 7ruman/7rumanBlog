// 站标小机器人：把 .brand-mark 里的文字换成迷你机器人
// 眼睛（瞳孔）+ 头部转角 + 整体位移 三者同时跟随鼠标，动作明显
(function () {
  const marks = document.querySelectorAll(".brand-mark");
  if (!marks.length) return;

  const SVG =
    '<svg class="brandbot" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">' +
      '<circle class="bb-led" cx="12" cy="1.8" r="1.35"/>' +
      '<line class="bb-ant" x1="12" y1="3" x2="12" y2="5.2"/>' +
      '<rect class="bb-head" x="4.2" y="5" width="15.6" height="12.4" rx="3.7"/>' +
      '<circle class="bb-socket" cx="9.0" cy="11.1" r="2.9"/>' +
      '<circle class="bb-socket" cx="15.0" cy="11.1" r="2.9"/>' +
      '<circle class="bb-pupil" cx="9.0" cy="11.1" r="1.25"/>' +
      '<circle class="bb-pupil" cx="15.0" cy="11.1" r="1.25"/>' +
      '<line class="bb-mouth" x1="10" y1="15" x2="14" y2="15"/>' +
    "</svg>";

  marks.forEach((m) => { m.innerHTML = SVG; });

  const bots = document.querySelectorAll(".brand-mark .brandbot");
  const pupils = Array.prototype.slice
    .call(document.querySelectorAll(".brand-mark .bb-pupil"))
    .map((el) => ({ el, x: parseFloat(el.getAttribute("cx")), y: parseFloat(el.getAttribute("cy")) }));
  if (!pupils.length) return;

  const MAX = 1.7;     // 瞳孔最大位移（viewBox 单位；眼窝 r2.9 - 瞳孔 r1.25 ≈ 1.65，略超一点点读作"看到边缘"）
  const TILT = 10;     // 头部最大转角（度）
  const SHIFT = 2.2;   // 整体最大位移（px）
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

  function apply() {
    raf = 0;
    cx += (tx - cx) * 0.28;
    cy += (ty - cy) * 0.28;
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

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchstart", onMove, { passive: true });
})();
