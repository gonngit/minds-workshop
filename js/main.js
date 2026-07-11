/* ============================================================
   main.js — 카운트다운 / 리빌 / 지도 탭 / 갤러리 / 라이트박스
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 내비게이션 스크롤 상태 ---------- */
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 30);
  }, { passive: true });

  /* ---------- 스크롤 리빌 ---------- */
  const revealEls = document.querySelectorAll(".reveal, .tl-item");
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        io.unobserve(en.target);
      }
    }
  }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
  revealEls.forEach(el => io.observe(el));

  /* ---------- D-DAY 카운트다운 ---------- */
  const START = new Date("2026-07-28T11:00:00+09:00").getTime();
  const END = new Date("2026-07-29T12:00:00+09:00").getTime();
  const cdD = document.getElementById("cd-d");
  const cdH = document.getElementById("cd-h");
  const cdM = document.getElementById("cd-m");
  const cdS = document.getElementById("cd-s");
  const cdStatus = document.getElementById("cd-status");

  function pad(n) { return String(n).padStart(2, "0"); }

  function updateCountdown() {
    const now = Date.now();
    if (now >= START && now <= END) {
      cdD.textContent = cdH.textContent = cdM.textContent = cdS.textContent = "00";
      cdStatus.textContent = "✦ 워크숍 진행 중 ✦";
      return;
    }
    if (now > END) {
      cdD.textContent = cdH.textContent = cdM.textContent = cdS.textContent = "00";
      cdStatus.textContent = "워크숍이 종료되었습니다. 감사합니다!";
      return;
    }
    const diff = START - now;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    cdD.textContent = pad(d);
    cdH.textContent = pad(h);
    cdM.textContent = pad(m);
    cdS.textContent = pad(s);
    cdStatus.textContent = "워크숍 시작까지";
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- 지도 ---------- */
  const MAPS = {
    b104: {
      title: "UNIST 104동 · 제2공학관",
      room: "E205호",
      label: "104동 E205",
      lat: 35.57228, lng: 129.19028, // 플러스코드 H5CR+W4
      query: "UNIST 제2공학관",
      naver: "https://map.naver.com/p/search/" + encodeURIComponent("울산과학기술원제2공학관")
    },
    b112: {
      title: "UNIST 112동 · 제5공학관",
      room: "I101호",
      label: "112동 I101",
      lat: 35.57156, lng: 129.18756, // 플러스코드 H5CQ+J2
      // "UNIST 제5공학관"으론 구글이 못 찾음 → 등록된 장소명+주소로 검색해야 카드가 뜸
      query: "제5공학관, 울산광역시 울주군 언양읍 반연리 334-1",
      open: "제5공학관, 울산광역시 울주군 언양읍 반연리 334-1",
      naver: "https://map.naver.com/p/search/" + encodeURIComponent("울산과학기술원제5공학관")
    },
    b106: {
      title: "UNIST 106동 · 제3공학관",
      room: "501-10호",
      label: "106동 501-10",
      lat: 35.57219, lng: 129.18953, // 플러스코드 H5CQ+VR
      // 이름만 검색하면 결과 2개로 핀이 밀림 → 주소를 붙여 유일한 장소로 고정
      query: "UNIST 제3공학관, 울산광역시 울주군 언양읍 반연리 154-4",
      open: "UNIST 제3공학관, 울산광역시 울주군 언양읍 반연리 154-4",
      naver: "https://map.naver.com/p/search/" + encodeURIComponent("울산과학기술원제3공학관")
    },
    dinner: {
      title: "허고개 소도둑 구영점",
      room: "저녁 식사",
      label: "저녁 식사",
      lat: 35.56717, lng: 129.24500,
      query: "울산 울주군 범서읍 구영리 394-15",
      naver: "https://naver.me/FXwNbhMC"
    }
  };

  const iframe = document.getElementById("map-iframe");
  const naverMapEl = document.getElementById("naver-map");
  const mapTitle = document.getElementById("map-title");
  const mapOpen = document.getElementById("map-open");
  const mapNaver = document.getElementById("map-naver");
  const tabs = document.querySelectorAll(".map-tab");

  let naverMap = null;
  let currentKey = "b104";
  const naverMarkers = {};

  function embedUrl(query) {
    return "https://www.google.com/maps?q=" + encodeURIComponent(query) + "&z=17&hl=ko&output=embed";
  }
  function openUrl(query) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query);
  }

  function markerContent(m, active) {
    return '<div class="nv-marker' + (active ? " active" : "") + '">' + m.label + "</div>";
  }

  function initNaverMap() {
    const first = MAPS.b104;
    naverMap = new naver.maps.Map("naver-map", {
      center: new naver.maps.LatLng(first.lat, first.lng),
      zoom: 16,
      mapDataControl: false,
      scaleControl: false
    });
    for (const key of Object.keys(MAPS)) {
      const m = MAPS[key];
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(m.lat, m.lng),
        map: naverMap,
        icon: {
          content: markerContent(m, key === "b104"),
          anchor: new naver.maps.Point(0, 34)
        }
      });
      naver.maps.Event.addListener(marker, "click", () => selectMap(key));
      naverMarkers[key] = marker;
    }
    iframe.hidden = true;
    iframe.removeAttribute("src");
    naverMapEl.hidden = false;
  }

  // Client ID가 있으면 네이버 지도 로드, 실패/부재 시 구글 임베드 폴백
  if (typeof NAVER_MAP_CLIENT_ID !== "undefined" && NAVER_MAP_CLIENT_ID) {
    window.navermap_authFailure = function () {
      naverMap = null;
      naverMapEl.hidden = true;
      iframe.hidden = false;
      selectMap(currentKey);
    };
    const s = document.createElement("script");
    s.src = "https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=" + encodeURIComponent(NAVER_MAP_CLIENT_ID);
    s.onload = () => { initNaverMap(); selectMap(currentKey); };
    s.onerror = () => window.navermap_authFailure();
    document.head.appendChild(s);
  }

  function selectMap(key) {
    const m = MAPS[key];
    if (!m) return;
    currentKey = key;

    if (naverMap) {
      naverMap.panTo(new naver.maps.LatLng(m.lat, m.lng));
      if (naverMap.getZoom() < 16) naverMap.setZoom(16, true);
      for (const k of Object.keys(naverMarkers)) {
        naverMarkers[k].setIcon({
          content: markerContent(MAPS[k], k === key),
          anchor: new naver.maps.Point(0, 34)
        });
        naverMarkers[k].setZIndex(k === key ? 100 : 10);
      }
    } else {
      // src 재할당은 히스토리 항목을 쌓아 뒤로가기를 망가뜨림 → replace 사용
      const url = embedUrl(m.query);
      try {
        iframe.contentWindow.location.replace(url);
      } catch (err) {
        iframe.src = url;
      }
      iframe.title = m.title + " 지도";
    }

    mapTitle.innerHTML = m.title + ' <span class="room-badge mono">' + m.room + "</span>";
    mapOpen.href = openUrl(m.open || m.query);
    mapNaver.hidden = !m.naver;
    if (m.naver) mapNaver.href = m.naver;
    tabs.forEach(t => {
      const on = t.dataset.map === key;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
  }

  tabs.forEach(t => t.addEventListener("click", () => selectMap(t.dataset.map)));

  // 일정/히어로의 장소 칩 → 지도 섹션으로 스크롤 + 해당 위치 선택
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".place-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      selectMap(chip.dataset.map);
      document.getElementById("venue").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  selectMap("b104");

  /* ---------- 갤러리 ---------- */
  const grid = document.getElementById("gallery-grid");
  const empty = document.getElementById("gallery-empty");
  const photos = (typeof GALLERY !== "undefined" && Array.isArray(GALLERY)) ? GALLERY : [];

  if (photos.length === 0) {
    empty.hidden = false;
  } else {
    for (const p of photos) {
      const item = document.createElement("figure");
      item.className = "gallery-item";
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", (p.caption || "워크숍 사진") + " 크게 보기");
      const img = document.createElement("img");
      img.src = p.src;
      img.alt = p.caption || "워크숍 사진";
      img.loading = "lazy";
      item.appendChild(img);
      if (p.caption) {
        const cap = document.createElement("figcaption");
        cap.className = "cap";
        cap.textContent = p.caption;
        item.appendChild(cap);
      }
      item.addEventListener("click", () => openLightbox(p));
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openLightbox(p);
        }
      });
      grid.appendChild(item);
    }
  }

  /* ---------- 오럴 발표자 ---------- */
  const oralList = document.getElementById("oral-list");
  const orals = (typeof ORAL !== "undefined" && Array.isArray(ORAL)) ? ORAL : [];

  function initial(name) {
    const s = (name || "").trim();
    return s ? s.charAt(0) : "✦";
  }

  if (oralList) {
    orals.forEach((p, i) => {
      const card = document.createElement("article");
      card.className = "oral-card reveal";

      // 이니셜 플레이스홀더 (사진 없거나 로드 실패 시 표시)
      const ph = document.createElement("div");
      ph.className = "oral-photo placeholder";
      ph.textContent = initial(p.name);
      ph.setAttribute("aria-hidden", "true");

      // 사진 (파일 있으면 표시, 없거나 404면 플레이스홀더 유지)
      if (p.photo) {
        const img = document.createElement("img");
        img.className = "oral-photo";
        img.src = p.photo;
        img.alt = (p.name || "발표자") + " 사진";
        img.loading = "lazy";
        img.onerror = () => { img.replaceWith(ph); };
        card.appendChild(img);
      } else {
        card.appendChild(ph);
      }

      // 본문
      const body = document.createElement("div");
      body.className = "oral-body";
      body.innerHTML =
        '<p class="oral-num mono">ORAL ' + (i + 1) + '</p>' +
        '<p class="oral-name"></p>' +
        '<p class="oral-affil"></p>' +
        (p.title
          ? '<p class="oral-title"></p>'
          : '<p class="oral-title tbd">발표 제목 추후 공개</p>') +
        (p.summary ? '<p class="oral-summary"></p>' : "");
      body.querySelector(".oral-name").textContent = p.name || ("발표자 " + (i + 1));
      body.querySelector(".oral-affil").textContent = p.affil || "";
      if (p.title) body.querySelector(".oral-title").textContent = p.title;
      if (p.summary) body.querySelector(".oral-summary").textContent = p.summary;
      card.appendChild(body);

      // 발표자료 버튼
      const action = document.createElement("div");
      action.className = "oral-action";
      if (p.pdf) {
        const a = document.createElement("a");
        a.className = "oral-pdf ready";
        a.href = p.pdf;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "발표자료 (PDF) ↗";
        action.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.className = "oral-pdf disabled";
        span.textContent = "발표자료 준비 중";
        action.appendChild(span);
      }
      card.appendChild(action);

      oralList.appendChild(card);
      io.observe(card); // 동적 생성 카드도 스크롤 리빌 대상에 등록
    });
  }

  /* ---------- 라이트박스 ---------- */
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCaption = document.getElementById("lb-caption");
  const lbClose = document.getElementById("lb-close");

  let lbReturnFocus = null;

  function openLightbox(p) {
    lbImg.src = p.src;
    lbImg.alt = p.caption || "워크숍 사진";
    lbCaption.textContent = p.caption || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lbReturnFocus = document.activeElement;
    lbClose.focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    lbImg.src = "";
    document.body.style.overflow = "";
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
  }
  lbClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    // 닫기 버튼이 유일한 포커스 대상 — Tab이 뒤 문서로 새지 않게 가둠
    if (e.key === "Tab") {
      e.preventDefault();
      lbClose.focus();
    }
  });

  /* ---------- 카드 hover 글로우 좌표 ---------- */
  document.querySelectorAll(".school-card").forEach(card => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
})();
