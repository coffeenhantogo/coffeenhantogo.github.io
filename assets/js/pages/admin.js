/* Admin: realtime orders + customers (admin emails only, enforced by firestore.rules) */
(() => {
  const N = window.NHAN;
  const root = document.querySelector("[data-admin]");
  const STATUS = {
    pending: ["Mới đặt", "st-new"], confirmed: ["Đã xác nhận", "st-ok"], making: ["Đang pha / chuẩn bị", "st-make"],
    delivering: ["Đang giao", "st-ship"], done: ["Hoàn thành", "st-done"], cancelled: ["Đã hủy", "st-cancel"],
  };
  const toDate = (v, fallback) => (v && v.toDate ? v.toDate() : v ? new Date(v) : fallback ? new Date(fallback) : null);
  const dateOf = (o) => toDate(o.createdAt, o.createdAtLocal) || new Date();
  const sameDay = (a, b) => a && a.toDateString() === b.toDateString();
  const daysAgo = (d, n) => d && Date.now() - d.getTime() <= n * 864e5;
  const fmtDT = (d) => (d ? `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : "—");
  const ago = (d) => {
    if (!d) return "—";
    const m = Math.round((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "vừa xong"; if (m < 60) return `${m} phút trước`;
    const h = Math.round(m / 60); if (h < 24) return `${h} giờ trước`;
    const dd = Math.round(h / 24); return dd < 30 ? `${dd} ngày trước` : d.toLocaleDateString("vi-VN");
  };

  N.fbReady.then((api) => {
    if (!api) { N.requireConfig(root); return; }
    const u = api.user;
    if (!u) { location.replace("dang-nhap.html?next=quan-tri.html"); return; }
    if (!api.isAdmin(u)) {
      root.innerHTML = `<div class="co-card" style="max-width:620px;margin:0 auto;text-align:center"><h1 style="font-size:24px;color:var(--brown)">Không có quyền truy cập</h1><p style="color:var(--muted);margin:8px 0 18px">Trang này chỉ dành cho chủ quán${u.emailVerified ? "" : " (email cần được xác thực)"}.</p><a class="btn btn-lime" href="tai-khoan.html">Về tài khoản</a></div>`;
      return;
    }

    let orders = [], users = [], filter = "active", q = "", cq = "", csort = "new", firstLoad = true, view = location.hash === "#khach-hang" ? "customers" : "orders", autoAll = true;
    root.innerHTML = `
      <div class="admin-head" data-reveal="up">
        <div><span class="kicker">Quản trị</span><h1>Bảng điều khiển</h1><p>Cập nhật theo thời gian thực · ${N.esc(u.email)}</p></div>
        <label class="check"><input type="checkbox" data-sound checked><span>Âm báo khi có đơn mới</span></label>
      </div>
      <div class="admin-tabs" role="tablist">
        <button role="tab" data-view="orders">Đơn hàng <small data-n-orders>0</small></button>
        <button role="tab" data-view="customers">Khách hàng <small data-n-users>0</small></button>
      </div>
      <section data-pane="orders">
        <div class="admin-stats" data-stats></div>
        <div class="toolbar">
          <div class="filter-chips" data-filters></div>
          <div class="toolbar-right"><label class="search-inline"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input class="input" type="search" placeholder="Tìm mã đơn, tên, SĐT…" data-q></label></div>
        </div>
        <div class="admin-list" data-list></div>
      </section>
      <section data-pane="customers" hidden>
        <div class="admin-stats" data-ustats></div>
        <div class="toolbar">
          <div class="filter-chips" data-csort>
            <button class="fchip" data-s="new">Mới đăng ký</button>
            <button class="fchip" data-s="login">Đăng nhập gần đây</button>
            <button class="fchip" data-s="spend">Chi tiêu nhiều</button>
          </div>
          <div class="toolbar-right"><label class="search-inline"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input class="input" type="search" placeholder="Tìm tên, email, SĐT…" data-cq></label></div>
        </div>
        <div class="cust-list" data-ulist></div>
      </section>`;
    const $ = (s) => root.querySelector(s);
    N.anim(root.querySelectorAll("[data-reveal]"), "up", { stagger: false });

    const setView = (v) => {
      view = v;
      root.querySelectorAll("[data-view]").forEach((b) => { const on = b.dataset.view === v; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
      root.querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== v));
      history.replaceState(null, "", v === "customers" ? "#khach-hang" : location.pathname);
    };
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) setView(b.dataset.view); });
    setView(view);

    /* ---------------- orders ---------------- */
    const FILTERS = [["active", "Cần xử lý"], ["pending", "Mới"], ["confirmed", "Đã xác nhận"], ["making", "Đang pha"], ["delivering", "Đang giao"], ["done", "Hoàn thành"], ["cancelled", "Đã hủy"], ["all", "Tất cả"]];
    const isActive = (o) => !["done", "cancelled"].includes(o.status);
    function beep() {
      if (!$("[data-sound]").checked) return;
      try { const c = new (window.AudioContext || window.webkitAudioContext)(); [0, .18].forEach((t, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = i ? 1046 : 784; o.connect(g); g.connect(c.destination); g.gain.setValueAtTime(.18, c.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + t + .25); o.start(c.currentTime + t); o.stop(c.currentTime + t + .26); }); } catch { /* no audio */ }
    }
    function renderOrders() {
      const today = new Date();
      if (autoAll && !orders.some(isActive) && orders.length) filter = "all";
      const todays = orders.filter((o) => sameDay(dateOf(o), today));
      const revenue = todays.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.totalAmount || 0), 0);
      $("[data-n-orders]").textContent = orders.length;
      $("[data-stats]").innerHTML = [
        ["Đơn hôm nay", todays.length], ["Cần xử lý", orders.filter(isActive).length],
        ["Doanh thu hôm nay", N.fmtVND(revenue)], ["Tổng đơn", orders.length],
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
            <span class="ad-time">${fmtDT(d)}</span>
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
      }).join("") : `<div class="empty-state"><b>Không có đơn nào ở mục này</b>Bấm “Tất cả” để xem toàn bộ đơn.</div>`;
    }
    root.addEventListener("click", (e) => { const c = e.target.closest("[data-f]"); if (c && c.closest("[data-filters]")) { filter = c.dataset.f; autoAll = false; renderOrders(); } });
    $("[data-q]").addEventListener("input", (e) => { q = e.target.value; renderOrders(); });
    root.addEventListener("change", async (e) => {
      const s = e.target.closest(".ad-status"); if (!s) return;
      try { await api.db.collection("orders").doc(s.dataset.code).update({ status: s.value, updatedAt: api.firebase.firestore.FieldValue.serverTimestamp() }); N.toast(`Đơn ${s.dataset.code}: ${STATUS[s.value][0]}`); }
      catch (err) { N.toast(api.errorText(err)); }
    });

    /* ---------------- customers ---------------- */
    function renderUsers() {
      const today = new Date();
      const byUid = {};
      orders.forEach((o) => { if (!o.uid) return; const b = (byUid[o.uid] = byUid[o.uid] || { n: 0, spend: 0, last: null }); b.n++; if (o.status !== "cancelled") b.spend += o.totalAmount || 0; const d = dateOf(o); if (!b.last || d > b.last) b.last = d; });
      const rows = users.map((x) => ({ ...x, created: toDate(x.createdAt), login: toDate(x.lastLoginAt), stats: byUid[x.id] || { n: 0, spend: 0, last: null } }));
      $("[data-n-users]").textContent = rows.length;
      $("[data-ustats]").innerHTML = [
        ["Tổng khách hàng", rows.length],
        ["Đăng ký mới hôm nay", rows.filter((r) => sameDay(r.created, today)).length],
        ["Đăng ký 7 ngày qua", rows.filter((r) => daysAgo(r.created, 7)).length],
        ["Đăng nhập hôm nay", rows.filter((r) => sameDay(r.login, today)).length],
      ].map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join("");
      root.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("is-active", b.dataset.s === csort));
      const nq = N.norm(cq);
      let list = rows.filter((r) => !nq || N.norm(`${r.name || ""} ${r.email || ""} ${r.phone || ""}`).includes(nq));
      const t = (d) => (d ? d.getTime() : 0);
      if (csort === "login") list.sort((a, b) => t(b.login) - t(a.login));
      else if (csort === "spend") list.sort((a, b) => b.stats.spend - a.stats.spend || b.stats.n - a.stats.n);
      else list.sort((a, b) => t(b.created) - t(a.created));
      $("[data-ulist]").innerHTML = list.length ? `
        <div class="cust-table" role="table">
          <div class="ct-row ct-head" role="row"><span>Khách hàng</span><span>Liên hệ</span><span>Đăng ký</span><span>Đăng nhập gần nhất</span><span>Đơn hàng</span><span>Thao tác</span></div>
          ${list.map((r) => {
            const isNew = daysAgo(r.created, 1);
            const prov = r.provider === "google.com" ? '<span class="st st-ok">Google</span>' : '<span class="st st-make">Email</span>';
            const self = r.id === u.uid;
            const actions = self ? '<small>Tài khoản của bạn</small>' : r.deleted
              ? `<span class="st st-cancel">Đã xóa</span><a class="ct-act" href="https://console.firebase.google.com/project/coffeenhantogo/authentication/users" target="_blank" rel="noopener">Xóa đăng nhập ↗</a>`
              : r.banned
                ? `<button type="button" class="ct-act" data-unban="${r.id}">Mở khóa</button><button type="button" class="ct-act danger" data-del="${r.id}">Xóa</button>`
                : `<button type="button" class="ct-act warn" data-ban="${r.id}">Khóa</button><button type="button" class="ct-act danger" data-del="${r.id}">Xóa</button>`;
            return `<div class="ct-row ${r.banned ? "is-banned" : ""}" role="row">
              <span class="ct-name"><i class="ct-av">${N.esc(((r.name || "").replace(/^\[Đã xóa\]\s*/, "") || r.email || "?").charAt(0).toUpperCase())}</i><b>${N.esc(r.name || "(chưa có tên)")}</b>${r.banned && !r.deleted ? `<span class="st st-cancel" title="${N.esc(r.banReason || "")}">Đã khóa</span>` : isNew ? '<span class="st st-new">Mới</span>' : ""}</span>
              <span class="ct-contact">${r.phone ? `<a href="tel:${N.esc(r.phone)}">${N.esc(r.phone)}</a>` : '<em>Chưa có SĐT</em>'}<small>${N.esc(r.email || "")}</small></span>
              <span><b class="ct-strong">${r.created ? r.created.toLocaleDateString("vi-VN") : "—"}</b>${prov}</span>
              <span><b class="ct-strong">${ago(r.login)}</b><small>${r.loginCount ? `${r.loginCount} lần đăng nhập` : ""}</small></span>
              <span><b class="ct-strong">${r.stats.n} đơn</b><small>${r.stats.spend ? N.fmtVND(r.stats.spend) : "—"}</small></span>
              <span class="ct-actions">${actions}${r.banned && r.banReason ? `<small>Lý do: ${N.esc(r.banReason)}</small>` : ""}</span>
            </div>`;
          }).join("")}
        </div>` : `<div class="empty-state"><b>Chưa có khách hàng</b>Khách đăng ký sẽ tự hiện ở đây.</div>`;
    }
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-s]"); if (b) { csort = b.dataset.s; renderUsers(); } });

    /* lock / unlock / delete customers */
    const FV = api.firebase.firestore.FieldValue;
    const nameOf = (id) => { const x = users.find((y) => y.id === id); return x ? (x.name || x.email || id) : id; };
    root.addEventListener("click", async (e) => {
      const ban = e.target.closest("[data-ban]"), unban = e.target.closest("[data-unban]"), del = e.target.closest("[data-del]");
      if (!ban && !unban && !del) return;
      const id = (ban || unban || del).dataset.ban || (ban || unban || del).dataset.unban || (ban || unban || del).dataset.del;
      const ref = api.db.collection("users").doc(id);
      try {
        if (ban) {
          const reason = prompt(`Khóa tài khoản "${nameOf(id)}"?\nKhách sẽ bị đăng xuất và không thể đăng nhập / đặt hàng.\n\nLý do (VD: spam, đặt đơn ảo, lừa đảo):`, "Spam / đặt đơn ảo");
          if (reason === null) return;
          await ref.set({ banned: true, banReason: reason.trim().slice(0, 200), bannedAt: FV.serverTimestamp(), bannedBy: u.email }, { merge: true });
          N.toast(`Đã khóa: ${nameOf(id)}`);
        } else if (unban) {
          if (!confirm(`Mở khóa tài khoản "${nameOf(id)}"?`)) return;
          await ref.set({ banned: false, banReason: FV.delete(), bannedAt: FV.delete() }, { merge: true });
          N.toast(`Đã mở khóa: ${nameOf(id)}`);
        } else {
          const x = users.find((y) => y.id === id) || {};
          const mine = orders.filter((o) => o.uid === id);
          const reason = prompt(`XÓA tài khoản "${nameOf(id)}"?\n• Xóa họ tên, SĐT, địa chỉ của khách\n• Xóa ${mine.length} đơn hàng của khách\n• Khóa vĩnh viễn (không đăng nhập / đặt hàng được)\nKhông thể hoàn tác.\n\nNhập lý do để xác nhận:`, "Lừa đảo");
          if (reason === null) return;
          for (const o of mine) await api.db.collection("orders").doc(o.code).delete();
          await ref.set({ banned: true, deleted: true, banReason: reason.trim().slice(0, 200) || "Đã xóa", bannedAt: FV.serverTimestamp(), deletedAt: FV.serverTimestamp(), bannedBy: u.email,
            name: x.name ? `[Đã xóa] ${x.name}` : "[Đã xóa]", phone: FV.delete(), address: FV.delete(), branch: FV.delete() }, { merge: true });
          N.toast(`Đã xóa dữ liệu của ${nameOf(id)}. Bấm "Xóa đăng nhập ↗" để xóa hẳn trong Firebase.`);
        }
      } catch (err) { N.toast(api.errorText(err)); }
    });
    $("[data-cq]").addEventListener("input", (e) => { cq = e.target.value; renderUsers(); });

    /* ---------------- realtime data ---------------- */
    api.db.collection("orders").orderBy("createdAt", "desc").limit(500).onSnapshot((snap) => {
      const added = snap.docChanges().filter((c) => c.type === "added").length;
      orders = snap.docs.map((d) => d.data());
      if (!firstLoad && added) { beep(); N.toast(`Có ${added} đơn mới!`); }
      firstLoad = false;
      renderOrders(); renderUsers();
    }, (err) => { $("[data-list]").innerHTML = `<div class="form-alert err">${N.esc(api.errorText(err))}</div>`; });
    api.db.collection("users").limit(1000).onSnapshot((snap) => {
      users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      renderUsers();
    }, (err) => { $("[data-ulist]").innerHTML = `<div class="form-alert err">${N.esc(api.errorText(err))}</div>`; });
  });
})();
