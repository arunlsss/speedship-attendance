const CONFIG = {
    API_URL: "https://attendanceapi-wl5ots23eq-as.a.run.app",
    THEME_KEY: "sss-attendance-theme",
    LOCATION_KEY: "sss-attendance-location",
    PHOTO_MAX_W: 640,
    PHOTO_MAX_H: 480,
    PHOTO_QUALITY: 0.72
  };

  const state = {
    locations: [],
    employees: [],
    selectedLocation: null,
    selectedEmployee: null,
    logType: "IN",
    photoDataUrl: null,
    stream: null,
    submitting: false,
    pendingDuplicate: null,
    gps: null
  };

  const $ = id => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[ch]));
  }

  function initials(emp) {
    const s = (emp.nick || emp.name || emp.id || "?").trim();
    return s.slice(0, 2).toUpperCase();
  }

  function safeLegacyPhotoUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(String(value));
      return url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function avatarMarkup(emp) {
    const directUrl = safeLegacyPhotoUrl(emp.profilePhotoUrl);
    const proxyUrl = CONFIG.API_URL + "?action=getEmployeeAvatar&empId=" + encodeURIComponent(emp.id);
    const photoUrl = directUrl || proxyUrl;
    const fallback = `<span class="avatar-fallback">${escapeHtml(initials(emp))}</span>`;
    return `<span class="avatar">${fallback}<img class="avatar-photo" src="${escapeHtml(photoUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer"></span>`;
  }

  function unwrap(payload) {
    if (!payload || payload.ok !== true) throw new Error(payload?.error || "Server error");
    return payload.data;
  }

  async function apiGet(action) {
    const url = new URL(CONFIG.API_URL);
    url.searchParams.set("action", action);
    const response = await fetch(url, { method: "GET", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    return unwrap(payload);
  }

  async function apiPost(body) {
    const response = await fetch(CONFIG.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    return unwrap(payload);
  }

  function setThemePreference(pref) {
    localStorage.setItem(CONFIG.THEME_KEY, pref);
    applyTheme(pref);
  }

  function applyTheme(pref) {
    const resolved = pref === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : pref;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    $("themeMode").value = pref;
  }

  const systemThemeMedia = matchMedia("(prefers-color-scheme: dark)");
  systemThemeMedia.addEventListener?.("change", () => {
    if ((localStorage.getItem(CONFIG.THEME_KEY) || "system") === "system") applyTheme("system");
  });

  function updateClock() {
    const now = new Date();
    $("clock").textContent = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
    $("dateText").textContent = new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(now);
  }

  function setApiStatus(mode, text) {
    const el = $("apiStatus");
    el.className = `status-chip ${mode || ""}`;
    el.querySelector("span:last-child").textContent = text;
  }

  function toast(title, detail = "", type = "") {
    const node = document.createElement("div");
    node.className = `toast ${type}`;
    node.innerHTML = `<span class="toast-mark"></span><div><div class="toast-title">${escapeHtml(title)}</div>${detail ? `<div class="toast-detail">${escapeHtml(detail)}</div>` : ""}</div>`;
    $("toastStack").appendChild(node);
    setTimeout(() => node.remove(), 4200);
  }

  function uploadStatus(id, title, detail) {
    let node = document.querySelector(`[data-upload-id="${CSS.escape(id)}"]`);
    if (!node) {
      node = document.createElement("div");
      node.className = "upload-card";
      node.dataset.uploadId = id;
      node.innerHTML = `<span class="spinner"></span><div><strong></strong><small></small></div>`;
      $("uploadCenter").appendChild(node);
    }
    node.querySelector("strong").textContent = title;
    node.querySelector("small").textContent = detail;
    return node;
  }

  function finishUploadStatus(id, success, detail) {
    const node = document.querySelector(`[data-upload-id="${CSS.escape(id)}"]`);
    if (!node) return;
    node.classList.add(success ? "done" : "error");
    node.querySelector("small").textContent = detail;
    setTimeout(() => node.remove(), success ? 1700 : 4500);
  }

  async function loadCoreData() {
    try {
      setApiStatus("", "กำลังเชื่อมต่อ");
      const [health, locations, employees] = await Promise.all([
        apiGet("health"), apiGet("getLocations"), apiGet("getEmployees")
      ]);
      state.locations = locations;
      state.employees = employees;
      setApiStatus("online", `Online · ${health.region}`);
      renderLocations();
      renderEmployees();
    } catch (error) {
      console.error(error);
      setApiStatus("offline", "เชื่อมต่อไม่ได้");
      toast("เชื่อมต่อระบบไม่ได้", error.message, "error");
    }
  }

  function renderLocations() {
    const select = $("locationSelect");
    select.innerHTML = `<option value="">เลือกสถานที่</option>` + state.locations.map(loc => `<option value="${escapeHtml(loc.id)}">${escapeHtml(loc.name)}</option>`).join("");
    const saved = localStorage.getItem(CONFIG.LOCATION_KEY);
    if (saved && state.locations.some(x => x.id === saved)) {
      select.value = saved;
      setLocation(saved);
    }
  }

  function setLocation(id) {
    state.selectedLocation = state.locations.find(x => x.id === id) || null;
    if (state.selectedLocation) localStorage.setItem(CONFIG.LOCATION_KEY, state.selectedLocation.id);
    else localStorage.removeItem(CONFIG.LOCATION_KEY);

    if (state.selectedEmployee && !employeeMatchesLocation(state.selectedEmployee)) clearSelectedEmployee();
    renderEmployees();
    updateReadiness();
  }

  function employeeMatchesLocation(emp) {
    if (!state.selectedLocation) return false;
    return (emp.assignedLocs || []).some(x => String(x).trim().toLowerCase() === state.selectedLocation.name.trim().toLowerCase());
  }

  function filteredEmployees() {
    const query = $("employeeSearch").value.trim().toLowerCase();
    return state.employees.filter(emp => employeeMatchesLocation(emp)).filter(emp => {
      if (!query) return true;
      return [emp.id, emp.name, emp.nick, emp.type].some(v => String(v || "").toLowerCase().includes(query));
    });
  }

  function renderEmployees() {
    const list = $("employeeList");
    if (!state.selectedLocation) {
      list.innerHTML = `<div class="empty">กรุณาเลือกสถานที่ก่อน</div>`;
      $("employeeCount").textContent = "";
      return;
    }
    const rows = filteredEmployees();
    $("employeeCount").textContent = `${rows.length} คน`;
    if (!rows.length) {
      list.innerHTML = `<div class="empty">ไม่พบพนักงานในสาขานี้</div>`;
      return;
    }
    list.innerHTML = rows.map(emp => `
      <button type="button" class="employee-button ${state.selectedEmployee?.id === emp.id ? "selected" : ""}" data-emp-id="${escapeHtml(emp.id)}">
        ${avatarMarkup(emp)}
        <span class="employee-meta">
          <span class="employee-name">${escapeHtml(emp.name)}</span>
          <span class="employee-sub">${escapeHtml(emp.nick || "-")} · ${escapeHtml(emp.id)}${emp.type ? ` · ${escapeHtml(emp.type)}` : ""}</span>
        </span>
      </button>`).join("");
    list.querySelectorAll(".avatar-photo").forEach(img => {
      img.addEventListener("load", () => img.classList.add("loaded"));
      img.addEventListener("error", () => img.remove());
    });
    list.querySelectorAll("[data-emp-id]").forEach(btn => btn.addEventListener("click", () => selectEmployee(btn.dataset.empId)));
  }

  function selectEmployee(id) {
    state.selectedEmployee = state.employees.find(x => x.id === id) || null;
    if (!state.selectedEmployee) return;
    $("selectedName").textContent = state.selectedEmployee.name;
    $("selectedMeta").textContent = `${state.selectedEmployee.nick || "-"} · ${state.selectedEmployee.id}`;
    $("selectedPanel").classList.add("show");
    $("employeePicker").style.display = "none";
    updateReadiness();
    updateSubmitButton();
  }

  function clearSelectedEmployee() {
    state.selectedEmployee = null;
    $("selectedPanel").classList.remove("show");
    $("employeePicker").style.display = "block";
    $("employeeSearch").value = "";
    renderEmployees();
    updateReadiness();
    updateSubmitButton();
  }

  function setLogType(type) {
    state.logType = type;
    $("inButton").classList.toggle("active", type === "IN");
    $("outButton").classList.toggle("active", type === "OUT");
    updateSubmitButton();
  }

  async function startCamera() {
    if (state.stream) {
      stopCamera();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("อุปกรณ์นี้ไม่รองรับกล้อง", "กรุณาใช้ Safari หรือ Chrome เวอร์ชันล่าสุด", "error");
      return;
    }
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false
        });
      } catch (firstError) {
        if (firstError?.name !== "NotFoundError" && firstError?.name !== "OverconstrainedError") throw firstError;
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      state.stream = stream;
      $("video").srcObject = stream;
      $("video").style.display = "block";
      $("cameraPlaceholder").style.display = "none";
      $("cameraLive").classList.add("show");
      $("captureButton").disabled = false;
      $("cameraToggle").textContent = "ปิดกล้อง";
    } catch (error) {
      toast("เปิดกล้องไม่ได้", error.message, "error");
    }
  }

  function stopCamera() {
    if (state.stream) state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
    $("video").srcObject = null;
    $("video").style.display = "none";
    $("cameraPlaceholder").style.display = "grid";
    $("cameraLive").classList.remove("show");
    $("captureButton").disabled = true;
    $("cameraToggle").textContent = "เปิดกล้อง";
  }

  function capturePhoto() {
    const video = $("video");
    const canvas = $("canvas");
    const snapshot = $("snapshot");
    if (!video.videoWidth || !video.videoHeight) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1,0,0,1,0,0);
    const dataUrl = canvas.toDataURL("image/jpeg", .88);
    snapshot.src = dataUrl;
    snapshot.style.display = "block";
    video.style.display = "none";
    state.photoDataUrl = dataUrl;
    $("captureButton").textContent = "ถ่ายใหม่";
    $("cameraLive").classList.remove("show");
    updateReadiness();
    updateSubmitButton();
  }

  function retakeOrCapture() {
    if (!state.photoDataUrl) return capturePhoto();
    state.photoDataUrl = null;
    $("snapshot").style.display = "none";
    if (state.stream) {
      $("video").style.display = "block";
      $("cameraLive").classList.add("show");
    }
    $("captureButton").textContent = "ถ่ายรูป";
    updateReadiness();
    updateSubmitButton();
  }

  function compressImage(dataUrl, maxW, maxH, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function randomWriteToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  }

  function base64Part(dataUrl) {
    return String(dataUrl).split(",").pop();
  }

  async function uploadPhoto(dataUrl, filename, logId, writeToken) {
    const compressed = await compressImage(dataUrl, CONFIG.PHOTO_MAX_W, CONFIG.PHOTO_MAX_H, CONFIG.PHOTO_QUALITY);
    return apiPost({ action: "uploadPhoto", logId, writeToken, imageBase64: base64Part(compressed), filename });
  }

  async function getGps() {
    if (!navigator.geolocation) throw new Error("Geolocation is not supported");
    return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      reject,
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 30_000 }
    ));
  }

  async function warmGps() {
    try {
      state.gps = await getGps();
      updateReadiness();
    } catch (error) {
      console.warn("GPS warm-up failed", error);
      state.gps = null;
      updateReadiness();
    }
  }

  function updateReadiness() {
    const gps = $("gpsReady");
    gps.classList.toggle("good", !!state.gps);
    gps.classList.toggle("bad", !state.gps);
    gps.querySelector("strong").textContent = state.gps ? `พร้อม · ±${Math.round(state.gps.accuracy || 0)}m` : "ยังไม่พร้อม";

    const photo = $("photoReady");
    photo.classList.toggle("good", !!state.photoDataUrl);
    photo.classList.toggle("bad", !state.photoDataUrl);
    photo.querySelector("strong").textContent = state.photoDataUrl ? "ถ่ายแล้ว" : "ยังไม่มีรูป";

    const emp = $("employeeReady");
    emp.classList.toggle("good", !!state.selectedEmployee);
    emp.classList.toggle("bad", !state.selectedEmployee);
    emp.querySelector("strong").textContent = state.selectedEmployee ? state.selectedEmployee.nick || state.selectedEmployee.name : "ยังไม่ได้เลือก";
  }

  function updateSubmitButton() {
    const button = $("submitButton");
    const ready = !!(state.selectedLocation && state.selectedEmployee && state.photoDataUrl);
    button.disabled = !ready || state.submitting;
    button.className = `submit-button ${state.logType === "IN" ? "in" : "out"}`;
    button.textContent = state.submitting ? "กำลังบันทึก..." : `ลงชื่อ${state.logType === "IN" ? "เข้างาน" : "ออกงาน"}`;
  }

  function thaiClientDateTime(now) {
    return new Intl.DateTimeFormat("th-TH", {
      timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }).format(now);
  }

  async function submitAttendance(forceWrite = false, preserved = null) {
    if (!state.selectedLocation || !state.selectedEmployee || !state.photoDataUrl || state.submitting) return;
    state.submitting = true;
    updateSubmitButton();

    const now = preserved?.now || new Date();
    const logId = preserved?.logId || `LOG${now.getTime()}`;
    const photoSnapshot = preserved?.photoSnapshot || state.photoDataUrl;
    const employeeSnapshot = preserved?.employee || { ...state.selectedEmployee };
    const locationSnapshot = preserved?.location || { ...state.selectedLocation };
    const logTypeSnapshot = preserved?.logType || state.logType;
    const noteSnapshot = preserved?.note ?? $("note").value.trim();
    const writeToken = preserved?.writeToken || randomWriteToken();

    try {
      const gpsPromise = getGps().catch(() => state.gps || { lat: "", lng: "", accuracy: null });
      const result = await apiPost({
        action: "appendLog",
        logId,
        empId: employeeSnapshot.id,
        locId: locationSnapshot.id,
        logType: logTypeSnapshot,
        dateTime: thaiClientDateTime(now),
        todayStr: new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short" }).format(now),
        lat: "",
        lng: "",
        photoUrl: "",
        note: noteSnapshot,
        writeToken,
        forceWrite
      });

      if (result.isDup && !forceWrite) {
        state.pendingDuplicate = { now, logId, photoSnapshot, employee: employeeSnapshot, location: locationSnapshot, logType: logTypeSnapshot, note: noteSnapshot, writeToken };
        $("duplicateMessage").innerHTML = `<strong>${escapeHtml(employeeSnapshot.name)}</strong> มีการลงชื่อ${logTypeSnapshot === "IN" ? "เข้างาน" : "ออกงาน"}ที่ <strong>${escapeHtml(locationSnapshot.name)}</strong> วันนี้แล้ว ต้องการบันทึกซ้ำหรือไม่`;
        $("duplicateModal").classList.add("open");
        return;
      }

      state.submitting = false;
      updateSubmitButton();
      toast("บันทึกเวลาแล้ว", `${employeeSnapshot.name} · ${logTypeSnapshot === "IN" ? "เข้างาน" : "ออกงาน"}`, "success");

      uploadStatus(logId, employeeSnapshot.name, "กำลังอัปโหลดรูปและตำแหน่ง");
      resetForNextPerson();

      Promise.all([
        gpsPromise,
        uploadPhoto(photoSnapshot, `${logId}_${employeeSnapshot.id}.jpg`, logId, writeToken)
      ])
        .then(([gps, photo]) => {
          if (gps?.lat) state.gps = gps;
          updateReadiness();
          return apiPost({
            action: "updateLogPhoto",
            logId,
            writeToken,
            photoUrl: photo.viewUrl,
            storagePath: photo.storagePath,
            lat: gps?.lat ?? "",
            lng: gps?.lng ?? ""
          });
        })
        .then(() => finishUploadStatus(logId, true, "รูปและ GPS บันทึกเรียบร้อย"))
        .catch(error => {
          console.error(error);
          finishUploadStatus(logId, false, `บันทึกเวลาแล้ว แต่ข้อมูลเสริมอัปโหลดไม่สำเร็จ: ${error.message}`);
        });
    } catch (error) {
      console.error(error);
      toast("บันทึกไม่สำเร็จ", error.message, "error");
    } finally {
      if (!$("duplicateModal").classList.contains("open")) {
        state.submitting = false;
        updateSubmitButton();
      }
    }
  }

  function resetForNextPerson() {
    state.photoDataUrl = null;
    $("snapshot").style.display = "none";
    $("captureButton").textContent = "ถ่ายรูป";
    if (state.stream) {
      $("video").style.display = "block";
      $("cameraLive").classList.add("show");
    }
    $("note").value = "";
    clearSelectedEmployee();
    updateReadiness();
    updateSubmitButton();
  }

  function bindEvents() {
    $("themeMode").addEventListener("change", e => setThemePreference(e.target.value));
    $("locationSelect").addEventListener("change", e => setLocation(e.target.value));
    $("employeeSearch").addEventListener("input", renderEmployees);
    $("changeEmployee").addEventListener("click", clearSelectedEmployee);
    $("inButton").addEventListener("click", () => setLogType("IN"));
    $("outButton").addEventListener("click", () => setLogType("OUT"));
    $("cameraToggle").addEventListener("click", startCamera);
    $("captureButton").addEventListener("click", retakeOrCapture);
    $("submitButton").addEventListener("click", () => submitAttendance(false));

    $("duplicateCancel").addEventListener("click", () => {
      state.pendingDuplicate = null;
      state.submitting = false;
      $("duplicateModal").classList.remove("open");
      updateSubmitButton();
    });
    $("duplicateConfirm").addEventListener("click", async () => {
      const data = state.pendingDuplicate;
      state.pendingDuplicate = null;
      state.submitting = false;
      $("duplicateModal").classList.remove("open");
      if (data) await submitAttendance(true, data);
    });

    $("registerButton").addEventListener("click", () => { window.location.href = "login.html"; });

    $("duplicateModal").addEventListener("click", event => {
      if (event.target === $("duplicateModal")) {
        state.pendingDuplicate = null;
        state.submitting = false;
        $("duplicateModal").classList.remove("open");
        updateSubmitButton();
      }
    });
  }

  async function init() {
    applyTheme(localStorage.getItem(CONFIG.THEME_KEY) || "system");
    bindEvents();
    updateClock();
    setInterval(updateClock, 1000);
    updateReadiness();
    updateSubmitButton();
    loadCoreData();
    warmGps();
  }

  init();