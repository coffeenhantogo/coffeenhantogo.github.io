/* Product detail page: ?id=<product id> */
(() => {
  const N = window.NHAN;
  const root = document.querySelector("[data-pd]");
  const p = N.byId[N.params.get("id")];

  if (!p) {
    root.innerHTML = `<div class="nf"><div class="big">404</div><h1>Không tìm thấy sản phẩm</h1><p>Sản phẩm có thể đã ngừng bán hoặc đường dẫn không đúng.</p><div class="success-actions"><a class="btn btn-lime" href="san-pham.html">Xem sản phẩm</a><a class="btn btn-outline" href="thuc-don.html">Xem thực đơn</a></div></div>`;
    document.querySelector(".related").hidden = true;
    return;
  }

  const isDrink = p.type === "drink";
  const listUrl = isDrink ? "thuc-don.html" : `san-pham.html?loai=${p.group}`;
  const listName = isDrink ? "Thực đơn" : "Cà phê xay";
  const gallery = p.gallery && p.gallery.length ? p.gallery : [p.img];

  document.title = `${p.name} | Coffee Nhẫn To Go`;
  const setMeta = (sel, attr, val) => { let m = document.head.querySelector(sel); if (!m) { m = document.createElement("meta"); const [k, v] = sel.match(/\[(.+?)="(.+?)"\]/).slice(1); m.setAttribute(k, v); document.head.appendChild(m); } m.setAttribute(attr, val); };
  setMeta('meta[name="description"]', "content", `${p.name} – ${p.short} Đặt hàng online tại Coffee Nhẫn To Go, hotline ${N.STORE.phoneDisplay}.`);
  setMeta('meta[property="og:title"]', "content", `${p.name} | Coffee Nhẫn To Go`);
  setMeta('meta[property="og:image"]', "content", N.img(p.img));
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.desc, image: gallery.map(N.img),
    brand: { "@type": "Brand", name: "Coffee Nhẫn To Go" }, category: p.cat,
  });
  document.head.appendChild(ld);

  const howTo = isDrink
    ? `<ul><li>Chọn size (Nhỏ 500ml / Lớn 700ml), độ ngọt, lượng đá theo khẩu vị trước khi thêm vào giỏ.</li><li>Đồ uống được pha khi nhân viên xác nhận đơn để đảm bảo độ tươi ngon.</li><li>Nên dùng trong vòng 1–2 giờ sau khi pha; với món đá, uống ngay để không bị nhạt.</li></ul>`
    : `<ul><li>Pha phin: khoảng 20–25g cà phê cho một ly, ủ 20–30 giây rồi châm nước sôi khoảng 90–96°C.</li><li>Gói 1kg nên chia ra vài hũ nhỏ đậy kín, dùng hết hũ này mới mở hũ khác.</li><li>Bảo quản nơi khô ráo thoáng mát, tránh ánh nắng và nơi có mùi mạnh.</li><li>Mua số lượng lớn cho quán: gọi hoặc nhắn Zalo để được tư vấn.</li></ul>
       <p><a href="bai-viet-chi-tiet.html?slug=bi-quyet-pha-ca-phe-phin" style="color:var(--lime-deep);font-weight:800">Đọc hướng dẫn pha phin chi tiết →</a></p>`;

  root.innerHTML = `
    <nav class="crumbs dark" aria-label="Breadcrumb"><a href="index.html">Trang chủ</a><span aria-hidden="true">/</span><a href="${listUrl}">${listName}</a><span aria-hidden="true">/</span><span>${N.esc(p.name)}</span></nav>
    <div class="pd-grid">
      <div class="pd-gallery" data-reveal="left">
        <div class="pd-main-img"><img src="${N.img(gallery[0])}" alt="${N.esc(p.name)}" data-main-img></div>
        ${gallery.length > 1 ? `<div class="pd-thumbs">${gallery.map((g, i) => `<button type="button" class="${i === 0 ? "is-active" : ""}" data-thumb="${g}" aria-label="Ảnh ${i + 1}"><img src="${N.img(g)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
      </div>
      <div class="pd-info" data-reveal="right">
        <p class="p-cat">${N.esc(p.cat)}${p.badge ? ` · ${N.esc(p.badge)}` : ""}</p>
        <h1>${N.esc(p.name)}</h1>
        <p class="pd-price" data-price>${N.priceText(p, N.defaultOpts(p))}<small>${N.unitPrice(p, N.defaultOpts(p)) == null ? "Nhân viên báo giá khi xác nhận đơn" : p.priceBy ? "Giá theo size bạn chọn" : ""}</small></p>
        <p class="pd-short">${N.esc(p.short)}</p>
        <div class="pd-tags">${(p.notes || []).map((t) => `<span class="lime">${N.esc(t)}</span>`).join("")}${p.roast ? `<span>${N.esc(p.roast)}</span>` : ""}${p.bean ? `<span>${N.esc(p.bean)}</span>` : ""}</div>
        <form data-buy>
          ${N.optionsFieldsHTML(p, N.defaultOpts(p), "pd")}
          <label class="field"><span>Ghi chú (tùy chọn)</span><input type="text" name="note" maxlength="120" placeholder="${isDrink ? "VD: ít ngọt hơn, đá để riêng…" : "VD: chia 2 túi nhỏ…"}"></label>
          <div class="pd-buy">
            <div class="qty qty-lg" role="group" aria-label="Số lượng"><button type="button" data-step="-1" aria-label="Giảm">−</button><input type="number" name="qty" value="1" min="1" max="99" aria-label="Số lượng"><button type="button" data-step="1" aria-label="Tăng">+</button></div>
            <button class="btn btn-lime" type="submit" name="action" value="add">${N.IC.plus} Thêm vào giỏ</button>
            <button class="btn btn-ink" type="submit" name="action" value="buy">Mua ngay</button>
          </div>
        </form>
        <div class="pd-meta">
          <div><b>Nhận hàng:</b> Giao tận nơi hoặc ghé lấy tại 2 chi nhánh</div>
          <div><b>Đặt nhanh:</b> <a href="tel:${N.STORE.phone}">${N.STORE.phoneDisplay}</a> · <a href="${N.STORE.zalo}" target="_blank" rel="noopener">Zalo</a></div>
        </div>
      </div>
    </div>
    <div class="pd-tabs" data-reveal="up">
      <div class="pd-tabs-nav" role="tablist">
        <button role="tab" aria-selected="true" data-tab="desc">Mô tả</button>
        <button role="tab" aria-selected="false" data-tab="how">${isDrink ? "Lưu ý" : "Hướng dẫn pha & bảo quản"}</button>
        <button role="tab" aria-selected="false" data-tab="ship">Giao hàng & đổi trả</button>
      </div>
      <div class="pd-panel" data-panel="desc"><p>${N.esc(p.desc)}</p></div>
      <div class="pd-panel" data-panel="how" hidden>${howTo}</div>
      <div class="pd-panel" data-panel="ship" hidden>
        <ul><li>Nhận tại quán: 351 Minh Phụng hoặc 26B/4 Lạc Long Quân – đặt trước, ghé lấy không cần chờ.</li><li>Giao hàng: nhân viên gọi xác nhận đơn và báo phí giao (nếu có) trước khi giao.</li><li>Sản phẩm lỗi do đóng gói/vận chuyển được đổi mới. Xem chi tiết tại <a href="chinh-sach.html" style="color:var(--lime-deep);font-weight:800">Chính sách mua hàng</a>.</li></ul>
      </div>
    </div>`;

  // gallery
  const mainImg = root.querySelector("[data-main-img]");
  root.querySelectorAll("[data-thumb]").forEach((b) => b.addEventListener("click", () => {
    root.querySelectorAll("[data-thumb]").forEach((x) => x.classList.toggle("is-active", x === b));
    mainImg.style.opacity = 0;
    setTimeout(() => { mainImg.src = N.img(b.dataset.thumb); mainImg.style.opacity = 1; }, 150);
  }));
  // tabs
  root.querySelectorAll("[data-tab]").forEach((t) => t.addEventListener("click", () => {
    root.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", x === t));
    root.querySelectorAll("[data-panel]").forEach((pn) => (pn.hidden = pn.dataset.panel !== t.dataset.tab));
  }));
  // buy
  const form = root.querySelector("[data-buy]");
  form.addEventListener("change", () => { root.querySelector("[data-price]").firstChild.textContent = N.priceText(p, N.readOpts(form)); });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const qty = Math.max(1, Math.min(99, parseInt(form.qty.value, 10) || 1));
    N.fly && N.fly(mainImg);
    N.cart.add(p.id, qty, N.readOpts(form), form.note.value.trim());
    if (e.submitter && e.submitter.value === "buy") location.href = "thanh-toan.html";
    else N.open("cartDrawer");
  });
  root.querySelectorAll("[data-reveal]").forEach((el) => N.anim([el], el.dataset.reveal, { stagger: false }));

  // related
  const others = N.PRODUCTS.filter((x) => x.id !== p.id);
  const rel = [...others.filter((x) => x.type === p.type), ...others.filter((x) => x.type !== p.type && x.featured)].slice(0, 4);
  document.querySelector("[data-related]").innerHTML = rel.map(N.card).join("");
  N.anim(document.querySelectorAll("[data-related] .p-card"), "up", { mod: 4 });
  N.anim(".related .section-head", "blur", { stagger: false });
})();
