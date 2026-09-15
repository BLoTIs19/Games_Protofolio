/*
  BACKGROUND — a quiet "editor viewport" grid with drifting nodes.
  One deliberate ambient moment, kept subtle so it never competes with
  the content. Reacts gently to scroll position and pauses entirely for
  prefers-reduced-motion.
*/
(function () {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w, h, dpr;
  let nodes = [];
  let scrollT = 0;
  let raf = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedNodes();
  }

  function seedNodes() {
    const count = Math.max(18, Math.min(46, Math.floor((w * h) / 42000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      r: Math.random() * 1.4 + 0.6,
    }));
  }

  function drawGrid(offset) {
    const spacing = 64;
    ctx.strokeStyle = "rgba(233, 231, 226, 0.045)";
    ctx.lineWidth = 1;
    const oy = offset % spacing;
    for (let y = -spacing + oy; y < h + spacing; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  function drawNodes() {
    ctx.fillStyle = "rgba(227, 168, 87, 0.55)";
    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
    // faint connective lines between nearby nodes
    ctx.strokeStyle = "rgba(95, 168, 160, 0.10)";
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    drawGrid(scrollT * 0.04);
    drawNodes();
    raf = requestAnimationFrame(frame);
  }

  function drawStatic() {
    // Reduced motion: draw one calm static frame, no animation loop.
    ctx.clearRect(0, 0, w, h);
    drawGrid(0);
    ctx.fillStyle = "rgba(227, 168, 87, 0.4)";
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  window.addEventListener("resize", () => {
    resize();
    if (reduceMotion) drawStatic();
  });

  window.addEventListener(
    "scroll",
    () => {
      scrollT = window.scrollY;
    },
    { passive: true }
  );

  resize();
  if (reduceMotion) {
    drawStatic();
  } else {
    frame();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = null;
    } else if (!document.hidden && !reduceMotion && !raf) {
      frame();
    }
  });
})();
