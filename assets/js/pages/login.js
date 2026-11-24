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
    if (api.user) { location.replace(next); return; }
    const done = () => { N.toast("Đăng nhập thành công!"); setTimeout(() => location.replace(next), 500); };

    root.querySelector("[data-google]").addEventListener("click", async () => {
      hideMsg();
      try { await api.google(); done(); } catch (e) { show("err", api.errorText(e)); }
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
        await api.signUp({ name, phone, email, password: pw });
        N.store.set("nhan-customer-v1", { ...N.store.get("nhan-customer-v1", {}), name, phone, email });
        N.toast("Tạo tài khoản thành công! Kiểm tra email để xác thực.");
        setTimeout(() => location.replace(next), 700);
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
