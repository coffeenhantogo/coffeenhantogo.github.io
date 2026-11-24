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
          <div class="acct-av-wrap">
            <div class="acct-avatar" data-av></div>
            <button type="button" class="acct-av-cam" data-av-pick aria-label="Đổi ảnh đại diện" title="Đổi ảnh đại diện"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></button>
          </div>
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
            <div class="av-edit">
              <div class="acct-avatar av-sm" data-av></div>
              <div class="av-edit-body">
                <b>Ảnh đại diện</b>
                <span data-av-src></span>
                <div class="av-edit-btns">
                  <button type="button" class="btn btn-ink btn-sm" data-av-pick>Tải ảnh lên</button>
                  <button type="button" class="btn btn-outline btn-sm" data-av-google hidden>Dùng ảnh Google</button>
                  <button type="button" class="btn btn-outline btn-sm btn-g" data-av-link hidden><svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Lấy ảnh từ Google</button>
                  <button type="button" class="auth-link" data-av-remove hidden>Xóa ảnh</button>
                </div>
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/*" data-av-file hidden>
            </div>
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

      /* ---- avatar: custom upload (resized to 256px square JPEG, stored in Firestore) → Google photo → initial ---- */
      if (prof.photo && !api.photo) api.photo = prof.photo;
      const initial = N.esc(((name.trim().split(/\s+/).pop()) || u.email || "?").charAt(0).toUpperCase());
      const paintAv = () => {
        const cu = api.user || u, custom = api.photo, google = N.googlePhoto(cu);
        root.querySelectorAll("[data-av]").forEach((el) => { el.innerHTML = initial + N.avatarImg(custom || google); });
        root.querySelector("[data-av-src]").textContent = custom ? "Ảnh bạn đã tải lên." : google ? "Đang dùng ảnh từ tài khoản Google." : "Tải ảnh lên (JPG, PNG, WEBP – tự cắt vuông) hoặc lấy ảnh từ tài khoản Google.";
        root.querySelector("[data-av-google]").hidden = !(custom && google);
        root.querySelector("[data-av-link]").hidden = !!google;
        root.querySelector("[data-av-remove]").hidden = !custom || !!google;
      };
      paintAv();
      document.addEventListener("nhan:photo", paintAv);
      /* find the real content of an image: ignore a plain margin (same colour as all 4 corners) or
         transparent padding – so a logo with empty space around it fills the round avatar */
      const contentBox = (img) => {
        const W = img.naturalWidth, H = img.naturalHeight, k = Math.min(1, 400 / Math.max(W, H));
        const w = Math.max(1, Math.round(W * k)), h = Math.max(1, Math.round(H * k));
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0, w, h);
        let d; try { d = g.getImageData(0, 0, w, h).data; } catch { return { trimmed: false, fill: "#fff" }; }
        const px = (x, y) => { const i = (y * w + x) * 4; return [d[i], d[i + 1], d[i + 2], d[i + 3]]; };
        const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
        const bg = [0, 1, 2, 3].map((j) => corners.reduce((sum, c) => sum + c[j], 0) / 4);
        const near = (a, b, t) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < t;
        const clear = bg[3] < 20;
        const fill = clear ? "#fff" : `rgb(${bg.slice(0, 3).map(Math.round).join(",")})`;
        if (!clear && !corners.every((c) => near(c, bg, 60))) return { trimmed: false, fill: "#fff" }; // a normal photo
        const isBg = (p) => p[3] < 20 || (!clear && near(p, bg, 70));
        let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          if (!isBg(px(x, y))) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        if (x1 < 0 || (x1 - x0 < w * 0.15 && y1 - y0 < h * 0.15)) return { trimmed: false, fill };
        return { trimmed: true, fill, x: x0 / k, y: y0 / k, w: (x1 - x0 + 1) / k, h: (y1 - y0 + 1) / k };
      };
      const toAvatar = (file) => new Promise((ok, fail) => {
        if (!file || !/^image\//.test(file.type)) return fail(new Error("Vui lòng chọn một tệp ảnh (JPG, PNG, WEBP)."));
        if (file.size > 20e6) return fail(new Error("Ảnh quá lớn (tối đa 20MB)."));
        const url = URL.createObjectURL(file), img = new Image();
        img.onload = () => {
          const W = img.naturalWidth, H = img.naturalHeight, S = 256;
          const box = contentBox(img);
          // logos / images on a plain background: fit the content box; photos: centre square crop
          const s = box.trimmed ? Math.max(box.w, box.h) : Math.min(W, H);
          const cx = box.trimmed ? box.x + box.w / 2 : W / 2, cy = box.trimmed ? box.y + box.h / 2 : H / 2;
          const c = document.createElement("canvas"); c.width = c.height = S;
          const g = c.getContext("2d"); g.fillStyle = box.fill; g.fillRect(0, 0, S, S);
          g.imageSmoothingQuality = "high";
          g.drawImage(img, cx - s / 2, cy - s / 2, s, s, 0, 0, S, S);
          URL.revokeObjectURL(url);
          let q = 0.86, d = c.toDataURL("image/jpeg", q);
          while (d.length > 90000 && q > 0.45) { q -= 0.12; d = c.toDataURL("image/jpeg", q); }
          ok(d);
        };
        img.onerror = () => { URL.revokeObjectURL(url); fail(new Error("Không đọc được ảnh này. Hãy thử ảnh JPG hoặc PNG.")); };
        img.src = url;
      });
      const fileIn = root.querySelector("[data-av-file]");
      root.querySelectorAll("[data-av-pick]").forEach((b) => b.addEventListener("click", () => fileIn.click()));
      const avBusy = (on) => root.querySelectorAll("[data-av-pick],[data-av-google],[data-av-link],[data-av-remove]").forEach((b) => (b.disabled = on));
      root.querySelector("[data-av-link]").addEventListener("click", async () => {
        avBusy(true);
        try {
          const gp = await api.linkGoogle();
          if (api.photo) await api.setPhoto(null); else { N.updateAccountUI(api.user, api); paintAv(); }
          N.toast(gp ? "Đã lấy ảnh từ Google" : "Đã liên kết Google (tài khoản Google này chưa có ảnh)");
        } catch (err) {
          if (!(err && err.code === "auth/popup-closed-by-user")) N.toast(api.errorText(err).replace(/<[^>]+>/g, ""));
        }
        avBusy(false);
      });
      fileIn.addEventListener("change", async () => {
        const f = fileIn.files[0]; fileIn.value = "";
        if (!f) return;
        avBusy(true); N.toast("Đang tải ảnh lên…");
        try { await api.setPhoto(await toAvatar(f)); N.toast("Đã cập nhật ảnh đại diện"); }
        catch (err) { N.toast(err && err.code ? api.errorText(err) : (err && err.message) || "Không tải được ảnh."); }
        avBusy(false);
      });
      const clearPhoto = async (msg) => { avBusy(true); try { await api.setPhoto(null); N.toast(msg); } catch (err) { N.toast(api.errorText(err)); } avBusy(false); };
      root.querySelector("[data-av-google]").addEventListener("click", () => clearPhoto("Đã chuyển về ảnh Google"));
      root.querySelector("[data-av-remove]").addEventListener("click", () => clearPhoto("Đã xóa ảnh đại diện"));

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
            ${o.status === "pending" ? `<div class="ao-act"><a class="auth-link" href="dat-hang-thanh-cong.html?ma=${encodeURIComponent(o.code)}">Chi tiết / Hủy đơn</a></div>` : ""}
          </article>`).join("")}</div>`
          : `<div class="cart-empty" style="padding:30px 10px"><p>Bạn chưa có đơn hàng nào.</p><a class="btn btn-lime" href="thuc-don.html">Đặt món đầu tiên</a></div>`;
        N.anim(box.querySelectorAll(".acct-order"), "up");
      } catch (err) { box.innerHTML = `<div class="form-alert err">${N.esc(api.errorText(err))}</div>`; }
    };
    render(api.user);
    document.addEventListener("nhan:user", (e) => { if (!e.detail) location.replace("dang-nhap.html?next=tai-khoan.html"); });
  });
})();
