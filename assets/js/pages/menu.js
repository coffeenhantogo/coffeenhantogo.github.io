/* Menu page: drinks grouped, filter + search */
(() => {
  const N = window.NHAN;
  const drinks = N.PRODUCTS.filter((p) => p.type === "drink");
  const GROUPS = [
    { key: "phin", title: "Cà phê phin", desc: "Pha phin truyền thống, đậm đà – nóng hoặc đá." },
    { key: "dac-biet", title: "Đặc biệt", desc: "Những món được yêu thích nhất của Nhẫn." },
  ];
  const filtersEl = document.querySelector("[data-filters]");
  const menuEl = document.querySelector("[data-menu]");
  const qEl = document.querySelector("[data-q]");
  let active = N.params.get("nhom") || "all";

  const chips = [{ key: "all", title: "Tất cả" }, ...GROUPS];
  filtersEl.innerHTML = chips.map((g) => {
    const n = g.key === "all" ? drinks.length : drinks.filter((d) => d.group === g.key).length;
    return `<button class="fchip" role="tab" data-g="${g.key}">${g.title}<small>${n}</small></button>`;
  }).join("");

  const cardWithShort = (p) => N.card(p).replace('<p class="p-price">', `<p class="p-short">${N.esc(p.short)}</p><p class="p-price">`);

  function render() {
    filtersEl.querySelectorAll(".fchip").forEach((c) => { const on = c.dataset.g === active; c.classList.toggle("is-active", on); c.setAttribute("aria-selected", on); });
    const q = N.norm(qEl.value.trim());
    const match = (p) => !q || N.norm(`${p.name} ${p.short}`).includes(q);
    const groups = GROUPS.filter((g) => active === "all" || g.key === active)
      .map((g) => ({ ...g, items: drinks.filter((d) => d.group === g.key && match(d)) }))
      .filter((g) => g.items.length);
    menuEl.innerHTML = groups.length
      ? groups.map((g) => `
        <div class="menu-group">
          <div class="menu-group-head"><h2>${g.title}</h2><p>${g.desc}</p></div>
          <div class="grid-4">${g.items.map(cardWithShort).join("")}</div>
        </div>`).join("")
      : `<div class="empty-state"><b>Không tìm thấy món phù hợp</b>Thử từ khóa khác hoặc gọi ${N.STORE.phoneDisplay} để được tư vấn.</div>`;
    N.anim(menuEl.querySelectorAll(".menu-group-head"), "blur", { stagger: false });
    N.anim(menuEl.querySelectorAll(".p-card"), "up", { mod: 4 });
  }
  filtersEl.addEventListener("click", (e) => {
    const c = e.target.closest("[data-g]");
    if (!c) return;
    active = c.dataset.g;
    const u = new URL(location.href);
    active === "all" ? u.searchParams.delete("nhom") : u.searchParams.set("nhom", active);
    history.replaceState(null, "", u);
    render();
  });
  qEl.addEventListener("input", render);
  N.anim(".toolbar", "up", { stagger: false });
  render();
})();
