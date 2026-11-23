/* Shop page: all products with group filter, search, sort (state kept in URL) */
(() => {
  const N = window.NHAN;
  const all = N.PRODUCTS;
  const GROUPS = [
    { key: "all", label: "Tất cả", title: "Tất cả <em>sản phẩm</em>", crumb: "Sản phẩm" },
    { key: "ca-phe", label: "Cà phê Moka", title: "Cà phê <em>Moka</em>", crumb: "Cà phê Moka" },
    { key: "bac-xiu", label: "Bạc xỉu", title: "<em>Bạc xỉu</em>", crumb: "Bạc xỉu" },
    { key: "tra-sua", label: "Trà sữa & sữa", title: "Trà sữa <em>&amp; sữa</em>", crumb: "Trà sữa & sữa" },
    { key: "ca-phe-xay", label: "Cà phê xay 1kg", title: "Cà phê <em>xay</em>", crumb: "Cà phê xay" },
  ];
  const grid = document.querySelector("[data-grid]");
  const countEl = document.querySelector("[data-count]");
  const qEl = document.querySelector("[data-q]");
  const sortEl = document.querySelector("[data-sort]");
  const filtersEl = document.querySelector("[data-type-filters]");
  const titleEl = document.querySelector("[data-title]");
  const crumbEl = document.querySelector("[data-crumb]");
  const minPrice = (p) => (p.priceBy ? Math.min(...Object.values(p.priceBy)) : p.price ?? Infinity);

  let type = GROUPS.some((g) => g.key === N.params.get("loai")) ? N.params.get("loai") : "all";
  qEl.value = N.params.get("q") || "";
  sortEl.value = N.params.get("sap-xep") || "featured";

  filtersEl.innerHTML = GROUPS.map((g) => {
    const n = g.key === "all" ? all.length : all.filter((p) => p.group === g.key).length;
    return `<button class="fchip" role="tab" data-type="${g.key}">${N.esc(g.label)}<small>${n}</small></button>`;
  }).join("");

  function syncUrl() {
    const u = new URL(location.href);
    const set = (k, v) => (v ? u.searchParams.set(k, v) : u.searchParams.delete(k));
    set("loai", type === "all" ? "" : type);
    set("q", qEl.value.trim());
    set("sap-xep", sortEl.value === "featured" ? "" : sortEl.value);
    history.replaceState(null, "", u);
  }

  function render() {
    const g = GROUPS.find((x) => x.key === type);
    filtersEl.querySelectorAll("[data-type]").forEach((c) => { const on = c.dataset.type === type; c.classList.toggle("is-active", on); c.setAttribute("aria-selected", on); });
    titleEl.innerHTML = g.title;
    crumbEl.textContent = g.crumb;
    document.title = `${g.crumb} | Coffee Nhẫn To Go`;
    const q = N.norm(qEl.value.trim());
    let list = all.filter((p) => (type === "all" || p.group === type) && (!q || N.norm(`${p.name} ${p.short} ${p.cat}`).includes(q)));
    const s = sortEl.value;
    if (s === "az") list = list.slice().sort((a, b) => a.name.localeCompare(b.name, "vi"));
    else if (s === "price-asc") list = list.slice().sort((a, b) => minPrice(a) - minPrice(b));
    else if (s === "price-desc") list = list.slice().sort((a, b) => minPrice(b) - minPrice(a));
    else list = list.slice().sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    countEl.textContent = `${list.length} sản phẩm`;
    grid.innerHTML = list.length
      ? list.map(N.card).join("")
      : `<div class="empty-state"><b>Không có sản phẩm phù hợp</b>Hãy thử từ khóa khác.</div>`;
    N.anim(grid.querySelectorAll(".p-card"), "up", { mod: 4 });
    syncUrl();
  }
  filtersEl.addEventListener("click", (e) => { const c = e.target.closest("[data-type]"); if (c) { type = c.dataset.type; render(); } });
  qEl.addEventListener("input", render);
  sortEl.addEventListener("change", render);
  N.anim(".toolbar", "up", { stagger: false });
  render();
})();
