/* Login / register / reset password */
(() => {
  const N = window.NHAN;
  const root = document.querySelector("[data-auth-root]");
  const msg = root.querySelector("[data-msg]");
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;
  const next = (() => { const n = N.params.get("next") || ""; return /^[a-z0-9-]+\.html(\?[^#]*)?$/i.test(n) ? n : "tai-khoan.html"; })();
  const show = (type, html) => { msg.className = `form-alert ${type}`; msg.innerHTML = html; msg.hidden = false; };
  const hideMsg = () => (msg.hidden = true);

  /* tabs / views */
  const forms = { login: root.querySelector('[data-form="login"]'), register: root.querySelector('[data-form="register"]'), reset: root.querySelector('[data-form="reset"]') };
  const tabs = root.querySelector(".auth-tabs");
  function view(name) {
    hideMsg();
    Object.entries(forms).forEach(([k, f]) => (f.hidden = k !== name));
    tabs.querySelectorAll("[data-tab]").forEach((t) => { const on = t.dataset.tab === name; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
    tabs.dataset.active = name;
    root.querySelector("[data-google]").hidden = name === "reset";
    const gl = root.querySelector("[data-google-label]");
    if (gl) gl.textContent = name === "register" ? "Đăng ký với Google" : "Đăng nhập với Google";
    root.querySelector(".auth-or").hidden = name === "reset";
    const f = forms[name].querySelector("input"); f && setTimeout(() => f.focus(), 50);
  }
  tabs.addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t) view(t.dataset.tab); });
  root.addEventListener("click", (e) => {
    const s = e.target.closest("[data-show]"); if (s) view(s.dataset.show);
    const pw = e.target.closest("[data-pw]");
    if (pw) { const i = pw.parentElement.querySelector("input"); const on = i.type === "password"; i.type = on ? "text" : "password"; pw.textContent = on ? "Ẩn" : "Hiện"; }
  });
  if (N.params.get("tab") === "register") view("register");

  /* password strength meter */
  const pwIn = forms.register.password, meter = forms.register.querySelector(".pw-meter i");
  pwIn.addEventListener("input", () => {
    const v = pwIn.value; let s = 0;
    if (v.length >= 6) s++; if (v.length >= 10) s++; if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if (/\d/.test(v) && /[^A-Za-z0-9]/.test(v)) s++;
    meter.style.width = `${(s / 4) * 100}%`; meter.dataset.s = s;
  });

  const setErr = (form, f, on) => { const el = form.querySelector(`[data-f="${f}"]`); el && el.classList.toggle("has-error", !!on); return !!on; };
  root.addEventListener("input", (e) => { const f = e.target.closest("[data-f]"); f && f.classList.remove("has-error"); });
  const busy = (form, on, label) => { const b = form.querySelector("button[type=submit]"); b.disabled = on; if (on) { b.dataset.label = b.textContent; b.innerHTML = `<span class="spinner"></span> ${label}`; } else b.textContent = b.dataset.label || b.textContent; };

  N.fbReady.then((api) => {
    if (!api) { N.requireConfig(root); return; }
    const needsVerify = (u) => u && !u.emailVerified && u.providerData.some((p) => p.providerId === "password");

    /* "activate your account" screen for unverified email/password accounts */
    function showVerify(u, justRegistered) {
      const email = u.email || "";
      const webmail = /@gmail\.com$/i.test(email) ? "https://mail.google.com/mail/u/0/#search/from%3Anoreply%40coffeenhantogo" : null;
      root.innerHTML = `
        <div class="verify-box">
          <div class="verify-ic"><svg viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path d="M3 6h18v12H3z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></div>
          <h2>${justRegistered ? "Kích hoạt tài khoản" : "Tài khoản chưa được kích hoạt"}</h2>
          <p>Nhẫn đã gửi email xác nhận tới<br><b>${N.esc(email)}</b></p>
          <ol class="verify-steps">
            <li>Mở hộp thư email trên (kiểm tra cả mục <b>Spam / Quảng cáo</b>).</li>
            <li>Bấm nút <b>“Xác thực email”</b> trong thư từ Coffee Nhẫn To Go.</li>
            <li>Quay lại đây – trang sẽ tự chuyển tiếp khi bạn đã xác nhận.</li>
          </ol>
          <div class="form-alert" data-vmsg hidden></div>
          <div class="verify-actions">
            ${webmail ? `<a class="btn btn-lime btn-block" href="${webmail}" target="_blank" rel="noopener">Mở Gmail</a>` : ""}
            <button type="button" class="btn ${webmail ? "btn-ink" : "btn-lime"} btn-block" data-vcheck>Tôi đã xác nhận</button>
            <button type="button" class="btn btn-outline btn-block" data-vresend>Gửi lại email</button>
          </div>
          <p class="auth-foot">Nhập sai email? <button type="button" class="auth-link" data-vout>Đăng ký bằng email khác</button></p>
        </div>`;
      const msg = root.querySelector("[data-vmsg]");
      const say = (t, h) => { msg.className = `form-alert ${t}`; msg.innerHTML = h; msg.hidden = false; };
      let stopped = false;
      const check = async (manual) => {
        try {
          await u.reload();
          if (api.auth.currentUser && api.auth.currentUser.emailVerified) {
            stopped = true;
            await api.auth.currentUser.getIdToken(true); // refresh token so the database sees email_verified
            N.toast("Đã kích hoạt tài khoản!");
            setTimeout(() => location.replace(next), 500);
          } else if (manual) say("warn", "Chưa thấy xác nhận. Hãy bấm link trong email rồi thử lại sau vài giây.");
        } catch (err) { if (manual) say("err", api.errorText(err)); }
      };
      root.querySelector("[data-vcheck]").addEventListener("click", () => check(true));
      root.querySelector("[data-vresend]").addEventListener("click", async (e) => {
        const b = e.currentTarget;
        try { await u.sendEmailVerification({ url: (N.SITE_URL || location.origin + "/") + "dang-nhap.html" }); say("ok", "Đã gửi lại email xác nhận. Dùng <b>email mới nhất</b>."); b.disabled = true; setTimeout(() => (b.disabled = false), 60000); }
        catch (err) { say("err", api.errorText(err)); }
      });
      root.querySelector("[data-vout]").addEventListener("click", async () => { stopped = true; await api.signOut(); location.replace("dang-nhap.html?tab=register"); });
      // auto-detect verification done in another tab
      const tick = () => { if (!stopped && !document.hidden) check(false); };
      setInterval(tick, 4000);
      addEventListener("focus", tick);
    }

    if (api.user) { needsVerify(api.user) ? showVerify(api.user, false) : location.replace(next); return; }
    const done = () => {
      const u = api.auth.currentUser;
      if (needsVerify(u)) { showVerify(u, false); return; }
      N.toast("Đăng nhập thành công!"); setTimeout(() => location.replace(next), 500);
    };

    /* Google needs a registration: completion step (phone + policy) for new Google accounts */
    function showComplete(u) {
      root.innerHTML = `
        <div class="verify-box">
          <div class="verify-ic">${N.IC.user.replace('width="20" height="20"', 'width="36" height="36"')}</div>
          <h2>Hoàn tất đăng ký</h2>
          <p>Chỉ còn một bước nữa để tạo tài khoản<br><b>${N.esc(u.email || "")}</b></p>
          <form class="auth-form" data-complete novalidate style="text-align:left;margin-top:18px">
            <div class="form-alert" data-cmsg hidden></div>
            <label class="field" data-f="name"><span>Họ và tên <em>*</em></span><input name="name" maxlength="60" value="${N.esc(u.displayName || "")}"><span class="err">Vui lòng nhập họ tên.</span></label>
            <label class="field" data-f="phone"><span>Số điện thoại <em>*</em></span><input name="phone" type="tel" inputmode="tel" maxlength="15" placeholder="09xx xxx xxx"><span class="err">Số điện thoại chưa đúng.</span><span class="hint">Để Nhẫn gọi xác nhận đơn hàng.</span></label>
            <label class="check" data-f="agree"><input type="checkbox" name="agree"><span>Tôi đồng ý với <a href="chinh-sach.html" target="_blank">chính sách & bảo mật</a> của Nhẫn.</span></label>
            <button class="btn btn-lime btn-block" type="submit" style="margin-top:16px">Hoàn tất đăng ký</button>
          </form>
          <p class="auth-foot"><button type="button" class="auth-link" data-cancel>Hủy & dùng cách khác</button></p>
        </div>`;
      const f = root.querySelector("[data-complete]"), m = root.querySelector("[data-cmsg]");
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = f.name.value.trim(), phone = f.phone.value.replace(/[\s.-]/g, "");
        const bad = [setErr(f, "name", name.length < 2), setErr(f, "phone", !PHONE_RE.test(phone))];
        f.querySelector('[data-f="agree"]').style.color = f.agree.checked ? "" : "#c0392b";
        if (bad.some(Boolean) || !f.agree.checked) return;
        busy(f, true, "Đang lưu…");
        try {
          await api.completeProfile({ name, phone });
          N.store.set("nhan-customer-v1", { ...N.store.get("nhan-customer-v1", {}), name, phone, email: u.email });
          N.toast("Đăng ký thành công!"); setTimeout(() => location.replace(next), 500);
        } catch (err) { m.className = "form-alert err"; m.textContent = api.errorText(err); m.hidden = false; busy(f, false); }
      });
      root.querySelector("[data-cancel]").addEventListener("click", async () => {
        try { await api.db.collection("users").doc(api.user.uid).delete(); } catch { /* ignore */ }
        try { await api.user.delete(); } catch { await api.signOut(); }
        location.replace("dang-nhap.html?tab=register");
      });
    }

    root.querySelector("[data-google]").addEventListener("click", async () => {
      hideMsg();
      const mode = tabs.dataset.active === "register" ? "register" : "login";
      try {
        const r = await api.google(mode);
        if (r.needsProfile) showComplete(r.user); else done();
      } catch (e) {
        show("err", api.errorText(e));
        if (e && e.code === "nhan/not-registered") setTimeout(() => { view("register"); show("warn", "Gmail này chưa có tài khoản. Bấm <b>“Đăng ký với Google”</b> hoặc điền form bên dưới để tạo tài khoản."); }, 1800);
      }
    });

    forms.login.addEventListener("submit", async (e) => {
      e.preventDefault(); hideMsg();
      const f = forms.login, email = f.email.value.trim();
      const bad = [setErr(f, "email", !EMAIL_RE.test(email)), setErr(f, "password", !f.password.value)];
      if (bad.some(Boolean)) return;
      busy(f, true, "Đang đăng nhập…");
      try {
        await api.auth.setPersistence(f.remember.checked ? api.firebase.auth.Auth.Persistence.LOCAL : api.firebase.auth.Auth.Persistence.SESSION);
        await api.signIn(email, f.password.value); done();
      } catch (err) { show("err", api.errorText(err)); busy(f, false); }
    });

    forms.register.addEventListener("submit", async (e) => {
      e.preventDefault(); hideMsg();
      const f = forms.register;
      const name = f.name.value.trim(), phone = f.phone.value.replace(/[\s.-]/g, ""), email = f.email.value.trim(), pw = f.password.value;
      const bad = [setErr(f, "name", name.length < 2), setErr(f, "phone", !PHONE_RE.test(phone)), setErr(f, "email", !EMAIL_RE.test(email)),
        setErr(f, "password", pw.length < 6), setErr(f, "confirm", pw !== f.confirm.value)];
      f.querySelector('[data-f="agree"]').style.color = f.agree.checked ? "" : "#c0392b";
      if (bad.some(Boolean) || !f.agree.checked) { show("err", "Vui lòng kiểm tra lại các thông tin được đánh dấu."); return; }
      busy(f, true, "Đang tạo tài khoản…");
      try {
        const nu = await api.signUp({ name, phone, email, password: pw });
        N.store.set("nhan-customer-v1", { ...N.store.get("nhan-customer-v1", {}), name, phone, email });
        showVerify(nu, true);
      } catch (err) { show("err", api.errorText(err)); busy(f, false); }
    });

    forms.reset.addEventListener("submit", async (e) => {
      e.preventDefault(); hideMsg();
      const f = forms.reset, email = f.email.value.trim();
      if (setErr(f, "email", !EMAIL_RE.test(email))) return;
      if (!N.resetCooldown()) { show("warn", "Bạn vừa yêu cầu link. Vui lòng chờ 1 phút rồi thử lại – và chỉ mở <b>email mới nhất</b>."); return; }
      busy(f, true, "Đang gửi…");
      try { await api.reset(email); show("ok", `Đã gửi link đặt lại mật khẩu tới <b>${N.esc(email)}</b>. Mở <b>email mới nhất</b> trong vòng 1 giờ (mỗi link chỉ dùng được 1 lần). Kiểm tra cả hộp thư Spam nhé.`); }
      catch (err) { show("err", api.errorText(err)); }
      busy(f, false);
    });
  });
})();
