/* Hyunsu Park — photo journal
   photos.json 을 읽어 월별 '호(號)'로 묶어 갤러리를 그리고, 라이트박스를 띄운다. */

(function () {
  const grid = document.getElementById("zine");
  if (!grid) return;

  const MONTHS_KR = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  let flat = []; // 라이트박스 탐색용 평탄화 목록

  fetch("photos.json?" + Date.now())
    .then((r) => { if (!r.ok) throw new Error("no manifest"); return r.json(); })
    .then(render)
    .catch(() => {
      grid.innerHTML =
        '<div class="empty"><p>아직 사진이 없습니다.</p>' +
        '<p style="font-size:.95rem;margin-top:1rem">' +
        '<code>photos/</code> 폴더에 사진을 올리면 이곳에 자동으로 나타납니다.</p></div>';
    });

  function render(data) {
    const photos = (data && data.photos) || [];
    if (!photos.length) {
      grid.innerHTML = '<div class="empty"><p>아직 사진이 없습니다.</p></div>';
      return;
    }

    // 월별 묶기 (이미 최신순 정렬되어 들어옴)
    const groups = [];
    const idx = {};
    photos.forEach((p) => {
      if (!(p.month in idx)) { idx[p.month] = groups.length; groups.push({ month: p.month, items: [] }); }
      groups[idx[p.month]].items.push(p);
    });

    flat = photos.slice();
    const total = groups.length;

    groups.forEach((g, gi) => {
      const [y, m] = g.month.split("-");
      const issueNo = String(total - gi).padStart(2, "0");

      const section = document.createElement("section");
      section.className = "issue";
      section.innerHTML =
        '<div class="issue-head">' +
          '<span class="issue-no">NO. ' + issueNo + '</span>' +
          '<h2 class="issue-title">' + y + ' &middot; ' + MONTHS_KR[parseInt(m,10)-1] + '</h2>' +
          '<span class="issue-count">' + g.items.length + ' frames</span>' +
        '</div>';

      const gw = document.createElement("div");
      gw.className = "grid";

      g.items.forEach((p) => {
        const fig = document.createElement("figure");
        fig.className = "card";
        const ratio = (p.w && p.h) ? (p.w + " / " + p.h) : "3 / 2";
        const cap = p.caption
          ? '<figcaption>' + escapeHTML(p.caption) + '</figcaption>' : '';
        fig.innerHTML =
          '<div class="frame">' +
            '<img loading="lazy" src="' + p.thumb + '" alt="' +
            escapeHTML(p.caption || p.date) + '" style="aspect-ratio:' + ratio + '">' +
          '</div>' + cap +
          '<div class="meta">' + p.date.replace(/-/g, ".") + '</div>';
        fig.addEventListener("click", () => openLightbox(flat.indexOf(p)));
        gw.appendChild(fig);
      });

      section.appendChild(gw);
      grid.appendChild(section);
    });

    // 스크롤 진입 애니메이션
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    const cards = document.querySelectorAll(".card");
    cards.forEach((c, i) => {
      c.style.transitionDelay = (Math.min(i, 6) * 0.04) + "s";
      obs.observe(c);
    });
    // 안전장치: 어떤 이유로든 관찰을 놓친 카드도 반드시 보이게 한다.
    setTimeout(() => {
      document.querySelectorAll(".card:not(.in)").forEach((c) => c.classList.add("in"));
    }, 1600);
  }

  /* ---------- 라이트박스 ---------- */
  const lb = document.getElementById("lightbox");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");
  const lbMeta = document.getElementById("lb-meta");
  let cur = 0;

  function openLightbox(i) {
    cur = i;
    show();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }
  function show() {
    const p = flat[cur];
    lbImg.src = p.file;            // 라이트박스는 원본 표시
    lbImg.alt = p.caption || p.date;
    lbCap.textContent = p.caption || "";
    lbCap.style.display = p.caption ? "block" : "none";
    lbMeta.textContent = p.date.replace(/-/g, ".");
  }
  function step(d) { cur = (cur + d + flat.length) % flat.length; show(); }

  if (lb) {
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target === lbImg.parentElement) closeLightbox(); });
    document.getElementById("lb-close").addEventListener("click", closeLightbox);
    document.getElementById("lb-prev").addEventListener("click", (e) => { e.stopPropagation(); step(-1); });
    document.getElementById("lb-next").addEventListener("click", (e) => { e.stopPropagation(); step(1); });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
