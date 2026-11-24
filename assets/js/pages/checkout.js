/* Checkout: validate → email order via FormSubmit → save locally → success page */
(async () => {
  const N = window.NHAN, S = N.STORE;
  const root = document.querySelector("[data-checkout]");
  const PROFILE_KEY = "nhan-customer-v1";
  const PHONE_RE = /^(0|\+?84)(3|5|7|8|9)\d{8}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function renderEmpty() { root.innerHTML = `<div class="co-card">${N.emptyCartHTML}</div>`; }
  if (!N.cart.items().length) { renderEmpty(); return; }

  /* ---- accounts required: only signed-in customers can place orders ---- */
  root.innerHTML = `<div class="acct-loading"><span class="spinner"></span> Đang kiểm tra tài khoản…</div>`;
  const ACCT = await N.fbReady;
  if (!ACCT) {
    root.innerHTML = `<div class="co-card login-gate"><h2>Không kết nối được hệ thống tài khoản</h2><p>Vui lòng kiểm tra mạng rồi tải lại trang, hoặc đặt nhanh qua Zalo / điện thoại.</p><div class="success-actions"><button class="btn btn-lime" type="button" onclick="location.reload()">Tải lại trang</button><a class="btn btn-outline" href="${S.zalo}" target="_blank" rel="noopener">Zalo ${S.phoneDisplay}</a></div></div>`;
    return;
  }
  if (!ACCT.user) {
    const n = N.cart.count();
    root.innerHTML = `
      <div class="co-card login-gate" data-reveal="zoom">
        <div class="cart-empty-ic">${N.IC.user.replace('width="20" height="20"', 'width="34" height="34"')}</div>
        <h2>Đăng nhập để đặt hàng</h2>
        <p>Giỏ hàng của bạn (<b>${n} món – ${N.esc(N.cart.total().text)}</b>) đã được giữ lại. Chỉ mất vài giây để tạo tài khoản – lần sau thông tin giao hàng sẽ được điền sẵn và bạn theo dõi được trạng thái đơn.</p>
        <div class="success-actions">
          <a class="btn btn-lime" href="dang-nhap.html?next=thanh-toan.html">Đăng nhập</a>
          <a class="btn btn-ink" href="dang-nhap.html?tab=register&next=thanh-toan.html">Tạo tài khoản mới</a>
        </div>
        <p class="gate-note">Hoặc dùng nút <b>“Tiếp tục với Google”</b> trên trang đăng nhập – không cần điền form.</p>
      </div>`;
    N.anim(root.querySelectorAll("[data-reveal]"), "zoom", { stagger: false });
    document.addEventListener("nhan:user", (e) => { if (e.detail) location.reload(); });
    return;
  }
  if (!ACCT.user.emailVerified && ACCT.user.providerData.some((p) => p.providerId === "password")) {
    root.innerHTML = `
      <div class="co-card login-gate" data-reveal="zoom">
        <div class="cart-empty-ic">${N.IC.mail.replace("<svg", '<svg width="34" height="34"')}</div>
        <h2>Kích hoạt tài khoản để đặt hàng</h2>
        <p>Vui lòng xác nhận email <b>${N.esc(ACCT.user.email)}</b> – bấm nút “Xác thực email” trong thư Nhẫn đã gửi. Giỏ hàng của bạn vẫn được giữ.</p>
        <div class="success-actions"><a class="btn btn-lime" href="dang-nhap.html?next=thanh-toan.html">Kích hoạt ngay</a></div>
      </div>`;
    N.anim(root.querySelectorAll("[data-reveal]"), "zoom", { stagger: false });
    return;
  }

  const prof = N.store.get(PROFILE_KEY, {});
  const today = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const minDate = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  root.innerHTML = `
  <div class="co-layout">
    <form class="co-form" novalidate data-form>
      ${N.canSend() ? "" : `<div class="form-alert warn"><b>Chế độ xem thử:</b> bạn đang mở file trực tiếp trên máy, đơn sẽ <b>không</b> được gửi email. Sau khi đặt, hãy dùng nút “Gửi đơn qua Zalo”. Khi website chạy trên mạng (GitHub Pages), đơn sẽ tự gửi về email của quán.</div>`}
      <div class="form-alert err" data-error hidden></div>
      <div class="co-member" data-member hidden></div>

      <div class="co-card" data-reveal="up">
        <h2><span class="step">1</span> Thông tin người nhận</h2>
        <div class="row-2">
          <label class="field" data-f="name"><span>Họ và tên <em>*</em></span><input name="name" autocomplete="name" maxlength="60" value="${N.esc(prof.name || "")}" placeholder="Nguyễn Văn A"><span class="err">Vui lòng nhập họ tên.</span></label>
          <label class="field" data-f="phone"><span>Số điện thoại <em>*</em></span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="15" value="${N.esc(prof.phone || "")}" placeholder="09xx xxx xxx"><span class="err">Số điện thoại chưa đúng (VD: 0909637168).</span></label>
        </div>
        <label class="field" data-f="email"><span>Email (không bắt buộc)</span><input name="email" type="email" autocomplete="email" maxlength="80" value="${N.esc(prof.email || "")}" placeholder="ban@email.com"><span class="err">Email chưa đúng định dạng.</span><span class="hint">Để nhận bản sao xác nhận khi quán phản hồi.</span></label>
      </div>

      <div class="co-card" data-reveal="up">
        <h2><span class="step">2</span> Hình thức nhận hàng</h2>
        <div class="choice-cards">
          <label class="choice"><input type="radio" name="method" value="pickup" ${prof.method !== "ship" ? "checked" : ""}><span><i class="dot"></i><span><b>Nhận tại quán</b><small>Đặt trước, ghé lấy không cần chờ</small></span></span></label>
          <label class="choice"><input type="radio" name="method" value="ship" ${prof.method === "ship" ? "checked" : ""}><span><i class="dot"></i><span><b>Giao tận nơi</b><small>Phí giao báo khi xác nhận đơn</small></span></span></label>
        </div>
        <div data-pickup>
          <div class="field" data-f="branch"><span>Chọn chi nhánh <em>*</em></span>
            <div class="choice-cards" style="margin:0">
              ${S.branches.map((b, i) => `<label class="choice"><input type="radio" name="branch" value="${N.esc(b.name + " – " + b.address)}" ${(prof.branch ? prof.branch === b.name + " – " + b.address : i === 0) ? "checked" : ""}><span><i class="dot"></i><span><b>${N.esc(b.name)}</b><small>${N.esc(b.address)}</small></span></span></label>`).join("")}
            </div>
          </div>
        </div>
        <div data-ship hidden>
          <label class="field" data-f="address"><span>Địa chỉ giao hàng <em>*</em></span><input name="address" autocomplete="street-address" maxlength="160" value="${N.esc(prof.address || "")}" placeholder="Số nhà, tên đường, phường, TP.HCM"><span class="err">Vui lòng nhập địa chỉ giao hàng.</span></label>
        </div>
        <div class="field"><span>Thời gian nhận</span>
          <div class="chips">
            <label class="chip"><input type="radio" name="when" value="asap" checked><span>Sớm nhất có thể</span></label>
            <label class="chip"><input type="radio" name="when" value="later"><span>Hẹn giờ</span></label>
          </div>
        </div>
        <div class="row-2" data-later hidden>
          <label class="field" data-f="date"><span>Ngày</span><input name="date" type="date" min="${minDate}" value="${minDate}"><span class="err">Chọn ngày hợp lệ.</span></label>
          <label class="field" data-f="time"><span>Giờ</span><input name="time" type="time" value=""><span class="err">Vui lòng chọn giờ.</span></label>
        </div>
      </div>

      <div class="co-card" data-reveal="up">
        <h2><span class="step">3</span> Thanh toán &amp; ghi chú</h2>
        <div class="choice-cards">
          <label class="choice"><input type="radio" name="payment" value="Tiền mặt khi nhận hàng" checked><span><i class="dot"></i><span><b>Tiền mặt khi nhận</b><small>Thanh toán khi nhận món / nhận hàng</small></span></span></label>
          <label class="choice"><input type="radio" name="payment" value="Chuyển khoản QR (ACB)"><span><i class="dot"></i><span><b>Chuyển khoản QR · ACB</b><small>Quét mã VietQR có sẵn số tiền – hiện ngay sau khi đặt</small></span></span></label>
        </div>
        <label class="field"><span>Ghi chú cho đơn hàng</span><textarea class="textarea" name="note" maxlength="400" placeholder="VD: gọi trước khi giao, lấy thêm ống hút…"></textarea></label>
        <label class="check" data-f="agree"><input type="checkbox" name="agree" ${prof.name ? "checked" : ""}><span>Tôi đồng ý với <a href="chinh-sach.html" target="_blank">chính sách mua hàng</a> và đồng ý để Nhẫn liên hệ xác nhận đơn qua số điện thoại trên.</span></label>
        <input class="honey" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true">
      </div>
    </form>

    <aside class="summary" data-reveal="right">
      <h2>Đơn hàng (<span data-n></span> món)</h2>
      <div class="sum-items" data-items></div>
      <div class="sum-row"><span>Tạm tính</span><b data-sub></b></div>
      <div class="sum-row"><span>Phí giao hàng</span><b data-ship-fee>Không áp dụng</b></div>
      <div class="sum-row total"><span>Tổng cộng</span><b data-total></b></div>
      <button class="btn btn-lime btn-block" type="submit" form="" data-submit>Xác nhận đặt hàng</button>
      <a class="btn btn-outline btn-block" href="gio-hang.html" style="margin-top:10px">Sửa giỏ hàng</a>
      <p class="note">Sau khi đặt, Nhẫn sẽ gọi hoặc nhắn Zalo cho bạn để xác nhận đơn (và báo phí giao hàng nếu giao tận nơi).</p>
    </aside>
  </div>`;

  const form = root.querySelector("[data-form]");
  const errBox = root.querySelector("[data-error]");
  const submitBtn = root.querySelector("[data-submit]");

  function renderSummary() {
    const items = N.cart.items();
    if (!items.length) { renderEmpty(); return; }
    const t = N.cart.total();
    root.querySelector("[data-n]").textContent = N.cart.count();
    root.querySelector("[data-items]").innerHTML = items.map((i) => {
      const p = N.byId[i.id];
      return `<div class="sum-item${p.soldOut ? " is-out" : ""}"><img src="${N.img(p.img)}" alt=""><div><b>${N.esc(p.name)}</b><small>${p.soldOut ? '<span class="c-soldout">Tạm hết – hãy xóa khỏi giỏ</span> ' : ""}${N.esc(N.optSummary(i.opts))}${i.note ? ` · ${N.esc(i.note)}` : ""}</small></div><span class="q">×${i.qty}</span></div>`;
    }).join("");
    root.querySelector("[data-sub]").textContent = t.text;
    root.querySelector("[data-total]").textContent = t.text;
    // shop paused by the admin
    let pz = root.querySelector("[data-paused]");
    if (!N.shop.open) {
      if (!pz) { pz = document.createElement("div"); pz.className = "form-alert warn"; pz.setAttribute("data-paused", ""); submitBtn.before(pz); }
      const nt = N.shop.note.trim();
      pz.innerHTML = `<b>Quán đang tạm ngưng nhận đơn online.</b> ${N.esc(nt)}${nt && !/[.!?…]$/.test(nt) ? "." : ""} Vui lòng gọi <a href="tel:${S.phone}"><b>${S.phoneDisplay}</b></a> hoặc nhắn Zalo.`;
    } else if (pz) pz.remove();
    submitBtn.disabled = !N.shop.open;
  }
  N.cart.onChange(renderSummary);
  document.addEventListener("nhan:shop", renderSummary);
  renderSummary();

  function syncMethod() {
    const ship = form.method.value === "ship";
    root.querySelector("[data-ship]").hidden = !ship;
    root.querySelector("[data-pickup]").hidden = ship;
    root.querySelector("[data-ship-fee]").textContent = ship ? "Báo khi xác nhận" : "Không áp dụng";
    root.querySelector("[data-later]").hidden = form.when.value !== "later";
  }
  form.addEventListener("change", syncMethod);
  syncMethod();

  const setErr = (f, on) => { const el = root.querySelector(`[data-f="${f}"]`); el && el.classList.toggle("has-error", on); return on; };
  form.addEventListener("input", (e) => { const f = e.target.closest("[data-f]"); f && f.classList.remove("has-error"); });

  function validate() {
    const v = (n) => (form[n].value || "").trim();
    const phone = v("phone").replace(/[\s.-]/g, "");
    let bad = [];
    if (setErr("name", v("name").length < 2)) bad.push("name");
    if (setErr("phone", !PHONE_RE.test(phone))) bad.push("phone");
    if (setErr("email", v("email") && !EMAIL_RE.test(v("email")))) bad.push("email");
    if (form.method.value === "ship" && setErr("address", v("address").length < 8)) bad.push("address");
    else setErr("address", false);
    if (form.when.value === "later") {
      if (setErr("date", !v("date") || v("date") < minDate)) bad.push("date");
      if (setErr("time", !v("time"))) bad.push("time");
    }
    if (!form.agree.checked) bad.push("agree");
    root.querySelector('[data-f="agree"]').style.color = form.agree.checked ? "" : "#c0392b";
    return { ok: !bad.length, first: bad[0], phone };
  }

  function buildOrder(phone) {
    const v = (n) => (form[n].value || "").trim();
    const ship = form.method.value === "ship";
    const when = form.when.value === "later" ? `${new Date(v("date")).toLocaleDateString("vi-VN")} lúc ${v("time")}` : "Sớm nhất có thể";
    return {
      code: N.newOrderCode(),
      createdAt: new Date().toISOString(),
      customer: { name: v("name"), phone, email: v("email") },
      delivery: { method: ship ? "ship" : "pickup", address: ship ? v("address") : "", branch: ship ? "" : form.branch.value, time: when },
      payment: form.payment.value,
      note: v("note"),
      items: N.cart.items().map((i) => ({ id: i.id, name: N.byId[i.id].name, qty: i.qty, opts: N.optSummary(i.opts), note: i.note, price: N.unitPrice(N.byId[i.id], i.opts) })),
      totalText: N.cart.total().text,
      totalAmount: N.cart.total().unpriced ? null : N.cart.total().sum,
      status: "pending",
    };
  }

  async function submit() {
    errBox.hidden = true;
    if (form._honey.value) return; // bot
    const { ok, first, phone } = validate();
    if (!ok) {
      errBox.textContent = "Vui lòng kiểm tra lại các thông tin được đánh dấu.";
      errBox.hidden = false;
      const el = first === "agree" ? form.agree : form[first];
      el && el.scrollIntoView({ behavior: "smooth", block: "center" });
      el && el.focus && setTimeout(() => el.focus(), 300);
      return;
    }
    // latest shop settings: paused shop / sold-out items / current prices
    submitBtn.disabled = true;
    await Promise.race([N.shopReady, new Promise((r) => setTimeout(r, 4000))]);
    submitBtn.disabled = false;
    if (!N.shop.open) { renderSummary(); errBox.innerHTML = `Quán đang tạm ngưng nhận đơn online. Vui lòng gọi ${S.phoneDisplay}.`; errBox.hidden = false; return; }
    const out = N.cart.items().filter((i) => N.byId[i.id].soldOut).map((i) => N.byId[i.id].name);
    if (out.length) {
      errBox.textContent = `Món đang tạm hết: ${[...new Set(out)].join(", ")}. Vui lòng xóa khỏi giỏ hàng rồi đặt lại.`;
      errBox.hidden = false; N.open("cartDrawer"); return;
    }
    const order = buildOrder(phone);
    N.store.set(PROFILE_KEY, { name: order.customer.name, phone, email: order.customer.email, method: order.delivery.method, address: order.delivery.address, branch: order.delivery.branch });
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner"></span> Đang gửi đơn…`;
    try {
      await N.sendForm({
        _subject: `Đơn hàng mới ${order.code} – ${order.customer.name}`,
        ...(order.customer.email ? { _replyto: order.customer.email } : {}),
        "Mã đơn": order.code,
        "Khách hàng": order.customer.name,
        "Số điện thoại": order.customer.phone,
        "Email": order.customer.email || "(không có)",
        "Hình thức": order.delivery.method === "ship" ? "Giao tận nơi" : "Nhận tại quán",
        "Địa chỉ / Chi nhánh": order.delivery.method === "ship" ? order.delivery.address : order.delivery.branch,
        "Thời gian nhận": order.delivery.time,
        "Thanh toán": order.payment,
        "Món": order.items.map((i, k) => `${k + 1}) ${i.name} ×${i.qty}${i.opts ? ` [${i.opts}]` : ""}${i.note ? ` – ${i.note}` : ""}`).join(" | "),
        "Ghi chú": order.note || "(không có)",
        "Tạm tính": order.totalText,
        "Đặt lúc": new Date(order.createdAt).toLocaleString("vi-VN"),
      });
      order.status = "sent";
    } catch (err) {
      order.status = "unsent";
      order.error = String(err && err.message || err);
    }
    // also store the order in the shop database (accounts/admin), max 6s so checkout never hangs
    try {
      const api = await N.fbReady;
      if (api) await Promise.race([api.saveOrder(order), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 6000))]);
      order.synced = !!api;
      // remember phone / address on the customer's profile for next time
      if (api && api.user) {
        const pf = { phone: order.customer.phone };
        if (order.delivery.method === "ship") pf.address = order.delivery.address; else pf.branch = order.delivery.branch;
        api.saveProfile(pf).catch(() => {});
      }
    } catch (err) { order.synced = false; console.warn("order sync failed", err); }
    N.orders.save(order);
    N.cart.clear();
    location.href = `dat-hang-thanh-cong.html?ma=${encodeURIComponent(order.code)}`;
  }
  // accounts: banner + prefill from profile
  N.fbReady.then(async (api) => {
    const box = root.querySelector("[data-member]");
    if (!api || !box) return;
    if (!api.user) {
      box.innerHTML = `<span>Đã có tài khoản? <a href="dang-nhap.html?next=thanh-toan.html">Đăng nhập</a> để điền sẵn thông tin và theo dõi đơn.</span>`;
      box.hidden = false; return;
    }
    box.innerHTML = `<span>Đang đặt hàng với tài khoản <b>${N.esc(api.user.displayName || api.user.email)}</b> – đơn sẽ được lưu vào <a href="tai-khoan.html">Tài khoản của tôi</a>.</span>`;
    box.hidden = false;
    const p = (await api.getProfile().catch(() => null)) || {};
    const fill = (n, v) => { if (v && form[n] && !form[n].value) form[n].value = v; };
    fill("name", p.name || api.user.displayName); fill("phone", p.phone); fill("email", p.email || api.user.email); fill("address", p.address);
    if (p.branch) form.querySelectorAll('input[name="branch"]').forEach((r) => (r.checked = r.value === p.branch));
  });

  submitBtn.addEventListener("click", submit);
  form.addEventListener("submit", (e) => { e.preventDefault(); submit(); });
  root.querySelectorAll("[data-reveal]").forEach((el, i) => { el.style.setProperty("--i", i % 4); N.anim([el], el.dataset.reveal, { stagger: false }); });
})();
