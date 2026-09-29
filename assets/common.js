(() => {
  const API_URL = "https://attendanceapi-wl5ots23eq-as.a.run.app/";
  const THEME_KEY = "sss_theme";
  let dashboardUser = null;

  function applyTheme(pref = localStorage.getItem(THEME_KEY) || "auto") {
    const dark = pref === "dark" || (pref === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.themePreference = pref;
    document.querySelectorAll("[data-theme-label]").forEach(el => el.textContent = pref === "auto" ? "Auto" : pref === "dark" ? "Dark" : "Light");
    return pref;
  }

  function cycleTheme() {
    const current = localStorage.getItem(THEME_KEY) || "auto";
    const next = current === "auto" ? "light" : current === "light" ? "dark" : "auto";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    return next;
  }

  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if ((localStorage.getItem(THEME_KEY) || "auto") === "auto") applyTheme("auto");
  });

  async function request(action, { method = "GET", body = null, dashboard = false, query = {} } = {}) {
    const headers = {};
    if (dashboard) {
      const token = await window.SSSAuth?.idToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let url = API_URL;
    const payload = body ? { ...body, action } : null;
    if (method === "GET") {
      const params = new URLSearchParams({ action, ...query });
      url += `?${params.toString()}`;
    } else {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, { method, headers, body: method === "GET" ? undefined : JSON.stringify(payload || { action }) });
    const json = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
    if (!res.ok || !json.ok) {
      const err = new Error(json.error || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return json.data;
  }

  function toast(message, type = "") {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
  }

  function pct(value, digits = 0) { return value == null ? "—" : `${(value * 100).toFixed(digits)}%`; }
  function fmtDateTime(value) {
    if (!value) return "—";
    const d = new Date(value); if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "medium", timeStyle: "short" });
  }
  function fmtDate(value) {
    if (!value) return "—";
    const d = value.length === 10 ? new Date(`${value}T00:00:00+07:00`) : new Date(value);
    return d.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "2-digit", month: "short", year: "numeric" });
  }
  function initials(name, nick = "") { return String(nick || name || "?").trim().slice(0, 2).toUpperCase(); }

  function safeExternalUrl(value) {
    if (!value) return "";
    try {
      const u = new URL(String(value), location.origin);
      return u.protocol === "https:" ? u.href : "";
    } catch {
      return "";
    }
  }


  function routeForRole(role) {
    if (role === "hr") return "hr.html";
    if (role === "executive") return "executive.html";
    if (role === "admin" || role === "super_admin") return "admin.html";
    return "login.html";
  }

  async function loadDashboardUser(force = false) {
    if (dashboardUser && !force) return dashboardUser;
    const user = await window.SSSAuth?.ready();
    if (!user) return null;
    dashboardUser = await request("dashboardMe", { method: "POST", dashboard: true, body: {} });
    return dashboardUser;
  }

  async function requireDashboard(roles = []) {
    const user = await window.SSSAuth?.ready();
    if (!user) {
      const next = encodeURIComponent(location.pathname.split("/").pop() || "hr.html");
      location.href = `login.html?next=${next}`;
      return null;
    }
    try {
      const me = await loadDashboardUser(true);
      if (!me.emailVerified || me.status !== "active" || !me.role) {
        location.href = "login.html";
        return null;
      }
      if (roles.length && !roles.includes(me.role)) {
        location.href = routeForRole(me.role);
        return null;
      }
      return me;
    } catch (e) {
      if (e.status === 401 || e.status === 403) location.href = "login.html";
      else throw e;
      return null;
    }
  }

  async function logoutDashboard() {
    dashboardUser = null;
    await window.SSSAuth?.logout();
  }

  applyTheme();

  window.SSS = {
    API_URL, THEME_KEY,
    applyTheme, cycleTheme, request, toast, esc, pct, fmtDateTime, fmtDate, initials, safeExternalUrl,
    routeForRole, loadDashboardUser, requireDashboard, logoutDashboard,
    dashboardUser: () => dashboardUser
  };
})();
