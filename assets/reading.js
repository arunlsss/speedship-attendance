(() => {
  const key = "sss-text-size";
  const scales = { standard: 1, large: 1.25, extra: 1.5 };
  const labels = { standard: "Standard", large: "Large", extra: "Extra large" };
  let preference = "standard";
  const attendancePage = /\/(?:index\.html)?$/.test(location.pathname);
  document.documentElement.classList.add(attendancePage ? "reading-attendance" : "reading-dashboard");

  function readPreference() {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function syncControls() {
    document.querySelectorAll("select[data-text-size]").forEach(control => {
      control.value = preference;
    });
  }

  function apply(value) {
    preference = Object.hasOwn(scales, value) ? value : "standard";
    document.documentElement.style.setProperty("--text-scale", scales[preference]);
    document.documentElement.dataset.textSize = preference;
    syncControls();
  }

  function controlMarkup(id) {
    return `<label class="text-size-control" for="${id}"><span>Text size</span><select id="${id}" data-text-size aria-label="Text size / ขนาดตัวอักษร">${Object.entries(labels).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}</select></label>`;
  }

  function createControl(id) {
    const template = document.createElement("template");
    template.innerHTML = controlMarkup(id);
    return template.content.firstElementChild;
  }

  function mountControls() {
    const header = document.querySelector(".header-actions, .dash-topbar > .toolbar-group");
    if (header && !header.querySelector("select[data-text-size]")) {
      header.prepend(createControl("desktop-text-size"));
    }
    const loginTheme = document.querySelector(".auth-topline #themeBtn");
    if (loginTheme && !document.querySelector(".auth-topline select[data-text-size]")) {
      const displayControls = document.createElement("div");
      displayControls.className = "auth-display-controls";
      loginTheme.before(displayControls);
      displayControls.append(createControl("login-text-size"), loginTheme);
    }
    const menu = document.querySelector(".mobile-menu");
    if (menu && !menu.querySelector("select[data-text-size]")) {
      menu.querySelector("#mobileThemeBtn").before(createControl("mobile-text-size"));
    }
    syncControls();
  }

  apply(readPreference());
  document.addEventListener("DOMContentLoaded", () => {
    mountControls();
    new MutationObserver(mountControls).observe(document.body, { childList: true, subtree: true });
  });
  document.addEventListener("change", event => {
    if (!event.target.matches("select[data-text-size]")) return;
    apply(event.target.value);
    try { localStorage.setItem(key, preference); } catch { /* Keep working without storage. */ }
  });
  window.addEventListener("storage", event => {
    if (event.key === key) apply(event.newValue);
  });
  window.SSSReading = { controlMarkup, syncControls };
})();
