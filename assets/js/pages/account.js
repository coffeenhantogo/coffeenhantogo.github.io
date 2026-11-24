/* Account page (dashboard): overview, live orders, profile + avatar, security */
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
      const isPw = u.providerData.some((p) => p.providerId === "password");
      const hasGoogle = u.providerData.some((p) => p.providerId === "google.com");
      const since = u.metadata && u.metadata.creationTime ? new Date(u.metadata.creationTime) : null;
      const ico = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
      const IC2 = {
        home: ico('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
        bag: ico('<path d="M6 7h12l1 13H5z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>'),
        user: ico('<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
        lock: ico('<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
        out: ico('<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>'),
        cup: ico('<path d="M5 8h12v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M12 3v2"/>'),
        beans: ico('<ellipse cx="9" cy="12" rx="4.5" ry="7" transform="rotate(-30 9 12)"/><path d="M6.5 7.5c2 2 2.5 5 1 9"/><ellipse cx="17" cy="10" rx="3" ry="5" transform="rotate(25 17 10)"/>'),
        chat: ico('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>'),
      };
      root.innerHTML = `
        <section class="dash-hero" data-reveal="up">
          <div class="dh-inner">
            <div class="acct-av-wrap dh-av">
              <div class="acct-avatar" data-av></div>
              <button type="button" class="acct-av-cam" data-av-pick aria-label="Đổi ảnh đại diện" title="Đổi ảnh đại diện"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg></button>
            </div>
            <div class="dh-text">
              <span class="dh-kicker">Tài khoản của tôi</span>
              <h1>Xin chào, ${N.esc(name.split(" ").pop() || "bạn")}!${admin ? ' <span class="admin-tag">Quản trị</span>' : ""}</h1>
              <p>${N.esc(u.email || "")} ${u.emailVerified ? '<span class="dh-badge ok">✓ Đã xác thực</span>' : '<span class="dh-badge warn">Chưa xác thực email</span>'}${since ? `<span class="dh-since">Thành viên từ ${since.toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })}</span>` : ""}</p>
            </div>
            <div class="dh-actions">
              ${admin ? '<a class="btn btn-outline-light btn-sm" href="quan-tri.html">Trang quản trị</a>' : ""}
              <a class="btn btn-lime btn-sm" href="thuc-don.html">${N.IC.plus} Đặt món</a>
            </div>
          </div>
          <div class="dh-stats">
            <div><span>Đơn hàng</span><b data-st-n>—</b></div>
            <div><span>Đã chi tiêu</span><b data-st-spend>—</b></div>
            <div><span>Đang xử lý</span><b data-st-active>—</b></div>
          </div>
        </section>
        <div class="dash">
          <nav class="dash-nav" aria-label="Mục tài khoản" data-reveal="left">
            <button type="button" data-tab="tong-quan">${IC2.home}<span>Tổng quan</span></button>
            <button type="button" data-tab="don-hang">${IC2.bag}<span>Đơn hàng</span><small data-n-orders hidden></small></button>
            <button type="button" data-tab="thong-tin">${IC2.user}<span>Thông tin cá nhân</span></button>
            <button type="button" data-tab="bao-mat">${IC2.lock}<span>Bảo mật</span></button>
            <button type="button" class="dn-out" data-signout>${IC2.out}<span>Đăng xuất</span></button>
          </nav>
          <div class="dash-main">
            <section data-panel="tong-quan">
              <div class="dcard">
                <div class="dcard-head"><h2>Đơn đang xử lý</h2><button type="button" class="dlink" data-go="don-hang">Tất cả đơn →</button></div>
                <div data-active><div class="acct-loading"><span class="spinner"></span> Đang tải…</div></div>
              </div>
              <div class="dcard">
                <div class="dcard-head"><h2 data-fav-title>Món bạn hay đặt</h2><a class="dlink" href="thuc-don.html">Xem thực đơn →</a></div>
                <div class="fav-grid" data-favs></div>
              </div>
              <div class="dquick">
                <a href="thuc-don.html"><i>${IC2.cup}</i><span><b>Thực đơn đồ uống</b><small>Cà phê, bạc xỉu, trà sữa</small></span></a>
                <a href="san-pham.html?loai=ca-phe-xay"><i>${IC2.beans}</i><span><b>Cà phê xay 1kg</b><small>Pha tại nhà, cho quán</small></span></a>
                <a href="${S.zalo}" target="_blank" rel="noopener"><i>${IC2.chat}</i><span><b>Nhắn Zalo cho Nhẫn</b><small>${S.phoneDisplay}</small></span></a>
              </div>
            </section>
            <section data-panel="don-hang" hidden>
              <div class="dcard">
                <div class="dcard-head"><h2>Đơn hàng của tôi</h2><div class="filter-chips" data-ofilter></div></div>
                <div data-orders><div class="acct-loading"><span class="spinner"></span> Đang tải đơn hàng…</div></div>
              </div>
            </section>
            <section data-panel="thong-tin" hidden>
              <form class="dcard acct-profile" data-profile novalidate>
                <div class="dcard-head"><h2>Thông tin cá nhân</h2></div>
                <div class="form-alert" data-pmsg hidden></div>
                <div class="av-edit">
                  <div class="acct-avatar av-sm" data-av></div>
                  <div class="av-edit-body">
                    <b>Ảnh đại diện</b>
                    <span data-av-src></span>
                    <div class="av-edit-btns">
                      <button type="button" class="btn btn-ink btn-sm" data-av-pick>Tải ảnh lên</button>
                      <button type="button" class="btn btn-outline btn-sm" data-av-adjust hidden>Căn chỉnh ảnh</button>
                      <button type="button" class="btn btn-outline btn-sm" data-av-google hidden>Dùng ảnh Google</button>
                      <button type="button" class="btn btn-outline btn-sm btn-g" data-av-link hidden><svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg> Lấy ảnh từ Google</button>
                      <button type="button" class="auth-link" data-av-remove hidden>Xóa ảnh</button>
                    </div>
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/*" data-av-file hidden>
                </div>
                <div class="form-2col">
                  <label class="field" data-f="name"><span>Họ và tên</span><input name="name" maxlength="60" value="${N.esc(name)}"><span class="err">Vui lòng nhập họ tên.</span></label>
                  <label class="field" data-f="phone"><span>Số điện thoại</span><input name="phone" type="tel" inputmode="tel" maxlength="15" value="${N.esc(prof.phone || "")}"><span class="err">Số điện thoại chưa đúng.</span></label>
                </div>
                <label class="field"><span>Địa chỉ giao hàng mặc định</span><input name="address" maxlength="160" value="${N.esc(prof.address || "")}" placeholder="Số nhà, tên đường, phường, TP.HCM"></label>
                <label class="field"><span>Chi nhánh hay ghé</span>
                  <select class="select" name="branch"><option value="">— Chọn chi nhánh —</option>${S.branches.map((b) => { const v = `${b.name} – ${b.address}`; return `<option value="${N.esc(v)}" ${prof.branch === v ? "selected" : ""}>${N.esc(b.name)}</option>`; }).join("")}</select>
                </label>
                <p class="dnote">Số điện thoại và địa chỉ được điền sẵn khi bạn đặt hàng.</p>
                <button class="btn btn-lime" type="submit">Lưu thông tin</button>
              </form>
            </section>
            <section data-panel="bao-mat" hidden>
              <div class="dcard">
                <div class="dcard-head"><h2>Bảo mật & đăng nhập</h2></div>
                <div class="sec-rows">
                  <div class="sec-row"><i>${IC2.chat}</i><div><b>Email</b><small>${N.esc(u.email || "")}</small></div>${u.emailVerified ? '<span class="st st-done">Đã xác thực</span>' : '<button type="button" class="btn btn-outline btn-sm" data-verify>Gửi lại email xác thực</button>'}</div>
                  <div class="sec-row"><i><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg></i><div><b>Đăng nhập bằng Google</b><small>${hasGoogle ? "Đã liên kết – có thể dùng nút “Đăng nhập với Google”" : "Chưa liên kết"}</small></div>${hasGoogle ? '<span class="st st-done">Đã liên kết</span>' : '<button type="button" class="btn btn-outline btn-sm" data-sec-link>Liên kết Google</button>'}</div>
                </div>
              </div>
              ${isPw ? `
              <form class="dcard" data-pwform novalidate>
                <div class="dcard-head"><h2>Đổi mật khẩu</h2></div>
                <div class="form-alert" data-pwmsg hidden></div>
                <label class="field" data-f="cur"><span>Mật khẩu hiện tại</span><input name="cur" type="password" autocomplete="current-password"><span class="err">Vui lòng nhập mật khẩu hiện tại.</span></label>
                <div class="form-2col">
                  <label class="field" data-f="npw"><span>Mật khẩu mới</span><input name="npw" type="password" autocomplete="new-password" placeholder="Ít nhất 8 ký tự, có chữ và số"><span class="err">Mật khẩu cần ít nhất 8 ký tự, gồm cả chữ và số.</span></label>
                  <label class="field" data-f="npw2"><span>Nhập lại mật khẩu mới</span><input name="npw2" type="password" autocomplete="new-password"><span class="err">Mật khẩu nhập lại không khớp.</span></label>
                </div>
                <div class="pw-actions"><button type="button" class="btn btn-ink" data-pw-save>Cập nhật mật khẩu</button><button type="button" class="auth-link" data-pw-forgot>Quên mật khẩu hiện tại?</button></div>
              </form>` : `<div class="dcard"><p class="pw-google-note" style="margin:0">Bạn đăng nhập bằng Google – mật khẩu do tài khoản Google quản lý.</p></div>`}
              <div class="dcard safe-tips">
                <div class="dcard-head"><h2>Mẹo an toàn – chống lừa đảo</h2></div>
                <ul>
                  <li><b>Nhẫn không bao giờ hỏi</b> mật khẩu, mã OTP, số thẻ hay mã xác thực Google của bạn – qua điện thoại, Zalo hay email.</li>
                  <li>Website chính thức duy nhất: <b>coffeenhantogo.github.io</b>. Kiểm tra kỹ địa chỉ trước khi đăng nhập.</li>
                  <li>Chỉ chuyển khoản tới <b>ACB · 16470961 · TRAN NGUYEN MINH KHOI</b>. Tài khoản khác đều là giả mạo.</li>
                  <li>Số điện thoại / Zalo duy nhất của quán: <b>${S.phoneDisplay}</b>. Nghi ngờ? Gọi số này để xác minh.</li>
                  <li>Dùng mật khẩu riêng cho Nhẫn (không trùng mật khẩu email / ngân hàng) và đăng xuất khi dùng máy lạ.</li>
                </ul>
              </div>
              <div class="dcard dcard-out"><div><b>Đăng xuất</b><small>Thoát khỏi tài khoản trên thiết bị này.</small></div><button type="button" class="btn btn-outline" data-signout>Đăng xuất</button></div>
            </section>
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
        root.querySelector("[data-av-adjust]").hidden = !(custom || google);
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
      const loadImg = (src, cors) => new Promise((ok, fail) => {
        const im = new Image();
        if (cors) im.crossOrigin = "anonymous";
        im.onload = () => ok(im);
        im.onerror = () => fail(new Error("Không đọc được ảnh này. Hãy thử ảnh JPG hoặc PNG."));
        im.src = src;
      });
      /* crop editor: drag to position, slider / mouse wheel to zoom, round preview → 256px JPEG data URL (or null) */
      const openCropper = (img) => new Promise((resolve) => {
        const W = img.naturalWidth, H = img.naturalHeight, box = contentBox(img);
        const base = Math.min(W, H);                       // visible square side at zoom 1 (fills the circle)
        let side = box.trimmed ? Math.max(box.w, box.h) : base;
        let cx = box.trimmed ? box.x + box.w / 2 : W / 2, cy = box.trimmed ? box.y + box.h / 2 : H / 2;
        const Z_MIN = 0.5, Z_MAX = 6;
        const wrap = document.createElement("div");
        wrap.className = "av-crop";
        wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true"); wrap.setAttribute("aria-label", "Căn chỉnh ảnh đại diện");
        wrap.innerHTML = `
          <div class="avc-box">
            <h3>Căn chỉnh ảnh đại diện</h3>
            <p>Kéo ảnh để căn giữa · kéo thanh trượt để phóng to, thu nhỏ</p>
            <div class="avc-stage"><canvas width="560" height="560" tabindex="0" aria-label="Xem trước – dùng phím mũi tên để di chuyển ảnh"></canvas></div>
            <label class="avc-zoom"><span aria-hidden="true">−</span><input type="range" min="${Z_MIN}" max="${Z_MAX}" step="0.01" aria-label="Phóng to ảnh"><span aria-hidden="true">+</span></label>
            <div class="avc-actions"><button type="button" class="btn btn-outline" data-avc-cancel>Hủy</button><button type="button" class="btn btn-lime" data-avc-save>Lưu ảnh</button></div>
          </div>`;
        document.body.appendChild(wrap);
        const prevOverflow = document.body.style.overflow; document.body.style.overflow = "hidden";
        const cv = wrap.querySelector("canvas"), g = cv.getContext("2d"), V = cv.width, range = wrap.querySelector("input");
        const draw = (ctx, size, overlay) => {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillStyle = box.fill; ctx.fillRect(0, 0, size, size);
          const k = size / side;
          ctx.imageSmoothingQuality = "high";
          ctx.setTransform(k, 0, 0, k, size / 2 - cx * k, size / 2 - cy * k);
          ctx.drawImage(img, 0, 0);
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          if (overlay) {
            ctx.fillStyle = "rgba(17,17,17,.55)";
            ctx.beginPath(); ctx.rect(0, 0, size, size); ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2); ctx.fill("evenodd");
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2); ctx.stroke();
          }
        };
        const setZoom = (z) => { z = Math.min(Z_MAX, Math.max(Z_MIN, z)); side = base / z; range.value = z; draw(g, V, true); };
        range.value = base / side; draw(g, V, true);
        range.addEventListener("input", () => setZoom(+range.value));
        // drag (mouse / touch)
        let drag = null;
        cv.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId); cv.classList.add("dragging"); });
        cv.addEventListener("pointermove", (e) => {
          if (!drag) return;
          const f = (V / cv.clientWidth) * (side / V);
          cx -= (e.clientX - drag.x) * f; cy -= (e.clientY - drag.y) * f; drag = { x: e.clientX, y: e.clientY };
          draw(g, V, true);
        });
        const endDrag = () => { drag = null; cv.classList.remove("dragging"); };
        cv.addEventListener("pointerup", endDrag); cv.addEventListener("pointercancel", endDrag);
        cv.addEventListener("wheel", (e) => { e.preventDefault(); setZoom((base / side) * (e.deltaY < 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
        cv.addEventListener("keydown", (e) => {
          const step = side * 0.03, m = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
          if (m) { e.preventDefault(); cx += m[0]; cy += m[1]; draw(g, V, true); }
        });
        const close = (val) => { wrap.remove(); document.body.style.overflow = prevOverflow; document.removeEventListener("keydown", onEsc); resolve(val); };
        const onEsc = (e) => { if (e.key === "Escape") close(null); };
        document.addEventListener("keydown", onEsc);
        wrap.addEventListener("click", (e) => { if (e.target === wrap) close(null); });
        wrap.querySelector("[data-avc-cancel]").addEventListener("click", () => close(null));
        wrap.querySelector("[data-avc-save]").addEventListener("click", () => {
          const c = document.createElement("canvas"); c.width = c.height = 256;
          draw(c.getContext("2d"), 256, false);
          try {
            let q = 0.86, d = c.toDataURL("image/jpeg", q);
            while (d.length > 90000 && q > 0.45) { q -= 0.12; d = c.toDataURL("image/jpeg", q); }
            close(d);
          } catch { N.toast("Không chỉnh được ảnh này – hãy dùng nút “Tải ảnh lên”."); close(null); }
        });
        cv.focus({ preventScroll: true });
      });
      const savePhoto = async (img) => {
        const d = await openCropper(img);
        if (!d) return;
        avBusy(true);
        try { await api.setPhoto(d); N.toast("Đã cập nhật ảnh đại diện"); }
        catch (err) { N.toast(err && err.code ? api.errorText(err) : "Không lưu được ảnh."); }
        avBusy(false);
      };
      const fileIn = root.querySelector("[data-av-file]");
      root.querySelectorAll("[data-av-pick]").forEach((b) => b.addEventListener("click", () => fileIn.click()));
      const avBusy = (on) => root.querySelectorAll("[data-av-pick],[data-av-adjust],[data-av-google],[data-av-link],[data-av-remove]").forEach((b) => (b.disabled = on));
      // adjust the current photo (uploaded one, or the Google photo when Google allows reading it)
      root.querySelector("[data-av-adjust]").addEventListener("click", async () => {
        const cur = api.photo || N.googlePhoto(api.user || u);
        if (!cur) return;
        try { await savePhoto(await loadImg(cur.replace(/=s\d+(-c)?$/, "=s512-c"), !cur.startsWith("data:"))); }
        catch { N.toast("Không mở được ảnh hiện tại – hãy dùng nút “Tải ảnh lên”."); }
      });
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
        if (!/^image\//.test(f.type)) { N.toast("Vui lòng chọn một tệp ảnh (JPG, PNG, WEBP)."); return; }
        if (f.size > 20e6) { N.toast("Ảnh quá lớn (tối đa 20MB)."); return; }
        const url = URL.createObjectURL(f);
        try { await savePhoto(await loadImg(url, false)); }
        catch (err) { N.toast((err && err.message) || "Không đọc được ảnh."); }
        URL.revokeObjectURL(url);
      });
      const clearPhoto = async (msg) => { avBusy(true); try { await api.setPhoto(null); N.toast(msg); } catch (err) { N.toast(api.errorText(err)); } avBusy(false); };
      root.querySelector("[data-av-google]").addEventListener("click", () => clearPhoto("Đã chuyển về ảnh Google"));
      root.querySelector("[data-av-remove]").addEventListener("click", () => clearPhoto("Đã xóa ảnh đại diện"));

      root.querySelectorAll("[data-signout]").forEach((b) => b.addEventListener("click", async () => { await api.signOut(); N.toast("Đã đăng xuất"); location.replace(N.HOME); }));
      root.querySelector("[data-verify]")?.addEventListener("click", async (e) => { try { await u.sendEmailVerification(); e.target.textContent = "Đã gửi – kiểm tra hộp thư"; } catch (err) { N.toast(api.errorText(err)); } });
      /* change password directly (re-authenticate with the current password) */
      const pwBox = root.querySelector("[data-pw-box]");
      root.querySelector("[data-pw-toggle]")?.addEventListener("click", () => { pwBox.hidden = !pwBox.hidden; if (!pwBox.hidden) pwBox.querySelector("input").focus(); });
      const pwMsg = root.querySelector("[data-pwmsg]");
      const showPw = (type, html) => { pwMsg.className = `form-alert ${type}`; pwMsg.innerHTML = html; pwMsg.hidden = false; };
      root.querySelector("[data-pw-save]")?.addEventListener("click", async (e) => {
        const f = root.querySelector("[data-pwform]");
        const cur = f.cur.value, npw = f.npw.value;
        const set = (k, on) => { f.querySelector(`[data-f="${k}"]`).classList.toggle("has-error", on); return on; };
        if ([set("cur", !cur), set("npw", !N.strongPw(npw)), set("npw2", npw !== f.npw2.value)].some(Boolean)) return;
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

      /* ---- tabs (hash: #don-hang, #thong-tin, #bao-mat) ---- */
      const TABS = ["tong-quan", "don-hang", "thong-tin", "bao-mat"];
      const setTab = (t, push) => {
        if (!TABS.includes(t)) t = "tong-quan";
        root.querySelectorAll("[data-tab]").forEach((b) => { const on = b.dataset.tab === t; b.classList.toggle("is-active", on); b.setAttribute("aria-current", on ? "page" : "false"); });
        root.querySelectorAll("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== t; });
        const nav = root.querySelector(".dash-nav"), act = nav.querySelector(`[data-tab="${t}"]`);
        if (nav.scrollWidth > nav.clientWidth && act) nav.scrollTo({ left: nav.scrollLeft + act.getBoundingClientRect().left - nav.getBoundingClientRect().left - nav.clientWidth / 2 + act.clientWidth / 2, behavior: push ? "smooth" : "auto" });
        const pn = root.querySelector(`[data-panel="${t}"]`);
        N.anim(pn.querySelectorAll(".dcard, .dquick > a"), "up");
        if (push) history.replaceState(null, "", t === "tong-quan" ? location.pathname : `#${t}`);
      };
      root.addEventListener("click", (e) => {
        const b = e.target.closest("[data-tab], [data-go]");
        if (!b) return;
        setTab(b.dataset.tab || b.dataset.go, true);
        if (b.dataset.go || innerWidth < 900) root.querySelector(".dash").scrollIntoView({ behavior: "smooth", block: "start" });
      });
      setTab(location.hash.slice(1), false);
      root.querySelector("[data-sec-link]")?.addEventListener("click", () => root.querySelector("[data-av-link]").click());

      /* ---- orders: live from Firestore ---- */
      const ACTIVE = ["pending", "confirmed", "making", "delivering"];
      const steps = (o) => (o.delivery && o.delivery.method === "ship" ? ["pending", "confirmed", "making", "delivering", "done"] : ["pending", "confirmed", "making", "done"]);
      const STEP_T = { pending: "Đặt", confirmed: "Xác nhận", making: "Pha chế", delivering: "Đang giao", done: "Xong" };
      const tracker = (o) => {
        if (o.status === "cancelled") return "";
        const st = steps(o), idx = Math.max(0, st.indexOf(o.status));
        return `<ol class="o-track" style="--p:${idx / (st.length - 1)};--n:${st.length}">${st.map((k, i) => `<li class="${i < idx ? "done" : i === idx ? "now" : ""}"><i></i><span>${STEP_T[k]}</span></li>`).join("")}</ol>`;
      };
      const thumbs = (o) => o.items.slice(0, 3).map((i) => { const p = N.byId[i.id]; return p ? `<img src="${N.img(p.img)}" alt="">` : ""; }).join("");
      const orderCard = (o) => `
        <article class="o-card ${(N.STATUS[o.status] || N.STATUS.pending)[1]}">
          <div class="oc-top">
            <div class="oc-thumbs">${thumbs(o)}</div>
            <div class="oc-id"><b>${N.esc(o.code)}</b><small>${when(o)} · ${o.delivery.method === "ship" ? "Giao tận nơi" : "Nhận tại quán"}</small></div>
            ${stBadge(o.status)}
          </div>
          <p class="oc-items">${o.items.map((i) => `${N.esc(i.name)} <b>×${i.qty}</b>`).join(" · ")}</p>
          ${tracker(o)}
          <div class="oc-foot">
            <div class="oc-total"><small>${N.esc(o.payment || "")}</small><b>${N.esc(o.totalText)}</b></div>
            <div class="oc-actions">
              <a class="btn btn-outline btn-sm" href="dat-hang-thanh-cong.html?ma=${encodeURIComponent(o.code)}">Chi tiết</a>
              <button type="button" class="btn btn-lime btn-sm" data-reorder="${N.esc(o.code)}">Đặt lại</button>
              ${o.status === "pending" ? `<button type="button" class="btn btn-outline btn-sm btn-danger" data-cancel-order="${N.esc(o.code)}">Hủy đơn</button>` : ""}
            </div>
          </div>
        </article>`;
      let orders = [], ofilter = "all";
      const OF = [["all", "Tất cả"], ["active", "Đang xử lý"], ["done", "Hoàn thành"], ["cancelled", "Đã hủy"]];
      const renderOrders = () => {
        const nActive = orders.filter((o) => ACTIVE.includes(o.status)).length;
        const spent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + (o.totalAmount || 0), 0);
        root.querySelector("[data-st-n]").textContent = orders.length;
        root.querySelector("[data-st-spend]").textContent = N.fmtVND(spent);
        root.querySelector("[data-st-active]").textContent = nActive;
        const badge = root.querySelector("[data-n-orders]"); badge.hidden = !nActive; badge.textContent = nActive;
        // overview: active orders
        const act = orders.filter((o) => ACTIVE.includes(o.status));
        root.querySelector("[data-active]").innerHTML = act.length ? act.map(orderCard).join("")
          : `<div class="d-empty"><b>Không có đơn nào đang xử lý</b><span>Thèm một ly cà phê? Đặt trước, ghé lấy không cần chờ.</span><a class="btn btn-lime btn-sm" href="thuc-don.html">Đặt món ngay</a></div>`;
        // favourite items (from non-cancelled orders), else featured suggestions
        const tally = {};
        orders.filter((o) => o.status !== "cancelled").forEach((o) => o.items.forEach((i) => { if (N.byId[i.id]) tally[i.id] = (tally[i.id] || 0) + i.qty; }));
        let favs = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => [N.byId[id], `Bạn đã đặt ${n} lần`]);
        root.querySelector("[data-fav-title]").textContent = favs.length ? "Món bạn hay đặt" : "Gợi ý cho bạn";
        if (favs.length < 3) favs = favs.concat(N.PRODUCTS.filter((p) => p.featured && p.type === "drink" && !tally[p.id]).slice(0, 3 - favs.length).map((p) => [p, favs.length ? "Gợi ý thêm" : p.badge || p.cat]));
        root.querySelector("[data-favs]").innerHTML = favs.map(([p, sub]) => `
          <div class="fav${p.soldOut ? " is-out" : ""}">
            <a href="${N.productUrl(p)}"><img src="${N.img(p.img)}" alt="${N.esc(p.name)}" loading="lazy"></a>
            <div><b>${N.esc(p.name)}</b><small>${N.esc(sub)} · ${N.esc(N.priceText(p))}</small></div>
            <button type="button" class="btn btn-lime btn-sm" data-add="${p.id}" ${p.soldOut ? "disabled" : ""}>${p.soldOut ? "Tạm hết" : "Đặt"}</button>
          </div>`).join("");
        // orders tab
        root.querySelector("[data-ofilter]").innerHTML = OF.map(([k, t]) => {
          const n = k === "all" ? orders.length : k === "active" ? nActive : orders.filter((o) => o.status === k).length;
          return `<button type="button" class="fchip ${ofilter === k ? "is-active" : ""}" data-of="${k}">${t}<small>${n}</small></button>`;
        }).join("");
        const list = orders.filter((o) => ofilter === "all" || (ofilter === "active" ? ACTIVE.includes(o.status) : o.status === ofilter));
        root.querySelector("[data-orders]").innerHTML = list.length ? `<div class="o-list">${list.map(orderCard).join("")}</div>`
          : `<div class="d-empty"><b>${orders.length ? "Không có đơn nào ở mục này" : "Bạn chưa có đơn hàng nào"}</b><span>Đơn bạn đặt sẽ hiện ở đây, kèm trạng thái cập nhật trực tiếp.</span><a class="btn btn-lime btn-sm" href="thuc-don.html">Đặt món đầu tiên</a></div>`;
      };
      root.addEventListener("click", async (e) => {
        const f = e.target.closest("[data-of]");
        if (f) { ofilter = f.dataset.of; renderOrders(); return; }
        const r = e.target.closest("[data-reorder]");
        if (r) {
          const o = orders.find((x) => x.code === r.dataset.reorder); if (!o) return;
          let n = 0;
          o.items.forEach((i) => {
            const p = N.byId[i.id]; if (!p || p.soldOut) return;
            const vals = (i.opts || "").split(" · "), opts = {};
            Object.keys(p.options || {}).forEach((k) => { const v = vals.find((x) => p.options[k].includes(x)); if (v) opts[k] = v; });
            N.cart.add(i.id, i.qty, opts, i.note || "", true); n++;
          });
          N.toast(n ? `Đã thêm ${n} món vào giỏ` : "Các món trong đơn này đang tạm hết");
          if (n) N.open("cartDrawer");
          return;
        }
        const c = e.target.closest("[data-cancel-order]");
        if (c) {
          if (!confirm(`Hủy đơn ${c.dataset.cancelOrder}?\nChỉ hủy được khi quán chưa xác nhận đơn.`)) return;
          c.disabled = true;
          try { await api.cancelOrder(c.dataset.cancelOrder); N.toast("Đã hủy đơn"); }
          catch (err) { c.disabled = false; N.toast(err && err.code === "permission-denied" ? `Quán đã xác nhận đơn – vui lòng gọi ${S.phoneDisplay} để hủy.` : api.errorText(err)); }
        }
      });
      const sortO = (list) => list.sort((a, b) => (b.createdAtLocal || "").localeCompare(a.createdAtLocal || ""));
      try {
        api.db.collection("orders").where("uid", "==", u.uid).limit(100).onSnapshot(
          (snap) => { orders = sortO(snap.docs.map((d) => N.cleanOrder(d.data()))); renderOrders(); },
          async () => { orders = sortO((await api.myOrders().catch(() => [])).map(N.cleanOrder)); renderOrders(); },
        );
      } catch { orders = sortO((await api.myOrders().catch(() => [])).map(N.cleanOrder)); renderOrders(); }
      document.addEventListener("nhan:shop", renderOrders);
    };
    render(api.user);
    document.addEventListener("nhan:user", (e) => { if (!e.detail) location.replace("dang-nhap.html?next=tai-khoan.html"); });
  });
})();
