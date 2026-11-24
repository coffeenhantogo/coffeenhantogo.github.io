/* =========================================================
   Coffee Nhẫn To Go — shared site script (all pages)
   Renders header/footer/overlays, cart (with options), option picker,
   search, scroll animations, toast, order submission helpers.
   Requires data.js loaded first. Page scripts use window.NHAN.
   ========================================================= */
(() => {
  "use strict";
  const N = window.NHAN;
  const S = N.STORE;
  const params = new URLSearchParams(location.search);
  const STATIC = params.has("shot");
  if (STATIC) document.documentElement.classList.add("static");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const page = document.body.dataset.page || "";
  // Public site root. Home links use "./" online (→ https://coffeenhantogo.github.io/), "index.html" when opened from disk.
  const SITE_URL = "https://coffeenhantogo.github.io/";
  const ONLINE = /^https?:$/.test(location.protocol);
  const HOME = ONLINE ? "./" : "index.html";
  N.SITE_URL = SITE_URL; N.HOME = HOME;

  /* ---------- utils ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtVND = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
  const img = (name) => `assets/img/photos/${name}.jpg`;
  const byId = Object.fromEntries(N.PRODUCTS.map((p) => [p.id, p]));
  const productUrl = (p) => `san-pham-chi-tiet.html?id=${encodeURIComponent(p.id)}`;
  const unitPrice = (p, opts = {}) => {
    if (p.priceBy) { for (const v of Object.values(opts)) if (p.priceBy[v] != null) return p.priceBy[v]; }
    return p.price ?? null;
  };
  const priceText = (p, opts) => {
    const v = unitPrice(p, opts);
    if (v != null) return fmtVND(v);
    if (!opts && p.priceBy) { const vals = Object.values(p.priceBy); return `Từ ${fmtVND(Math.min(...vals))}`; }
    return "Liên hệ";
  };
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const optSummary = (opts = {}) => Object.values(opts).filter(Boolean).join(" · ");
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* unavailable */ } },
  };
  Object.assign(N, { esc, fmtVND, img, byId, productUrl, unitPrice, priceText, norm, optSummary, store, STATIC, params });

  /* ---------- icons ---------- */
  const IC = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="currentColor"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9c0-3 2-5 4-5l2 4-2 1.5c1 2.5 3 4.5 5.5 5.5L14 13l4 2c0 2-2 4-5 4C7.5 19 3 14.5 3 9z" fill="currentColor"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 8h14l-1.2 12H6.2L5 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8h6M9 12h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  IC.user = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="12" cy="8.5" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  N.IC = IC;

  /* ---------- layout: header / footer / overlays ---------- */
  const NAV = [
    { href: HOME, label: "Trang chủ", key: "home" },
    { href: "thuc-don.html", label: "Thực đơn", key: "menu" },
    { href: "san-pham.html", label: "Sản phẩm", key: "shop", sub: [
      { href: "san-pham.html?loai=ca-phe-xay", label: "Cà phê xay (gói 1kg)" },
      { href: "san-pham.html?loai=tra-sua", label: "Trà sữa & sữa" },
      { href: "thuc-don.html", label: "Đồ uống pha sẵn" },
    ] },
    { href: "bai-viet.html", label: "Bài viết", key: "blog" },
    { href: "ve-chung-toi.html", label: "Về chúng tôi", key: "about" },
    { href: "lien-he.html", label: "Liên hệ", key: "contact" },
  ];
  const isCurrent = (k) => (k === page || (k === "shop" && page === "product") || (k === "blog" && page === "article"));

  const headerHTML = `
  <a class="skip-link" href="#main">Bỏ qua tới nội dung chính</a>
  <div class="topbar">
    <div class="container topbar-inner">
      <span class="tb-item hide-md">${IC.pin} 351 Minh Phụng &nbsp;·&nbsp; 26B/4 Lạc Long Quân, TP.HCM</span>
      <span class="tb-slogan">Drink to be happy</span>
      <span class="tb-right hide-md">
        <a class="tb-item" href="mailto:${S.email}">${IC.mail} ${S.email}</a>
        <a class="tb-item" href="tel:${S.phone}">${IC.phone} ${S.phoneDisplay}</a>
      </span>
    </div>
  </div>
  <header class="header" id="top">
    <div class="container header-inner">
      <button class="icon-btn menu-toggle" aria-label="Mở menu" aria-expanded="false" aria-controls="mobileNav" data-open="mobileNav">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      <a class="brand" href="${HOME}" aria-label="${S.name} – Trang chủ">
        <img class="brand-badge" src="assets/img/logo-badge.png" alt="Logo Coffee Nhẫn To Go – Drink to be happy" width="64" height="64">
      </a>
      <nav class="nav" aria-label="Điều hướng chính">
        <ul>
          ${NAV.filter((n) => n.key !== "home").map((n) => `
            <li class="${n.sub ? "has-sub" : ""}">
              <a href="${n.href}" class="${isCurrent(n.key) ? "is-current" : ""}" ${isCurrent(n.key) ? 'aria-current="page"' : ""}>${n.label}${n.sub ? " " + IC.chev : ""}</a>
              ${n.sub ? `<ul class="sub">${n.sub.map((s) => `<li><a href="${s.href}">${s.label}</a></li>`).join("")}</ul>` : ""}
            </li>`).join("")}
        </ul>
      </nav>
      <div class="header-actions">
        <div class="ha-group">
          <button class="icon-btn round hb-search" data-tip="Tìm kiếm" aria-label="Tìm kiếm sản phẩm" data-open="searchModal">${IC.search}</button>
          <a class="icon-btn round hide-sm hb-orders" data-tip="Đơn hàng" href="don-hang.html" aria-label="Đơn hàng của tôi">${IC.receipt}</a>
          <a class="icon-btn round hb-user" data-tip="Đăng nhập" href="dang-nhap.html" aria-label="Đăng nhập / Tài khoản" data-account-link>${IC.user}</a>
          <button class="icon-btn round cart-btn" data-tip="Giỏ hàng" aria-label="Giỏ hàng" data-open="cartDrawer">${IC.bag}<span class="cart-count" data-cart-count hidden>0</span></button>
        </div>
        <a class="btn-order" href="thuc-don.html"><span>Đặt hàng</span><i class="bo-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></i></a>
      </div>
    </div>
  </header>`;

  const B = S.bank;
  const footerHTML = `
  <footer class="footer" id="contact">
    <div class="footer-main">
      <div class="container footer-grid">
        <div class="f-brand">
          <a href="${HOME}" class="f-logo" aria-label="${S.name} – Trang chủ">
            <img class="footer-badge" src="assets/img/logo-badge.png" alt="Logo Coffee Nhẫn To Go" width="76" height="76" loading="lazy">
            <span><b>COFFEE NHẪN</b><small>TO GO · Cà phê mang đi</small></span>
          </a>
          <p>Cà phê Moka, bạc xỉu, trà sữa mang đi và cà phê xay gói 1kg. Pha chậm bằng sự kiên nhẫn – uống để hạnh phúc.</p>
          <img class="footer-slogan" src="assets/img/drink-to-be-happy.png" alt="Drink to be happy" width="210" height="40" loading="lazy">
          <div class="f-social">
            <a href="${S.zalo}" target="_blank" rel="noopener" aria-label="Zalo">Zalo</a>
            <a href="tel:${S.phone}" aria-label="Gọi điện">${IC.phone}</a>
            <a href="mailto:${S.email}" aria-label="Email">${IC.mail}</a>
          </div>
        </div>
        <div>
          <h4>Khám phá</h4>
          <ul class="links">
            <li><a href="thuc-don.html">Thực đơn đồ uống</a></li>
            <li><a href="san-pham.html">Tất cả sản phẩm</a></li>
            <li><a href="san-pham.html?loai=ca-phe-xay">Cà phê xay 1kg</a></li>
            <li><a href="bai-viet.html">Góc cà phê</a></li>
            <li><a href="don-hang.html">Đơn hàng của tôi</a></li>
            <li><a href="chinh-sach.html">Chính sách mua hàng</a></li>
          </ul>
        </div>
        <div>
          <h4>Cửa hàng</h4>
          <ul class="contact">
            ${S.branches.map((b) => `<li>${IC.pin}<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.mapQuery)}" target="_blank" rel="noopener"><b>${b.name}</b><br>${b.address}</a></li>`).join("")}
            <li>${IC.phone}<span><a href="tel:${S.phone}">${S.phoneDisplay}</a> · <a href="${S.zalo}" target="_blank" rel="noopener">Zalo</a></span></li>
            <li>${IC.mail}<a href="mailto:${S.email}">${S.email}</a></li>
          </ul>
        </div>
        <div class="f-pay">
          <h4>Thanh toán</h4>
          <div class="f-qr">
            <img src="${B.staticQr}" alt="Mã QR chuyển khoản ACB ${B.accountNo}" width="132" height="132" loading="lazy">
            <div>
              <b>${B.id}</b>
              <span>${B.accountName}</span>
              <button type="button" class="f-copy" data-copy-text="${B.accountNo}">${B.accountNo} <small>Sao chép</small></button>
            </div>
          </div>
          <p class="f-pay-note">Tiền mặt khi nhận hàng hoặc chuyển khoản VietQR – mã QR kèm số tiền hiện sau khi đặt hàng.</p>
        </div>
      </div>
      <div class="container f-bottom">
        <span>© ${new Date().getFullYear()} COFFEE NHẪN TO GO · Drink to be happy.</span>
        <span><a href="chinh-sach.html">Chính sách</a> · <a href="credits.html">Nguồn ảnh</a> · <a href="#top" data-top>Lên đầu trang ↑</a></span>
      </div>
    </div>
  </footer>
  <div class="float-contact">
    <a class="float-btn zalo" href="${S.zalo}" target="_blank" rel="noopener" aria-label="Chat Zalo với Nhẫn Coffee">Zalo</a>
    <a class="float-btn call" href="tel:${S.phone}" aria-label="Gọi ${S.phoneDisplay}">${IC.phone.replace("<svg", '<svg width="24" height="24"')}</a>
  </div>
  <div class="overlay" data-overlay hidden></div>
  <aside class="drawer drawer-left" id="mobileNav" aria-label="Menu" hidden>
    <div class="drawer-head">
      <img class="brand-badge" src="assets/img/logo-badge.png" alt="Logo Coffee Nhẫn To Go" width="56" height="56">
      <button class="icon-btn" aria-label="Đóng menu" data-close>&times;</button>
    </div>
    <nav class="mnav">
      ${NAV.map((n) => `<a href="${n.href}" class="${isCurrent(n.key) ? "is-current" : ""}">${n.label}</a>`).join("")}
      <a href="don-hang.html">Đơn hàng của tôi</a>
      <a href="dang-nhap.html" data-account-mlink>Đăng nhập / Đăng ký</a>
      <a class="btn btn-lime" href="tel:${S.phone}">Gọi ${S.phoneDisplay}</a>
    </nav>
  </aside>
  <aside class="drawer drawer-right" id="cartDrawer" aria-label="Giỏ hàng" hidden>
    <div class="drawer-head">
      <h2>Giỏ hàng <small data-cart-count-text></small></h2>
      <button class="icon-btn" aria-label="Đóng giỏ hàng" data-close>&times;</button>
    </div>
    <div class="cart-body" data-cart-body></div>
    <div class="cart-foot" data-cart-foot>
      <div class="cart-total"><span>Tạm tính</span><b data-cart-total>0 ₫</b></div>
      <p class="cart-note">Cần đăng nhập để đặt hàng. Phí giao hàng (nếu có) được nhân viên báo khi xác nhận đơn.</p>
      <a class="btn btn-lime btn-block" href="thanh-toan.html">Tiến hành đặt hàng</a>
      <a class="btn btn-outline btn-block" href="gio-hang.html">Xem giỏ hàng</a>
    </div>
  </aside>
  <div class="modal" id="searchModal" role="dialog" aria-modal="true" aria-label="Tìm kiếm" hidden>
    <div class="modal-box">
      <div class="search-row">
        ${IC.search}
        <input type="search" placeholder="Tìm cà phê, bạc xỉu, robusta…" aria-label="Từ khóa" data-search-input>
        <button class="icon-btn" aria-label="Đóng" data-close>&times;</button>
      </div>
      <ul class="search-results" data-search-results></ul>
    </div>
  </div>
  <div class="modal" id="optionModal" role="dialog" aria-modal="true" aria-label="Chọn tùy chọn" hidden>
    <div class="modal-box opt-box" data-opt-box></div>
  </div>
  <div class="toast" role="status" aria-live="polite" data-toast></div>`;

  document.body.insertAdjacentHTML("afterbegin", headerHTML);
  document.body.insertAdjacentHTML("beforeend", footerHTML);

  /* ---------- toast ---------- */
  const toastEl = document.querySelector("[data-toast]");
  let toastT;
  N.toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 2800);
  };

  /* ---------- overlays ---------- */
  const overlay = document.querySelector("[data-overlay]");
  let openEl = null, lastFocus = null;
  N.open = (id) => {
    N.close();
    openEl = document.getElementById(id);
    if (!openEl) return;
    lastFocus = document.activeElement;
    openEl.hidden = false;
    if (openEl.classList.contains("drawer")) overlay.hidden = false;
    document.body.style.overflow = "hidden";
    const f = openEl.querySelector("input:not([type=radio]), button, a");
    f && f.focus();
    document.querySelectorAll(`[data-open="${id}"]`).forEach((b) => b.setAttribute("aria-expanded", "true"));
  };
  N.close = () => {
    if (!openEl) return;
    document.querySelectorAll(`[data-open="${openEl.id}"]`).forEach((b) => b.setAttribute("aria-expanded", "false"));
    openEl.hidden = true; overlay.hidden = true; document.body.style.overflow = ""; openEl = null;
    lastFocus && lastFocus.focus && lastFocus.focus();
  };
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); N.open(o.dataset.open); return; }
    if (e.target.closest("[data-close]") || e.target === overlay) N.close();
    if (openEl && openEl.classList.contains("modal") && e.target === openEl) N.close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") N.close(); });

  /* ---------- cart ---------- */
  const CART_KEY = "nhan-cart-v2";
  let cart = store.get(CART_KEY, []).filter((i) => byId[i.id] && i.qty > 0);
  const listeners = [];
  const keyOf = (id, opts, note) => `${id}|${JSON.stringify(opts || {})}|${note || ""}`;
  const saveCart = () => { store.set(CART_KEY, cart); listeners.forEach((fn) => fn(cart)); renderCart(); };
  N.cart = {
    items: () => cart.slice(),
    count: () => cart.reduce((s, i) => s + i.qty, 0),
    add(id, qty = 1, opts = {}, note = "") {
      const key = keyOf(id, opts, note);
      const it = cart.find((i) => i.key === key);
      it ? (it.qty += qty) : cart.push({ key, id, qty, opts, note });
      saveCart();
      const btn = document.querySelector(".cart-btn");
      if (btn) { btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump"); }
      N.toast(`Đã thêm “${byId[id].name}” vào giỏ`);
    },
    setQty(key, qty) { cart = qty <= 0 ? cart.filter((i) => i.key !== key) : cart.map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i)); saveCart(); },
    remove(key) { this.setQty(key, 0); },
    clear() { cart = []; saveCart(); },
    onChange(fn) { listeners.push(fn); },
    total() {
      const unpriced = cart.some((i) => unitPrice(byId[i.id], i.opts) == null);
      const sum = cart.reduce((s, i) => s + (unitPrice(byId[i.id], i.opts) || 0) * i.qty, 0);
      return { unpriced, sum, text: unpriced ? "Báo giá khi xác nhận" : fmtVND(sum) };
    },
  };

  N.cartLineHTML = (i, { compact = true } = {}) => {
    const p = byId[i.id];
    return `<div class="c-item" data-key="${esc(i.key)}">
      <a class="c-thumb" href="${productUrl(p)}"><img src="${img(p.img)}" alt="" loading="lazy"></a>
      <div class="c-main">
        <a class="c-name" href="${productUrl(p)}">${esc(p.name)}</a>
        ${optSummary(i.opts) ? `<div class="c-opts">${esc(optSummary(i.opts))}</div>` : ""}
        ${i.note ? `<div class="c-opts">Ghi chú: ${esc(i.note)}</div>` : ""}
        <div class="c-row">
          <div class="qty" role="group" aria-label="Số lượng"><button type="button" aria-label="Giảm" data-qty="-1">−</button><span>${i.qty}</span><button type="button" aria-label="Tăng" data-qty="1">+</button></div>
          <span class="c-price">${priceText(p, i.opts)}</span>
        </div>
      </div>
      <button class="c-remove" type="button" aria-label="Xóa ${esc(p.name)}" data-remove>&times;</button>
    </div>`;
  };

  const cartBody = document.querySelector("[data-cart-body]");
  const cartFoot = document.querySelector("[data-cart-foot]");
  N.emptyCartHTML = `<div class="cart-empty"><div class="cart-empty-ic">${IC.bag.replace('width="20" height="20"', 'width="34" height="34"')}</div><p>Giỏ hàng đang trống.<br>Chọn một ly cà phê để bắt đầu nhé!</p><a class="btn btn-lime" href="thuc-don.html">Xem thực đơn</a></div>`;
  function renderCart() {
    const count = N.cart.count();
    document.querySelectorAll("[data-cart-count]").forEach((el) => { el.textContent = count; el.hidden = count === 0; });
    document.querySelectorAll("[data-cart-count-text]").forEach((el) => (el.textContent = count ? `(${count})` : ""));
    cartBody.innerHTML = cart.length ? cart.map((i) => N.cartLineHTML(i)).join("") : N.emptyCartHTML;
    cartFoot.hidden = !cart.length;
    document.querySelector("[data-cart-total]").textContent = N.cart.total().text;
  }
  document.addEventListener("click", (e) => {
    const line = e.target.closest(".c-item[data-key]");
    if (!line) return;
    const key = line.dataset.key;
    const it = cart.find((i) => i.key === key);
    if (!it) return;
    const q = e.target.closest("[data-qty]");
    if (q) N.cart.setQty(key, it.qty + Number(q.dataset.qty));
    if (e.target.closest("[data-remove]")) N.cart.remove(key);
  });
  addEventListener("storage", (e) => { if (e.key === CART_KEY) { cart = store.get(CART_KEY, []); renderCart(); listeners.forEach((fn) => fn(cart)); } });
  renderCart();

  /* ---------- option picker (quick add) ---------- */
  const defaultOpt = (k, vals) => (k === "sugar" ? (vals.includes("Vừa") ? "Vừa" : vals[0]) : k === "ice" ? (vals.includes("Bình thường") ? "Bình thường" : vals[0]) : vals[0]);
  N.defaultOpts = (p) => Object.fromEntries(Object.entries(p.options || {}).map(([k, v]) => [k, defaultOpt(k, v)]));
  N.optionsFieldsHTML = (p, selected = N.defaultOpts(p), name = "opt") =>
    Object.entries(p.options || {}).map(([k, vals]) => `
      <fieldset class="opt-group">
        <legend>${N.OPTION_LABELS[k] || k}</legend>
        <div class="chips">
          ${vals.map((v) => `<label class="chip"><input type="radio" name="${name}-${k}" value="${esc(v)}" ${selected[k] === v ? "checked" : ""} data-opt-key="${k}"><span>${esc(v)}</span></label>`).join("")}
        </div>
      </fieldset>`).join("");
  N.readOpts = (root) => {
    const o = {};
    root.querySelectorAll("input[data-opt-key]:checked").forEach((i) => (o[i.dataset.optKey] = i.value));
    return o;
  };
  const optBox = document.querySelector("[data-opt-box]");
  N.pick = (id, srcImg) => {
    const p = byId[id];
    if (!p) return;
    if (!p.options || !Object.keys(p.options).length) { N.fly && N.fly(srcImg); N.cart.add(id); return; }
    optBox.innerHTML = `
      <div class="opt-head">
        <img src="${img(p.img)}" alt="">
        <div><p class="p-cat">${esc(p.cat)}</p><h3>${esc(p.name)}</h3><p class="opt-price">${priceText(p)}</p></div>
        <button class="icon-btn" aria-label="Đóng" data-close>&times;</button>
      </div>
      <form class="opt-form" data-opt-form>
        ${N.optionsFieldsHTML(p, N.defaultOpts(p), "q")}
        <label class="field"><span>Ghi chú cho món (tùy chọn)</span><input type="text" name="note" maxlength="120" placeholder="VD: ít ngọt hơn, thêm đá riêng…"></label>
        <div class="opt-foot">
          <div class="qty qty-lg" role="group" aria-label="Số lượng"><button type="button" data-step="-1" aria-label="Giảm">−</button><input type="number" name="qty" value="1" min="1" max="99" aria-label="Số lượng"><button type="button" data-step="1" aria-label="Tăng">+</button></div>
          <button class="btn btn-lime" type="submit">${IC.plus} Thêm vào giỏ</button>
        </div>
      </form>`;
    N.open("optionModal");
    const form = optBox.querySelector("[data-opt-form]");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const qty = Math.max(1, Math.min(99, parseInt(form.qty.value, 10) || 1));
      N.fly && N.fly(optBox.querySelector(".opt-head img"));
      N.cart.add(id, qty, N.readOpts(form), form.note.value.trim());
      N.close();
    });
  };
  // qty steppers anywhere
  document.addEventListener("click", (e) => {
    const st = e.target.closest("[data-step]");
    if (!st) return;
    const input = st.parentElement.querySelector("input[type=number]");
    if (input) input.value = Math.max(1, Math.min(99, (parseInt(input.value, 10) || 1) + Number(st.dataset.step)));
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-add]");
    if (a) {
      e.preventDefault();
      const src = a.closest(".p-card, .feature-card, li")?.querySelector(".p-media img, .c-thumb img");
      N.pick(a.dataset.add, src);
    }
  });

  /* ---------- product card ---------- */
  const sizesLabel = (p) => {
    const s = p.options && p.options.size;
    if (s && s.length) return s.map((x) => x.replace(/^(Nhỏ|Lớn)\s*/, "")).join(" · ");
    if (p.type === "ground") return "Gói 1kg";
    return "";
  };
  const priceBox = (p) => {
    if (p.priceBy) return `<small>Từ</small><b>${fmtVND(Math.min(...Object.values(p.priceBy)))}</b>`;
    if (p.price != null) return `<small>Giá</small><b>${fmtVND(p.price)}</b>`;
    return `<small>Giá</small><b>Liên hệ</b>`;
  };
  N.card = (p) => `<article class="p-card">
      <a class="p-media-wrap" href="${productUrl(p)}" aria-label="${esc(p.name)}">
        ${p.badge ? `<span class="p-badge">${esc(p.badge)}</span>` : ""}
        <span class="p-media"><img src="${img(p.img)}" alt="${esc(p.name)}" loading="lazy"></span>
      </a>
      <div class="p-body">
        <div class="p-meta"><span class="p-cat">${esc(p.cat)}</span>${sizesLabel(p) ? `<span class="p-sizes">${esc(sizesLabel(p))}</span>` : ""}</div>
        <h3 class="p-name"><a href="${productUrl(p)}">${esc(p.name)}</a></h3>
        ${p.short ? `<p class="p-desc">${esc(p.short)}</p>` : ""}
        <div class="p-foot">
          <div class="p-pricebox">${priceBox(p)}</div>
          <button class="p-add" type="button" data-add="${p.id}" aria-label="Thêm ${esc(p.name)} vào giỏ">${IC.plus}</button>
        </div>
      </div>
    </article>`;

  N.postCard = (a) => `<article class="post">
      <a class="post-media" href="bai-viet-chi-tiet.html?slug=${a.slug}"><img src="${img(a.img)}" alt="${esc(a.title)}" loading="lazy"><span class="post-tag">${esc(a.tag)}</span></a>
      <p class="post-meta">${new Date(a.date).toLocaleDateString("vi-VN")} · ${a.read} phút đọc</p>
      <h3><a href="bai-viet-chi-tiet.html?slug=${a.slug}">${esc(a.title)}</a></h3>
      <p>${esc(a.excerpt)}</p>
      <a class="more" href="bai-viet-chi-tiet.html?slug=${a.slug}">Xem thêm <span aria-hidden="true">→</span></a>
    </article>`;

  /* ---------- search ---------- */
  const sInput = document.querySelector("[data-search-input]");
  const sResults = document.querySelector("[data-search-results]");
  function renderSearch() {
    const q = norm(sInput.value.trim());
    const list = N.PRODUCTS.filter((p) => !q || norm(`${p.name} ${p.cat} ${p.short}`).includes(q));
    const arts = q ? N.ARTICLES.filter((a) => norm(a.title).includes(q)) : [];
    sResults.innerHTML = (list.length || arts.length)
      ? list.map((p) => `<li><a class="c-thumb" href="${productUrl(p)}"><img src="${img(p.img)}" alt="" loading="lazy"></a><div><a class="c-name" href="${productUrl(p)}">${esc(p.name)}</a><div class="c-price">${esc(p.cat)} · ${priceText(p)}</div></div><button class="mini-add" type="button" data-add="${p.id}">Thêm</button></li>`).join("")
        + arts.map((a) => `<li><a class="c-thumb" href="bai-viet-chi-tiet.html?slug=${a.slug}"><img src="${img(a.img)}" alt="" loading="lazy"></a><div><a class="c-name" href="bai-viet-chi-tiet.html?slug=${a.slug}">${esc(a.title)}</a><div class="c-price">Bài viết</div></div></li>`).join("")
      : `<li class="search-empty">Không tìm thấy kết quả phù hợp. Gọi <a href="tel:${S.phone}"><b>${S.phoneDisplay}</b></a> để được tư vấn.</li>`;
  }
  sInput.addEventListener("input", renderSearch);
  sInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { const first = sResults.querySelector("a.c-name"); first && (location.href = first.href); } });
  renderSearch();

  /* ---------- scroll animations ---------- */
  const ANIM = !STATIC && !reduced;
  if (ANIM) document.documentElement.classList.add("js-anim");
  const pending = new Set();
  const show = (n) => { n.classList.add("in"); pending.delete(n); animIO && animIO.unobserve(n); };
  const animIO = ANIM && "IntersectionObserver" in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(e.target); }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })
    : null;
  let ticking = false;
  const sweep = () => { ticking = false; const vh = innerHeight; pending.forEach((n) => { const r = n.getBoundingClientRect(); if (r.top < vh * 0.94 && r.bottom > 0) show(n); }); };
  const requestSweep = () => { if (!ticking && pending.size) { ticking = true; requestAnimationFrame(sweep); } };
  if (ANIM) { addEventListener("scroll", requestSweep, { passive: true }); addEventListener("resize", requestSweep); }
  N.anim = (targets, type, { stagger = true, mod = 5 } = {}) => {
    const nodes = typeof targets === "string" ? document.querySelectorAll(targets) : targets;
    nodes.forEach((n, i) => {
      n.dataset.anim = type;
      if (stagger) n.style.setProperty("--i", i % mod);
      if (!ANIM) return;
      pending.add(n);
      animIO && animIO.observe(n);
    });
    requestSweep();
  };

  // auto-register: page banners, footer, and any element with data-reveal="up|left|right|zoom|blur|clip"
  const autoAnim = () => {
    N.anim(".page-hero .container > *", "up", { mod: 4 });
    N.anim(".footer-grid > div", "up", { mod: 3 });
    const groups = new Map();
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      const parent = el.parentElement;
      const list = groups.get(parent) || [];
      list.push(el); groups.set(parent, list);
    });
    groups.forEach((els) => els.forEach((el, i) => { el.style.setProperty("--i", i % 5); N.anim([el], el.dataset.reveal, { stagger: false }); }));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoAnim); else setTimeout(autoAnim, 0);

  /* ---------- clean home URLs + canonical / social URLs (online only) ---------- */
  const fixHomeLinks = (scope = document) => {
    if (!ONLINE) return;
    scope.querySelectorAll('a[href^="index.html"]').forEach((a) => a.setAttribute("href", "./" + a.getAttribute("href").slice("index.html".length)));
  };
  if (ONLINE) {
    // 1) visiting /index.html directly → show the clean root URL
    if (/\/index\.html$/.test(location.pathname)) history.replaceState(null, "", location.pathname.replace(/index\.html$/, "") + location.search + location.hash);
    // 2) rewrite static + dynamically rendered links
    setTimeout(() => fixHomeLinks(), 0);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 && fixHomeLinks(n)))).observe(document.body, { childList: true, subtree: true });
    // 3) canonical + og:url + absolute og:image
    const file = location.pathname.split("/").pop() || "";
    const keep = ["id", "slug"].filter((k) => params.get(k)).map((k) => `${k}=${encodeURIComponent(params.get(k))}`).join("&");
    const canonical = SITE_URL + (file === "index.html" ? "" : file) + (keep ? `?${keep}` : "");
    const addMeta = (attr, key, val) => { let m = document.head.querySelector(`meta[${attr}="${key}"]`); if (!m) { m = document.createElement("meta"); m.setAttribute(attr, key); document.head.appendChild(m); } m.setAttribute("content", val); };
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = canonical;
    addMeta("property", "og:url", canonical);
    addMeta("property", "og:site_name", S.name);
    const ogImg = document.head.querySelector('meta[property="og:image"]');
    if (ogImg && !/^https?:/.test(ogImg.content)) ogImg.content = SITE_URL + ogImg.content.replace(/^\.?\//, "");
  }

  // scroll progress
  const bar = document.createElement("div");
  bar.className = "scroll-progress"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  const updateBar = () => { const max = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`; };
  addEventListener("scroll", updateBar, { passive: true });

  // header shrink
  const header = document.querySelector(".header");
  // smart sticky: hide while scrolling down, reveal on scroll up
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY, dy = y - lastY;
    header.classList.toggle("is-stuck", y > 40);
    const busy = document.body.style.overflow === "hidden" || header.matches(":hover") || header.contains(document.activeElement);
    void busy; void dy; // header always stays visible (owner preference) – no hide-on-scroll
    header.classList.remove("is-hidden");
    lastY = y;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- nav: sliding pill indicator ---------- */
  (() => {
    const ul = document.querySelector(".nav > ul");
    if (!ul) return;
    const ink = document.createElement("span");
    ink.className = "nav-ink"; ink.setAttribute("aria-hidden", "true");
    ul.prepend(ink);
    const links = [...ul.querySelectorAll(":scope > li > a")];
    const current = links.find((a) => a.classList.contains("is-current"));
    const moveTo = (a, instant) => {
      if (!a) { ink.style.opacity = "0"; return; }
      if (ink.style.opacity !== "1") instant = true; // first hover: appear in place, then glide between items
      const r = a.getBoundingClientRect(), p = ul.getBoundingClientRect();
      if (instant) ink.style.transition = "none";
      ink.style.width = `${r.width}px`;
      ink.style.transform = `translateX(${r.left - p.left}px)`;
      ink.style.opacity = "1";
      if (instant) { void ink.offsetWidth; ink.style.transition = ""; }
    };
    links.forEach((a) => a.addEventListener("mouseenter", () => moveTo(a)));
    links.forEach((a) => a.addEventListener("focus", () => moveTo(a)));
    ul.addEventListener("mouseleave", () => moveTo(null));
    const place = () => moveTo(null, true);
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(place);
    addEventListener("resize", place);
    setTimeout(place, 50);
  })();

  /* ---------- accounts (Firebase, loaded only when configured) ---------- */
  N.fbReady = new Promise((res) => (N._fbResolve = res));
  if (N.FIREBASE && N.FIREBASE.apiKey) {
    const me = [...document.scripts].find((s) => /assets\/js\/site\.js/.test(s.src));
    const ver = me && me.src.includes("?") ? me.src.slice(me.src.indexOf("?")) : "";
    const s = document.createElement("script");
    s.src = `assets/js/auth.js${ver}`;
    s.onerror = () => N._fbResolve(null);
    document.body.appendChild(s);
    setTimeout(() => N._fbResolve(null), 12000); // never hang pages if Firebase cannot start
  } else N._fbResolve(null);
  N.updateAccountUI = (u, api) => {
    const first = u ? (u.displayName || u.email || "?").trim() : "";
    document.querySelectorAll("[data-account-link]").forEach((a) => {
      if (u) {
        const admin = !!(api && api.isAdmin(u));
        a.href = admin ? "quan-tri.html" : "tai-khoan.html";
        a.dataset.tip = admin ? "Quản trị" : `Tài khoản · ${first.split(/[\s@]/)[0]}`;
        a.setAttribute("aria-label", admin ? "Trang quản trị" : "Tài khoản của tôi");
        a.classList.add("is-in");
        a.classList.toggle("is-admin", admin);
        a.innerHTML = admin
          ? `<span class="hb-avatar hb-admin"><svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6z" fill="currentColor"/><path d="m9 12 2 2 4-4" fill="none" stroke="#A8D636" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`
          : `<span class="hb-avatar">${esc(first.charAt(0).toUpperCase())}</span>`;
      } else {
        a.href = "dang-nhap.html"; a.dataset.tip = "Đăng nhập"; a.classList.remove("is-in"); a.innerHTML = IC.user;
      }
    });
    document.querySelectorAll("[data-account-mlink]").forEach((a) => {
      const adm = !!(u && api && api.isAdmin(u));
      a.href = !u ? "dang-nhap.html" : adm ? "quan-tri.html" : "tai-khoan.html";
      a.textContent = !u ? "Đăng nhập / Đăng ký" : adm ? "Trang quản trị" : `Tài khoản (${first.split(/[\s@]/)[0]})`;
    });
  };
  // password-reset email throttle: max 1 request / 60s per browser (each new link invalidates the previous one)
  N.resetCooldown = () => {
    const k = "nhan-reset-at", now = Date.now();
    try { const last = +localStorage.getItem(k) || 0; if (now - last < 60000) return false; localStorage.setItem(k, String(now)); } catch { /* ignore */ }
    return true;
  };
  N.requireConfig = (root) => {
    root.innerHTML = `<div class="co-card" style="max-width:620px;margin:0 auto;text-align:center"><div class="cart-empty-ic">${IC.user.replace('width="20" height="20"', 'width="34" height="34"')}</div><h2 style="font-size:22px;color:var(--brown);font-weight:800">Tính năng tài khoản đang được thiết lập</h2><p style="color:var(--muted);margin:8px 0 18px">Vui lòng thử lại sau ít phút, hoặc đặt nhanh qua Zalo / điện thoại.</p><a class="btn btn-lime" href="thuc-don.html">Đặt món ngay</a></div>`;
  };

  /* ---------- motion polish ---------- */
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;

  // split text into word spans (keeps inline elements like <em>) → CSS staggers .w via --w
  N.splitWords = (el) => {
    if (!el || el.dataset.split) return;
    el.dataset.split = "1";
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement("span");
            s.className = "w"; s.textContent = part; s.style.setProperty("--w", i++);
            frag.appendChild(s);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) walk(ch);
      });
    };
    walk(el);
  };
  if (ANIM) setTimeout(() => document.querySelectorAll(".section-head .section-title").forEach(N.splitWords), 0);

  // fade images in once loaded (only those still loading, so cached images never flash)
  const prepImg = (im) => {
    if (im.complete || im.dataset.fade) return;
    im.dataset.fade = "1"; im.classList.add("img-wait");
    const done = () => { im.classList.remove("img-wait"); im.classList.add("img-ready"); };
    im.addEventListener("load", done, { once: true }); im.addEventListener("error", done, { once: true });
  };
  if (ANIM) {
    document.querySelectorAll("img").forEach(prepImg);
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.tagName === "IMG") prepImg(n); else n.querySelectorAll && n.querySelectorAll("img").forEach(prepImg);
    }))).observe(document.body, { childList: true, subtree: true });
  }

  // click ripple
  document.addEventListener("pointerdown", (e) => {
    if (reduced) return;
    const b = e.target.closest(".btn, .btn-order, .fchip, .p-add, .mini-add, .tab");
    if (!b) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
    const s = document.createElement("span");
    s.className = "ripple";
    Object.assign(s.style, { width: `${d}px`, height: `${d}px`, left: `${e.clientX - r.left - d / 2}px`, top: `${e.clientY - r.top - d / 2}px` });
    b.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  // subtle 3D tilt on product / post / gallery images (mouse only)
  if (FINE && !reduced && !STATIC) {
    let cur = null;
    const reset = (el) => { el.classList.remove("tilting"); ["--rx", "--ry"].forEach((v) => el.style.removeProperty(v)); };
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest(".p-media-wrap, .post-media, .pd-main-img");
      if (cur && cur !== el) { reset(cur); cur = null; }
      if (!el) return;
      cur = el;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("tilting");
      el.style.setProperty("--rx", `${((0.5 - y) * 5).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${((x - 0.5) * 6).toFixed(2)}deg`);
    }, { passive: true });
    document.addEventListener("pointerleave", () => { if (cur) { reset(cur); cur = null; } });
  }

  // fly a product image into the cart icon
  N.fly = (imgEl) => {
    const cartBtn = document.querySelector(".cart-btn");
    if (!imgEl || !cartBtn || reduced) return;
    const a = imgEl.getBoundingClientRect(), b = cartBtn.getBoundingClientRect();
    if (!a.width || a.bottom < 0 || a.top > innerHeight) return;
    const c = document.createElement("img");
    c.src = imgEl.currentSrc || imgEl.src; c.alt = ""; c.className = "fly-img";
    Object.assign(c.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
    document.body.appendChild(c);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      c.style.transform = `translate(${dx}px, ${dy}px) scale(${Math.max(0.08, 34 / a.width)})`;
      c.style.opacity = "0.35"; c.style.borderRadius = "50%";
    }));
    setTimeout(() => c.remove(), 900);
  };

  // parallax for inner-page banners
  const pageBg = document.querySelector(".page-hero-bg");
  if (pageBg && !reduced && !STATIC) {
    const par = () => { if (scrollY < 700) pageBg.style.translate = `0 ${(scrollY * 0.3).toFixed(1)}px`; };
    addEventListener("scroll", par, { passive: true });
  }

  // tooltip labels for floating buttons
  document.querySelector(".float-btn.zalo")?.setAttribute("data-tip", "Chat Zalo");
  document.querySelector(".float-btn.call")?.setAttribute("data-tip", `Gọi ${S.phoneDisplay}`);

  /* ---------- forms: FormSubmit + orders ---------- */
  N.canSend = () => /^https?:$/.test(location.protocol);
  N.sendForm = async (data) => {
    if (!N.canSend()) throw new Error("local-file");
    const res = await fetch(S.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ _captcha: "false", _template: "table", ...data }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.success === "false" || json.success === false) throw new Error(json.message || `HTTP ${res.status}`);
    return json;
  };
  const ORDERS_KEY = "nhan-orders-v1";
  N.orders = {
    all: () => store.get(ORDERS_KEY, []),
    get: (code) => store.get(ORDERS_KEY, []).find((o) => o.code === code),
    save(o) { const list = store.get(ORDERS_KEY, []).filter((x) => x.code !== o.code); list.unshift(o); store.set(ORDERS_KEY, list.slice(0, 50)); },
  };
  N.newOrderCode = () => {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `NH${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  };
  N.orderText = (o) => {
    const lines = o.items.map((i, k) => `${k + 1}. ${i.name} x${i.qty}${i.opts ? ` (${i.opts})` : ""}${i.note ? ` – ${i.note}` : ""}`).join("\n");
    return `ĐƠN HÀNG ${o.code} – ${S.name}\n${lines}\n\nKhách: ${o.customer.name} – ${o.customer.phone}\n${o.delivery.method === "ship" ? `Giao tới: ${o.delivery.address}` : `Nhận tại: ${o.delivery.branch}`}\nThời gian: ${o.delivery.time}\nThanh toán: ${o.payment}${o.note ? `\nGhi chú: ${o.note}` : ""}`;
  };
  N.copy = async (text) => { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } };
  // copy buttons anywhere: <button data-copy-text="...">
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-copy-text]");
    if (!b) return;
    N.toast((await N.copy(b.dataset.copyText)) ? `Đã sao chép: ${b.dataset.copyText}` : b.dataset.copyText);
  });
  // VietQR image (amount + transfer note pre-filled). Note: only A–Z 0–9 and spaces are safe in the note.
  N.qrUrl = ({ amount, note } = {}) => {
    const B = S.bank, q = new URLSearchParams({ accountName: B.accountName });
    if (amount) q.set("amount", String(Math.round(amount)));
    if (note) q.set("addInfo", String(note).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/[^A-Za-z0-9 ]/g, " ").slice(0, 50));
    return `https://img.vietqr.io/image/${B.id}-${B.accountNo}-compact2.png?${q}`;
  };
})();
