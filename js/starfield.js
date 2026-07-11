/* ============================================================
   Cosmos canvas — 별하늘 + 마우스 인터랙션 + 초신성 폭발
   ============================================================ */
(function () {
  "use strict";

  const canvas = document.getElementById("cosmos");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 640px)").matches;
  let DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W = 0, H = 0;
  let stars = [];
  let novae = [];        // 초신성들
  let shootingStars = [];
  // 화면 중앙에서 시작해야 첫 프레임부터 시차(parallax)가 0 — 터치 기기에서도 안전
  let mouse = {
    x: window.innerWidth / 2, y: window.innerHeight / 2,
    tx: window.innerWidth / 2, ty: window.innerHeight / 2
  };
  let running = true;
  let rafId = 0;
  let lastAutoNova = 0;

  const PALETTE = ["#ffd27a", "#ff8a4c", "#ff4d8d", "#7fe3ff", "#9b8cff", "#ffffff"];

  function resize() {
    const prevW = W, prevH = H;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // 모바일 주소창 접힘(높이만 변경) 때 별이 재배치되며 튀는 것 방지:
    // 너비가 바뀔 때만 새로 생성, 높이 변화는 기존 별 y를 비례 스케일
    if (stars.length === 0 || W !== prevW) {
      initStars();
    } else if (H !== prevH && prevH > 0) {
      const sy = H / prevH;
      for (const st of stars) st.y *= sy;
    }
  }

  function initStars() {
    const density = isMobile ? 9000 : 5500; // px² per star
    const count = Math.floor((W * H) / density);
    stars = [];
    for (let i = 0; i < count; i++) {
      const layer = Math.random(); // 0 = far, 1 = near
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        layer: 0.15 + layer * 0.85,
        r: 0.4 + layer * 1.3,
        color: Math.random() < 0.82 ? "#ffffff" : PALETTE[(Math.random() * PALETTE.length) | 0],
        baseA: 0.25 + Math.random() * 0.6,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 0.4 + Math.random() * 1.4,
        ox: 0, oy: 0 // repulsion offset
      });
    }
  }

  /* ---------- 초신성 (부드러운 발광 구체) ---------- */
  const NOVA_LIFE = 2.2; // seconds until fully faded

  function spawnNova(x, y, big) {
    const scale = big ? 1 : 0.35;
    const dust = [];
    const n = reduceMotion ? 0 : Math.floor((isMobile ? 45 : 100) * scale);
    for (let i = 0; i < n; i++) {
      dust.push({
        ang: Math.random() * Math.PI * 2,
        frac: Math.pow(Math.random(), 1.5), // 코어 쪽으로 밀집
        size: 0.3 + Math.random() * 1.1,
        tw: Math.random() * Math.PI * 2,
        twSpeed: 1.5 + Math.random() * 2.5,
        // 별처럼 다양한 색 (흰색 위주 + 금/주황/분홍/청록/보라)
        color: Math.random() < 0.45 ? "#fff6ea" : PALETTE[(Math.random() * PALETTE.length) | 0]
      });
    }
    novae.push({ x, y, t: 0, scale, dust });
    if (novae.length > 4) novae.shift();
  }

  function drawNova(nv, dt) {
    nv.t += dt;
    const t = nv.t;

    // 밝기: 빠른 상승(0.35s) → 지수 감쇠
    const rise = Math.min(t / 0.3, 1);
    const decay = Math.exp(-Math.max(t - 0.3, 0) / 0.6);
    const I = rise * rise * decay;
    if (I < 0.012) return;

    // 반경: 감속 팽창
    const maxR = Math.min(W, H) * 0.13 * nv.scale;
    const R = Math.max(maxR * (1 - Math.exp(-t / 0.55)), 1);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    // 1) 바깥 헤일로 — 넓고 옅은 따뜻한 빛
    let g = ctx.createRadialGradient(nv.x, nv.y, 0, nv.x, nv.y, R);
    g.addColorStop(0, `rgba(255, 208, 165, ${0.22 * I})`);
    g.addColorStop(0.5, `rgba(255, 180, 135, ${0.10 * I})`);
    g.addColorStop(1, "rgba(255, 160, 115, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(nv.x, nv.y, R, 0, Math.PI * 2);
    ctx.fill();

    // 2) 중간 글로우
    const midR = R * 0.5;
    g = ctx.createRadialGradient(nv.x, nv.y, 0, nv.x, nv.y, midR);
    g.addColorStop(0, `rgba(255, 234, 205, ${0.42 * I})`);
    g.addColorStop(1, "rgba(255, 200, 160, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(nv.x, nv.y, midR, 0, Math.PI * 2);
    ctx.fill();

    // 3) 백색 코어
    const coreR = Math.max(R * 0.17, 2);
    g = ctx.createRadialGradient(nv.x, nv.y, 0, nv.x, nv.y, coreR);
    g.addColorStop(0, `rgba(255, 255, 255, ${0.95 * I})`);
    g.addColorStop(0.55, `rgba(255, 243, 224, ${0.5 * I})`);
    g.addColorStop(1, "rgba(255, 230, 200, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(nv.x, nv.y, coreR, 0, Math.PI * 2);
    ctx.fill();

    // 4) 미세 성진(星塵) — 글로우에 질감
    for (const d of nv.dust) {
      d.tw += d.twSpeed * dt;
      const r = d.frac * R * 0.9;
      const a = I * (1 - d.frac * 0.75) * (0.45 + 0.35 * Math.sin(d.tw));
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(nv.x + Math.cos(d.ang) * r, nv.y + Math.sin(d.ang) * r, d.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /* ---------- 유성 ---------- */
  function spawnShootingStar() {
    const fromLeft = Math.random() < 0.5;
    shootingStars.push({
      x: fromLeft ? -60 : Math.random() * W,
      y: fromLeft ? Math.random() * H * 0.5 : -60,
      vx: 7 + Math.random() * 6,
      vy: 3 + Math.random() * 3,
      life: 1
    });
  }

  function drawShootingStar(s) {
    s.x += s.vx;
    s.y += s.vy;
    s.life -= 0.012;
    if (s.life <= 0) return;
    const len = 14;
    const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * len, s.y - s.vy * len);
    grad.addColorStop(0, `rgba(255,255,255,${0.85 * s.life})`);
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * len, s.y - s.vy * len);
    ctx.stroke();
  }

  /* ---------- 메인 루프 ---------- */
  let lastTime = performance.now();
  let tick = 0;

  function frame(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    tick += dt;

    ctx.clearRect(0, 0, W, H);

    // smooth mouse
    mouse.x += (mouse.tx - mouse.x) * 0.08;
    mouse.y += (mouse.ty - mouse.y) * 0.08;

    const cx = W / 2, cy = H / 2;
    const parX = (mouse.x - cx) / cx || 0; // -1..1
    const parY = (mouse.y - cy) / cy || 0;

    // stars
    for (const st of stars) {
      // parallax: near layers move more (reduced-motion이면 정지)
      const px = reduceMotion ? 0 : parX * st.layer * 20;
      const py = reduceMotion ? 0 : parY * st.layer * 14;

      // mouse repulsion (near stars only)
      if (!reduceMotion && !isMobile) {
        const dx = st.x + px - mouse.x;
        const dy = st.y + py - mouse.y;
        const dist2 = dx * dx + dy * dy;
        const R = 120;
        if (dist2 < R * R && dist2 > 0.01) {
          const dist = Math.sqrt(dist2);
          const f = ((R - dist) / R) * 16 * st.layer;
          st.ox += (dx / dist) * f * 0.12;
          st.oy += (dy / dist) * f * 0.12;
        }
      }
      st.ox *= 0.90;
      st.oy *= 0.90;

      if (!reduceMotion) st.tw += st.twSpeed * dt;
      const a = reduceMotion ? st.baseA : st.baseA * (0.7 + 0.3 * Math.sin(st.tw));

      ctx.globalAlpha = a;
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(st.x + px + st.ox, st.y + py + st.oy, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // shooting stars
    if (!reduceMotion && Math.random() < 0.0025 && shootingStars.length < 2) spawnShootingStar();
    shootingStars = shootingStars.filter(s => s.life > 0 && s.x < W + 100 && s.y < H + 100);
    for (const s of shootingStars) drawShootingStar(s);

    // 자동 미니 초신성 (18~30초 간격, 은은하게)
    if (!reduceMotion && tick - lastAutoNova > 18 + Math.random() * 12) {
      lastAutoNova = tick;
      spawnNova(Math.random() * W, Math.random() * H * 0.7, false);
    }

    // novae
    novae = novae.filter(nv => nv.t < NOVA_LIFE);
    for (const nv of novae) drawNova(nv, dt);

    rafId = requestAnimationFrame(frame);
  }

  /* ---------- 이벤트 ---------- */
  window.addEventListener("resize", resize);

  const glow = document.getElementById("cursor-glow");
  window.addEventListener("pointermove", (e) => {
    mouse.tx = e.clientX;
    mouse.ty = e.clientY;
    if (glow) {
      glow.style.left = e.clientX + "px";
      glow.style.top = e.clientY + "px";
      glow.style.opacity = "1";
    }
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    if (glow) glow.style.opacity = "0";
  });

  // 클릭 → 초신성 (인터랙티브 요소 클릭은 제외)
  window.addEventListener("click", (e) => {
    if (reduceMotion) return;
    if (e.target.closest("a, button, iframe, input, textarea, select, .lightbox, .nav, .gallery-item")) return;
    spawnNova(e.clientX, e.clientY, true);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(rafId); // 대기 중인 콜백 제거 — 루프 중복 방지
    } else if (!running) {
      running = true;
      lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  });

  resize();
  rafId = requestAnimationFrame(frame);

  // 페이지 로드 시 히어로 중앙에서 환영 초신성 한 번
  if (!reduceMotion) {
    setTimeout(() => spawnNova(W / 2, H * 0.38, true), 700);
  }
})();
