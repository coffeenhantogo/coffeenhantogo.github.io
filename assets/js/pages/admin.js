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

    let showDeleted = false; let orders = [], users = [], filter = "active", q = "", cq = "", csort = "new", firstLoad = true, autoAll = true;
    const HASH = { "#don-hang": "orders", "#khach-hang": "customers", "#thuc-don": "menu" };
    let view = HASH[location.hash] || "overview";
    const aico = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const AI = {
      chart: aico('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
      bag: aico('<path d="M6 7h12l1 13H5z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>'),
      users: aico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c1-3.5 3.6-5.5 6.5-5.5s5.5 2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c1.8.8 3 2.6 3.5 5.4"/>'),
      menu: aico('<path d="M5 8h12v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M12 3v2"/>'),
      shield: '<svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 3 5 6v5c0 4.4 3 8.3 7 9.5 4-1.2 7-5.1 7-9.5V6z" fill="currentColor"/><path d="m9 12 2 2 4-4" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
    const firstName = (u.displayName || "").trim().split(/\s+/)[0] || "Quản trị";
    const todayLong = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
    root.innerHTML = `
      <section class="dash-hero adm-hero" data-reveal="up">
        <div class="dh-inner">
          <div class="adm-badge">${AI.shield}</div>
          <div class="dh-text">
            <span class="dh-kicker">Quản trị · Coffee Nhẫn To Go</span>
            <h1>Chào ${N.esc(firstName)}!</h1>
            <p><span class="dh-since">${todayLong.charAt(0).toUpperCase() + todayLong.slice(1)}</span><button type="button" class="shop-pill" data-shop-pill data-view="menu"></button><span class="dh-since">Cập nhật theo thời gian thực</span></p>
          </div>
          <div class="dh-actions">
            <label class="check check-light"><input type="checkbox" data-sound checked><span>Âm báo đơn mới</span></label>
            <a class="btn btn-outline-light btn-sm" href="tai-khoan.html">Hồ sơ &amp; ảnh</a>
          </div>
        </div>
        <div class="dh-stats adm-stats" data-kpis></div>
      </section>
      <div class="dash">
        <nav class="dash-nav" aria-label="Mục quản trị" data-reveal="left">
          <button type="button" data-view="overview">${AI.chart}<span>Tổng quan</span></button>
          <button type="button" data-view="orders">${AI.bag}<span>Đơn hàng</span><small data-n-orders>0</small></button>
          <button type="button" data-view="customers">${AI.users}<span>Khách hàng</span><small class="muted" data-n-users>0</small></button>
          <button type="button" data-view="menu">${AI.menu}<span>Thực đơn</span><small class="warn" data-n-out hidden></small></button>
        </nav>
        <div class="dash-main">
      <section data-pane="overview">
        <div data-ov-alert></div>
        <div class="dcard">
          <div class="dcard-head"><h2>Doanh thu 7 ngày qua</h2><span class="dmeta" data-ov-total></span></div>
          <div class="rev-chart" data-ov-chart></div>
        </div>
        <div class="ov-grid">
          <div class="dcard"><div class="dcard-head"><h2>Món bán chạy · 7 ngày</h2></div><div data-ov-top></div></div>
          <div class="dcard"><div class="dcard-head"><h2>Đơn mới nhất</h2><button type="button" class="dlink" data-go-orders>Tất cả đơn →</button></div><div data-ov-latest></div></div>
        </div>
      </section>
      <section data-pane="orders" hidden>
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
            <button class="fchip fchip-del" data-showdel hidden></button>
          </div>
          <div class="toolbar-right"><label class="search-inline"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input class="input" type="search" placeholder="Tìm tên, email, SĐT…" data-cq></label></div>
        </div>
        <div class="cust-list" data-ulist></div>
      </section>
      <section data-pane="menu" hidden>
        <div class="shop-switch" data-shopbox>
          <div class="ss-text"><b data-open-title>Đang nhận đơn online</b><p>Tắt khi quán nghỉ hoặc quá tải: khách vẫn xem thực đơn nhưng không gửi đơn được, website hiện thông báo kèm lời nhắn bên dưới.</p>
            <label class="field" style="margin:10px 0 0"><span>Lời nhắn khi tạm ngưng</span><input class="input" maxlength="140" data-note placeholder="VD: Quán nghỉ Tết, nhận đơn lại từ 05/02."></label>
          </div>
          <label class="switch" title="Bật / tắt nhận đơn"><input type="checkbox" data-shop-open><span aria-hidden="true"></span><em class="sr-only">Nhận đơn online</em></label>
        </div>
        <div class="mn-head"><h2>Món &amp; giá</h2><p>Bấm <b>Còn hàng / Hết hàng</b> để đổi ngay. Sửa giá rồi bấm <b>Lưu giá</b>. Giá gốc là giá trong thực đơn ban đầu.</p></div>
        <div class="mn-list" data-mlist></div>
        <div class="mn-foot">
          <button class="btn btn-lime" type="button" data-msave>Lưu giá</button>
          <button class="btn btn-outline" type="button" data-mreset>Khôi phục toàn bộ giá gốc</button>
        </div>
      </section>
        </div>
      </div>`;
    const $ = (s) => root.querySelector(s);
    N.anim(root.querySelectorAll("[data-reveal]"), "up", { stagger: false });

    const setView = (v) => {
      view = v;
      root.querySelectorAll("[data-view]").forEach((b) => { const on = b.dataset.view === v; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
      root.querySelectorAll("[data-pane]").forEach((p) => (p.hidden = p.dataset.pane !== v));
      history.replaceState(null, "", v === "orders" ? "#don-hang" : v === "customers" ? "#khach-hang" : v === "menu" ? "#thuc-don" : location.pathname);
      const nav = root.querySelector(".dash-nav"), act = nav && nav.querySelector(`[data-view="${v}"]`);
      if (nav && act && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: nav.scrollLeft + act.getBoundingClientRect().left - nav.getBoundingClientRect().left - nav.clientWidth / 2 + act.clientWidth / 2 });
      const pane = root.querySelector(`[data-pane="${v}"]`); if (pane) N.anim(pane.querySelectorAll(".dcard, .stat, .ov-alert"), "up");
    };
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-view]"); if (b) setView(b.dataset.view); });
    setView(view);

    /* ---------------- orders ---------------- */
    const FILTERS = [["active", "Cần xử lý"], ["pending", "Mới"], ["confirmed", "Đã xác nhận"], ["making", "Đang pha"], ["delivering", "Đang giao"], ["done", "Hoàn thành"], ["cancelled", "Đã hủy"], ["all", "Tất cả"]];
    const nextOf = (o) => ({ pending: ["confirmed", "Xác nhận đơn"], confirmed: ["making", "Bắt đầu pha"], making: o.delivery && o.delivery.method === "ship" ? ["delivering", "Giao hàng"] : ["done", "Hoàn thành"], delivering: ["done", "Đã giao xong"] })[o.status];
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
      { const na = orders.filter(isActive).length, bn = $("[data-n-orders]"); bn.textContent = na; bn.hidden = !na; }
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
        const pc = ["pending", "confirmed"].includes(o.status) ? N.checkOrderPrice(o) : { ok: true };
        const where = o.delivery.method === "ship" ? `🛵 Giao: ${N.esc(o.delivery.address)}` : `🏠 Nhận tại: ${N.esc(o.delivery.branch)}`;
        return `<article class="admin-order ${cls}">
          <div class="ad-top">
            <div><b class="ad-code">${N.esc(o.code)}</b> <span class="st ${cls}">${st}</span>${o.cancelledBy === "customer" ? ' <span class="st st-cancel">Khách tự hủy</span>' : ""}${o.uid ? ' <span class="st st-ok">Thành viên</span>' : ""}${pc.ok ? "" : ' <span class="st st-warn" title="Tổng tiền khách gửi khác với giá trong thực đơn – kiểm tra trước khi xác nhận">⚠ Giá không khớp</span>'}</div>
            <span class="ad-time">${fmtDT(d)}</span>
          </div>
          <div class="ad-body">
            <div class="ad-cust"><b>${N.esc(o.customer.name)}</b><a href="tel:${N.esc(o.customer.phone)}">${N.esc(o.customer.phone)}</a>${o.customer.email ? `<span>${N.esc(o.customer.email)}</span>` : ""}<span>${where}</span><span>⏰ ${N.esc(o.delivery.time)}</span></div>
            <ul class="ad-items">${o.items.map((i) => `<li><b>${i.qty}×</b> ${N.esc(i.name)}${i.opts ? ` <small>(${N.esc(i.opts)})</small>` : ""}${i.note ? ` <em>– ${N.esc(i.note)}</em>` : ""}</li>`).join("")}</ul>
          </div>
          ${o.note ? `<p class="ad-note">📝 ${N.esc(o.note)}</p>` : ""}
          <div class="ad-foot">
            <span>${N.esc(o.payment)} · <b>${N.esc(o.totalText)}</b>${pc.ok ? "" : ` <em class="ad-pricewarn">Thực đơn tính: ${pc.expected != null ? N.fmtVND(pc.expected) : "có món không còn trong thực đơn"}</em>`}</span>
            <div class="ad-actions">
              <button class="btn btn-outline btn-sm" type="button" data-print="${N.esc(o.code)}">In phiếu</button>
              <a class="btn btn-outline btn-sm" href="https://zalo.me/${N.esc(o.customer.phone)}" target="_blank" rel="noopener">Zalo khách</a>
              ${nextOf(o) ? `<button type="button" class="btn btn-lime btn-sm ad-next" data-next="${N.esc(o.code)}" data-to="${nextOf(o)[0]}">${nextOf(o)[1]} →</button>` : ""}
              <select class="select ad-status" data-code="${N.esc(o.code)}">${Object.entries(STATUS).map(([k, [t]]) => `<option value="${k}" ${o.status === k ? "selected" : ""}>${t}</option>`).join("")}</select>
            </div>
          </div>
        </article>`;
      }).join("") : `<div class="empty-state"><b>Không có đơn nào ở mục này</b>Bấm “Tất cả” để xem toàn bộ đơn.</div>`;
    }
    root.addEventListener("click", (e) => { const c = e.target.closest("[data-f]"); if (c && c.closest("[data-filters]")) { filter = c.dataset.f; autoAll = false; renderOrders(); } });
    $("[data-q]").addEventListener("input", (e) => { q = e.target.value; renderOrders(); });
    root.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-next]"); if (!b) return;
      b.disabled = true;
      try { await api.db.collection("orders").doc(b.dataset.next).update({ status: b.dataset.to, updatedAt: api.firebase.firestore.FieldValue.serverTimestamp() }); N.toast(`Đơn ${b.dataset.next}: ${STATUS[b.dataset.to][0]}`); }
      catch (err) { b.disabled = false; N.toast(api.errorText(err)); }
    });
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
      const ADMINS = (N.ADMIN_EMAILS || []).map((e) => e.toLowerCase());
      const rows = users
        .filter((x) => x.id !== u.uid && !ADMINS.includes((x.email || "").toLowerCase())) // shop admins are not customers
        .map((x) => ({ ...x, created: toDate(x.createdAt), login: toDate(x.lastLoginAt), stats: byUid[x.id] || { n: 0, spend: 0, last: null } }));
      const live = rows.filter((r) => !r.deleted);
      $("[data-n-users]").textContent = live.length;
      $("[data-ustats]").innerHTML = [
        ["Tổng khách hàng", live.length],
        ["Đăng ký mới hôm nay", live.filter((r) => sameDay(r.created, today)).length],
        ["Đăng ký 7 ngày qua", live.filter((r) => daysAgo(r.created, 7)).length],
        ["Đăng nhập hôm nay", live.filter((r) => sameDay(r.login, today)).length],
      ].map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join("");
      root.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("is-active", b.dataset.s === csort));
      const nq = N.norm(cq);
      const nDel = rows.length - live.length;
      const tg = $("[data-showdel]");
      tg.hidden = nDel === 0;
      tg.classList.toggle("is-active", showDeleted);
      tg.innerHTML = `${showDeleted ? "Ẩn đã xóa" : "Đã xóa"}<small>${nDel}</small>`;
      let list = rows.filter((r) => (showDeleted || !r.deleted) && (!nq || N.norm(`${r.name || ""} ${r.email || ""} ${r.phone || ""}`).includes(nq)));
      const t = (d) => (d ? d.getTime() : 0);
      const byDeleted = (a, b) => (a.deleted ? 1 : 0) - (b.deleted ? 1 : 0);
      if (csort === "login") list.sort((a, b) => t(b.login) - t(a.login));
      else if (csort === "spend") list.sort((a, b) => b.stats.spend - a.stats.spend || b.stats.n - a.stats.n);
      else list.sort((a, b) => t(b.created) - t(a.created));
      list.sort(byDeleted);
      $("[data-ulist]").innerHTML = list.length ? `
        <div class="cust-table" role="table">
          <div class="ct-row ct-head" role="row"><span>Khách hàng</span><span>Liên hệ</span><span>Đăng ký</span><span>Đăng nhập gần nhất</span><span>Đơn hàng</span><span>Thao tác</span></div>
          ${list.map((r) => {
            const isNew = !r.deleted && !r.banned && daysAgo(r.created, 1);
            const prov = r.provider === "google.com" ? '<span class="st st-ok">Google</span>' : '<span class="st st-make">Email</span>';
            const self = r.id === u.uid;
            const actions = self ? '<small>Tài khoản của bạn</small>' : r.deleted
              ? `<span class="st st-cancel">Đã xóa</span><a class="ct-act" href="https://console.firebase.google.com/project/coffeenhantogo/authentication/users" target="_blank" rel="noopener">Xóa đăng nhập ↗</a>`
              : r.banned
                ? `<button type="button" class="ct-act" data-unban="${r.id}">Mở khóa</button><button type="button" class="ct-act danger" data-del="${r.id}">Xóa</button>`
                : `<button type="button" class="ct-act warn" data-ban="${r.id}">Khóa</button><button type="button" class="ct-act danger" data-del="${r.id}">Xóa</button>`;
            return `<div class="ct-row ${r.banned ? "is-banned" : ""}" role="row">
              <span class="ct-name"><i class="ct-av">${N.esc(((r.name || "").replace(/^\[Đã xóa\]\s*/, "") || r.email || "?").charAt(0).toUpperCase())}${N.avatarImg(r.photo || r.photoURL)}</i><b>${N.esc(r.name || "(chưa có tên)")}</b>${r.banned && !r.deleted ? `<span class="st st-cancel" title="${N.esc(r.banReason || "")}">Đã khóa</span>` : isNew ? '<span class="st st-new">Mới</span>' : ""}</span>
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
    root.addEventListener("click", (e) => { if (e.target.closest("[data-showdel]")) { showDeleted = !showDeleted; renderUsers(); } });

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

    /* ---------------- print order slip (80mm receipt printer or A4) ---------------- */
    const printOrder = (o) => {
      const S = N.STORE, e = N.esc;
      const where = o.delivery.method === "ship" ? `Giao tới: ${e(o.delivery.address)}` : `Nhận tại: ${e(o.delivery.branch)}`;
      const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu ${e(o.code)}</title><style>
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 12.5px; color: #000; width: 72mm; margin: 0 auto; line-height: 1.35; }
        h1 { font-size: 16px; text-align: center; margin: 0; letter-spacing: .04em; } .c { text-align: center; }
        hr { border: 0; border-top: 1px dashed #000; margin: 7px 0; } table { width: 100%; border-collapse: collapse; }
        td { vertical-align: top; padding: 2px 0; } td.r { text-align: right; white-space: nowrap; padding-left: 6px; }
        .big { font-size: 15px; font-weight: 700; } small { color: #333; } p { margin: 2px 0; }
      </style></head><body>
        <h1>COFFEE NHẪN TO GO</h1><div class="c">${S.phoneDisplay} · Drink to be happy</div><hr>
        <div class="c big">${e(o.code)}</div><div class="c">${fmtDT(dateOf(o))}</div><hr>
        <p><b>Khách:</b> ${e(o.customer.name)} – ${e(o.customer.phone)}</p><p>${where}</p><p><b>Thời gian:</b> ${e(o.delivery.time)}</p><hr>
        <table>${o.items.map((i) => `<tr><td><b>${i.qty}×</b> ${e(i.name)}${i.opts ? `<br><small>${e(i.opts)}</small>` : ""}${i.note ? `<br><small>Ghi chú: ${e(i.note)}</small>` : ""}</td><td class="r">${i.price != null ? N.fmtVND(i.price * i.qty) : ""}</td></tr>`).join("")}</table><hr>
        <table><tr><td class="big">TỔNG</td><td class="r big">${e(o.totalText)}</td></tr></table>
        <p>Thanh toán: ${e(o.payment)}</p>${o.note ? `<p><b>Ghi chú đơn:</b> ${e(o.note)}</p>` : ""}<hr>
        <div class="c">Cảm ơn bạn đã ủng hộ Nhẫn!</div>
      </body></html>`;
      const f = document.createElement("iframe");
      f.setAttribute("aria-hidden", "true");
      f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
      document.body.appendChild(f);
      const d = f.contentDocument; d.open(); d.write(html); d.close();
      setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1500); }, 250);
    };
    root.addEventListener("click", (e) => { const b = e.target.closest("[data-print]"); if (b) { const o = orders.find((x) => x.code === b.dataset.print); o && printOrder(o); } });

    /* ---------------- menu: sold-out toggles, prices, pause online orders (settings/shop) ---------------- */
    const shopRef = api.db.collection("settings").doc("shop");
    const GROUP_T = { "ca-phe": "Cà phê Moka", "bac-xiu": "Bạc xỉu", "tra-sua": "Trà sữa & sữa", "ca-phe-xay": "Cà phê xay 1kg" };
    const curShop = () => JSON.parse(JSON.stringify({ open: N.shop.open, note: N.shop.note, soldOut: N.shop.soldOut, prices: N.shop.prices }));
    let pricesDirty = false;
    // apply locally first (so quick successive edits build on each other), then write; roll back on failure
    const saveShop = async (next, msg) => {
      const prev = curShop();
      N.setShop(next);
      try {
        await shopRef.set({ ...next, updatedAt: FV.serverTimestamp(), updatedBy: u.email });
        N.toast(msg); return true;
      } catch (err) {
        N.setShop(prev);
        N.toast(err && err.code === "permission-denied" ? "Chưa lưu được: tài khoản không có quyền quản trị hoặc quy tắc Firestore chưa được cập nhật." : api.errorText(err));
        renderMenu(true); return false;
      }
    };
    const fmtNum = (n) => new Intl.NumberFormat("vi-VN").format(n);
    const baseOf = (p, k) => (k === "price" ? p._base.price : p._base.priceBy[k]);
    const valOf = (p, k) => (k === "price" ? p.price : p.priceBy[k]);
    function renderMenu(force) {
      const sh = N.shop;
      $("[data-shop-open]").checked = sh.open;
      $("[data-open-title]").textContent = sh.open ? "Đang nhận đơn online" : "Đang TẠM NGƯNG nhận đơn online";
      $("[data-shopbox]").classList.toggle("is-off", !sh.open);
      if (document.activeElement !== $("[data-note]")) $("[data-note]").value = sh.note;
      const nOut = N.PRODUCTS.filter((p) => p.soldOut).length;
      const badge = $("[data-n-out]"); badge.hidden = !nOut; badge.textContent = `${nOut} hết`;
      if (pricesDirty && !force) { // keep unsaved price edits; only refresh stock buttons
        root.querySelectorAll("[data-pid]").forEach((row) => { const p = N.byId[row.dataset.pid]; row.classList.toggle("is-out", p.soldOut); const b = row.querySelector("[data-stock]"); b.classList.toggle("out", p.soldOut); b.textContent = p.soldOut ? "Hết hàng" : "Còn hàng"; b.setAttribute("aria-pressed", String(!p.soldOut)); });
        return;
      }
      pricesDirty = false;
      const groups = [...new Set(N.PRODUCTS.map((p) => p.group))];
      $("[data-mlist]").innerHTML = groups.map((g) => `
        <div class="mn-group"><h3>${N.esc(GROUP_T[g] || g)}</h3>
          ${N.PRODUCTS.filter((p) => p.group === g).map((p) => {
            const keys = p._base.priceBy ? Object.keys(p._base.priceBy) : ["price"];
            return `<div class="mn-row ${p.soldOut ? "is-out" : ""}" data-pid="${p.id}">
              <img src="${N.img(p.img)}" alt="" loading="lazy">
              <div class="mn-name"><b>${N.esc(p.name)}</b><small>${N.esc(p.cat)}</small></div>
              <div class="mn-prices">${keys.map((k) => {
                const v = valOf(p, k), b = baseOf(p, k);
                return `<label class="mn-price"><span>${k === "price" ? (p.type === "ground" ? "Gói 1kg" : "Ly lớn") : N.esc(k)}</span><span class="mn-money"><input class="input" type="text" inputmode="numeric" autocomplete="off" data-k="${N.esc(k)}" value="${v != null ? fmtNum(v) : ""}" aria-label="Giá ${N.esc(p.name)} ${N.esc(k === "price" ? "" : k)}"><em aria-hidden="true">₫</em></span><small class="${v !== b ? "chg" : ""}">${v !== b ? "Đã đổi · " : ""}Gốc ${b != null ? N.fmtVND(b) : "—"}</small></label>`;
              }).join("")}</div>
              <button type="button" class="mn-stock ${p.soldOut ? "out" : ""}" data-stock="${p.id}" aria-pressed="${!p.soldOut}">${p.soldOut ? "Hết hàng" : "Còn hàng"}</button>
            </div>`;
          }).join("")}
        </div>`).join("");
    }
    // price inputs: digits only, shown as 22.000 while typing (caret kept after the same digit)
    root.addEventListener("input", (e) => {
      const inp = e.target.closest("[data-k]"); if (!inp) return;
      pricesDirty = true;
      const caret = inp.selectionStart ?? inp.value.length, digitsBefore = inp.value.slice(0, caret).replace(/\D/g, "").length;
      const digits = inp.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 8);
      inp.value = digits ? fmtNum(+digits) : "";
      let pos = 0, seen = 0; while (pos < inp.value.length && seen < digitsBefore) { if (/\d/.test(inp.value[pos])) seen++; pos++; }
      try { inp.setSelectionRange(pos, pos); } catch { /* not focusable */ }
    });
    root.addEventListener("click", async (e) => {
      const st = e.target.closest("[data-stock]");
      if (st) {
        const id = st.dataset.stock, p = N.byId[id], next = curShop();
        if (next.soldOut[id]) delete next.soldOut[id]; else next.soldOut[id] = true;
        st.disabled = true;
        await saveShop(next, next.soldOut[id] ? `“${p.name}”: đã báo HẾT HÀNG` : `“${p.name}”: đã bán lại`);
        st.disabled = false;
        return;
      }
      if (e.target.closest("[data-msave]")) {
        const prices = {}; let bad = null;
        root.querySelectorAll("[data-pid]").forEach((row) => {
          const p = N.byId[row.dataset.pid];
          row.querySelectorAll("[data-k]").forEach((inp) => {
            const k = inp.dataset.k, b = baseOf(p, k);
            if (inp.value === "" && b == null) return;
            const v = Math.round(Number(inp.value.replace(/\D/g, "")) || NaN);
            const ok = Number.isFinite(v) && v >= 1000 && v <= 10000000;
            inp.classList.toggle("is-bad", !ok);
            if (!ok) { bad = bad || inp; return; }
            if (v !== b) (prices[p.id] = prices[p.id] || {})[k] = v;
          });
        });
        if (bad) { bad.focus(); N.toast("Giá phải từ 1.000đ đến 10.000.000đ"); return; }
        const next = curShop(); next.prices = prices;
        if (await saveShop(next, "Đã lưu giá – website cập nhật ngay cho khách")) renderMenu(true);
        return;
      }
      if (e.target.closest("[data-mreset]")) {
        if (!confirm("Khôi phục toàn bộ giá về giá gốc trong thực đơn?")) return;
        const next = curShop(); next.prices = {};
        if (await saveShop(next, "Đã khôi phục giá gốc")) renderMenu(true);
      }
    });
    $("[data-shop-open]").addEventListener("change", async (e) => {
      const on = e.target.checked;
      if (!on && !confirm("Tạm ngưng nhận đơn online?\nKhách sẽ thấy thông báo và không gửi được đơn cho tới khi bạn bật lại.")) { e.target.checked = true; return; }
      const next = curShop(); next.open = on; next.note = $("[data-note]").value.trim().slice(0, 140);
      await saveShop(next, on ? "Đã MỞ nhận đơn online" : "Đã TẠM NGƯNG nhận đơn online");
    });
    $("[data-note]").addEventListener("change", async (e) => {
      const next = curShop(); next.note = e.target.value.trim().slice(0, 140);
      await saveShop(next, "Đã lưu lời nhắn");
    });
    document.addEventListener("nhan:shop", () => { renderMenu(); updateShopPill(); });
    renderMenu(true);

    /* ---------------- overview: KPIs, 7-day revenue chart, top items, latest orders ---------------- */
    const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const amount = (o) => (o.status === "cancelled" ? 0 : o.totalAmount || 0);
    const STATUS_ICON = {};
    function renderOverview() {
      const now = new Date(), today = dayKey(now), yd = new Date(now - 864e5);
      const days = [...Array(7)].map((_, i) => { const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return { d, key: dayKey(d), rev: 0, n: 0 }; });
      const byKey = Object.fromEntries(days.map((x) => [x.key, x]));
      const top = {};
      orders.forEach((o) => {
        const d = dateOf(o), b = byKey[dayKey(d)];
        if (!b) return;
        if (o.status !== "cancelled") { b.rev += amount(o); b.n++; o.items.forEach((i) => { top[i.name] = (top[i.name] || 0) + i.qty; }); }
      });
      const tRev = byKey[today].rev, yRev = orders.filter((o) => dayKey(dateOf(o)) === dayKey(yd)).reduce((s, o) => s + amount(o), 0);
      const todays = orders.filter((o) => dayKey(dateOf(o)) === today);
      const active = orders.filter(isActive).length, pending = orders.filter((o) => o.status === "pending").length;
      const ADM = (N.ADMIN_EMAILS || []).map((e) => e.toLowerCase());
      const newCust = users.filter((x) => !x.deleted && x.id !== u.uid && !ADM.includes((x.email || "").toLowerCase()) && daysAgo(toDate(x.createdAt), 7)).length;
      const delta = yRev ? Math.round(((tRev - yRev) / yRev) * 100) : null;
      $("[data-kpis]").innerHTML = [
        ["Doanh thu hôm nay", N.fmtVND(tRev), delta == null ? "Hôm qua: " + N.fmtVND(yRev) : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% so với hôm qua`],
        ["Đơn hôm nay", todays.length, `${todays.filter((o) => o.status === "cancelled").length} đơn đã hủy`],
        ["Cần xử lý", active, pending ? `${pending} đơn mới chờ xác nhận` : "Không có đơn mới"],
        ["Khách mới · 7 ngày", newCust, `${users.filter((x) => !x.deleted).length} tài khoản`],
      ].map(([k, v, s]) => `<div><span>${k}</span><b>${v}</b><small>${s}</small></div>`).join("");
      // alert for new orders
      $("[data-ov-alert]").innerHTML = pending
        ? `<div class="ov-alert"><span class="ova-dot" aria-hidden="true"></span><div><b>Có ${pending} đơn mới đang chờ xác nhận</b><small>Khách đang đợi – bấm để xử lý ngay.</small></div><button type="button" class="btn btn-lime btn-sm" data-go-orders data-f-go="pending">Xử lý ngay →</button></div>` : "";
      // 7-day revenue bar chart (single series, SVG, hover tooltip + hidden table)
      const W = 700, H = 230, padL = 8, padR = 8, padT = 26, padB = 44, gap = 18;
      const max = Math.max(...days.map((x) => x.rev));
      const nice = max <= 0 ? 100000 : (() => { const p = 10 ** Math.floor(Math.log10(max)); return Math.ceil(max / p) * p; })();
      const bw = (W - padL - padR - gap * 6) / 7, ch = H - padT - padB;
      const short = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(v % 1e6 ? 1 : 0).replace(".", ",")}tr` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`);
      const grid = [0, 0.5, 1].map((f) => { const y = padT + ch * (1 - f); return `<line x1="${padL}" x2="${W - padR}" y1="${y}" y2="${y}" class="rc-grid"/><text x="${W - padR}" y="${y - 5}" class="rc-axis" text-anchor="end">${short(nice * f)}</text>`; }).join("");
      const bars = days.map((x, i) => {
        const h = x.rev ? Math.max(4, (x.rev / nice) * ch) : 0, X = padL + i * (bw + gap), Y = padT + ch - h, isT = x.key === today;
        const label = `${WD[x.d.getDay()]} ${x.d.getDate()}/${x.d.getMonth() + 1}`;
        const showVal = x.rev && (isT || x.rev === max);
        return `<g class="rc-bar${isT ? " is-today" : ""}" data-tip="${N.esc(`${isT ? "Hôm nay" : label}: ${N.fmtVND(x.rev)} · ${x.n} đơn`)}">
          <rect class="rc-hit" x="${X - gap / 2}" y="${padT}" width="${bw + gap}" height="${ch + padB}" />
          ${h ? `<path d="M${X},${padT + ch} V${Y + 4} Q${X},${Y} ${X + 4},${Y} H${X + bw - 4} Q${X + bw},${Y} ${X + bw},${Y + 4} V${padT + ch} Z" class="rc-fill"/>` : `<line x1="${X}" x2="${X + bw}" y1="${padT + ch}" y2="${padT + ch}" class="rc-zero"/>`}
          ${showVal ? `<text x="${X + bw / 2}" y="${Y - 8}" text-anchor="middle" class="rc-val">${short(x.rev)}</text>` : ""}
          <text x="${X + bw / 2}" y="${H - 22}" text-anchor="middle" class="rc-day">${isT ? "Hôm nay" : WD[x.d.getDay()]}</text>
          <text x="${X + bw / 2}" y="${H - 6}" text-anchor="middle" class="rc-date">${x.d.getDate()}/${x.d.getMonth() + 1}</text>
        </g>`;
      }).join("");
      const total7 = days.reduce((s, x) => s + x.rev, 0), n7 = days.reduce((s, x) => s + x.n, 0);
      $("[data-ov-total]").innerHTML = `Tổng 7 ngày: <b>${N.fmtVND(total7)}</b> · ${n7} đơn`;
      $("[data-ov-chart]").innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Doanh thu 7 ngày qua, tổng ${N.fmtVND(total7)}">${grid}${bars}<line x1="${padL}" x2="${W - padR}" y1="${padT + ch}" y2="${padT + ch}" class="rc-base"/></svg>
        <div class="rc-tip" data-rc-tip hidden></div>
        <table class="sr-only"><caption>Doanh thu theo ngày</caption><tr><th>Ngày</th><th>Doanh thu</th><th>Số đơn</th></tr>${days.map((x) => `<tr><td>${x.d.toLocaleDateString("vi-VN")}</td><td>${N.fmtVND(x.rev)}</td><td>${x.n}</td></tr>`).join("")}</table>
        ${total7 ? "" : '<p class="rc-empty">Chưa có doanh thu trong 7 ngày qua – biểu đồ sẽ tự cập nhật khi có đơn.</p>'}`;
      // top items (7 days)
      const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5), tmax = topList.length ? topList[0][1] : 1;
      $("[data-ov-top]").innerHTML = topList.length ? `<ol class="top-items">${topList.map(([name, n], i) => {
        const p = N.PRODUCTS.find((x) => x.name === name);
        return `<li><span class="ti-rank">${i + 1}</span>${p ? `<img src="${N.img(p.img)}" alt="">` : ""}<div><b>${N.esc(name)}</b><span class="ti-bar"><i style="width:${Math.max(6, (n / tmax) * 100)}%"></i></span></div><em>${n} ly</em></li>`;
      }).join("")}</ol>` : '<div class="d-empty"><b>Chưa có dữ liệu</b><span>Món bán chạy sẽ hiện khi có đơn trong 7 ngày qua.</span></div>';
      // latest orders
      const latest = orders.slice(0, 5);
      $("[data-ov-latest]").innerHTML = latest.length ? `<ul class="latest">${latest.map((o) => {
        const [st, cls] = STATUS[o.status] || STATUS.pending;
        return `<li><button type="button" data-open-order="${N.esc(o.code)}"><span class="lt-ic ${cls}" aria-hidden="true">${STATUS_ICON[o.status] || "●"}</span><span class="lt-main"><b>${N.esc(o.customer.name)}</b><small>${N.esc(o.code)} · ${ago(dateOf(o))}</small></span><span class="lt-end"><b>${N.esc(o.totalText)}</b><span class="st ${cls}">${st}</span></span></button></li>`;
      }).join("")}</ul>` : '<div class="d-empty"><b>Chưa có đơn hàng</b><span>Đơn mới sẽ hiện ở đây kèm âm báo.</span></div>';
      updateShopPill();
    }
    const updateShopPill = () => {
      const p = $("[data-shop-pill]"); if (!p) return;
      p.className = `shop-pill ${N.shop.open ? "is-open" : "is-off"}`;
      p.innerHTML = `<i aria-hidden="true"></i>${N.shop.open ? "Đang nhận đơn online" : "Đang tạm ngưng nhận đơn"}`;
    };
    // chart tooltip
    root.addEventListener("mouseover", (e) => {
      const g = e.target.closest(".rc-bar"), tip = $("[data-rc-tip]");
      if (!tip) return;
      if (!g) { tip.hidden = true; return; }
      const box = $("[data-ov-chart]").getBoundingClientRect(), r = g.querySelector(".rc-fill, .rc-zero").getBoundingClientRect();
      tip.textContent = g.dataset.tip; tip.hidden = false;
      tip.style.left = `${r.left - box.left + r.width / 2}px`; tip.style.top = `${r.top - box.top - 10}px`;
    });
    root.addEventListener("mouseleave", () => { const t = $("[data-rc-tip]"); if (t) t.hidden = true; }, true);
    // jump to orders (optionally a filter or a specific order)
    root.addEventListener("click", (e) => {
      const go = e.target.closest("[data-go-orders]"), one = e.target.closest("[data-open-order]");
      if (!go && !one) return;
      if (go && go.dataset.fGo) { filter = go.dataset.fGo; autoAll = false; }
      if (one) { filter = "all"; autoAll = false; q = one.dataset.openOrder; $("[data-q]").value = q; }
      setView("orders"); renderOrders();
      root.querySelector(".dash").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    renderOverview();

    /* ---------------- realtime data ---------------- */
    api.db.collection("orders").orderBy("createdAt", "desc").limit(500).onSnapshot((snap) => {
      const added = snap.docChanges().filter((c) => c.type === "added").length; // (data below is re-read through N.cleanOrder)
      if (!firstLoad) snap.docChanges().forEach((c) => { const d = N.cleanOrder(c.doc.data()); if (c.type === "modified" && d.status === "cancelled" && d.cancelledBy === "customer") { beep(); N.toast(`Khách đã hủy đơn ${d.code}`); } });
      orders = snap.docs.map((d) => N.cleanOrder(d.data()));
      if (!firstLoad && added) { beep(); N.toast(`Có ${added} đơn mới!`); }
      firstLoad = false;
      renderOrders(); renderUsers(); renderOverview();
    }, (err) => { $("[data-list]").innerHTML = `<div class="form-alert err">${N.esc(api.errorText(err))}</div>`; });
    api.db.collection("users").limit(1000).onSnapshot((snap) => {
      users = snap.docs.map((d) => ({ ...N.cleanUser(d.data()), id: d.id }));
      renderUsers(); renderOverview();
    }, (err) => { $("[data-ulist]").innerHTML = `<div class="form-alert err">${N.esc(api.errorText(err))}</div>`; });
  });
})();
