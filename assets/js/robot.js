// Zero-dependency interactive robot hero: pupils follow the cursor,
// the head tilts slightly toward it, and it eases back to center on leave.
(function () {
  var hero = document.querySelector('.hero--robot');
  var stage = document.getElementById('robotStage');
  var pl = document.getElementById('pupilL');
  var pr = document.getElementById('pupilR');
  if (!hero || !pl || !pr) return;

  var BASE_L = 82, BASE_R = 118, BASE_Y = 74; // pupil base centers (viewBox units)
  var MAX_X = 6, MAX_Y = 5;                    // pupil travel range

  function move(dx, dy) {
    pl.setAttribute('cx', (BASE_L + dx).toFixed(2));
    pl.setAttribute('cy', (BASE_Y + dy).toFixed(2));
    pr.setAttribute('cx', (BASE_R + dx).toFixed(2));
    pr.setAttribute('cy', (BASE_Y + dy).toFixed(2));
    if (stage) stage.style.setProperty('--tilt', (dx * 0.9).toFixed(2) + 'deg');
  }

  function reset() {
    move(0, 0);
  }

  hero.addEventListener('mousemove', function (e) {
    var r = hero.getBoundingClientRect();
    var nx = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
    var ny = (e.clientY - r.top) / r.height - 0.5;
    var dx = Math.max(-MAX_X, Math.min(MAX_X, nx * 18));
    var dy = Math.max(-MAX_Y, Math.min(MAX_Y, ny * 14));
    move(dx, dy);
  });

  hero.addEventListener('mouseleave', reset);

  // Touch: look toward the last touch point while dragging.
  hero.addEventListener('touchmove', function (e) {
    if (!e.touches || !e.touches.length) return;
    var t = e.touches[0];
    var r = hero.getBoundingClientRect();
    var nx = (t.clientX - r.left) / r.width - 0.5;
    var ny = (t.clientY - r.top) / r.height - 0.5;
    move(
      Math.max(-MAX_X, Math.min(MAX_X, nx * 18)),
      Math.max(-MAX_Y, Math.min(MAX_Y, ny * 14))
    );
  }, { passive: true });

  hero.addEventListener('touchend', reset);
})();
