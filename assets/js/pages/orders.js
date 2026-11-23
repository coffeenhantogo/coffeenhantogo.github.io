/* Success page (?ma=CODE) + "Đơn hàng của tôi" list */
(() => {
  const N = window.NHAN, S = N.STORE;
  const statusLabel = (o) => (o.status === "sent" ? `<span class="status">Đã gửi tới quán</span>` : `<span class="status local">Chưa gửi – hãy gửi qua Zalo</span>`);
  const detailRows = (o) => `
    <div class="od-row"><span>Người nhận</span><b>${N.esc(o.customer.name)} · ${N.esc(o.customer.phone)}</b></div>
    <div class="od-row"><span>${o.delivery.method === "ship" ? "Giao tới" : "Nhận tại"}</span><b>${N.esc(o.delivery.method === "ship" ? o.delivery.address : o.delivery.branch)}</b></div>
    <div class="od-row"><span>Thời gian</span><b>${N.esc(o.delivery.time)}</b></div>
    <div class="od-row"><span>Thanh toán</span><b>${N.esc(o.payment)}</b></div>
    <div class="od-row"><span>Món</span><b>${o.items.map((i) => `${N.esc(i.name)} ×${i.qty}${i.opts ? ` <small style="color:var(--muted)">(${N.esc(i.opts)})</small>` : ""}${i.note ? ` <small style="color:var(--muted)">– ${N.esc(i.note)}</small>` : ""}`).join("<br>")}</b></div>
    ${o.note ? `<div class="od-row"><span>Ghi chú</span><b>${N.esc(o.note)}</b></div>` : ""}
    <div class="od-row"><span>Tạm tính</span><b>${N.esc(o.totalText)}</b></div>`;

  const zaloSend = async (o) => {
    const ok = await N.copy(N.orderText(o));
    N.toast(ok ? "Đã sao chép đơn – dán vào Zalo để gửi cho quán" : "Mở Zalo để gửi đơn cho quán");
    window.open(S.zalo, "_blank", "noopener");
  };

  /* VietQR bank-transfer panel (only when the customer chose bank transfer) */
  const isTransfer = (o) => /chuyển khoản/i.test(o.payment || "");
  const payPanel = (o) => {
    if (!isTransfer(o)) return "";
    const B = S.bank, note = o.code.replace(/-/g, " ");
    const amount = o.totalAmount || null;
    const src = N.qrUrl({ amount, note: `${note} ${o.customer.phone}` });
    return `
      <div class="pay-panel">
        <div class="pay-qr">
          <img src="${src}" alt="Mã VietQR chuyển khoản ${B.id} ${B.accountNo}" width="260" height="300" onerror="this.onerror=null;this.src='${B.staticQr}'">
          <a class="btn btn-outline btn-sm" href="${src}" target="_blank" rel="noopener" download>Tải mã QR</a>
        </div>
        <div class="pay-info">
          <span class="kicker">Thanh toán chuyển khoản</span>
          <h3>Quét mã bằng app ngân hàng</h3>
          <div class="pay-row"><span>Ngân hàng</span><b>${N.esc(B.name)}</b></div>
          <div class="pay-row"><span>Chủ tài khoản</span><b>${N.esc(B.accountName)}</b></div>
          <div class="pay-row"><span>Số tài khoản</span><b>${B.accountNo}</b><button type="button" class="pay-copy" data-copy-text="${B.accountNo}">Sao chép</button></div>
          <div class="pay-row"><span>Số tiền</span><b class="pay-amount">${amount ? N.fmtVND(amount) : "Theo xác nhận của quán"}</b>${amount ? `<button type="button" class="pay-copy" data-copy-text="${amount}">Sao chép</button>` : ""}</div>
          <div class="pay-row"><span>Nội dung</span><b>${N.esc(note)} ${N.esc(o.customer.phone)}</b><button type="button" class="pay-copy" data-copy-text="${N.esc(note)} ${N.esc(o.customer.phone)}">Sao chép</button></div>
          <p class="pay-hint">Mã QR đã điền sẵn số tiền và nội dung. Sau khi chuyển, Nhẫn sẽ kiểm tra và xác nhận đơn qua điện thoại/Zalo.${o.delivery.method === "ship" ? " Phí giao hàng (nếu có) thanh toán khi nhận hàng." : ""}</p>
        </div>
      </div>`;
  };

  /* success page */
  const sRoot = document.querySelector("[data-success]");
  if (sRoot) {
    const o = N.orders.get(N.params.get("ma"));
    if (!o) {
      sRoot.innerHTML = `<div class="success-card"><h1>Không tìm thấy đơn hàng</h1><p class="lead">Đơn có thể được đặt trên thiết bị khác. Vui lòng gọi ${S.phoneDisplay} để được hỗ trợ.</p><div class="success-actions"><a class="btn btn-lime" href="don-hang.html">Đơn hàng của tôi</a><a class="btn btn-outline" href="index.html">Về trang chủ</a></div></div>`;
      return;
    }
    const sent = o.status === "sent";
    sRoot.innerHTML = `
      <div class="success-card" data-reveal="zoom">
        <div class="success-ic"><svg viewBox="0 0 24 24" width="42" height="42" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <h1>${sent ? "Đặt hàng thành công!" : "Đã ghi nhận đơn hàng"}</h1>
        <div class="order-code">Mã đơn: ${N.esc(o.code)}</div>
        ${sent
          ? `<p class="lead">Cảm ơn ${N.esc(o.customer.name)}! Đơn đã được gửi tới Nhẫn. Nhân viên sẽ gọi hoặc nhắn Zalo tới <b>${N.esc(o.customer.phone)}</b> để xác nhận đơn. Bạn có thể gửi thêm qua Zalo để được xử lý nhanh hơn.</p>`
          : `<div class="form-alert warn" style="margin-top:16px;text-align:left">${N.canSend() ? "Không gửi được đơn tự động (mạng chập chờn hoặc hệ thống email chưa kích hoạt)." : "Bạn đang xem thử trên máy nên đơn chưa được gửi email."} <b>Vui lòng bấm “Gửi đơn qua Zalo”</b> hoặc gọi ${S.phoneDisplay} để Nhẫn nhận đơn.</div>`}
        ${payPanel(o)}
        <div class="order-detail">${detailRows(o)}</div>
        <div class="success-actions">
          <button class="btn ${sent ? "btn-outline" : "btn-lime"}" type="button" data-zalo>Gửi đơn qua Zalo</button>
          <a class="btn btn-outline" href="tel:${S.phone}">Gọi ${S.phoneDisplay}</a>
          <a class="btn ${sent ? "btn-lime" : "btn-outline"}" href="thuc-don.html">Tiếp tục mua</a>
        </div>
      </div>`;
    sRoot.querySelector("[data-zalo]").addEventListener("click", () => zaloSend(o));
    N.anim(sRoot.querySelectorAll("[data-reveal]"), "zoom", { stagger: false });
  }

  /* orders list page */
  const lRoot = document.querySelector("[data-orders]");
  if (lRoot) {
    const list = N.orders.all();
    if (!list.length) {
      lRoot.innerHTML = `<div class="co-card"><div class="cart-empty"><div class="cart-empty-ic">${N.IC.receipt.replace('width="20" height="20"', 'width="34" height="34"')}</div><p>Bạn chưa có đơn hàng nào trên thiết bị này.</p><a class="btn btn-lime" href="thuc-don.html">Đặt món ngay</a></div></div>`;
      return;
    }
    lRoot.innerHTML = `<div class="order-list">${list.map((o) => `
      <article class="order-item">
        <div>
          <h3>${N.esc(o.code)} ${statusLabel(o)}</h3>
          <p>${new Date(o.createdAt).toLocaleString("vi-VN")} · ${o.items.reduce((s, i) => s + i.qty, 0)} món · ${o.delivery.method === "ship" ? "Giao tận nơi" : "Nhận tại quán"}</p>
          <p>${o.items.map((i) => `${N.esc(i.name)} ×${i.qty}`).join(", ")}</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a class="btn btn-outline btn-sm" href="dat-hang-thanh-cong.html?ma=${encodeURIComponent(o.code)}">Chi tiết</a>
          <button class="btn btn-outline btn-sm" type="button" data-reorder="${N.esc(o.code)}">Đặt lại</button>
          <button class="btn btn-lime btn-sm" type="button" data-zalo="${N.esc(o.code)}">Gửi Zalo</button>
        </div>
      </article>`).join("")}</div>
      <p class="note" style="margin-top:18px;color:var(--muted);font-size:13.5px">Lịch sử đơn được lưu trên trình duyệt của thiết bị này (tối đa 50 đơn gần nhất).</p>`;
    lRoot.addEventListener("click", (e) => {
      const z = e.target.closest("[data-zalo]");
      if (z) zaloSend(N.orders.get(z.dataset.zalo));
      const r = e.target.closest("[data-reorder]");
      if (r) {
        const o = N.orders.get(r.dataset.reorder);
        o.items.forEach((i) => {
          if (!N.byId[i.id]) return;
          const p = N.byId[i.id];
          // rebuild option object from the summary text in the same order as product options
          const vals = (i.opts || "").split(" · ");
          const opts = {};
          Object.keys(p.options || {}).forEach((k) => { const v = vals.find((x) => p.options[k].includes(x)); if (v) opts[k] = v; });
          N.cart.add(i.id, i.qty, opts, i.note || "");
        });
        N.open("cartDrawer");
      }
    });
    N.anim(lRoot.querySelectorAll(".order-item"), "up");
  }
})();
