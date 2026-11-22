/* Stores widget: renders into every [data-stores] (home + contact page) */
(() => {
  const N = window.NHAN, S = N.STORE, IC = N.IC;
  const mapSrc = (q) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
  const dirUrl = (q) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
  document.querySelectorAll("[data-stores]").forEach((root) => {
    root.innerHTML = `
    <div class="stores-grid">
      <div class="store-list">
        ${S.branches.map((b, i) => `
          <article class="store-card ${i === 0 ? "is-active" : ""}" data-map="${N.esc(b.mapQuery)}">
            <span class="store-no">0${i + 1}</span>
            <div class="store-info">
              <h3>${N.esc(b.name)}</h3>
              <p class="store-addr">${N.esc(b.address)}</p>
              <div class="store-actions">
                <a class="btn btn-lime btn-sm" href="${dirUrl(b.mapQuery)}" target="_blank" rel="noopener">Chỉ đường</a>
                <button class="btn btn-outline btn-sm" type="button" data-show-map>Xem bản đồ</button>
              </div>
            </div>
          </article>`).join("")}
        <div class="store-contact">
          <a class="sc-item" href="tel:${S.phone}"><span class="sc-ic">${IC.phone}</span><span><small>Hotline / Zalo</small><b>${S.phoneDisplay}</b></span></a>
          <a class="sc-item" href="mailto:${S.email}"><span class="sc-ic">${IC.mail}</span><span><small>Email</small><b>${S.email}</b></span></a>
        </div>
      </div>
      <div class="store-map">
        <div class="store-map-fallback" aria-hidden="true">
          <span class="pin">${IC.pin.replace("<svg", '<svg width="26" height="26"')}</span>
          <b>2 chi nhánh tại TP.HCM</b>
          <small>351 Minh Phụng · 26B/4 Lạc Long Quân</small>
        </div>
        <iframe title="Bản đồ ${N.esc(S.name)}" data-map-frame loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${mapSrc(S.branches[0].mapQuery)}"></iframe>
      </div>
    </div>`;
    root.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-show-map]");
      if (!btn) return;
      const card = btn.closest(".store-card");
      root.querySelectorAll(".store-card").forEach((c) => c.classList.toggle("is-active", c === card));
      root.querySelector("[data-map-frame]").src = mapSrc(card.dataset.map);
    });
    N.anim(root.querySelectorAll(".store-card"), "left");
    N.anim(root.querySelectorAll(".store-contact"), "up", { stagger: false });
    N.anim(root.querySelectorAll(".store-map"), "zoom", { stagger: false });
  });
})();
