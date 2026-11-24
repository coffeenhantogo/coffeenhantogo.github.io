/* Home page */
(() => {
  const N = window.NHAN;

  /* product grids */
  const groundGrid = document.querySelector('[data-grid="ground"]');
  const drinksGrid = document.querySelector('[data-grid="drinks"]');
  const ICO = {
    bag: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 7h12l1 13H5z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M8 7h7M8 11h5"/></svg>',
  };
  // "Cà phê xay Đặc biệt – 1kg" → tier "Đặc biệt", title "Cà phê xay Đặc biệt"
  const tierOf = (p) => p.name.replace(/^Cà phê xay\s*/i, "").replace(/\s*–\s*1kg$/i, "");
  const titleOf = (p) => p.name.replace(/\s*–\s*1kg$/i, "");
  const groundCard = (p) => `
    <article class="gx-card${p.badge ? " is-special" : ""}${p.soldOut ? " is-soldout" : ""}">
      <a class="gx-media p-media-wrap" href="${N.productUrl(p)}" aria-label="Xem chi tiết ${N.esc(titleOf(p))}">
        <span class="p-media"><img src="${N.img(p.img)}" alt="${N.esc(p.name)}" loading="lazy"></span>
        ${p.soldOut ? `<span class="gx-ribbon is-out">Tạm hết</span>` : p.badge ? `<span class="gx-ribbon">Dòng ${N.esc(p.badge)}</span>` : ""}
        <span class="gx-stamp" aria-hidden="true"><b>1</b>kg</span>
        <span class="gx-tier"><small>Cà phê xay</small>${N.esc(tierOf(p))}</span>
      </a>
      <div class="gx-body">
        <h3><a href="${N.productUrl(p)}">${N.esc(titleOf(p))}</a></h3>
        <p class="gx-desc">${N.esc(p.desc || p.short)}</p>
        <ul class="gx-specs">
          <li><small>Khối lượng</small><b>1kg / gói</b></li>
          <li><small>Dạng</small><b>Xay sẵn</b></li>
          <li><small>Nhận hàng</small><b>Tại quán · Giao</b></li>
        </ul>
        <div class="gx-buy">
          <div class="gx-price">
            <small>Giá gói 1kg</small>
            <b>${p.price != null ? N.fmtVND(p.price) : "Liên hệ"}</b>
            ${p.price != null ? `<em>≈ ${N.fmtVND(Math.round(p.price / 10))} / 100g</em>` : ""}
          </div>
          <div class="gx-actions">
            ${p.soldOut
              ? `<button class="btn btn-outline" type="button" disabled>Tạm hết hàng</button>`
              : `<button class="btn btn-lime" type="button" data-add="${p.id}">${N.IC.plus} Thêm vào giỏ</button>`}
            <a class="gx-link" href="${N.productUrl(p)}">Chi tiết <span aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
    </article>`;
  const renderProducts = () => {
    groundGrid.innerHTML = N.PRODUCTS.filter((p) => p.type === "ground").map(groundCard).join("");
    drinksGrid.innerHTML = N.PRODUCTS.filter((p) => p.type === "drink" && p.featured).slice(0, 5).map(N.card).join("");
  };
  renderProducts();
  // support strip under the ground-coffee cards
  groundGrid.insertAdjacentHTML("afterend", `
    <div class="gx-notes">
      <div class="gx-note"><i>${ICO.bag}</i><span><b>Đóng gói 1kg</b><small>Tiện dùng cho gia đình và quán</small></span></div>
      <div class="gx-note gx-note-bulk"><i>${ICO.phone}</i><span><b>Mua số lượng lớn?</b><small>Tư vấn giá cho quán, văn phòng</small>
        <span class="gx-note-btns"><a href="tel:${N.STORE.phone}">Gọi ${N.STORE.phoneDisplay}</a><a href="${N.STORE.zalo}" target="_blank" rel="noopener">Nhắn Zalo</a></span></span></div>
      <a class="gx-note gx-note-link" href="bai-viet-chi-tiet.html?slug=bi-quyet-pha-ca-phe-phin"><i>${ICO.book}</i><span><b>Hướng dẫn pha phin</b><small>Pha ngon tại nhà như ở quán</small></span><em class="gx-go" aria-hidden="true">→</em></a>
    </div>`);
  N.anim(groundGrid.querySelectorAll(".gx-card"), "up");
  N.anim(document.querySelectorAll(".gx-note"), "up");
  N.anim(drinksGrid.querySelectorAll(".p-card"), "up");
  document.addEventListener("nhan:shop", () => { renderProducts(); N.anim(groundGrid.querySelectorAll(".gx-card"), "up"); N.anim(drinksGrid.querySelectorAll(".p-card"), "up"); });
  const postsGrid = document.querySelector('[data-grid="posts"]');
  postsGrid.innerHTML = N.ARTICLES.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map(N.postCard).join("");


  /* hero carousel */
  const slides = [...document.querySelectorAll("[data-slide]")];
  const dotsWrap = document.querySelector(".hero-dots");
  let current = 0, timer = null;
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.setAttribute("role", "tab"); b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.addEventListener("click", () => { go(i); restart(); });
    dotsWrap.appendChild(b);
  });
  const dots = [...dotsWrap.children];
  function go(i) {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => {
      s.classList.toggle("is-active", k === current);
      s.setAttribute("aria-hidden", k !== current);
      if (k === current) { const im = s.querySelector(".slide-bg"); if (im) im.loading = "eager"; }
    });
    dots.forEach((d, k) => d.setAttribute("aria-selected", k === current));
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function restart() { clearInterval(timer); if (!N.STATIC && !reduced) timer = setInterval(() => go(current + 1), 6500); }
  document.querySelectorAll(".hero-arrow").forEach((b) => b.addEventListener("click", () => { go(current + Number(b.dataset.dir)); restart(); }));
  const hero = document.querySelector(".hero");
  let sx = null;
  hero.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener("touchend", (e) => {
    if (sx == null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); restart(); }
    sx = null;
  });
  // word-by-word title reveal (the mouse parallax on the photo was removed: it exposed the edges)
  document.querySelectorAll(".hero-title").forEach(N.splitWords);
  go(Math.max(0, Math.min(slides.length - 1, parseInt(N.params.get("slide") || "1", 10) - 1)));
  restart();
  addEventListener("load", () => slides.forEach((s) => { const im = s.querySelector(".slide-bg"); if (im) im.loading = "eager"; }));

  /* scroll animations */
  N.anim(".usp-item", "up", { mod: 4 });
  N.anim(".section-head", "blur", { stagger: false });
  N.anim(".tile", "clip", { mod: 3 });
  N.anim(".about-left", "left", { stagger: false });
  N.anim(".about-right", "right", { stagger: false });
  N.anim(".post", "up", { mod: 3 });
  N.anim(".section-more", "up", { stagger: false });
})();
