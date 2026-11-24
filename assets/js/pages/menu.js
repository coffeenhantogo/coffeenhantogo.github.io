/* Menu page: drinks grouped, filter + search */
(() => {
  const N = window.NHAN;
  const drinks = N.PRODUCTS.filter((p) => p.type === "drink");
  const GROUPS = [
    { key: "ca-phe", title: "Cà phê Moka", desc: "Size Nhỏ 500ml · Lớn 700ml – đá hoặc nóng." },
    { key: "bac-xiu", title: "Bạc xỉu", desc: "Nhiều sữa, ít cà phê – đá hoặc nóng." },
    { key: "tra-sua", title: "Trà sữa & sữa", desc: "Chỉ phục vụ ly lớn 700ml." },
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

  const cardWithShort = N.card;

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
          <div class="menu-group-head"><span class="mg-no">0${GROUPS.findIndex((x) => x.key === g.key) + 1}</span><div class="mg-text"><h2>${g.title}</h2><p>${g.desc}</p></div><span class="mg-count">${g.items.length} món</span></div>
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

  /* price board (full menu + ground coffee) */
  const SMALL = "Nhỏ 500ml", LARGE = "Lớn 700ml";
  const cell = (v) => (v == null ? '<span class="na">—</span>' : `<b>${N.fmtVND(v)}</b>`);
  const row = (p) => {
    const s = p.priceBy ? p.priceBy[SMALL] : null;
    const l = p.priceBy ? p.priceBy[LARGE] : p.price;
    return `<tr><td><a href="${N.productUrl(p)}">${N.esc(p.name)}</a></td><td>${cell(s)}</td><td>${cell(l)}</td></tr>`;
  };
  const board = document.createElement("div");
  board.className = "price-board";
  const buildBoard = () => { board.innerHTML = `
    <h2>Bảng giá</h2>
    <p>Giá niêm yết tại quán (VNĐ).</p>
    <table class="price-table">
      <thead><tr><th>Món</th><th>Nhỏ 500ml</th><th>Lớn 700ml</th></tr></thead>
      <tbody>
        ${GROUPS.map((g) => `<tr class="grp"><td colspan="3">${g.title}</td></tr>${drinks.filter((d) => d.group === g.key).map(row).join("")}`).join("")}
      </tbody>
    </table>
    <table class="price-table">
      <thead><tr><th>Cà phê xay</th><th></th><th>Gói 1kg</th></tr></thead>
      <tbody>${N.PRODUCTS.filter((p) => p.type === "ground").map((p) => `<tr><td><a href="${N.productUrl(p)}">${N.esc(p.name.replace(/ – 1kg$/, ""))}</a></td><td></td><td>${cell(p.price)}</td></tr>`).join("")}</tbody>
    </table>`; };
  buildBoard();
  menuEl.after(board);
  N.anim([board], "up", { stagger: false });
  N.anim(".toolbar", "up", { stagger: false });
  render();
  // admin changed prices / sold-out items → refresh
  document.addEventListener("nhan:shop", () => { render(); buildBoard(); });
})();
