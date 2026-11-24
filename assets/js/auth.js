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
        signIn: (email, pw) => auth.signInWithEmailAndPassword(email.trim(), pw),
        async signUp({ name, phone, email, password }) {
          const cred = await auth.createUserWithEmailAndPassword(email.trim(), password);
          await cred.user.updateProfile({ displayName: name });
          await db.collection("users").doc(cred.user.uid).set({ name, phone, email: email.trim(), createdAt: ts() }, { merge: true });
          try { await cred.user.sendEmailVerification({ url: (N.SITE_URL || location.origin + "/") + "dang-nhap.html" }); } catch { /* not fatal */ }
          return cred.user;
        },
        async google() {
          const p = new fb.auth.GoogleAuthProvider();
          p.setCustomParameters({ prompt: "select_account" });
          const cred = await auth.signInWithPopup(p);
          const u = cred.user;
          const ref = db.collection("users").doc(u.uid);
          const snap = await ref.get();
          if (!snap.exists) await ref.set({ name: u.displayName || "", email: u.email || "", phone: "", createdAt: ts() }, { merge: true });
          return u;
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
          const provider = (u.providerData[0] && u.providerData[0].providerId) || "password";
          const data = { email: u.email || "", provider, lastLoginAt: ts(), loginCount: fb.firestore.FieldValue.increment(1) };
          if (!snap.exists) Object.assign(data, { name: u.displayName || "", phone: "", createdAt: u.metadata && u.metadata.creationTime ? fb.firestore.Timestamp.fromDate(new Date(u.metadata.creationTime)) : ts() });
          else if (!snap.data().name && u.displayName) data.name = u.displayName;
          // count at most once per browser session
          const k = `nhan-touch-${u.uid}`;
          if (sessionStorage.getItem(k)) delete data.loginCount; else sessionStorage.setItem(k, "1");
          await ref.set(data, { merge: true });
        } catch { /* stats are best-effort */ }
      };

      let first = true;
      auth.onAuthStateChanged((u) => {
        if (u) touch(u);
        api.user = u;
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
