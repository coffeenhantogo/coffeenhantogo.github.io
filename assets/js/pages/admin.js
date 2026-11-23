/* Admin: live orders from Firestore (admin emails only, enforced by firestore.rules) */
(() => {
  const N = window.NHAN;
  const root = document.querySelector("[data-admin]");
  const STATUS = {
    pending: ["Mới đặt", "st-new"], confirmed: ["Đã xác nhận", "st-ok"], making: ["Đang pha / chuẩn bị", "st-make"],
    delivering: ["Đang giao", "st-ship"], done: ["Hoàn thành", "st-done"], cancelled: ["Đã hủy", "st-cancel"],
  };
  const dateOf = (o) => (o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAtLocal || Date.now()));
  const sameDay = (a, b) => a.toDateString() === b.toDateString();

  N.fbReady.then((api) => {
    if (!api) { N.requireConfig(root); return; }
    const u = api.user;
    if (!u) { location.replace("dang-nhap.html?next=quan-tri.html"); return; }
    if (!api.isAdmin(u)) {
      root.innerHTML = `<div class="co-card" style="max-width:620px;margin:0 auto;text-align:center"><h1 style="font-size:24px;color:var(--brown)">Không có quyền truy cập</h1><p style="color:var(--muted);margin:8px 0 18px">Trang này chỉ dành cho chủ quán${u.emailVerified ? "" : " (email cần được xác thực)"}.</p><a class="btn btn-lime" href="tai-khoan.html">Về tài khoản</a></div>`;
      return;
    }

    let orders = [], filter = "active", q = "", firstLoad = true;
    root.innerHTML = `
      <div class="admin-head" data-reveal="up">
        <div><span class="kicker">Quản trị</span><h1>Đơn hàng</h1><p>Cập nhật theo thời gian thực · ${N.esc(u.email)}</p></div>
        <label class="check"><input type="checkbox" data-sound checked><span>Âm báo khi có đơn mới</span></label>
      </div>
      <div class="admin-stats" data-stats></div>
      <div class="toolbar">
        <div class="filter-chips" data-filters></div>
        <div class="toolbar-right"><label class="search-inline"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input class="input" type="search" placeholder="Tìm mã đơn, tên, SĐT…" data-q></label></div>
      </div>
      <div class="admin-list" data-list></div>`;
    const $ = (s) => root.querySelector(s);
    N.anim(root.querySelectorAll("[data-reveal]"), "up", { stagger: false });

    const FILTERS = [["active", "Cần xử lý"], ["pending", "Mới"], ["confirmed", "Đã xác nhận"], ["making", "Đang pha"], ["delivering", "Đang giao"], ["done", "Hoàn thành"], ["cancelled", "Đã hủy"], ["all", "Tất cả"]];
    const isActive = (o) => !["done", "cancelled"].includes(o.status);

    function beep() {
      if (!$("[data-sound]").checked) return;
      try { const c = new (window.AudioContext || window.webkitAudioContext)(); [0, .18].forEach((t, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = i ? 1046 : 784; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.18, c.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + t + .25); o.start(c.currentTime + t); o.stop(c.currentTime + t + .26); }); } catch { /* no audio */ }
    }

    function render() {
      const today = new Date();
      const todays = orders.filter((o) => sameDay(dateOf(o), today));
      const revenue = todays.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.totalAmount || 0), 0);
      $("[data-stats]").innerHTML = [
        ["Đơn hôm nay", todays.length], ["Cần xử lý", orders.filter(isActive).length],
        ["Doanh thu hôm nay", N.fmtVND(revenue)], ["Chuyển khoản hôm nay", todays.filter((o) => /chuyển khoản/i.test(o.payment)).length],
      ].map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join("");
      $("[data-filters]").innerHTML = FILTERS.map(([k, t]) => {
        const n = k === "all" ? orders.length : k === "active" ? orders.filter(isActive).length : orders.filter((o) => o.status === k).length;
        return `<button class="fchip ${filter === k ? "is-active" : ""}" data-f="${k}">${t}<small>${n}</small></button>`;
      }).join("");
      const nq = N.norm(q);
      const list = orders.filter((o) => (filter === "all" || (filter === "active" ? isActive(o) : o.status === filter)) &&
        (!nq || N.norm(`${o.code} ${o.customer.name} ${o.customer.phone}`).includes(nq)));
      $("[data-list]").innerHTML = list.length ? list.map((o) => {
        const [st, cls] = STATUS[o.status] || STATUS.pending;
        const d = dateOf(o);
        const where = o.delivery.method === "ship" ? `🛵 Giao: ${N.esc(o.delivery.address)}` : `🏠 Nhận tại: ${N.esc(o.delivery.branch)}`;
        return `<article class="admin-order ${cls}">
          <div class="ad-top">
            <div><b class="ad-code">${N.esc(o.code)}</b> <span class="st ${cls}">${st}</span>${o.uid ? ' <span class="st st-ok">Thành viên</span>' : ""}</div>
            <span class="ad-time">${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · ${d.toLocaleDateString("vi-VN")}</span>
          </div>
          <div class="ad-body">
            <div class="ad-cust"><b>${N.esc(o.customer.name)}</b><a href="tel:${N.esc(o.customer.phone)}">${N.esc(o.customer.phone)}</a>${o.customer.email ? `<span>${N.esc(o.customer.email)}</span>` : ""}<span>${where}</span><span>⏰ ${N.esc(o.delivery.time)}</span></div>
            <ul class="ad-items">${o.items.map((i) => `<li><b>${i.qty}×</b> ${N.esc(i.name)}${i.opts ? ` <small>(${N.esc(i.opts)})</small>` : ""}${i.note ? ` <em>– ${N.esc(i.note)}</em>` : ""}</li>`).join("")}</ul>
          </div>
          ${o.note ? `<p class="ad-note">📝 ${N.esc(o.note)}</p>` : ""}
          <div class="ad-foot">
            <span>${N.esc(o.payment)} · <b>${N.esc(o.totalText)}</b></span>
            <div class="ad-actions">
              <a class="btn btn-outline btn-sm" href="https://zalo.me/${N.esc(o.customer.phone)}" target="_blank" rel="noopener">Zalo khách</a>
              <select class="select ad-status" data-code="${N.esc(o.code)}">${Object.entries(STATUS).map(([k, [t]]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${t}</option>`).join("")}</select>
            </div>
          </div>
        </article>`;
      }).join("") : `<div class="empty-state"><b>Không có đơn nào</b>Đơn mới sẽ tự hiện ở đây.</div>`;
    }

    root.addEventListener("click", (e) => { const c = e.target.closest("[data-f]"); if (c && c.closest("[data-filters]")) { filter = c.dataset.f; render(); } });
    $("[data-q]").addEventListener("input", (e) => { q = e.target.value; render(); });
    root.addEventListener("change", async (e) => {
      const s = e.target.closest(".ad-status"); if (!s) return;
      try { await api.db.collection("orders").doc(s.dataset.code).update({ status: s.value, updatedAt: api.firebase.firestore.FieldValue.serverTimestamp() }); N.toast(`Đơn ${s.dataset.code}: ${STATUS[s.value][0]}`); }
      catch (err) { N.toast(api.errorText(err)); }
    });

    api.db.collection("orders").orderBy("createdAt", "desc").limit(300).onSnapshot((snap) => {
      const added = snap.docChanges().filter((c) => c.type === "added").length;
      orders = snap.docs.map((d) => d.data());
      if (!firstLoad && added) { beep(); N.toast(`Có ${added} đơn mới!`); }
      firstLoad = false;
      render();
    }, (err) => { $("[data-list]").innerHTML = `<div class="form-alert err">${N.esc(api.errorText(err))}</div>`; });
  });
})();
