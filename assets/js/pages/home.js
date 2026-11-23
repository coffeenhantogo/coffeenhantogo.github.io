/* Home page */
(() => {
  const N = window.NHAN;

  /* product grids */
  const beansGrid = document.querySelector('[data-grid="beans"]');
  const renderBeans = (group) => {
    const type = group === "hat" ? "bean" : "ground";
    beansGrid.innerHTML = N.PRODUCTS.filter((p) => p.type === type).slice(0, 5).map(N.card).join("");
    N.anim(beansGrid.querySelectorAll(".p-card"), "up");
  };
  renderBeans("rang-xay");
  const drinksGrid = document.querySelector('[data-grid="drinks"]');
  drinksGrid.innerHTML = N.PRODUCTS.filter((p) => p.type === "drink" && p.featured).slice(0, 5).map(N.card).join("");
  N.anim(drinksGrid.querySelectorAll(".p-card"), "up");
  const postsGrid = document.querySelector('[data-grid="posts"]');
  postsGrid.innerHTML = N.ARTICLES.slice(0, 3).map(N.postCard).join("");

  /* tabs */
  const title = document.querySelector("[data-products-title]");
  document.querySelectorAll("[data-tab]").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((x) => { const on = x === t; x.classList.toggle("is-active", on); x.setAttribute("aria-selected", on); });
    title.textContent = t.dataset.tab === "hat" ? "Cà Phê Hạt" : "Cà Phê Rang Xay";
    renderBeans(t.dataset.tab);
  }));

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
  // word-by-word title reveal + subtle mouse parallax on the background photo
  document.querySelectorAll(".hero-title").forEach(N.splitWords);
  if (!N.STATIC && !reduced && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty("--px", `${(-x * 22).toFixed(1)}px`);
      hero.style.setProperty("--py", `${(-y * 14).toFixed(1)}px`);
    });
    hero.addEventListener("pointerleave", () => { hero.style.setProperty("--px", "0px"); hero.style.setProperty("--py", "0px"); });
  }
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
