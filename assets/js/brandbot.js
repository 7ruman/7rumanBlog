// 站标小机器人：把 .brand-mark 里的文字换成迷你机器人，眼睛/头部跟随鼠标
(function () {
  const marks = document.querySelectorAll(".brand-mark");
  if (!marks.length) return;

  const SVG =
    '<svg class="brandbot" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' +
      '<circle class="bb-led" cx="12" cy="1.9" r="1.3"/>' +
      '<line class="bb-ant" x1="12" y1="3.1" x2="12" y2="5.2"/>' +
      '<rect class="bb-head" x="4.4" y="5" width="15.2" height="12.2" rx="3.6"/>' +
      '<circle class="bb-socket" cx="9.3" cy="11" r="2.7"/>' +
      '<circle class="bb-socket" cx="14.7" cy="11" r="2.7"/>' +
      '<circle class="bb-pupil" cx="9.3" cy="11" r="1.15"/>' +
      '<circle class="bb-pupil" cx="14.7" cy="11" r="1.15"/>' +
      '<line class="bb-mouth" x1="10" y1="14.9" x2="14" y2="14.9"/>' +
    "</svg>";

  marks.forEach((m) => { m.innerHTML = SVG; });

  const bots = document.querySelectorAll(".brand-mark .brandbot");
  const pupils = Array.prototype.slice.call(document.querySelectorAll(".brand-mark .bb-pupil"))
    .map((el) => ({ el, x: parseFloat(el.getAttribute("cx")), y: parseFloat(el.getAttribute("cy")) }));
  if (!pupils.length) return;

  const MAX = 1.45;          // 瞳孔最大位移（viewBox 单位）
  let raf = 0, tx = 0, ty = 0, cx = 0, cy = 0;

  function apply() {
    raf = 0;
    cx += (tx - cx) * 0.25;
    cy += (ty - cy) * 0.25;
    pupils.forEach((p) => {
      p.el.setAttribute("transform", "translate(" + (cx * MAX).toFixed(2) + "," + (cy * MAX).toFixed(2) + ")");
    });
    bots.forEach((b) => { b.style.transform = "rotate(" + (cx * 4).toFixed(2) + "deg)"; });
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
