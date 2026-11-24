/* Firebase email action handler: reset password / verify email / recover email.
   Set in Firebase console → Authentication → Templates → (pencil) → Customize action URL:
   https://coffeenhantogo.github.io/dat-lai-mat-khau.html */
(() => {
  const N = window.NHAN;
  const root = document.querySelector("[data-action]");
  const mode = N.params.get("mode");
  const code = N.params.get("oobCode");
  // drop the one-time code from the address bar / history as soon as possible
  if (code) history.replaceState(null, "", location.pathname);
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const icon = (ok) => `<div class="success-ic" style="${ok ? "" : "background:#fdecec;color:#c0392b"}"><svg viewBox="0 0 24 24" width="40" height="40" aria-hidden="true">${ok ? '<path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'}</svg></div>`;

  const resendForm = (api, title, why) => {
    root.innerHTML = `
      ${icon(false)}
      <h1 class="action-title">${title}</h1>
      <p class="auth-help" style="text-align:center">${why}</p>
      <form class="auth-form" data-resend novalidate>
        <div class="form-alert" data-msg hidden></div>
        <label class="field" data-f="email"><span>Email tài khoản</span><input name="email" type="email" autocomplete="email" placeholder="ban@email.com"><span class="err">Email chưa đúng định dạng.</span></label>
        <button class="btn btn-lime btn-block" type="submit">Gửi link mới</button>
        <p class="action-note">Mở <b>email mới nhất</b> và bấm link trong vòng 1 giờ. Mỗi link chỉ dùng được 1 lần.</p>
      </form>
      <p class="auth-foot"><a href="dang-nhap.html">← Về trang đăng nhập</a></p>`;
    const f = root.querySelector("[data-resend]"), msg = f.querySelector("[data-msg]");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = f.email.value.trim();
      f.querySelector('[data-f="email"]').classList.toggle("has-error", !EMAIL_RE.test(email));
      if (!EMAIL_RE.test(email)) return;
      const b = f.querySelector("button"); b.disabled = true;
      try { await api.reset(email); msg.className = "form-alert ok"; msg.innerHTML = `Đã gửi link mới tới <b>${N.esc(email)}</b>. Kiểm tra cả mục Spam.`; }
      catch (err) { msg.className = "form-alert err"; msg.textContent = api.errorText(err); b.disabled = false; }
      msg.hidden = false;
    });
  };

  N.fbReady.then(async (api) => {
    if (!api) { N.requireConfig(root); return; }
    const auth = api.auth;

    if (!mode || !code) { resendForm(api, "Đặt lại mật khẩu", "Nhập email tài khoản, Nhẫn sẽ gửi link đặt lại mật khẩu cho bạn."); return; }

    if (mode === "resetPassword") {
      let email;
      try { email = await auth.verifyPasswordResetCode(code); }
      catch { resendForm(api, "Liên kết đã hết hạn hoặc đã được dùng", "Có thể bạn đã yêu cầu nhiều lần (chỉ link mới nhất dùng được), link đã được mở trước đó, hoặc đã quá 1 giờ. Hãy gửi link mới bên dưới."); return; }
      root.innerHTML = `
        <img class="brand-badge" src="assets/img/logo-badge.png" alt="" width="64" height="64" style="margin:0 auto 14px;display:block">
        <h1 class="action-title">Tạo mật khẩu mới</h1>
        <p class="auth-help" style="text-align:center">cho tài khoản <b>${N.esc(email)}</b></p>
        <form class="auth-form" data-newpw novalidate>
          <div class="form-alert" data-msg hidden></div>
          <label class="field" data-f="password"><span>Mật khẩu mới</span>
            <span class="pw-wrap"><input name="password" type="password" autocomplete="new-password" placeholder="Ít nhất 8 ký tự, có chữ và số"><button type="button" class="pw-toggle" data-pw aria-label="Hiện mật khẩu">Hiện</button></span>
            <span class="err">Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.</span></label>
          <label class="field" data-f="confirm"><span>Nhập lại mật khẩu mới</span><input name="confirm" type="password" autocomplete="new-password"><span class="err">Mật khẩu nhập lại không khớp.</span></label>
          <button class="btn btn-lime btn-block" type="submit">Lưu mật khẩu mới</button>
        </form>`;
      const f = root.querySelector("[data-newpw]"), msg = f.querySelector("[data-msg]");
      root.addEventListener("click", (e) => { const t = e.target.closest("[data-pw]"); if (t) { const i = t.parentElement.querySelector("input"); const on = i.type === "password"; i.type = on ? "text" : "password"; t.textContent = on ? "Ẩn" : "Hiện"; } });
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const pw = f.password.value;
        const bad1 = !N.strongPw(pw), bad2 = pw !== f.confirm.value;
        f.querySelector('[data-f="password"]').classList.toggle("has-error", bad1);
        f.querySelector('[data-f="confirm"]').classList.toggle("has-error", bad2);
        if (bad1 || bad2) return;
        const b = f.querySelector("button"); b.disabled = true; b.innerHTML = '<span class="spinner"></span> Đang lưu…';
        try {
          await auth.confirmPasswordReset(code, pw);
          try { await api.signIn(email, pw); } catch { /* sign-in is a convenience */ }
          root.innerHTML = `${icon(true)}<h1 class="action-title">Đã đổi mật khẩu!</h1><p class="auth-help" style="text-align:center">Bạn đã được đăng nhập với mật khẩu mới.</p><div class="success-actions"><a class="btn btn-lime" href="tai-khoan.html">Tài khoản của tôi</a><a class="btn btn-outline" href="thuc-don.html">Đặt món</a></div>`;
        } catch (err) {
          msg.className = "form-alert err"; msg.textContent = api.errorText(err); msg.hidden = false;
          b.disabled = false; b.textContent = "Lưu mật khẩu mới";
        }
      });
      return;
    }

    if (mode === "verifyEmail" || mode === "recoverEmail") {
      try {
        await auth.applyActionCode(code);
        if (auth.currentUser) await auth.currentUser.reload();
        const t = mode === "verifyEmail" ? "Đã xác thực email!" : "Đã khôi phục email!";
        root.innerHTML = `${icon(true)}<h1 class="action-title">${t}</h1><p class="auth-help" style="text-align:center">Cảm ơn bạn. Tài khoản đã sẵn sàng.</p><div class="success-actions"><a class="btn btn-lime" href="tai-khoan.html">Tài khoản của tôi</a></div>`;
      } catch {
        root.innerHTML = `${icon(false)}<h1 class="action-title">Liên kết đã hết hạn hoặc đã được dùng</h1><p class="auth-help" style="text-align:center">Vào <a href="tai-khoan.html" style="font-weight:800;text-decoration:underline">Tài khoản của tôi</a> và bấm “Gửi lại email xác thực”.</p>`;
      }
      return;
    }
    resendForm(api, "Liên kết không hợp lệ", "Liên kết không đúng. Bạn có thể yêu cầu gửi link đặt lại mật khẩu mới.");
  });
})();
