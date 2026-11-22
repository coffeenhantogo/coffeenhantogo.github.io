/* Shop page: ground + whole bean products with filters (state kept in URL) */
(() => {
  const N = window.NHAN;
  const all = N.PRODUCTS.filter((p) => p.type === "ground" || p.type === "bean");
  const grid = document.querySelector("[data-grid]");
  const countEl = document.querySelector("[data-count]");
  const qEl = document.querySelector("[data-q]");
  const beanEl = document.querySelector("[data-bean]");
  const sortEl = document.querySelector("[data-sort]");
  const titleEl = document.querySelector("[data-title]");
  const crumbEl = document.querySelector("[data-crumb]");
  const TITLES = {
    all: ["Cà phê <em>hạt &amp; rang xay</em>", "Sản phẩm"],
    "rang-xay": ["Cà phê <em>rang xay</em>", "Cà phê rang xay"],
    hat: ["Cà phê <em>hạt nguyên</em>", "Cà phê hạt"],
  };

  let type = ["rang-xay", "hat"].includes(N.params.get("loai")) ? N.params.get("loai") : "all";
  qEl.value = N.params.get("q") || "";
  beanEl.value = N.params.get("giong") || "";
  sortEl.value = N.params.get("sap-xep") || "featured";

  function syncUrl() {
    const u = new URL(location.href);
    const set = (k, v) => (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
    set("loai", type === "all" ? "" : type);
    set("q", qEl.value.trim());
    set("giong", beanEl.value);
    set("sap-xep", sortEl.value === "featured" ? "" : sortEl.value);
    history.replaceState(null, "", u);
  }

  function render() {
    document.querySelectorAll("[data-type]").forEach((c) => { const on = c.dataset.type === type; c.classList.toggle("is-active", on); c.setAttribute("aria-selected", on); });
    titleEl.innerHTML = TITLES[type][0];
    crumbEl.textContent = TITLES[type][1];
    document.title = `${TITLES[type][1] === "Sản phẩm" ? "Cà phê hạt & rang xay" : TITLES[type][1]} | Coffee Nhẫn To Go`;
    const q = N.norm(qEl.value.trim());
    let list = all.filter((p) =>
      (type === "all" || p.group === type) &&
      (!beanEl.value || p.bean === beanEl.value) &&
      (!q || N.norm(`${p.name} ${p.short} ${p.bean}`).includes(q)));
    if (sortEl.value === "az") list = list.slice().sort((a, b) => a.name.localeCompare(b.name, "vi"));
    else if (sortEl.value === "za") list = list.slice().sort((a, b) => b.name.localeCompare(a.name, "vi"));
    else list = list.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    countEl.textContent = `${list.length} sản phẩm`;
    grid.innerHTML = list.length
      ? list.map((p) => N.card(p).replace('<p class="p-price">', `<p class="p-short">${N.esc(p.short)}</p><p class="p-price">`)).join("")
      : `<div class="empty-state"><b>Không có sản phẩm phù hợp</b>Hãy bỏ bớt bộ lọc hoặc thử từ khóa khác.</div>`;
    N.anim(grid.querySelectorAll(".p-card"), "up", { mod: 4 });
    syncUrl();
  }
  document.querySelector("[data-type-filters]").addEventListener("click", (e) => { const c = e.target.closest("[data-type]"); if (c) { type = c.dataset.type; render(); } });
  qEl.addEventListener("input", render);
  beanEl.addEventListener("change", render);
  sortEl.addEventListener("change", render);
  N.anim(".toolbar", "up", { stagger: false });
  N.anim(".section-head", "blur", { stagger: false });
  render();
})();
