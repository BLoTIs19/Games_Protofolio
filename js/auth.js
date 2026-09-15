/*
  ADMIN AUTH (DEMO ONLY — NOT SECURE)
  ------------------------------------
  This checks a username against a SHA-256 hash stored in js/config.js,
  entirely in the browser. That means:

    - Anyone can view the hash in the page source.
    - A hash can be brute-forced or looked up offline; it is not a
      substitute for real authentication.
    - There is no server verifying anything — this only gates the UI.

  This is fine for a personal, static portfolio where the "admin" pages
  are really just a content editor for you alone, on a machine only you
  use. It is NOT fine if you need real access control (e.g. multiple
  editors, sensitive data, or a public-write API).

  To make this production-grade, replace `Auth.attemptLogin` with a call
  to a real backend, e.g.:
    - A small serverless function (Cloudflare Worker / AWS Lambda) that
      checks credentials against an environment variable and returns a
      signed session token (JWT) in an httpOnly cookie.
    - Or a managed auth provider (Auth0, Supabase Auth, Firebase Auth).
  Everything else in admin.js only calls Auth.isAuthenticated() /
  Auth.logout(), so swapping the implementation here is enough.
*/

const SESSION_KEY = "gdportfolio.session.v1";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const Auth = {
  async attemptLogin(username, password) {
    const cfg = SITE_CONFIG.admin;
    if (username !== cfg.username) return { ok: false, error: "Incorrect username or password." };
    const hash = await sha256(password);
    if (hash !== cfg.passwordHash) return { ok: false, error: "Incorrect username or password." };

    const token = crypto.randomUUID ? crypto.randomUUID() : String(Math.random());
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: username, ts: Date.now() }));
    return { ok: true };
  },

  isAuthenticated() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const session = JSON.parse(raw);
      // Demo sessions expire after 4 hours of the tab being open.
      return Date.now() - session.ts < 4 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
  },

  requireAuthOrRedirect(loginPath) {
    if (!this.isAuthenticated()) {
      window.location.href = loginPath;
    }
  },
};
