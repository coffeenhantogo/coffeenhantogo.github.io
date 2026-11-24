/* =========================================================
   Coffee Nhẫn To Go — accounts & order database (Firebase, loaded on demand)
   Exposes (via N.fbReady → api | null):
     api.auth, api.db, api.user, api.isAdmin(user)
     api.signIn(email, pw), api.signUp({name, phone, email, password}), api.google(), api.reset(email), api.signOut()
     api.getProfile(), api.saveProfile(data), api.saveOrder(order), api.myOrders()
     api.errorText(err)
   Fires document event "nhan:user" with the current user (or null) on every auth change.
   ========================================================= */
(() => {
  "use strict";
  const N = window.NHAN;
  const V = "10.12.2";
  const base = `https://www.gstatic.com/firebasejs/${V}`;
  const load = (src) => new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = () => fail(new Error(`load ${src}`));
    document.head.appendChild(s);
  });

  const ERR = {
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/missing-email": "Vui lòng nhập email.",
    "auth/user-not-found": "Không tìm thấy tài khoản với email này.",
    "auth/wrong-password": "Mật khẩu không đúng.",
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/invalid-login-credentials": "Email hoặc mật khẩu không đúng.",
    "auth/email-already-in-use": "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng “Quên mật khẩu”.",
    "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
    "auth/too-many-requests": "Bạn thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.",
    "auth/network-request-failed": "Không có kết nối mạng. Vui lòng thử lại.",
    "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập Google.",
    "auth/popup-blocked": "Trình duyệt chặn cửa sổ đăng nhập. Hãy cho phép popup rồi thử lại.",
    "auth/unauthorized-domain": "Tên miền chưa được cho phép trong Firebase (Authorized domains).",
    "auth/operation-not-allowed": "Phương thức đăng nhập này chưa được bật trong Firebase.",
    "auth/requires-recent-login": "Vui lòng đăng nhập lại để thực hiện thao tác này.",
    "permission-denied": "Bạn không có quyền thực hiện thao tác này.",
    "auth/credential-already-in-use": "Tài khoản Google này đã được dùng cho một tài khoản khác tại Nhẫn. Hãy chọn đúng Gmail của bạn.",
    "auth/provider-already-linked": "Tài khoản đã được liên kết Google.",
    "auth/user-mismatch": "Bạn đã chọn một tài khoản Google khác với tài khoản đã liên kết.",
    "nhan/banned": "Tài khoản này đã bị khóa do vi phạm chính sách. Vui lòng liên hệ 0909.637.168 nếu có nhầm lẫn.",
    "nhan/not-registered": "Gmail này chưa đăng ký tài khoản tại Nhẫn. Hãy chuyển sang tab <b>Đăng ký</b> để tạo tài khoản.",
  };

  (async () => {
    try {
      await load(`${base}/firebase-app-compat.js`);
      await Promise.all([load(`${base}/firebase-auth-compat.js`), load(`${base}/firebase-firestore-compat.js`)]);
      const fb = window.firebase;
      fb.initializeApp(N.FIREBASE);
      const auth = fb.auth(), db = fb.firestore();
      auth.languageCode = "vi";
      const ts = () => fb.firestore.FieldValue.serverTimestamp();

      const api = {
        auth, db, firebase: fb, user: null,
        isAdmin: (u = api.user) => !!u && !!u.emailVerified && N.ADMIN_EMAILS.includes((u.email || "").toLowerCase()),
        errorText: (e) => ERR[e && e.code] || (e && e.message) || "Đã có lỗi xảy ra. Vui lòng thử lại.",
        async signIn(email, pw) {
          const cred = await auth.signInWithEmailAndPassword(email.trim(), pw);
          await api.assertNotBanned(cred.user);
          return cred;
        },
        // banned accounts (set by the admin) are signed out immediately
        async assertNotBanned(u) {
          if (!u) return;
          const s = await db.collection("users").doc(u.uid).get().catch(() => null);
          if (s && s.exists && s.data().banned) {
            await auth.signOut();
            const e = new Error("banned"); e.code = "nhan/banned"; throw e;
          }
        },
        async signUp({ name, phone, email, password }) {
          const cred = await auth.createUserWithEmailAndPassword(email.trim(), password);
          await cred.user.updateProfile({ displayName: name });
          await db.collection("users").doc(cred.user.uid).set({ name, phone, email: email.trim(), createdAt: ts() }, { merge: true });
          try { await cred.user.sendEmailVerification({ url: (N.SITE_URL || location.origin + "/") + "dang-nhap.html" }); } catch { /* not fatal */ }
          return cred.user;
        },
        /* mode "login": only existing customers – a Gmail that never registered is rejected (the
           auto-created Firebase user is deleted again). mode "register": creates the account; the
           caller then asks the customer to complete registration (phone + policy). */
        async google(mode = "login") {
          const p = new fb.auth.GoogleAuthProvider();
          p.setCustomParameters({ prompt: "select_account" });
          api._googlePending = true;
          try {
            const cred = await auth.signInWithPopup(p);
            const u = cred.user;
            const isNew = !!(cred.additionalUserInfo && cred.additionalUserInfo.isNewUser);
            const ref = db.collection("users").doc(u.uid);
            if (mode === "login") {
              const snap = isNew ? null : await ref.get().catch(() => null);
              if (isNew || !snap || !snap.exists) {
                if (isNew) { try { await u.delete(); } catch { /* fall back to sign-out */ } }
                await auth.signOut();
                const e = new Error("not-registered"); e.code = "nhan/not-registered"; throw e;
              }
              if (snap.data().banned) { await auth.signOut(); const e = new Error("banned"); e.code = "nhan/banned"; throw e; }
              return { user: u, isNew: false, needsProfile: !snap.data().phone };
            }
            const snap = await ref.get();
            if (!snap.exists) await ref.set({ name: u.displayName || "", email: u.email || "", phone: "", provider: "google.com", createdAt: ts() }, { merge: true });
            return { user: u, isNew: isNew || !snap.exists, needsProfile: !snap.exists || !snap.data().phone };
          } finally {
            api._googlePending = false;
            if (auth.currentUser) touch(auth.currentUser);
          }
        },
        async completeProfile({ name, phone }) {
          if (!api.user) throw new Error("not signed in");
          if (name && name !== api.user.displayName) await api.user.updateProfile({ displayName: name });
          await db.collection("users").doc(api.user.uid).set({ name, phone, registeredAt: ts() }, { merge: true });
        },
        reset: (email) => auth.sendPasswordResetEmail(email.trim()),
        signOut: () => auth.signOut(),
        async getProfile() {
          if (!api.user) return null;
          const s = await db.collection("users").doc(api.user.uid).get();
          return s.exists ? s.data() : {};
        },
        async saveProfile(data) {
          if (!api.user) throw new Error("not signed in");
          if (data.name && data.name !== api.user.displayName) await api.user.updateProfile({ displayName: data.name });
          await db.collection("users").doc(api.user.uid).set({ ...data, updatedAt: ts() }, { merge: true });
        },
        async saveOrder(o) {
          const doc = {
            code: o.code, createdAt: ts(), createdAtLocal: o.createdAt,
            uid: api.user ? api.user.uid : null,
            customer: o.customer, delivery: o.delivery, payment: o.payment, note: o.note || "",
            items: o.items.map((i) => ({ id: i.id, name: i.name, qty: i.qty, opts: i.opts || "", note: i.note || "", price: i.price ?? null })),
            totalText: o.totalText, totalAmount: o.totalAmount ?? null,
            status: "pending", emailSent: o.status === "sent",
          };
          await db.collection("orders").doc(o.code).set(doc);
        },
        /* custom avatar: a small square JPEG (data URL, ~20–60 KB) kept in users/{uid}.photo.
           null removes it (the header then falls back to the Google photo, then the initial). */
        async setPhoto(dataUrl) {
          if (!api.user) throw new Error("not signed in");
          const FV = fb.firestore.FieldValue;
          await db.collection("users").doc(api.user.uid).set({ photo: dataUrl || FV.delete(), photoUpdatedAt: ts() }, { merge: true });
          setCustomPhoto(dataUrl || null);
        },
        /* link a Google account to an email/password account (to use its profile photo, and
           to allow "Đăng nhập với Google" afterwards). Returns the Google photo URL. */
        async linkGoogle() {
          const u = api.user;
          if (!u) throw new Error("not signed in");
          const p = new fb.auth.GoogleAuthProvider();
          p.setCustomParameters({ prompt: "select_account", login_hint: u.email || "" });
          const linked = (u.providerData || []).some((x) => x.providerId === "google.com");
          const cred = linked ? await u.reauthenticateWithPopup(p) : await u.linkWithPopup(p);
          const gp = (cred.additionalUserInfo && cred.additionalUserInfo.profile && cred.additionalUserInfo.profile.picture)
            || ((cred.user.providerData || []).find((x) => x.providerId === "google.com") || {}).photoURL || "";
          if (gp && gp !== u.photoURL) await u.updateProfile({ photoURL: gp });
          await u.reload();
          api.user = auth.currentUser;
          if (gp) await db.collection("users").doc(u.uid).set({ photoURL: gp, provider: "google.com" }, { merge: true }).catch(() => {});
          return gp;
        },
        async myOrders() {
          if (!api.user) return [];
          const qs = await db.collection("orders").where("uid", "==", api.user.uid).limit(100).get();
          return qs.docs.map((d) => d.data()).sort((a, b) => (b.createdAtLocal || "").localeCompare(a.createdAtLocal || ""));
        },
      };

      // record sign-in activity on the customer's own profile (for admin stats)
      const touch = async (u) => {
        try {
          const ref = db.collection("users").doc(u.uid);
          const snap = await ref.get();
          if (snap.exists && snap.data().banned) {           // locked by the admin → sign out everywhere
            await auth.signOut();
            if (!/dang-nhap\.html/.test(location.pathname)) location.replace("dang-nhap.html?banned=1");
            return;
          }
          const provider = (u.providerData[0] && u.providerData[0].providerId) || "password";
          const data = { email: u.email || "", provider, lastLoginAt: ts(), loginCount: fb.firestore.FieldValue.increment(1) };
          const gp = N.googlePhoto ? N.googlePhoto(u) : u.photoURL;
          if (gp) data.photoURL = gp; // Google profile photo, shown in the admin customer list
          if (!snap.exists) Object.assign(data, { name: u.displayName || "", phone: "", createdAt: u.metadata && u.metadata.creationTime ? fb.firestore.Timestamp.fromDate(new Date(u.metadata.creationTime)) : ts() });
          else if (!snap.data().name && u.displayName) data.name = u.displayName;
          // count at most once per browser session
          const k = `nhan-touch-${u.uid}`;
          if (sessionStorage.getItem(k)) delete data.loginCount; else sessionStorage.setItem(k, "1");
          await ref.set(data, { merge: true });
        } catch { /* stats are best-effort */ }
      };

      // custom avatar cache (per uid) so the header shows it instantly on every page
      const photoKey = (uid) => `nhan-photo-${uid}`;
      const setCustomPhoto = (p) => {
        api.photo = p || null;
        try { if (api.user) { if (p) localStorage.setItem(photoKey(api.user.uid), p); else localStorage.removeItem(photoKey(api.user.uid)); } } catch { /* storage full / blocked */ }
        N.updateAccountUI && N.updateAccountUI(api.user, api);
        document.dispatchEvent(new CustomEvent("nhan:photo", { detail: api.photo }));
      };

      let first = true;
      auth.onAuthStateChanged((u) => {
        if (u && !api._googlePending) touch(u); // Google sign-ins are recorded only once accepted
        api.user = u;
        api.photo = null;
        if (u) { try { api.photo = localStorage.getItem(photoKey(u.uid)) || null; } catch { /* ignore */ } }
        if (u) db.collection("users").doc(u.uid).get().then((s) => { const p = (s.exists && s.data().photo) || null; if (api.user && api.user.uid === u.uid && p !== api.photo) setCustomPhoto(p); }).catch(() => {});
        N.updateAccountUI && N.updateAccountUI(u, api);
        document.dispatchEvent(new CustomEvent("nhan:user", { detail: u }));
        if (first) { first = false; N._fbResolve(api); }
      });
    } catch (e) {
      console.warn("[Nhẫn] Firebase unavailable:", e);
      N._fbResolve(null);
    }
  })();
})();
