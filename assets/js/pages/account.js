/* Account page: profile, order history (Firestore), sign out */
(() => {
  const N = window.NHAN, S = N.STORE;
  const root = document.querySelector("[data-account]");
  const PHONE_RE = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;
  N.STATUS = N.STATUS || {
    pending: ["Mới đặt", "st-new"], confirmed: ["Đã xác nhận", "st-ok"], making: ["Đang pha / chuẩn bị", "st-make"],
    delivering: ["Đang giao", "st-ship"], done: ["Hoàn thành", "st-done"], cancelled: ["Đã hủy", "st-cancel"],
  };
  const stBadge = (s) => { const [t, c] = N.STATUS[s] || N.STATUS.pending; return `<span class="st ${c}">${t}</span>`; };
  const when = (o) => { const d = o.createdAt && o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAtLocal || Date.now()); return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" }); };

  N.fbReady.then(async (api) => {
    if (!api) { N.requireConfig(root); return; }
    const render = async (u) => {
      if (!u) { location.replace("dang-nhap.html?next=tai-khoan.html"); return; }
      const prof = (await api.getProfile().catch(() => ({}))) || {};
      const name = prof.name || u.displayName || "";
      const admin = api.isAdmin(u);
      root.innerHTML = `
        <div class="acct-head" data-reveal="up">
          <div class="acct-avatar">${N.esc(((name.trim().split(/\s+/).pop()) || u.email || "?").charAt(0).toUpperCase())}</div>
          <div class="acct-hello">
            <span class="kicker">Tài khoản của tôi</span>
            <h1>Xin chào, ${N.esc(name.split(" ").pop() || "bạn")}!${admin ? ' <span class="admin-tag">Quản trị</span>' : ""}</h1>
            <p>${N.esc(u.email || "")} ${u.emailVerified ? '<span class="st st-done">Đã xác thực email</span>' : '<span class="st st-new">Chưa xác thực email</span> <button type="button" class="auth-link" data-verify>Gửi lại email xác thực</button>'}</p>
          </div>
          <div class="acct-actions">
            ${admin ? '<a class="btn btn-ink btn-sm" href="quan-tri.html">Trang quản trị</a>' : ""}
            <a class="btn btn-lime btn-sm" href="thuc-don.html">Đặt món</a>
            <button type="button" class="btn btn-outline btn-sm" data-signout>Đăng xuất</button>
          </div>
        </div>
        <div class="acct-grid">
          <form class="co-card acct-profile" data-profile novalidate data-reveal="left">
            <h2><span class="step">1</span> Thông tin cá nhân</h2>
            <div class="form-alert" data-pmsg hidden></div>
            <label class="field" data-f="name"><span>Họ và tên</span><input name="name" maxlength="60" value="${N.esc(name)}"><span class="err">Vui lòng nhập họ tên.</span></label>
            <label class="field" data-f="phone"><span>Số điện thoại</span><input name="phone" type="tel" inputmode="tel" maxlength="15" value="${N.esc(prof.phone || "")}"><span class="err">Số điện thoại chưa đúng.</span></label>
            <label class="field"><span>Địa chỉ giao hàng mặc định</span><input name="address" maxlength="160" value="${N.esc(prof.address || "")}" placeholder="Số nhà, tên đường, phường, TP.HCM"></label>
            <label class="field"><span>Chi nhánh hay ghé</span>
              <select class="select" name="branch"><option value="">— Chọn chi nhánh —</option>${S.branches.map((b) => { const v = `${b.name} – ${b.address}`; return `<option value="${N.esc(v)}" ${prof.branch === v ? "selected" : ""}>${N.esc(b.name)}</option>`; }).join("")}</select>
            </label>
            <button class="btn btn-lime btn-block" type="submit">Lưu thông tin</button>
            ${u.providerData.some((p) => p.providerId === "password")
              ? '<button type="button" class="auth-link" data-pw-toggle style="margin-top:14px">Đổi mật khẩu</button>'
              : '<p class="pw-google-note">Bạn đăng nhập bằng Google – mật khẩu do tài khoản Google quản lý.</p>'}
            <div class="pw-box" data-pw-box hidden>
              <div class="form-alert" data-pwmsg hidden></div>
              <label class="field" data-f="cur"><span>Mật khẩu hiện tại</span><input name="cur" type="password" autocomplete="current-password"><span class="err">Vui lòng nhập mật khẩu hiện tại.</span></label>
              <label class="field" data-f="npw"><span>Mật khẩu mới</span><input name="npw" type="password" autocomplete="new-password" placeholder="Ít nhất 6 ký tự"><span class="err">Mật khẩu mới cần ít nhất 6 ký tự.</span></label>
              <label class="field" data-f="npw2"><span>Nhập lại mật khẩu mới</span><input name="npw2" type="password" autocomplete="new-password"><span class="err">Mật khẩu nhập lại không khớp.</span></label>
              <button type="button" class="btn btn-ink btn-block" data-pw-save>Cập nhật mật khẩu</button>
              <button type="button" class="auth-link" data-pw-forgot style="margin-top:12px">Quên mật khẩu hiện tại?</button>
            </div>
          </form>
          <div class="co-card acct-orders" data-reveal="right">
            <h2><span class="step">2</span> Đơn hàng của tôi</h2>
            <div data-orders><div class="acct-loading"><span class="spinner"></span> Đang tải đơn hàng…</div></div>
          </div>
        </div>`;
      root.querySelectorAll("[data-reveal]").forEach((el) => N.anim([el], el.dataset.reveal, { stagger: false }));

      root.querySelector("[data-signout]").addEventListener("click", async () => { await api.signOut(); N.toast("Đã đăng xuất"); location.replace(N.HOME); });
      root.querySelector("[data-verify]")?.addEventListener("click", async (e) => { try { await u.sendEmailVerification(); e.target.textContent = "Đã gửi – kiểm tra hộp thư"; } catch (err) { N.toast(api.errorText(err)); } });
      /* change password directly (re-authenticate with the current password) */
      const pwBox = root.querySelector("[data-pw-box]");
      root.querySelector("[data-pw-toggle]")?.addEventListener("click", () => { pwBox.hidden = !pwBox.hidden; if (!pwBox.hidden) pwBox.querySelector("input").focus(); });
      const pwMsg = root.querySelector("[data-pwmsg]");
      const showPw = (type, html) => { pwMsg.className = `form-alert ${type}`; pwMsg.innerHTML = html; pwMsg.hidden = false; };
      root.querySelector("[data-pw-save]")?.addEventListener("click", async (e) => {
        const f = root.querySelector("[data-profile]");
        const cur = f.cur.value, npw = f.npw.value;
        const set = (k, on) => { f.querySelector(`[data-f="${k}"]`).classList.toggle("has-error", on); return on; };
        if ([set("cur", !cur), set("npw", npw.length < 6), set("npw2", npw !== f.npw2.value)].some(Boolean)) return;
        const b = e.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner"></span> Đang cập nhật…';
        try {
          const cred = api.firebase.auth.EmailAuthProvider.credential(u.email, cur);
          await u.reauthenticateWithCredential(cred);
          await u.updatePassword(npw);
          f.cur.value = f.npw.value = f.npw2.value = "";
          showPw("ok", "Đã đổi mật khẩu thành công. Lần đăng nhập sau dùng mật khẩu mới.");
        } catch (err) {
          const c = err && err.code;
          showPw("err", c === "auth/wrong-password" || c === "auth/invalid-credential" || c === "auth/invalid-login-credentials" ? "Mật khẩu hiện tại không đúng." : api.errorText(err));
        }
        b.disabled = false; b.textContent = "Cập nhật mật khẩu";
      });
      root.querySelector("[data-pw-forgot]")?.addEventListener("click", async () => {
        if (!N.resetCooldown()) { showPw("warn", "Bạn vừa yêu cầu link. Vui lòng chờ 1 phút – và chỉ mở <b>email mới nhất</b>."); return; }
        try { await api.reset(u.email); showPw("ok", `Đã gửi link đặt lại mật khẩu tới <b>${N.esc(u.email)}</b>. Mở <b>email mới nhất</b> trong 1 giờ, mỗi link chỉ dùng 1 lần.`); }
        catch (err) { showPw("err", api.errorText(err)); }
      });

      const form = root.querySelector("[data-profile]"), pmsg = root.querySelector("[data-pmsg]");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const nm = form.name.value.trim(), ph = form.phone.value.replace(/[\s.-]/g, "");
        form.querySelector('[data-f="name"]').classList.toggle("has-error", nm.length < 2);
        form.querySelector('[data-f="phone"]').classList.toggle("has-error", ph && !PHONE_RE.test(ph));
        if (nm.length < 2 || (ph && !PHONE_RE.test(ph))) return;
        const data = { name: nm, phone: ph, address: form.address.value.trim(), branch: form.branch.value };
        try {
          await api.saveProfile(data);
          N.store.set("nhan-customer-v1", { ...N.store.get("nhan-customer-v1", {}), ...data, email: u.email, method: data.address ? "ship" : "pickup" });
          pmsg.className = "form-alert ok"; pmsg.textContent = "Đã lưu thông tin."; pmsg.hidden = false;
          N.updateAccountUI(api.user, api);
        } catch (err) { pmsg.className = "form-alert err"; pmsg.textContent = api.errorText(err); pmsg.hidden = false; }
      });

      const box = root.querySelector("[data-orders]");
      try {
        const list = await api.myOrders();
        box.innerHTML = list.length ? `<div class="acct-olist">${list.map((o) => `
          <article class="acct-order">
            <div class="ao-top"><b>${N.esc(o.code)}</b>${stBadge(o.status)}</div>
            <p class="ao-meta">${when(o)} · ${o.items.reduce((s, i) => s + i.qty, 0)} món · ${o.delivery.method === "ship" ? "Giao tận nơi" : "Nhận tại quán"}</p>
            <p class="ao-items">${o.items.map((i) => `${N.esc(i.name)} ×${i.qty}`).join(", ")}</p>
            <div class="ao-foot"><span>${N.esc(o.payment)}</span><b>${N.esc(o.totalText)}</b></div>
          </article>`).join("")}</div>`
          : `<div class="cart-empty" style="padding:30px 10px"><p>Bạn chưa có đơn hàng nào.</p><a class="btn btn-lime" href="thuc-don.html">Đặt món đầu tiên</a></div>`;
        N.anim(box.querySelectorAll(".acct-order"), "up");
      } catch (err) { box.innerHTML = `<div class="form-alert err">${N.esc(api.errorText(err))}</div>`; }
    };
    render(api.user);
    document.addEventListener("nhan:user", (e) => { if (!e.detail) location.replace("dang-nhap.html?next=tai-khoan.html"); });
  });
})();
