const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  spark: "M12 2c1 6 4 9 10 10-6 1-9 4-10 10-1-6-4-9-10-10 6-1 9-4 10-10Z",
  home: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  class: "M3 4h18v14H3z M7 22h10 M12 18v4 M7 8h10 M7 12h6",
  message:
    "M21 11a8 8 0 0 1-8 8H6l-4 3V11a8 8 0 0 1 8-8h3a8 8 0 0 1 8 8Z M7 9h9 M7 13h6",
  calendar:
    "M5 3v4 M19 3v4 M3 10h18 M4 5h16a1 1 0 0 1 1 1v15H3V6a1 1 0 0 1 1-1Z M7 14h2 M13 14h2 M7 18h2",
  task: "M9 3h6v4H9z M9 5H5v16h14V5h-4 M8 12l2 2 5-5 M8 18h7",
  chart: "M4 3v18h17 M8 16v-5 M13 16V7 M18 16v-9",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  profile:
    "M20 21v-2a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v2 M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  search: "m21 21-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 10h18c0-3-3-3-3-10 M9 21h6",
  arrow: "M4 12h16 m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  back: "m14 5-7 7 7 7",
  plus: "M12 4v16 M4 12h16",
  close: "m6 6 12 12 M18 6 6 18",
  send: "m22 2-7 20-4-9L2 9 22 2Z M11 13 22 2",
  book: "M12 6v15 M12 6C8 3 4 3 2 4v16c3-1 6-1 10 1 4-2 7-2 10-1V4c-2-1-6-1-10 2Z",
  check: "m5 12 4 4L19 6",
  clock: "M12 8v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  logout: "M9 4H4v16h5 M9 12h12 m-4-4 4 4-4 4",
  file: "M14 2H4v20h16V8l-6-6Z M14 2v6h6 M8 13h8 M8 17h5",
  download: "M12 3v12 m-5-5 5 5 5-5 M4 17v4h16v-4",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  shield: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Z m-4 10 3 3 5-6",
  link: "m10 13 4-4 M7 15l-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0 M14 9l2-2a3 3 0 0 1 4 4l-5 5a3 3 0 0 1-4 0",
  flower:
    "M12 8c-8-9-14 1-7 4-8 6 1 12 7 4 6 8 15 2 7-4 7-3 1-13-7-4Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  star: "m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z",
  heart: "M20 4a6 6 0 0 0-8 1 6 6 0 0 0-8-1c-6 5 0 12 8 17 8-5 14-12 8-17Z",
};
function icon(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.book}"/></svg>`;
}
function art(name, size = 90) {
  let shapes = {
    flower:
      '<path d="M50 32C20-5 5 36 32 50 1 74 33 99 50 68 73 100 100 69 68 50 101 26 68-2 50 32Z" fill="#bf819f" stroke="#9c6685" stroke-width="1.3"/><circle cx="50" cy="50" r="13" fill="#f6e9a8" stroke="#bfae77"/><path d="m44 48 2 2m8-2 2 2m-9 5q4 4 8-1" stroke="#8d704d" fill="none"/>',
    orbit:
      '<circle cx="50" cy="50" r="15" fill="#baa5d8" stroke="#836499"/><g fill="none" stroke="#9077ac" stroke-width="1.6"><ellipse cx="50" cy="50" rx="42" ry="17" transform="rotate(25 50 50)"/><ellipse cx="50" cy="50" rx="42" ry="17" transform="rotate(90 50 50)"/><ellipse cx="50" cy="50" rx="42" ry="17" transform="rotate(-30 50 50)"/></g><circle cx="22" cy="24" r="4" fill="#8b6ca5"/><circle cx="70" cy="70" r="4" fill="#8b6ca5"/>',
    leaf: '<path d="M48 89V44 M48 65C20 65 18 42 22 27c28 2 30 19 26 38Z M48 49C47 23 65 13 81 13c6 27-12 39-33 36Z M48 79c2-26 18-31 32-29 0 26-16 33-32 29Z" fill="#a5ba87" stroke="#6f8959" stroke-width="1.5"/><path d="m28 36 20 29m22-42L48 49m22 12L48 79" stroke="#738b5e" fill="none"/>',
    sun: '<circle cx="50" cy="50" r="24" fill="#e8b775" stroke="#b88858"/><g stroke="#bd925e" stroke-width="2"><path d="M50 4v14 M50 82v14 M4 50h14 M82 50h14 M17 17l10 10 M73 73l10 10 M17 83l10-10 M73 27l10-10"/></g><path d="M41 49v3 M59 49v3 M42 59q8 7 16 0" stroke="#9b7454" stroke-width="2" fill="none"/>',
    star: '<path d="m50 8 12 27 30 4-22 20 6 31-26-15-27 15 7-31L8 39l30-4Z" fill="#a1bfd4" stroke="#6f92af" stroke-width="1.5"/><path d="M42 46v4 M58 46v4 M43 56q7 6 14 0" stroke="#64859a" stroke-width="2" fill="none"/>',
    spark:
      '<path d="M50 5c3 30 15 43 45 45-30 3-43 15-45 45C47 65 35 52 5 50c30-3 42-15 45-45Z" fill="#d4b369" stroke="#ae944e" stroke-width="1.5"/><path d="M81 8c1 10 5 14 15 15-10 1-14 5-15 15-1-10-5-14-15-15 10-1 14-5 15-15Z" fill="#bd98b2"/>',
  };
  return `<svg class="illustration" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" aria-hidden="true">${shapes[name] || shapes.flower}</svg>`;
}
const roleNames = {
  student: "Estudiante",
  teacher: "Profesor",
  admin: "Administrador",
};
let S = null,
  view = "home",
  currentCourse = null,
  tab = "wall",
  taskFilter = "pending",
  thread = null,
  calMonth = new Date(),
  selectedDay = null,
  searchQuery = "",
  menuOpen = false;
let taskCourse = "all",
  taskSort = "due",
  courseQuery = "",
  favoritesOnly = false,
  peopleQuery = "",
  peopleRole = "all",
  threadQuery = "",
  lastETag = "",
  requestEpoch = 0,
  pendingRequests = 0,
  syncStatus = "online",
  toastTimer,
  dirtyForm = false,
  modalBusy = false,
  pollTimer;
const indexMaps = {
  people: new Map(),
  courses: new Map(),
  tasks: new Map(),
  submissions: new Map(),
};
function reindex() {
  indexMaps.people = new Map(S.people.map((p) => [p.id, p]));
  indexMaps.courses = new Map(S.courses.map((c) => [c.id, c]));
  indexMaps.tasks = new Map(S.tasks.map((t) => [t.id, t]));
  indexMaps.submissions = new Map(
    S.submissions.filter((s) => s.student === S.me.id).map((s) => [s.task, s]),
  );
}
const person = (id) => indexMaps.people.get(id),
  course = (id) => indexMaps.courses.get(id);
const avatar = (p, large = false) =>
  p?.avatar && p.avatar !== "initials"
    ? `<span class="avatar ${esc(p.color || "pink")} illustrated-avatar ${large ? "large" : ""}">${art(p.avatar, large ? 65 : 27)}</span>`
    : `<span class="avatar ${esc(p?.color || "pink")}" ${large ? 'style="width:85px;height:85px;font-size:26px"' : ""}>${esc(
        (p?.name || "?")
          .split(" ")
          .slice(0, 2)
          .map((n) => n[0])
          .join(""),
      )}</span>`;
const dateFormat = (d, opts = { day: "numeric", month: "short" }) =>
  new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("es-CR", {
    timeZone: "America/Costa_Rica",
    ...opts,
  });
const todayISO = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Costa_Rica" });
const submission = (t) => indexMaps.submissions.get(t.id);
const pending = () => S.tasks.filter((t) => !submission(t) && !t.closed);
const unread = () =>
  S.messages.filter((m) => m.recipient === S.me.id && !m.read).length;
const can = (permission) => {
  const module = {
    "grades.manage": "grades",
    "materials.manage": "materials",
    "attendance.manage": "attendance",
    "events.manage": "calendar",
    "teaching.customize": "studio",
    "messages.use": "messages",
    "wall.participate": "wall",
  }[permission];
  return (
    !!S?.me.permissions?.includes(permission) &&
    (!module || moduleEnabled(module))
  );
};
const staff = () => can("assignments.manage");
const csrf = () =>
  decodeURIComponent(
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrftoken="))
      ?.split("=")[1] || "",
  );
async function api(path, data, method = "POST", options = {}) {
  const form = data instanceof FormData,
    writing = method !== "GET";
  const epoch = writing ? ++requestEpoch : requestEpoch;
  if (!options.background) setLoading(1);
  try {
    let res;
    if (form && options.onProgress) {
      res = await uploadRequest(path, data, options.onProgress);
    } else {
      const controller = new AbortController(),
        timer = setTimeout(() => controller.abort(), writing ? 45000 : 15000);
      try {
        res = await fetch("/api/" + path, {
          method,
          credentials: "same-origin",
          signal: controller.signal,
          headers: {
            "X-CSRFToken": csrf(),
            ...(form ? {} : { "Content-Type": "application/json" }),
            ...(!writing && path === "state" && lastETag
              ? { "If-None-Match": lastETag }
              : {}),
          },
          ...(writing
            ? { body: form ? data : JSON.stringify(data || {}) }
            : {}),
        });
      } finally {
        clearTimeout(timer);
      }
    }
    if (res.status === 304) {
      setSync("online");
      return S;
    }
    let result;
    try {
      result = await res.json();
    } catch {
      throw new Error(
        "El servidor no pudo completar la solicitud. Intenta de nuevo.",
      );
    }
    if (!res.ok) {
      const error = new Error(result.error || "Ocurrió un error.");
      error.status = res.status;
      throw error;
    }
    if (result.me && epoch === requestEpoch)
      lastETag = res.headers.get("ETag") || "";
    setSync("online");
    return result;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        "La solicitud tardó demasiado. Revisa tu conexión e intenta de nuevo.",
      );
    if (error instanceof TypeError || !navigator.onLine) {
      setSync("offline");
      throw new Error(
        "No hay conexión con el campus. Tu formulario sigue aquí; intenta de nuevo cuando vuelva.",
      );
    }
    throw error;
  } finally {
    if (!options.background) setLoading(-1);
  }
}
function uploadRequest(path, data, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/" + path);
    xhr.setRequestHeader("X-CSRFToken", csrf());
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      resolve({
        status: xhr.status,
        ok: xhr.status >= 200 && xhr.status < 300,
        headers: { get: (n) => xhr.getResponseHeader(n) },
        json: async () => JSON.parse(xhr.responseText),
      });
    xhr.onerror = () => reject(new TypeError("Network error"));
    xhr.ontimeout = () =>
      reject(
        new Error(
          "La carga tardó demasiado. Tu respuesta sigue aquí; vuelve a intentar.",
        ),
      );
    xhr.send(data);
  });
}
function setLoading(delta) {
  pendingRequests = Math.max(0, pendingRequests + delta);
  document.body.classList.toggle("is-loading", pendingRequests > 0);
  $("#network-progress")?.setAttribute("aria-hidden", String(!pendingRequests));
}
function setSync(status) {
  syncStatus = status;
  document.querySelectorAll(".sync-state").forEach((el) => {
    el.className = "sync-state " + status;
    el.textContent =
      status === "offline"
        ? "Sin conexión"
        : status === "retrying"
          ? "Reconectando…"
          : "Campus al día";
  });
}
function busy(button, on, label = "Guardando…") {
  if (!button) return;
  const form = button.closest("form");
  if (form) {
    form.inert = on;
    form.setAttribute("aria-busy", String(on));
  }
  if (on) {
    button.dataset.previous = button.innerHTML;
    button.innerHTML = '<span class="spinner"></span>' + label;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  } else {
    button.innerHTML = button.dataset.previous || button.innerHTML;
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}
function modalPending(on) {
  modalBusy = on;
  $(".modal")?.setAttribute("aria-busy", String(on));
  $$(".modal [data-close]").forEach((b) => (b.disabled = on));
}
function clearDirty() {
  dirtyForm = false;
}
function canNavigate() {
  if (modalBusy) return false;
  if (
    dirtyForm &&
    !confirm("Tienes cambios sin guardar. ¿Quieres salir de esta pantalla?")
  )
    return false;
  clearDirty();
  return true;
}

function toast(msg) {
  clearTimeout(toastTimer);
  $("#toast").textContent = msg;
  $("#toast").classList.add("show");
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4200);
}

function heroArt() {
  return `<div class="hero-art"><div class="art-star">${art("spark", 45)}</div><div class="book"></div><div class="art-flower">${art("flower", 85)}</div><div class="sticker">stay<br>curious ✦</div><div class="art-small">${art("spark", 28)}</div></div>`;
}
function brand() {
  const i = institutionData();
  if (i.logo || i.short_name !== "luma")
    return `<div class="brand institution-brand">${i.logo ? `<img src="${esc(i.logo)}" alt="Logo de ${esc(i.name)}">` : art("flower", 38)}<div>${esc(i.short_name)}<small>CAMPUS</small></div></div>`;
  return `<div class="brand">${art("flower", 38)}<div>luma<span style="font-weight:400">.</span><small>CAMPUS</small></div></div>`;
}
function loginPage() {
  resetAI();
  clearTimeout(pollTimer);
  pollingView = null;
  S = null;
  lastETag = "";
  clearDirty();
  applyAppearance();
  document.title = institutionData().name + " · Acceso";
  $("#app").innerHTML =
    `<main class="login"><section class="login-art">${brand()}<div><div class="eyebrow">TU ESCUELA. TU MUNDO.</div><h1>Un lugar para<br>aprender y <em>florecer.</em></h1><p>De casa al aula, y del aula a tus sueños.<br>Todo lo que necesitas, cerquita de ti.</p></div>${heroArt()}<div class="login-bottom">Hecho para conectar personas e ideas. ✦ Luma Campus</div></section><section class="login-form-area"><div class="login-box"><div class="eyebrow">QUÉ BONITO TENERTE AQUÍ</div><h2>Bienvenido a tu campus 🌷</h2><p>${esc(institutionData().name)} · ${esc(institutionData().motto)}</p><form id="login-form"><div class="login-error" role="alert"></div><div class="form-field"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" placeholder="tu.nombre@colegio.edu" required autocomplete="username"></div><div class="form-field"><label for="password">Contraseña</label><div class="password-wrap"><input id="password" name="password" type="password" placeholder="Tu contraseña" required autocomplete="current-password"><button type="button" id="toggle-password" aria-label="Mostrar contraseña">Mostrar</button></div></div><button class="btn primary" type="submit">Entrar a mi campus ${icon("arrow", 15)}</button></form><div class="demo-divider">EXPLORA EL CAMPUS DE DEMOSTRACIÓN</div><div class="demo-roles"><button class="demo-role" data-demo="student">${icon("book", 22)}Estudiante</button><button class="demo-role" data-demo="teacher">${icon("class", 22)}Profesor</button><button class="demo-role" data-demo="admin">${icon("shield", 22)}Administrador</button></div><p class="demo-caption">Las cuentas de prueba te permiten explorar los tres roles con datos de ejemplo. Tus cambios se guardan en esta instalación.</p></div></section></main>`;
  $("#toggle-password").onclick = () => {
    const input = $("#password"),
      b = $("#toggle-password");
    input.type = input.type === "password" ? "text" : "password";
    b.textContent = input.type === "password" ? "Mostrar" : "Ocultar";
    b.setAttribute(
      "aria-label",
      input.type === "password" ? "Mostrar contraseña" : "Ocultar contraseña",
    );
  };
  $("#login-form").onsubmit = async (e) => {
    e.preventDefault();
    await signIn(Object.fromEntries(new FormData(e.target)), e.submitter);
  };
  $$("[data-demo]").forEach(
    (b) =>
      (b.onclick = () =>
        signIn(
          {
            email: {
              student: "estudiante@luma.demo",
              teacher: "profe@luma.demo",
              admin: "admin@luma.demo",
            }[b.dataset.demo],
            password: "LumaDemo2026!",
          },
          b,
        )),
  );
}
async function signIn(data, b) {
  busy(b, true, "Entrando…");
  $$("[data-demo]").forEach((el) => (el.disabled = true));
  try {
    S = await api("login", data);
    view = "home";
    resetStudentUi();
    resetAI();
    thread = null;
    clearDirty();
    render();
  } catch (e) {
    $(".login-error").style.display = "block";
    $(".login-error").textContent = e.message;
  } finally {
    busy(b, false);
    $$("[data-demo]").forEach((el) => (el.disabled = false));
  }
}
function navButton(id, label, name) {
  if (!moduleEnabled(id)) return "";
  label = esc(moduleLabel(id, label));
  return `<button data-view="${id}" class="${view === id ? "active" : ""}">${icon(name)}${label}${id === "messages" && unread() ? `<span class="count">${unread()}</span>` : ""}${id === "tasks" && S.me.role === "student" ? `<span class="count">${pending().length}</span>` : ""}</button>`;
}
function render(options = {}) {
  if (!S) return loginPage();
  if (pollingView !== view) {
    pollingView = view;
    clearTimeout(pollTimer);
    pollTimer = setTimeout(poll, view === "messages" ? 6000 : 20000);
  }
  reindex();
  publicInstitution = S.institution;
  if (!moduleEnabled(view)) view = "home";
  const tabModule = {
    resources: "materials",
    wall: "wall",
    attendance: "attendance",
  }[tab];
  if (tabModule && !moduleEnabled(tabModule)) tab = "work";
  applyAppearance();
  if (currentCourse && !course(currentCourse)) currentCourse = null;
  const oldScroll = window.scrollY,
    active = document.activeElement,
    focusKey = active?.id || (active?.name ? `[name="${active.name}"]` : null),
    caret = active?.selectionStart;
  const oldChat = $(".chat-body"),
    chatTop = oldChat?.scrollTop || 0,
    wasNearBottom =
      !oldChat ||
      oldChat.scrollHeight - oldChat.scrollTop - oldChat.clientHeight < 70;
  let labels = {
    ai: "Luma AI",
    student: "Mi espacio",
    support: "Acompañamiento",
    studio: "Mi estudio docente",
    home: "Mi inicio",
    classroom: "Classroom",
    tasks: "Mis tareas",
    messages: "Mensajería",
    calendar: "Calendario",
    grades: "Calificaciones",
    profile: "Mi perfil",
    admin: "Administración",
    search: "Buscar",
  };
  $("#app").innerHTML =
    `<div class="shell"><button class="sidebar-scrim ${menuOpen ? "open" : ""}" aria-label="Cerrar menú" data-action="menu"></button><aside class="sidebar ${menuOpen ? "open" : ""}">${brand()}<div class="school-pill">${icon("class", 20)}<div>${esc(institutionData().name)}<span>Curso lectivo · ${esc(institutionData().year)}</span></div></div><div class="nav-label">MI CAMPUS</div><nav class="nav">${navButton("home", "Mi inicio", "home")}${S.me.role === "student" ? navButton("student", "Mi espacio", "flower") + navButton("ai", "Luma AI", "spark") : ""}${S.me.role === "teacher" ? navButton("support", "Acompañamiento", "heart") : ""}${navButton("classroom", "Classroom", "class")}${can("teaching.customize") ? navButton("studio", "Mi estudio", "flower") : ""}${navButton("tasks", staff() ? "Actividades" : "Mis tareas", "task")}${navButton("messages", "Mensajería", "message")}${navButton("calendar", "Calendario", "calendar")}${navButton("grades", "Calificaciones", "chart")}${S.me.role === "admin" ? navButton("admin", "Administración", "users") : ""}</nav><div class="sidebar-bottom"><div class="little-note"><span class="sparkle">✧</span>${art("flower", 32)}<strong>A tu ritmo, a tu manera.</strong>Cada pequeño paso también<br>cuenta. Sigue floreciendo.</div><button class="side-profile" data-view="profile" style="background:none;width:100%;text-align:left">${avatar(S.me)}<div><strong>${esc(S.me.name)}</strong><small>${roleNames[S.me.role]} · Luma Campus</small></div>${icon("chevron", 13)}</button></div></aside><main class="main"><header class="topbar"><button class="icon-btn mobile-toggle" data-action="menu" aria-label="Abrir menú">${icon("menu")}</button><div class="breadcrumb">Mi campus ${icon("chevron", 11)} <strong>${labels[view] || "Mi inicio"}</strong></div><div class="top-actions"><form class="search" id="search-form">${icon("search", 15)}<input name="q" placeholder="Busca en tu campus..." aria-label="Buscar" value="${esc(searchQuery)}"><span style="font-size:9px">↵</span></form><button class="icon-btn" data-action="notifications" aria-label="Notificaciones">${icon("bell", 17)}${notificationItems().length ? '<span class="dot"></span>' : ""}</button><button class="icon-btn" data-view="profile" aria-label="Mi perfil" style="border:0">${avatar(S.me)}</button></div></header>${S.me.email.endsWith("@luma.demo") ? `<div class="demo-banner"><span>✦ Campus de demostración · ${roleNames[S.me.role]} · Datos de ejemplo</span><button data-action="logout">Cambiar de cuenta</button></div>` : ""}<div class="content" id="main-content" tabindex="-1">${renderContent()}<footer class="footer"><span>Un lugar para aprender, conectar y crecer. ✦</span><span class="sync-state ${syncStatus}">${syncStatus === "offline" ? "Sin conexión" : "Campus al día"}</span><span>Luma Campus · ${new Date().getFullYear()}</span></footer></div></main></div>`;
  bind();
  bindEnhanced();
  bindTeaching();
  bindAdministration();
  bindStudent();
  bindAI();
  document.title =
    (labels[view] || "Mi inicio") + " · " + institutionData().name;
  syncRoute();
  if (view === "messages")
    $(".chat-body")?.scrollTo(
      0,
      options.preserve && !wasNearBottom ? chatTop : 999999,
    );
  if (options.preserve) {
    window.scrollTo(0, oldScroll);
    if (focusKey) {
      const el = focusKey.startsWith("[")
        ? $(focusKey)
        : document.getElementById(focusKey);
      if (el) {
        el.focus({ preventScroll: true });
        if (typeof caret === "number")
          try {
            el.setSelectionRange(caret, caret);
          } catch {}
      }
    }
  }
}
function heading(title, subtitle, action = "") {
  return `<div class="page-heading"><div><div class="eyebrow">TU PEQUEÑO GRAN MUNDO</div><h1>${title}</h1><p>${subtitle}</p></div>${action || `<div class="date-chip">${icon("calendar", 14)}${dateFormat(todayISO(), { weekday: "short", day: "numeric", month: "long" })}</div>`}</div>`;
}
function renderContent() {
  return (
    {
      ai: aiWorkspace,
      student: studentWorkspace,
      support: teacherLearningInbox,
      studio: teacherStudio,
      home: home,
      classroom: classroom,
      tasks: tasks,
      messages: messages,
      calendar: calendar,
      grades: grades,
      profile: profile,
      admin: admin,
      search: search,
    }[view]?.() || home()
  );
}
function stat(value, label, name, color) {
  return `<div class="stat"><div class="stat-icon ${color}">${icon(name, 19)}</div><div><strong>${value}</strong><small>${label}</small></div></div>`;
}
function stats() {
  let marks = S.submissions.filter((s) => s.grade !== null),
    avg = marks.length
      ? Math.round(
          marks.reduce(
            (a, s) => a + (s.grade / indexMaps.tasks.get(s.task).points) * 100,
            0,
          ) / marks.length,
        )
      : "—";
  let att = S.attendance.length
    ? Math.round(
        (S.attendance.filter((a) => a.present).length / S.attendance.length) *
          100,
      ) + "%"
    : "—";
  return `<div class="stats">${stat(S.courses.length, "Aulas activas", "book", "purple")}${stat(staff() ? S.submissions.filter((s) => s.grade === null).length : pending().length, staff() ? "Por calificar" : "Tareas pendientes", "task", "peach")}${stat(avg === "—" ? avg : avg + "%", staff() ? "Promedio del campus" : "Mi promedio", "chart", "green")}${stat(staff() ? S.people.filter((p) => p.role === "student").length : att, staff() ? "Estudiantes" : "Asistencia", "users", "pink")}</div>`;
}
function courseCard(c, full = false) {
  const all = S.tasks.filter((t) => t.course === c.id),
    done = all.filter((t) => submission(t)).length,
    n = all.filter((t) => !t.closed && (staff() || !submission(t))).length,
    fav = S.me.preferences?.favorites?.includes(c.id);
  return `<article class="course-card"><button class="course-open" data-course="${c.id}" aria-label="Abrir aula ${esc(c.title)}"><div class="course-cover ${esc(c.color)}"><span class="class-code">${esc(c.code)} · ${esc(c.room)}</span>${art(c.symbol)}<span class="decor">✦</span></div><div class="course-info"><h3>${esc(c.title)}</h3><div class="teacher">${esc(person(c.teacher)?.name || "Profesor")}</div>${full ? `<p>${esc(c.summary)}</p><p>${icon("clock", 12)} ${esc(c.schedule || "Horario por confirmar")}</p>` : ""}${!staff() ? `<div class="course-progress"><div><span>Mi recorrido</span><strong>${done}/${all.length}</strong></div><div class="progress"><i style="width:${all.length ? (done / all.length) * 100 : 0}%"></i></div></div>` : ""}<div class="course-footer"><div class="tiny-avatars">${c.students
    .slice(0, 3)
    .map((id) => `<span>${esc(person(id)?.name[0] || "?")}</span>`)
    .join(
      "",
    )}<span style="background:#f0ece7">${c.students.length}</span></div><span>${n} ${n === 1 ? "actividad" : "actividades"} ${icon("arrow", 11)}</span></div></div></button><button class="favorite-btn ${fav ? "saved" : ""}" data-favorite="${c.id}" aria-label="${fav ? "Quitar de favoritas" : "Marcar aula favorita"}: ${esc(c.title)}" aria-pressed="${!!fav}">${icon("heart", 14)}</button></article>`;
}

function home() {
  if (S.me.role === "student") return studentHome();
  let list = staff()
    ? S.tasks.filter((t) =>
        S.submissions.some((s) => s.task === t.id && s.grade === null),
      )
    : pending();
  if (staff() && !list.length) list = S.tasks;
  return `${heading(`Hola, ${esc(S.me.name.split(" ")[0])} <span style="font-size:24px">✳</span>`, "Un nuevo día, un montón de posibilidades. ¡Vamos a hacerlo bonito!")}<section class="hero"><div class="hero-copy"><span class="mini-tag">✦ ESTE ES TU ESPACIO</span><h2>Pequeños pasos.<br><em>Grandes descubrimientos.</em></h2><p>Tu próxima idea favorita puede estar a una clase de distancia.</p><button class="btn primary" data-view="classroom">Vamos a mis aulas ${icon("arrow", 14)}</button></div>${heroArt()}</section>${institutionSections()}${stats()}${dashboardActions()}<div class="dashboard-grid"><div><div class="section-head"><h2>Mis aulas <small>Un mundo por descubrir</small></h2><button class="link-btn" data-view="classroom">Ver todas ${icon("arrow", 12)}</button></div><div class="courses-grid">${
    sortedCourses()
      .slice(0, 6)
      .map((c) => courseCard(c))
      .join("") || empty("Todavía no tienes aulas asignadas.")
  }</div><section class="community"><div><span class="label">LA VIDA EN EL CAMPUS</span><h3>Las mejores ideas se comparten 💛</h3><p>Conecta con tus compañeros y sé parte de algo bonito.</p></div><div class="community-art">${art("flower", 45)}${art("spark", 30)}</div><button class="btn small" data-view="messages">Conectar ${icon("arrow", 12)}</button></section></div><div class="dashboard-right"><section class="panel"><div class="section-head"><h2>${staff() ? "Por revisar" : "Por hacer"} <span style="font-size:13px">✎</span></h2><span class="badge">${list.length}</span></div>${
    list
      .slice(0, 3)
      .map(
        (t) =>
          `<button class="todo-row" data-task="${t.id}"><span class="todo-icon ${course(t.course)?.color || "pink"}">${icon("file", 15)}</span><div><strong>${esc(t.title)}</strong><small>${esc(course(t.course)?.title)}</small><span class="due ${t.due <= todayISO() ? "urgent" : ""}">${t.due < todayISO() ? "Fecha pasada · " : ""}${dateFormat(t.due)}</span></div></button>`,
      )
      .join("") || '<div class="empty">Todo al día. ¡Bien hecho! ✦</div>'
  }<button class="all-tasks" data-view="tasks">Ver mis actividades ${icon("arrow", 11)}</button></section>${miniCalendar()}</div></div>`;
}
function empty(message) {
  return `<div class="empty">${icon("book", 30)}<br>${message}</div>`;
}
function classroom() {
  if (currentCourse) {
    let c = course(currentCourse);
    if (!c) {
      currentCourse = null;
      return classroom();
    }
    return `<button class="link-btn" data-action="back-class" style="margin-bottom:18px">${icon("back", 12)} Todas mis aulas</button><section class="class-banner ${c.color}"><div><span class="class-code">${esc(c.code)} · ${esc(c.room)}</span><h1>${esc(c.title)}</h1><p>${esc(c.summary)}</p><p style="margin-top:12px">${icon("profile", 13)} ${esc(person(c.teacher)?.name)} &nbsp; ${icon("clock", 13)} ${esc(c.schedule)}</p></div>${art(c.symbol, 120)}</section>${staff() ? `<div class="class-tools"><button class="btn small" data-timetable="${c.id}">Horario semanal</button></div>` : ""}${S.me.role === "admin" ? `<div class="class-tools"><button class="btn small" data-edit-course="${c.id}">${icon("profile", 13)} Editar aula</button></div>` : ""}<div class="tabs" role="tablist" aria-label="Secciones del aula">${[
      ["wall", "Muro del aula"],
      ["work", "Actividades"],
      ["resources", "Materiales"],
      ["people", "Personas"],
      ["attendance", "Asistencia"],
    ]
      .filter(([id]) =>
        moduleEnabled(
          { resources: "materials", wall: "wall", attendance: "attendance" }[
            id
          ] || id,
        ),
      )
      .map(
        ([id, name]) =>
          `<button role="tab" aria-selected="${tab === id}" data-tab="${id}" class="${tab === id ? "active" : ""}">${esc(moduleLabel({ resources: "materials", wall: "wall", attendance: "attendance", work: "tasks" }[id] || id, name))}</button>`,
      )
      .join("")}</div>${classTab(c)}`;
  }
  return `${heading("Mis aulas, mis mundos ✦", "Todo lo que estás aprendiendo, en un mismo lugar.", S.me.role === "admin" ? '<button class="btn primary" data-action="new-course">' + icon("plus", 14) + " Crear aula</button>" : "")}${courseToolbar()}<div class="courses-grid full-grid">${
    sortedCourses()
      .filter(
        (c) =>
          (!favoritesOnly || S.me.preferences?.favorites?.includes(c.id)) &&
          normalize(c.title + " " + c.code).includes(normalize(courseQuery)),
      )
      .map((c) => courseCard(c, true))
      .join("") ||
    empty(
      courseQuery || favoritesOnly
        ? "No hay aulas con estos filtros. Prueba otra búsqueda."
        : "Administración puede asignarte nuevas aulas.",
    )
  }</div>`;
}
function classTab(c) {
  if (c.archived && tab === "wall")
    return empty(
      "Materia archivada: sus publicaciones y datos se conservan. Restaura la materia desde Administración para continuar.",
    );
  if (tab === "wall")
    return `<div class="feed"><form id="post-form" class="panel composer">${avatar(S.me)}<textarea name="body" placeholder="Comparte una idea o una pregunta con tu aula..." aria-label="Publicación" required maxlength="4000"></textarea><button class="btn primary">Publicar ${icon("send", 13)}</button></form>${S.posts
      .filter((p) => p.course === c.id)
      .map(
        (p) =>
          `<article class="panel post ${p.pinned ? "pinned-post" : ""}">${p.pinned ? '<div class="pinned-label">✦ Destacado por tu profesor</div>' : ""}<div class="post-head">${avatar(person(p.author))}<div><strong>${esc(person(p.author)?.name)}</strong><small>${roleNames[person(p.author)?.role]} · ${dateFormat(p.created)}</small></div></div><p>${esc(p.body)}</p><div class="post-actions">${p.author === S.me.id || staff() ? `<button class="link-btn" data-edit-post="${p.id}">Editar</button><button class="link-btn danger" data-delete-post="${p.id}">Eliminar</button>` : ""}${staff() ? `<button class="link-btn" data-pin-post="${p.id}">${p.pinned ? "Quitar destacado" : "Destacar"}</button>` : ""}</div></article>`,
      )
      .join("")}</div>`;
  if (tab === "work")
    return `<div class="section-head"><h2>Actividades del aula</h2>${staff() ? '<button class="btn primary small" data-action="new-task">' + icon("plus", 13) + " Nueva actividad</button>" : ""}</div><div class="task-list">${
      S.tasks
        .filter((t) => t.course === c.id)
        .map(taskRow)
        .join("") || empty("Tu aula todavía no tiene actividades.")
    }</div>`;
  if (tab === "resources")
    return `<div class="section-head"><h2>Tu biblioteca de materiales</h2>${staff() ? '<button class="btn primary small" data-action="new-resource">' + icon("plus", 13) + " Añadir material</button>" : ""}</div>${
      S.resources
        .filter((r) => r.course_id === c.id)
        .map(
          (r) =>
            `<button class="panel resource-card" data-resource="${r.id}"><span class="todo-icon ${c.color}">${icon("book")}</span><div><h3>${esc(r.title)}</h3><p>${r.file ? esc(r.file) : r.url ? "Enlace de estudio" : "Guía de estudio · Material del aula"}</p></div>${icon("arrow", 15)}</button>`,
        )
        .join("") || empty("Todavía no hay materiales compartidos.")
    }`;
  if (tab === "people")
    return `<div class="section-head"><h2>Nuestra pequeña comunidad</h2>${S.me.role === "admin" ? '<button class="btn small" data-action="membership">Gestionar matrículas</button>' : ""}</div><div class="table-wrap"><table><thead><tr><th>Persona</th><th>Rol</th><th>Correo</th><th></th></tr></thead><tbody>${[
      c.teacher,
      ...c.students,
    ]
      .map((id) => person(id))
      .filter(Boolean)
      .map(
        (p) =>
          `<tr><td>${avatar(p)}${esc(p.name)}</td><td><span class="badge">${roleNames[p.role]}</span></td><td>${esc(p.email)}</td><td>${p.id !== S.me.id ? `<button class="link-btn" data-message-to="${p.id}">${icon("message", 14)} Escribir</button>` : ""}</td></tr>`,
      )
      .join("")}</tbody></table></div>`;
  if (tab === "attendance") {
    let rows = S.attendance.filter((a) => a.course_id === c.id);
    return `<div class="section-head"><h2>Asistencia ${staff() ? "del aula" : "personal"}</h2>${staff() ? '<button class="btn primary small" data-action="take-attendance">' + icon("check", 13) + " Tomar asistencia</button>" : ""}</div><div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Estudiante</th><th>Estado</th></tr></thead><tbody>${
      rows
        .sort((a, b) => b.date.localeCompare(a.date))
        .map(
          (a) =>
            `<tr><td>${dateFormat(a.date)}</td><td>${esc(person(a.student_id)?.name)}</td><td><span class="badge ${a.present ? "done" : "failed"}">${a.present ? "Presente" : "Ausente"}</span></td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="3">Aún no hay registros de asistencia.</td></tr>'
    }</tbody></table></div>`;
  }
}
function status(t) {
  const s = submission(t);
  if (s?.grade != null) return '<span class="badge done">Calificada</span>';
  if (s) return '<span class="badge wait">Entregada</span>';
  if (t.closed) return '<span class="badge closed">Cerrada</span>';
  if (t.due < todayISO()) return '<span class="badge failed">Atrasada</span>';
  if (S.drafts?.some((d) => d.task_id === t.id))
    return '<span class="badge draft">Borrador</span>';
  return '<span class="badge">Pendiente</span>';
}

function taskRow(t) {
  let c = course(t.course),
    s = submission(t),
    ss = S.submissions.filter((s) => s.task === t.id),
    late = !s && !t.closed && t.due < todayISO();
  return `<article class="task-item ${late ? "is-overdue" : ""}"><span class="stat-icon ${esc(t.color || c?.color || "pink")}">${icon("file", 20)}</span><div class="task-text"><h3>${esc(t.title)}</h3><p>${esc(c?.title)} · ${dueLabel(t.due)} · ${t.points} puntos</p>${staff() ? `<div class="task-meta">${ss.length}/${c?.students.length || 0} entregas · ${ss.filter((s) => s.grade == null).length} por revisar</div>` : ""}</div>${staff() ? `<span class="badge ${t.closed ? "closed" : ""}">${t.closed ? "Cerrada" : "Activa"}</span>` : status(t)}<button class="btn small" data-task="${t.id}">${staff() ? "Revisar" : s ? "Ver entrega" : t.closed ? "Ver actividad" : "Abrir actividad"} ${icon("arrow", 12)}</button>${staff() ? `<button class="icon-btn task-edit" data-edit-task="${t.id}" aria-label="Editar ${esc(t.title)}">${icon("profile", 14)}</button>` : ""}</article>`;
}

function tasks() {
  let list = S.tasks.filter(
    (t) => taskCourse === "all" || t.course === +taskCourse,
  );
  list = list.filter((t) => {
    const sub = submission(t);
    if (taskFilter === "all") return true;
    if (taskFilter === "late") return !t.closed && t.due < todayISO() && !sub;
    if (taskFilter === "closed") return t.closed;
    if (staff())
      return taskFilter === "done"
        ? t.closed
        : taskFilter === "review"
          ? S.submissions.some((s) => s.task === t.id && s.grade == null)
          : !t.closed;
    return taskFilter === "pending" ? !sub && !t.closed : !!sub;
  });
  list.sort((a, b) =>
    taskSort === "title"
      ? a.title.localeCompare(b.title, "es")
      : taskSort === "new"
        ? b.id - a.id
        : a.due.localeCompare(b.due),
  );
  const filters = staff()
    ? [
        ["pending", "Activas"],
        ["review", "Por revisar"],
        ["closed", "Cerradas"],
        ["all", "Todas"],
      ]
    : [
        ["pending", "Pendientes"],
        ["late", "Atrasadas"],
        ["done", "Entregadas"],
        ["all", "Todas"],
      ];
  return `${heading(staff() ? "Ideas que se convierten en actividades" : "Un paso a la vez ✎", staff() ? "Publica, organiza y acompaña cada avance de tus estudiantes." : "Tu próximo paso, más claro que nunca.", staff() ? '<button class="btn primary" data-action="new-task">' + icon("plus", 14) + " Nueva actividad</button>" : "")}<div class="toolbar task-toolbar"><div class="chips">${filters.map(([id, label]) => `<button class="chip ${taskFilter === id ? "active" : ""}" data-filter="${id}">${label}</button>`).join("")}</div><div class="toolbar-controls"><select id="task-course" aria-label="Filtrar actividades por aula"><option value="all">Todas las aulas</option>${S.courses.map((c) => `<option value="${c.id}" ${taskCourse == c.id ? "selected" : ""}>${esc(c.title)}</option>`).join("")}</select><select id="task-sort" aria-label="Ordenar actividades">${[
    ["due", "Próxima entrega"],
    ["new", "Más recientes"],
    ["title", "Nombre A → Z"],
  ]
    .map(
      ([id, name]) =>
        `<option value="${id}" ${taskSort === id ? "selected" : ""}>${name}</option>`,
    )
    .join(
      "",
    )}</select></div></div><div class="results-label">${list.length} ${list.length === 1 ? "actividad" : "actividades"}</div><div class="task-list">${list.map(taskRow).join("") || empty("No hay actividades con estos filtros. Tu próximo paso puede esperar un poquito. 🌷")}</div>`;
}

function messages() {
  const ms = S.messages,
    last = new Map(),
    counts = new Map();
  for (const m of ms) {
    const id = m.sender === S.me.id ? m.recipient : m.sender;
    last.set(id, m);
    if (m.recipient === S.me.id && !m.read)
      counts.set(id, (counts.get(id) || 0) + 1);
  }
  const people = S.people
    .filter((p) => p.id !== S.me.id)
    .sort((a, b) => (last.get(b.id)?.id || 0) - (last.get(a.id)?.id || 0));
  if (!thread)
    thread = ms.find((m) => m.recipient === S.me.id)?.sender || people[0]?.id;
  const p = person(thread),
    list = people.filter((p) =>
      normalize(p.name).includes(normalize(threadQuery)),
    ),
    chat = ms.filter(
      (m) =>
        (m.sender === S.me.id && m.recipient === thread) ||
        (m.recipient === S.me.id && m.sender === thread),
    );
  return `${heading("Conversaciones que conectan 💬", "Tu comunidad, a un mensaje de distancia.")}<div class="messages-layout"><aside class="threads"><div class="thread-heading"><h3>Personas de tu campus</h3><input id="thread-search" value="${esc(threadQuery)}" placeholder="Buscar persona…" aria-label="Buscar conversación"></div>${list.map((p) => `<button class="thread ${p.id === thread ? "active" : ""}" data-thread="${p.id}">${avatar(p)}<div><strong>${esc(p.name)}</strong><p>${esc(last.get(p.id)?.body || roleNames[p.role])}</p></div>${counts.get(p.id) ? `<span class="count">${counts.get(p.id)}</span>` : ""}</button>`).join("") || '<p class="thread-empty">No encontramos esa persona.</p>'}</aside><section class="chat">${p ? `<div class="chat-head">${avatar(p)}<div><strong>${esc(p.name)}</strong><small>${roleNames[p.role]} · ${esc(institutionData().name)}</small></div></div><div class="chat-body">${chat.map(messageBubble).join("") || empty("Una conversación puede empezar con un simple hola. ✦")}</div><form class="chat-form" id="message-form"><input name="body" placeholder="Escribe algo bonito…" required maxlength="4000" aria-label="Mensaje" autocomplete="off"><button class="btn primary" aria-label="Enviar mensaje">${icon("send", 18)}</button></form>` : empty("No hay destinatarios disponibles.")}</section></div>`;
}
function messageBubble(m) {
  return `<div class="bubble ${m.sender === S.me.id ? "mine" : ""}">${esc(m.body)}<small>${dateFormat(m.created)} · ${new Date(m.created).toLocaleTimeString("es-CR", { timeZone: "America/Costa_Rica", hour: "2-digit", minute: "2-digit" })}${m.sender === S.me.id ? ` · ${m.read ? "Leído ✓✓" : "Enviado ✓"}` : ""}</small></div>`;
}

function calendarCells(big = false) {
  let year = calMonth.getFullYear(),
    month = calMonth.getMonth(),
    days = new Date(year, month + 1, 0).getDate(),
    first = (new Date(year, month, 1).getDay() + 6) % 7;
  return `<div class="calendar-grid">${["L", "M", "M", "J", "V", "S", "D"].map((d) => `<span>${d}</span>`).join("")}${"<span></span>".repeat(first)}${Array.from(
    { length: days },
    (_, i) => {
      let iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
        events = S.events.filter((e) => e.date === iso);
      return `<button data-day="${iso}" class="${iso === todayISO() ? "today" : ""} ${events.length ? "has-event" : ""} ${selectedDay === iso ? "calendar-selected" : ""}" aria-label="${dateFormat(iso, { day: "numeric", month: "long" })}${events.length ? ", " + events.length + " eventos" : ""}">${i + 1}${big && events.length ? '<span style="display:block;font-size:8px;padding:0">✦</span>' : ""}</button>`;
    },
  ).join("")}</div>`;
}
function calendarHeader() {
  return `<div class="calendar-header"><span>${dateFormat(`${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}-01`, { month: "long", year: "numeric" })}</span><div><button class="link-btn" data-month="-1" aria-label="Mes anterior">${icon("back", 14)}</button> <button class="link-btn" data-month="1" aria-label="Mes siguiente">${icon("chevron", 14)}</button></div></div>`;
}
function miniCalendar() {
  let e = S.events.find((e) => e.date >= todayISO()) || S.events[0];
  return `<section class="panel calendar-panel">${calendarHeader()}${calendarCells()}${e ? `<button class="next-event" style="border-left:0;border-right:0;border-bottom:0;background:transparent;text-align:left;width:100%" data-event="${e.id}"><span class="event-date"><small>${dateFormat(e.date, { month: "short" })}</small>${new Date(e.date + "T12:00:00").getDate()}</span><span><strong>${esc(e.title)}</strong><small>${esc(e.time)} · ${esc(e.kind)}</small></span></button>` : ""}</section>`;
}
function eventCard(e) {
  return `<button class="event-card" data-event="${e.id}" style="text-align:left"><span class="event-date"><small>${dateFormat(e.date, { month: "short" })}</small>${new Date(e.date + "T12:00:00").getDate()}</span><div><h3>${esc(e.title)}</h3><span class="badge">${esc(e.kind)} · ${esc(e.time)}</span><p>${esc(e.description)}</p></div></button>`;
}
function calendar() {
  let events = selectedDay
    ? S.events.filter((e) => e.date === selectedDay)
    : S.events.filter(
        (e) =>
          new Date(e.date + "T12:00:00").getMonth() === calMonth.getMonth() &&
          new Date(e.date + "T12:00:00").getFullYear() ===
            calMonth.getFullYear(),
      );
  return `${heading("Lo bonito que viene 📅", "Actividades, encuentros y fechas para tener cerquita.", staff() ? '<button class="btn primary" data-action="new-event">' + icon("plus", 14) + " Crear evento</button>" : "")}<div class="calendar-main"><section class="panel big-calendar">${calendarHeader()}${calendarCells(true)}</section><section><div class="section-head"><h2>${selectedDay ? dateFormat(selectedDay) : "Este mes en el campus"}</h2>${selectedDay ? '<button class="link-btn" data-action="all-events">Ver mes</button>' : ""}</div><div class="event-list">${events.map(eventCard).join("") || empty("Sin eventos para esta fecha.")}</div></section></div>`;
}
function grades() {
  let ss = S.submissions.filter((s) => s.grade !== null);
  return `${heading(staff() ? "Cada avance cuenta" : "Mira cuánto has crecido 🌱", "Calificaciones, retroalimentación y pequeños grandes logros.")}${stats()}${gradeOverview()}<div class="section-head"><h2>Detalle de calificaciones</h2><a class="btn small" href="/api/grades-export">${icon("download", 14)} Exportar CSV</a></div><div class="table-wrap"><table><thead><tr><th>Actividad</th>${staff() ? "<th>Estudiante</th>" : ""}<th>Aula</th><th>Calificación</th><th>Retroalimentación</th></tr></thead><tbody>${
    ss
      .map((s) => {
        let t = indexMaps.tasks.get(s.task);
        return `<tr><td><button class="link-btn" data-task="${t.id}">${esc(t.title)}</button></td>${staff() ? `<td>${esc(person(s.student)?.name)}</td>` : ""}<td>${esc(course(t.course)?.title)}</td><td><span class="grade-number">${s.grade}</span><small> / ${t.points}</small></td><td style="white-space:normal;max-width:300px;line-height:1.8">${esc(s.feedback || "Sin comentarios")}</td></tr>`;
      })
      .join("") ||
    `<tr><td colspan="5">Las calificaciones aparecerán aquí cuando se revisen tus entregas.</td></tr>`
  }</tbody></table></div>`;
}
function profile() {
  return `${heading("Tu espacio, tu esencia 🌷", "Cuéntale a tu campus un poquito más de ti.")}${studentProfileCard()}${adminProfileCard()}${moduleEnabled("studio") ? teacherProfileCard() : ""}<div class="profile-layout"><aside class="panel profile-card">${avatar(S.me, true)}<h2>${esc(S.me.name)}</h2><span class="badge">${roleNames[S.me.role]}</span><p>${esc(S.me.bio)}</p><p>${esc(S.me.email)}</p><div class="progress"><i style="width:100%"></i></div><p>Parte de nuestra comunidad ✦</p><button class="btn" data-action="logout">${icon("logout", 15)} Cerrar sesión</button></aside><section class="panel"><div class="section-head"><h2>Información personal</h2>${icon("profile", 20)}</div><form id="profile-form"><div class="form-grid"><div class="form-field"><label for="profile-name">Nombre completo</label><input id="profile-name" name="name" value="${esc(S.me.name)}" required maxlength="100"></div><div class="form-field"><label for="profile-email">Correo electrónico</label><input id="profile-email" value="${esc(S.me.email)}" readonly style="background:#f5f2ee"></div><div class="form-field"><label for="profile-phone">Teléfono</label><input id="profile-phone" name="phone" value="${esc(S.me.phone)}" placeholder="Tu número de contacto" maxlength="40"></div><div class="form-field"><label>Mi rol en el campus</label><input value="${roleNames[S.me.role]}" readonly style="background:#f5f2ee"></div>${select(
    "color",
    "Color de mi perfil",
    [
      ["pink", "Rosa flor"],
      ["purple", "Lavanda"],
      ["green", "Verde salvia"],
      ["peach", "Durazno"],
      ["blue", "Azul cielo"],
      ["yellow", "Vainilla"],
    ],
    S.me.color,
  )}<div class="form-field full"><label for="profile-bio">Un poquito sobre mí</label><textarea id="profile-bio" name="bio" maxlength="1000">${esc(S.me.bio)}</textarea></div></div><div class="form-actions"><button class="btn primary">Guardar mi perfil ${icon("check", 14)}</button></div></form>${profileOptions()}<div style="border-top:1px solid var(--line);margin-top:25px;padding-top:22px;display:flex;justify-content:space-between;align-items:center"><div><h3 style="font-size:12px">Seguridad de tu cuenta</h3><p class="muted" style="font-size:10px;margin-top:5px">Actualiza tu contraseña cuando lo necesites.</p></div><button class="btn small" data-action="password">Cambiar contraseña</button></div><button class="link-btn" data-action="logout" style="margin-top:25px">${icon("logout", 14)} Cerrar sesión</button></section></div>`;
}
function admin() {
  return adminWorkspace();
}

function search() {
  let q = searchQuery.toLocaleLowerCase(),
    cs = S.courses.filter((c) =>
      (c.title + " " + c.code + " " + c.summary)
        .toLocaleLowerCase()
        .includes(q),
    ),
    ts = S.tasks.filter((t) =>
      (t.title + " " + t.description).toLocaleLowerCase().includes(q),
    ),
    ps = S.people.filter((p) => p.name.toLocaleLowerCase().includes(q));
  return `${heading("Lo encontramos juntos 🔎", `Resultados para «${esc(searchQuery)}».`)}<div class="search-results">${cs.length ? `<h3>Aulas</h3><div class="courses-grid">${cs.map((c) => courseCard(c)).join("")}</div>` : ""}${ts.length ? `<h3>Actividades</h3><div class="task-list">${ts.map(taskRow).join("")}</div>` : ""}${ps.length ? `<h3>Personas</h3><div class="chips">${ps.map((p) => `<button class="btn" data-message-to="${p.id}">${avatar(p)}${esc(p.name)}</button>`).join("")}</div>` : ""}${!cs.length && !ts.length && !ps.length ? empty("No encontramos coincidencias. Prueba con otra palabra.") : ""}</div>`;
}
function field(name, label, type = "text", value = "", extra = "") {
  return `<div class="form-field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
}
function textarea(name, label, value = "", extra = "") {
  return `<div class="form-field"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" ${extra}>${esc(value)}</textarea></div>`;
}
function select(name, label, items, selected) {
  return `<div class="form-field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}" required>${items.map(([id, label]) => `<option value="${id}" ${String(selected) === String(id) ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></div>`;
}
function courseSelect() {
  return select(
    "course",
    "Aula",
    S.courses.filter((c) => !c.archived).map((c) => [c.id, c.title]),
    currentCourse,
  );
}
function checkStudents(selected = []) {
  return `<div class="form-field"><label>Estudiantes matriculados</label><div class="checkbox-list">${S.people
    .filter((p) => p.role === "student")
    .map(
      (p) =>
        `<label><input type="checkbox" name="students" value="${p.id}" ${selected.includes(p.id) ? "checked" : ""}>${esc(p.name)}</label>`,
    )
    .join("")}</div></div>`;
}
let previousFocus = null;
function modal(title, body, editor = false) {
  modalBusy = false;
  $("#toast").classList.remove("show");
  document.body.classList.add("modal-open");
  $("#app").inert = true;
  previousFocus = document.activeElement;
  $("#modal-root").innerHTML =
    `<div class="overlay ${editor ? "editor-overlay" : ""}"><section class="modal ${editor ? "form-workspace" : ""}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div class="modal-head">${editor ? `<div class="editor-brand">${brand()}<span>Tu espacio de creación</span></div>` : ""}<h2 id="dialog-title">${esc(title)}</h2><button class="icon-btn" data-close aria-label="Cerrar">${icon("close", 18)}</button></div><div class="modal-error" role="alert"></div>${body}</section></div>`;
  bindFileDrops();
  $$("[data-close]").forEach((b) => (b.onclick = () => closeModal()));
  $(".overlay").onclick = (e) => {
    if (e.target === e.currentTarget) closeModal();
  };
  setTimeout(
    () =>
      $(
        ".modal input:not([type=hidden]),.modal textarea,.modal select,.modal button:not([data-close])",
      )?.focus(),
    20,
  );
}
function closeModal(force = false) {
  if (modalBusy && !force) return;
  const editorForm = $("#modal-form") || $("#help-reply-form");
  if (
    editorForm?.dataset.dirty === "true" &&
    !force &&
    !confirm("Tienes cambios sin guardar. ¿Quieres salir del formulario?")
  )
    return;
  const form = $("#submit-form");
  if (form && !force) {
    if (form.dataset.saving) {
      toast("Estamos guardando tu borrador. Espera un momento.");
      return;
    }
    if (
      form.elements.file.files.length &&
      !confirm(
        "El archivo se envía al entregar. Si cierras, deberás seleccionarlo otra vez. ¿Quieres cerrar?",
      )
    )
      return;
    const body = form.elements.body.value,
      answers = collectSmartAnswers(form);
    if (
      body !== form.dataset.savedBody ||
      JSON.stringify(answers) !== form.dataset.savedAnswers
    ) {
      modalPending(true);
      api("draft", { task: +form.elements.task.value, body, answers }, "POST", {
        background: true,
      })
        .then((next) => {
          if (S && next.me.id === S.me.id) S.drafts = next.drafts;
          modalPending(false);
          closeModal(true);
          toast("Borrador guardado. Puedes continuar después.");
        })
        .catch((error) => {
          modalPending(false);
          modalError(error);
        });
      return;
    }
  }
  $("#modal-root").innerHTML = "";
  document.body.classList.remove("modal-open");
  $("#app").inert = false;
  previousFocus?.focus();
}

function modalError(e) {
  let el = $(".modal-error");
  if (el) {
    el.style.display = "block";
    el.textContent = e.message;
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  } else toast(e.message);
}
function formModal(
  title,
  body,
  path,
  transform,
  success = "Guardado. Un pequeño gran paso ✦",
  multipart = false,
) {
  if (!guardForm(path)) return;
  const meta = formMeta(path);
  const sections = body.includes("editor-section")
    ? body
    : editorSection(
        "01",
        meta.section,
        "Completa los datos; los campos con * son obligatorios.",
        body,
      );
  modal(
    title,
    `<div class="editor-intro"><span class="editor-tag">${icon(meta.icon, 16)} ${meta.label}</span><span class="role-chip">${icon("shield", 14)} ${roleNames[S.me.role]}</span><p>${meta.description}</p></div><form id="modal-form" data-path="${path}"><div class="editor-grid"><div class="editor-fields">${sections}<div class="upload-status" aria-live="polite" hidden></div></div><aside class="editor-preview" aria-label="Vista previa"><span class="eyebrow">ASÍ VA TOMANDO FORMA</span><div id="form-preview"></div><div class="editor-tip">${icon("shield", 20)}<div><strong>Tu espacio tiene permisos claros</strong><p>${roleScope()}</p></div></div></aside></div><div class="form-actions editor-actions"><span class="editor-save-note">${icon("check", 14)} Revisa y guarda cuando esté listo.</span><button class="btn" type="button" data-close>Cancelar</button><button class="btn primary" type="submit" aria-label="Guardar">${meta.save} ${icon("check", 14)}</button></div></form>`,
    true,
  );
  const form = $("#modal-form");
  form.addEventListener("input", (e) => {
    if (e.target.closest("#form-preview,#task-fields-preview")) return;
    form.dataset.dirty = "true";
    updateFormPreview();
    updateTeachingPreview();
  });
  form.addEventListener("change", (e) => {
    if (e.target.closest("#form-preview,#task-fields-preview")) return;
    form.dataset.dirty = "true";
    updateFormPreview();
    updateTeachingPreview();
  });
  bindEditorPresets();
  updateFormPreview();
  $("#modal-form").onsubmit = async (e) => {
    e.preventDefault();
    const b = e.submitter;
    if (b.disabled) return;
    busy(b, true);
    modalPending(true);
    try {
      const f = new FormData(e.target);
      let d = Object.fromEntries(f);
      if (transform) d = transform(d, f);
      const input = multipart ? f : d;
      S = await api(
        path,
        input,
        "POST",
        multipart ? { onProgress: uploadProgress } : {},
      );
      clearDirty();
      modalPending(false);
      closeModal(true);
      render();
      toast(success);
    } catch (error) {
      modalError(error);
    } finally {
      modalPending(false);
      busy(b, false);
    }
  };
}
function uploadProgress(percent) {
  let el = $(".upload-status");
  if (el) {
    el.hidden = false;
    el.innerHTML = `<div><span>${percent === 100 ? "Procesando tu archivo…" : "Subiendo archivo"}</span><strong>${percent}%</strong></div><div class="progress"><i style="width:${percent}%"></i></div>`;
  }
}

function openTask(id) {
  const t = indexMaps.tasks.get(id),
    c = course(t.course),
    sub = submission(t),
    draft = S.drafts?.find((d) => d.task_id === id);
  const intro = `<div class="task-detail-top ${esc(t.color || c.color)}"><span class="badge">${esc(c.title)}</span><div>${icon("calendar", 14)} ${dueLabel(t.due)} <span>· ${t.points} puntos</span></div></div><p class="modal-description">${esc(t.description)}</p>${rubricView(t.rubric, sub?.rubric_assessment?.selections ? sub.rubric_assessment : null)}<div class="activity-rules"><span>${taskKind(t.kind)}</span><span>${deliveryName(t.submission_mode)}</span><span>${t.allow_late ? "Admite entregas tardías" : "Entrega hasta la fecha indicada"}</span></div>`;
  if (!staff()) {
    modal(
      t.title,
      `${intro}<div class="student-row-actions"><button class="btn small" data-task-ai="${id}">Pensar con Luma AI ${icon("spark", 14)}</button>${moduleEnabled("messages") ? `<button class="btn small" data-task-help="${id}">Pedir ayuda al profesor ${icon("heart", 14)}</button>` : ""}<button class="btn small" data-task-plan="${id}">Planear mi estudio</button>${sub ? `<button class="btn small" data-task-portfolio="${sub.id}">Guardar en mi portafolio</button>` : ""}</div>${sub ? `<section class="submission"><small>Tu entrega · ${dateFormat(sub.created)}</small><p>${esc(sub.body)}</p>${submissionFieldsView(t, sub.answers)}${sub.file ? `<a class="btn small" href="/api/file/${sub.id}">${icon("download", 14)} ${esc(sub.file)}</a>` : ""}${sub.grade != null ? `<div class="grade-feedback"><strong>${sub.grade}<small> / ${t.points}</small></strong><p>${esc(sub.feedback || "Tu profesor ya revisó tu trabajo.")}</p></div>` : ""}</section>` : ""}${sub?.grade != null ? '<span class="badge done">Trabajo revisado. ¡Sigue creciendo!</span>' : t.closed || (!t.allow_late && t.due < todayISO()) ? '<div class="notice">Esta actividad está cerrada. Puedes consultar tu entrega; para hacer cambios, contacta a tu profesor.</div>' : `<form id="submit-form"><input type="hidden" name="task" value="${t.id}">${textarea("body", "Tu respuesta", draft?.body ?? sub?.body ?? "", 'maxlength="10000" placeholder="Comparte lo que aprendiste…"')}${t.fields?.length ? `<section class="smart-submission"><h3>Tu recorrido de aprendizaje</h3>${smartFieldsHTML(t.fields, draft?.answers ?? sub?.answers ?? {})}</section>` : ""}<div class="draft-hint" id="draft-hint">${draft ? "Borrador guardado en tu cuenta" : "Tu respuesta se guarda como borrador al hacer una pausa."}</div>${t.submission_mode === "text" ? '<input type="file" name="file" hidden><p class="form-help">Esta actividad acepta una respuesta de texto.</p>' : attachmentField(t.submission_mode === "file" ? "Archivo requerido · máximo 5 MB" : undefined)}<div id="file-preview" class="file-preview" hidden></div><div class="upload-status" aria-live="polite" hidden></div><div class="form-actions"><button type="button" class="btn" id="save-draft">Guardar borrador</button><button class="btn primary">${sub ? "Actualizar entrega" : "Entregar actividad"} ${icon("send", 14)}</button></div><p class="form-help">El borrador guarda el texto. El archivo se envía al entregar la actividad.</p></form>`}`,
    );
    if (t.rubric?.criteria || t.fields?.length)
      $(".modal").classList.add("rubric-review");
    $("[data-task-ai]")?.addEventListener("click", () =>
      aiClassroomImport(id, "task"),
    );
    $("[data-task-help]")?.addEventListener("click", () => {
      if (closeTaskForPersonal()) openAskHelp(id);
    });
    $("[data-task-plan]")?.addEventListener("click", () => {
      if (closeTaskForPersonal()) openPlannerEditor(null, null, id);
    });
    $("[data-task-portfolio]")?.addEventListener(
      "click",
      () => closeTaskForPersonal() && openPortfolioEditor(null, sub.id),
    );
    const form = $("#submit-form");
    if (!form) return;
    form.dataset.savedBody = form.elements.body.value;
    bindSmartFields(form, t.fields || []);
    form.dataset.savedAnswers = JSON.stringify(collectSmartAnswers(form));
    let draftTimer,
      saving = false,
      sequence = 0;
    const saveDraft = async (showToast = false) => {
      if (saving || !form.isConnected || modalBusy) return;
      const value = form.elements.body.value,
        answers = collectSmartAnswers(form);
      const version = ++sequence;
      saving = true;
      form.dataset.saving = "1";
      $("#draft-hint").textContent = "Guardando borrador…";
      try {
        const next = await api(
          "draft",
          { task: id, body: value, answers },
          "POST",
          {
            background: true,
          },
        );
        if (S && next.me.id === S.me.id) {
          S.drafts = next.drafts;
          lastETag = "";
        }
        form.dataset.savedBody = value;
        form.dataset.savedAnswers = JSON.stringify(answers);
        if (form.isConnected && version === sequence)
          $("#draft-hint").textContent =
            form.elements.body.value === value
              ? "Borrador guardado en tu cuenta ✓"
              : "Hay cambios nuevos por guardar";
        if (showToast) toast("Borrador guardado. Puedes seguir otro día.");
      } catch (error) {
        if (form.isConnected)
          $("#draft-hint").textContent =
            "No se pudo guardar. Tu texto sigue aquí; vuelve a intentar.";
      } finally {
        saving = false;
        delete form.dataset.saving;
      }
    };
    form.addEventListener("input", (e) => {
      if (e.target.type === "file") return;
      clearTimeout(draftTimer);
      $("#draft-hint").textContent = "Escribiendo…";
      draftTimer = setTimeout(() => saveDraft(), 1800);
    });
    $("#save-draft").onclick = () => saveDraft(true);
    form.elements.file.onchange = () => {
      const f = form.elements.file.files[0],
        el = $("#file-preview");
      if (!f) {
        el.hidden = true;
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        form.elements.file.value = "";
        modalError(new Error("El archivo no puede superar 5 MB."));
        el.hidden = true;
        return;
      }
      el.hidden = false;
      el.innerHTML = `${icon("file", 18)}<div><strong>${esc(f.name)}</strong><small>${(f.size / 1024).toFixed(0)} KB · listo para enviar</small></div><button type="button" class="icon-btn" aria-label="Quitar archivo">${icon("close", 13)}</button>`;
      el.querySelector("button").onclick = () => {
        form.elements.file.value = "";
        el.hidden = true;
      };
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const b = e.submitter;
      if (b.disabled) return;
      if (saving) {
        toast("Espera un momento: estamos guardando tu borrador.");
        return;
      }
      clearTimeout(draftTimer);
      if (
        t.submission_mode === "file" &&
        !form.elements.file.files.length &&
        !sub?.file
      ) {
        modalError(
          new Error("Adjunta el archivo requerido para esta actividad."),
        );
        return;
      }
      if (
        !form.elements.body.value.trim() &&
        !form.elements.file.files.length &&
        !sub?.file &&
        !Object.keys(collectSmartAnswers(form)).length
      ) {
        modalError(new Error("Escribe tu respuesta o adjunta un archivo."));
        return;
      }
      busy(b, true, "Entregando…");
      modalPending(true);
      try {
        const payload = new FormData(form);
        payload.set("answers", JSON.stringify(collectSmartAnswers(form)));
        S = await api("submit", payload, "POST", {
          onProgress: uploadProgress,
        });
        modalPending(false);
        closeModal(true);
        clearDirty();
        render();
        toast("¡Entrega guardada! Tu esfuerzo cuenta 🌷");
      } catch (error) {
        modalError(error);
      } finally {
        modalPending(false);
        busy(b, false);
      }
    };
  } else {
    const ss = S.submissions
        .filter((s) => s.task === id)
        .sort((a, b) => Number(a.grade != null) - Number(b.grade != null)),
      missing = c.students.filter((id) => !ss.some((s) => s.student === id));
    modal(
      t.title,
      `${intro}<div class="activity-management"><button class="btn small" data-editor-task="${id}">Editar actividad</button><button class="btn small" id="toggle-task">${t.closed ? "Reabrir entregas" : "Cerrar entregas"}</button><span class="badge ${t.closed ? "closed" : ""}">${t.closed ? "Cerrada" : "Activa"}</span></div><div class="review-summary"><strong>${ss.length}/${c.students.length}</strong> entregas <span>${ss.filter((s) => s.grade == null).length} por revisar</span></div>${ss.map((s) => `<section class="submission"><div class="post-head">${avatar(person(s.student))}<div><strong>${esc(person(s.student)?.name)}</strong><small>${dateFormat(s.created)} · ${s.grade != null ? "Calificada" : "Pendiente de revisión"}</small></div></div><p>${esc(s.body)}</p>${submissionFieldsView(t, s.answers)}${s.file ? `<a class="btn small" href="/api/file/${s.id}">${icon("download", 14)} ${esc(s.file)}</a>` : ""}<form class="grade-form" data-id="${s.id}">${gradingFields(t, s)}<button class="btn primary small">Guardar calificación</button></form></section>`).join("") || empty("Aún no hay entregas.")}${missing.length ? `<div class="missing-students"><h3>Por entregar · ${missing.length}</h3>${missing.map((id) => `<span>${avatar(person(id))}${esc(person(id)?.name)}</span>`).join("")}</div>` : ""}`,
    );
    if (t.rubric?.criteria || t.fields?.length)
      $(".modal").classList.add("rubric-review");
    if (!moduleEnabled("grades") || c.archived)
      $$(".grade-form").forEach((form) =>
        form.replaceWith(
          Object.assign(document.createElement("p"), {
            className: "form-help",
            textContent: c.archived
              ? "Materia archivada. Restaura para modificar su contenido."
              : "La revisión de calificaciones está desactivada por la institución.",
          }),
        ),
      );
    if (c.archived) $(".activity-management").hidden = true;
    $("[data-editor-task]").onclick = () => editTask(id);
    $("#toggle-task").onclick = async (e) => {
      const b = e.currentTarget;
      busy(b, true);
      modalPending(true);
      try {
        S = await api("task-toggle", { id, closed: !t.closed });
        modalPending(false);
        render();
        openTask(id);
        toast(
          t.closed
            ? "Las entregas se reabrieron."
            : "Actividad cerrada. Las entregas se conservan.",
        );
      } catch (error) {
        modalError(error);
      } finally {
        modalPending(false);
        busy(b, false);
      }
    };
    $$(".grade-form").forEach((form) => bindGrading(form, t));
    $$(".grade-form").forEach(
      (form) =>
        (form.onsubmit = async (e) => {
          e.preventDefault();
          const b = e.submitter;
          busy(b, true);
          modalPending(true);
          try {
            S = await api("grade", {
              ...gradingPayload(form, t),
              submission: +form.dataset.id,
            });
            modalPending(false);
            render();
            openTask(id);
            toast("Calificación guardada.");
          } catch (error) {
            modalError(error);
          } finally {
            modalPending(false);
            busy(b, false);
          }
        }),
    );
  }
}

function openResource(id) {
  const r = S.resources.find((r) => r.id === id);
  modal(
    r.title,
    `${r.file ? `<div class="file-preview">${icon("file", 22)}<div><strong>${esc(r.file)}</strong><small>Material de tu aula</small></div><a class="btn small" href="/api/resource-file/${r.id}">${icon("download", 14)} Descargar</a></div>` : ""}${r.body ? `<pre>${esc(r.body)}</pre>` : ""}${r.url ? `<a class="btn primary" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Abrir enlace ${icon("link", 14)}</a>` : ""}${S.me.role === "student" ? `<div class="form-actions"><button class="btn primary" id="ai-import-resource">Estudiar con Luma AI ${icon("spark", 15)}</button></div>` : ""}${staff() ? `<div class="form-actions"><button class="btn" id="edit-resource">Editar material</button><button class="btn danger" id="delete-resource">Eliminar</button></div>` : ""}`,
  );
  $("#ai-import-resource")?.addEventListener("click", () =>
    aiClassroomImport(id, "resource"),
  );
  if (staff()) {
    $("#edit-resource").onclick = () => editResource(id);
    $("#delete-resource").onclick = () =>
      confirmDelete(
        "Eliminar material",
        "El material dejará de estar disponible para esta aula.",
        "resource-delete",
        { id },
      );
  }
}

function openEvent(id) {
  const e = S.events.find((e) => e.id === id),
    manage = S.me.role === "admin" || (staff() && e.author_id === S.me.id);
  modal(
    e.title,
    `<div class="event-detail">${art("flower", 64)}<div><span class="badge">${esc(e.kind)}</span><h3>${dateFormat(e.date, { weekday: "long", day: "numeric", month: "long" })}</h3><p>${icon("clock", 14)} ${esc(e.time)}</p></div></div><p class="modal-description">${esc(e.description || "Te esperamos en el campus.")}</p>${manage ? '<div class="form-actions"><button class="btn" id="edit-event">Editar evento</button><button class="btn danger" id="delete-event">Eliminar</button></div>' : ""}`,
  );
  if (manage) {
    $("#edit-event").onclick = () => editEvent(id);
    $("#delete-event").onclick = () =>
      confirmDelete(
        "Eliminar evento",
        "Este encuentro se quitará del calendario del campus.",
        "event-delete",
        { id },
      );
  }
}

async function selectThread(id) {
  if (!moduleEnabled("messages"))
    return toast("La mensajería está desactivada por la institución.");
  if (!canNavigate()) return;
  thread = +id;
  view = "messages";
  clearDirty();
  render();
  try {
    S = await api("read", { sender: thread });
    render();
  } catch (e) {
    toast(e.message);
  }
}
function bind() {
  $$("[data-view]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!canNavigate()) return;
        view = b.dataset.view;
        currentCourse = null;
        menuOpen = false;
        selectedDay = null;
        render();
        window.scrollTo(0, 0);
      }),
  );
  $$("[data-course]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!canNavigate()) return;
        currentCourse = +b.dataset.course;
        view = "classroom";
        tab = "wall";
        render();
        window.scrollTo(0, 0);
      }),
  );
  $$("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!canNavigate()) return;
        tab = b.dataset.tab;
        render();
      }),
  );
  $$("[data-task]").forEach(
    (b) => (b.onclick = () => openTask(+b.dataset.task)),
  );
  $$("[data-resource]").forEach(
    (b) => (b.onclick = () => openResource(+b.dataset.resource)),
  );
  $$("[data-event]").forEach(
    (b) => (b.onclick = () => openEvent(+b.dataset.event)),
  );
  $$("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        taskFilter = b.dataset.filter;
        render();
      }),
  );
  $$("[data-message-to]").forEach(
    (b) =>
      (b.onclick = () =>
        b.dataset.messageTo != S.me.id
          ? selectThread(+b.dataset.messageTo)
          : toast("Este es tu propio perfil.")),
  );
  $$("[data-thread]").forEach(
    (b) => (b.onclick = () => selectThread(+b.dataset.thread)),
  );
  $$("[data-month]").forEach(
    (b) =>
      (b.onclick = () => {
        calMonth = new Date(
          calMonth.getFullYear(),
          calMonth.getMonth() + +b.dataset.month,
          1,
        );
        selectedDay = null;
        render();
      }),
  );
  $$("[data-day]").forEach(
    (b) =>
      (b.onclick = () => {
        selectedDay = b.dataset.day;
        view = "calendar";
        render();
      }),
  );
  $$("[data-action]").forEach(
    (b) => (b.onclick = () => action(b.dataset.action)),
  );
  $("#search-form").onsubmit = (e) => {
    e.preventDefault();
    searchQuery = new FormData(e.target).get("q").trim();
    if (!searchQuery) return;
    if (!canNavigate()) return;
    view = "search";
    render();
  };
  if ($("#post-form"))
    $("#post-form").onsubmit = async (e) => {
      e.preventDefault();
      await saveForm(
        e,
        "post",
        { course: currentCourse },
        "Tu idea ya está en el muro. ✦",
      );
    };
  if ($("#profile-form"))
    $("#profile-form").onsubmit = (e) => {
      e.preventDefault();
      saveForm(e, "profile", {}, "Tu perfil quedó actualizado. 🌷");
    };
  if ($("#message-form"))
    $("#message-form").onsubmit = (e) => {
      e.preventDefault();
      saveForm(e, "message", { recipient: thread }, "Mensaje enviado.");
    };
}
async function saveForm(e, path, extra, msg) {
  const b = e.submitter;
  if (b.disabled) return;
  busy(b, true, path === "message" ? "Enviando…" : "Guardando…");
  try {
    S = await api(path, {
      ...Object.fromEntries(new FormData(e.target)),
      ...extra,
    });
    clearDirty();
    if (path === "message")
      sessionStorage.removeItem(`luma-message-${S.me.id}-${thread}`);
    render();
    toast(msg);
  } catch (error) {
    toast(error.message);
  } finally {
    busy(b, false);
  }
}

async function action(name) {
  if (name === "teaching-preferences") {
    openTeachingPreferences();
    return;
  }
  const required = {
    "new-course": "courses.manage",
    "new-user": "users.manage",
    membership: "membership.manage",
    "take-attendance": "attendance.manage",
    "new-task": "assignments.manage",
    "new-resource": "materials.manage",
    "new-event": "events.manage",
  }[name];
  if (required && !can(required))
    return toast("Tu perfil no tiene permiso para realizar esta acción.");
  if (name === "appearance") {
    openAppearance();
    return;
  }
  if (name === "permissions") {
    openPermissions();
    return;
  }
  if (name === "menu") {
    menuOpen = !menuOpen;
    $(".sidebar").classList.toggle("open", menuOpen);
    $(".sidebar-scrim")?.classList.toggle("open", menuOpen);
    return;
  }
  if (name === "logout") {
    if (!canNavigate()) return;
    try {
      await api("logout");
      closeModal();
      loginPage();
    } catch (e) {
      toast(e.message);
    }
    return;
  }
  if (name === "back-class") {
    if (!canNavigate()) return;
    currentCourse = null;
    render();
    return;
  }
  if (name === "all-events") {
    selectedDay = null;
    render();
    return;
  }
  if (name === "notifications") {
    openNotifications();
    return;
  }
  if (name === "new-resource") {
    editResource();
    return;
  }
  if (name === "new-event") {
    editEvent();
    return;
  }
  if (name === "password") {
    formModal(
      "Cuida tu espacio",
      field(
        "current",
        "Contraseña actual",
        "password",
        "",
        'required autocomplete="current-password"',
      ) +
        field(
          "password",
          "Nueva contraseña · mínimo 10 caracteres",
          "password",
          "",
          'required minlength="10" autocomplete="new-password"',
        ),
      "password",
    );
    return;
  }
  if (name === "new-task") {
    openTaskEditor();
    return;
  }
  if (name === "new-course") {
    let teachers = S.people.filter((p) => p.role === "teacher");
    if (!teachers.length) return toast("Crea primero una cuenta de profesor.");
    formModal(
      "Un nuevo mundo por descubrir",
      field(
        "title",
        "Nombre del aula",
        "text",
        "",
        'required maxlength="200"',
      ) +
        `<div class="form-grid">${field("code", "Código único", "text", "", 'required maxlength="40"')}${select(
          "color",
          "Color del aula",
          [
            ["pink", "Rosa flor"],
            ["purple", "Lavanda"],
            ["green", "Verde salvia"],
            ["peach", "Durazno"],
            ["blue", "Azul cielo"],
            ["yellow", "Vainilla"],
          ],
        )}</div>` +
        textarea("summary", "Descripción", "", 'maxlength="200"') +
        select(
          "teacher",
          "Profesor",
          teachers.map((p) => [p.id, p.name]),
        ) +
        field("schedule", "Horario", "text", "", 'maxlength="100"') +
        `<div class="form-grid">${field("room", "Sección / grupo", "text", "10-A", 'maxlength="60"')}${select(
          "symbol",
          "Ilustración",
          [
            ["flower", "Flor"],
            ["orbit", "Órbita"],
            ["leaf", "Hojas"],
            ["sun", "Sol"],
            ["star", "Estrella"],
            ["spark", "Destellos"],
          ],
        )}</div>` +
        checkStudents(),
      "course",
      (d, f) => ({
        ...d,
        teacher: +d.teacher,
        students: f.getAll("students").map(Number),
      }),
    );
    return;
  }
  if (name === "new-user") {
    formModal(
      "Una nueva persona en el campus",
      field("name", "Nombre completo", "text", "", 'required maxlength="100"') +
        field("email", "Correo electrónico", "email", "", "required") +
        select("role", "Rol", [
          ["student", "Estudiante"],
          ["teacher", "Profesor"],
          ["admin", "Administrador"],
        ]) +
        field(
          "password",
          "Contraseña inicial · mínimo 10 caracteres",
          "password",
          "",
          'required minlength="10"',
        ),
      "user",
    );
    return;
  }
  if (name === "membership") {
    let c = course(currentCourse);
    formModal(
      "Personas que comparten esta aula",
      `<input type="hidden" name="course" value="${c.id}">` +
        checkStudents(c.students),
      "membership",
      (d, f) => ({
        ...d,
        course: +d.course,
        students: f.getAll("students").map(Number),
      }),
    );
    return;
  }
  if (name === "take-attendance") {
    let c = course(currentCourse);
    let day = todayISO();
    formModal(
      "Un encuentro que cuenta",
      field("date", "Fecha", "date", day, "required") +
        c.students
          .map((id) => {
            let p = person(id);
            return `<label class="attendance-row">${avatar(p)}<span>${esc(p.name)}</span><span style="display:flex;align-items:center;gap:8px"><input type="checkbox" name="present" value="${id}" ${S.attendance.find((a) => a.course_id === c.id && a.student_id === id && a.date === day)?.present === false ? "" : "checked"}> Presente</span></label>`;
          })
          .join(""),
      "attendance",
      (d, f) => ({
        course: c.id,
        date: d.date,
        rows: c.students.map((id) => ({
          student: id,
          present: f.getAll("present").includes(String(id)),
        })),
      }),
      "Asistencia guardada.",
    );
    $("#f-date").onchange = (e) => {
      $$("[name=present]").forEach((input) => {
        const saved = S.attendance.find(
          (a) =>
            a.course_id === c.id &&
            a.student_id === +input.value &&
            a.date === e.target.value,
        );
        input.checked = saved ? saved.present : true;
      });
    };
    return;
  }
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    menuOpen = false;
    $(".sidebar")?.classList.remove("open");
    $(".sidebar-scrim")?.classList.remove("open");
  }
  if (e.key === "Tab" && $(".modal")) {
    let focusables = [
      ...$(".modal").querySelectorAll("button,input,select,textarea,a[href]"),
    ].filter(
      (el) =>
        !el.disabled && el.type !== "hidden" && el.getClientRects().length,
    );
    let first = focusables[0],
      last = focusables.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

// Luma 2: navigation, useful controls and resilient synchronization.
function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}
function sortedCourses() {
  const favorites = S.me.preferences?.favorites || [];
  return S.courses
    .filter((c) => !c.archived)
    .sort(
      (a, b) =>
        Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)) ||
        a.title.localeCompare(b.title, "es"),
    );
}
function dueLabel(d) {
  const days = Math.round(
    (new Date(d + "T12:00:00") - new Date(todayISO() + "T12:00:00")) / 86400000,
  );
  return days === 0
    ? "Entrega hoy"
    : days === 1
      ? "Entrega mañana"
      : days < 0
        ? `Fecha pasada · ${dateFormat(d)}`
        : `Entrega ${dateFormat(d)}`;
}
function courseToolbar() {
  return `<div class="toolbar course-toolbar"><div class="inline-search">${icon("search", 16)}<input id="course-search" value="${esc(courseQuery)}" placeholder="Encuentra tu próxima aula…" aria-label="Buscar aulas"></div><button class="chip ${favoritesOnly ? "active" : ""}" id="favorites-filter">${icon("heart", 14)} Mis favoritas</button><span class="muted results-count">${S.courses.length} aulas en tu campus</span></div>`;
}
function filteredPeople() {
  return S.people.filter(
    (p) =>
      (peopleRole === "all" || p.role === peopleRole) &&
      normalize(p.name + " " + p.email).includes(normalize(peopleQuery)),
  );
}
function peopleToolbar() {
  return `<div class="toolbar"><div class="inline-search">${icon("search", 16)}<input id="people-search" value="${esc(peopleQuery)}" placeholder="Busca por nombre o correo…" aria-label="Buscar personas"></div><select class="compact-select" id="people-role" aria-label="Filtrar personas por rol">${[
    ["all", "Todos los roles"],
    ["student", "Estudiantes"],
    ["teacher", "Profesores"],
    ["admin", "Administradores"],
  ]
    .map(
      ([id, name]) =>
        `<option value="${id}" ${peopleRole === id ? "selected" : ""}>${name}</option>`,
    )
    .join("")}</select></div>`;
}
function dashboardActions() {
  const done = S.tasks.filter((t) => submission(t)).length,
    total = S.tasks.length,
    graded = S.submissions.filter((s) => s.grade != null).length;
  return `<section class="daily-focus"><div class="focus-copy"><span class="eyebrow">TU RUTA DE HOY</span><h3>${staff() ? "Acompaña cada pequeño avance" : "Lo que avanzas también florece"}</h3><p>${staff() ? `${graded} trabajos revisados. Tu retroalimentación hace la diferencia.` : `${done} de ${total} actividades entregadas. Cada paso suma.`}</p>${!staff() ? `<div class="progress"><i style="width:${total ? (done / total) * 100 : 0}%"></i></div>` : ""}</div><div class="quick-actions"><button data-view="tasks">${icon("task", 19)}<span>${staff() ? "Revisar trabajos" : "Mis pendientes"}</span></button><button data-view="messages">${icon("message", 19)}<span>Conectar</span>${unread() ? `<i>${unread()}</i>` : ""}</button><button data-view="calendar">${icon("calendar", 19)}<span>Mi agenda</span></button></div></section>`;
}
function gradeOverview() {
  return `<section class="grade-overview">${S.courses
    .map((c) => {
      const tasks = S.tasks.filter((t) => t.course === c.id),
        ss = S.submissions.filter(
          (s) => tasks.some((t) => t.id === s.task) && s.grade != null,
        ),
        avg = ss.length
          ? Math.round(
              ss.reduce(
                (n, s) =>
                  n + (s.grade / indexMaps.tasks.get(s.task).points) * 100,
                0,
              ) / ss.length,
            )
          : null;
      return `<div class="grade-course"><span class="todo-icon ${c.color}">${art(c.symbol, 28)}</span><div><strong>${esc(c.title)}</strong><small>${ss.length} ${ss.length === 1 ? "trabajo revisado" : "trabajos revisados"}</small></div><b>${avg == null ? "—" : avg + "%"}</b></div>`;
    })
    .join("")}</section>`;
}
function notificationItems() {
  const items = S.messages
    .filter((m) => m.recipient === S.me.id && !m.read)
    .map((m) => ({
      type: "message",
      id: m.sender,
      title: person(m.sender)?.name || "Nuevo mensaje",
      body: m.body,
      icon: "message",
      color: "purple",
    }));
  if (!staff())
    for (const t of pending().filter(
      (t) =>
        t.due <=
        new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-CA", {
          timeZone: "America/Costa_Rica",
        }),
    ))
      items.push({
        type: "task",
        id: t.id,
        title: t.title,
        body: dueLabel(t.due) + " · " + course(t.course)?.title,
        icon: "task",
        color: "peach",
      });
  if (staff())
    for (const s of S.submissions.filter((s) => s.grade == null))
      items.push({
        type: "task",
        id: s.task,
        title: "Una entrega por revisar",
        body:
          person(s.student)?.name + " · " + indexMaps.tasks.get(s.task)?.title,
        icon: "file",
        color: "green",
      });
  return [...personalNotifications(), ...items];
}
function openNotifications() {
  const items = notificationItems();
  modal(
    "Tu campus, al día",
    `<p class="modal-description">Mensajes nuevos y actividades que necesitan un poquito de ti.</p>${items.map((item) => `<button class="notification-item" data-note-type="${item.type}" data-note-id="${item.id}"><span class="todo-icon ${item.color}">${icon(item.icon, 17)}</span><div><h3>${esc(item.title)}</h3><p>${esc(item.body.slice(0, 160))}</p></div>${icon("chevron", 13)}</button>`).join("") || empty("Todo al día. Respira y sigue floreciendo. 🌷")}`,
  );
  $$("[data-note-type]").forEach(
    (b) =>
      (b.onclick = () => {
        const type = b.dataset.noteType,
          id = +b.dataset.noteId;
        closeModal();
        if (type === "message") selectThread(id);
        else if (type === "planner") openPlannerEditor(id);
        else if (type === "help") openHelp(id);
        else if (type === "feedback") {
          const sub = S.submissions.find((s) => s.id === id);
          if (sub) openTask(sub.task);
        } else openTask(id);
      }),
  );
}
function confirmDelete(title, description, path, data) {
  modal(
    title,
    `<p class="modal-description">${esc(description)}</p><div class="form-actions"><button class="btn" data-close>Conservar</button><button class="btn danger" id="confirm-delete">Eliminar</button></div>`,
  );
  $("#confirm-delete").onclick = async (e) => {
    const b = e.currentTarget;
    busy(b, true, "Eliminando…");
    modalPending(true);
    try {
      S = await api(path, data);
      modalPending(false);
      closeModal();
      render();
      toast("El cambio quedó guardado.");
    } catch (error) {
      modalError(error);
    } finally {
      modalPending(false);
      busy(b, false);
    }
  };
}
function editTask(id) {
  openTaskEditor(id);
}
function editCourse(id) {
  const c = course(id);
  formModal(
    "Un aula con su propia esencia",
    `<input name="id" type="hidden" value="${id}">${field("title", "Nombre del aula", "text", c.title, 'required maxlength="200"')}<div class="form-grid">${field("code", "Código único", "text", c.code, 'required maxlength="40"')}${field("room", "Sección / grupo", "text", c.room, 'maxlength="60"')}</div>${textarea("summary", "Descripción", c.summary, 'maxlength="200"')}${select(
      "teacher",
      "Profesor",
      S.people.filter((p) => p.role === "teacher").map((p) => [p.id, p.name]),
      c.teacher,
    )}${field("schedule", "Horario", "text", c.schedule, 'maxlength="100"')}<div class="form-grid">${select(
      "color",
      "Color",
      [
        ["pink", "Rosa flor"],
        ["purple", "Lavanda"],
        ["green", "Verde salvia"],
        ["peach", "Durazno"],
        ["blue", "Azul cielo"],
        ["yellow", "Vainilla"],
      ],
      c.color,
    )}${select(
      "symbol",
      "Ilustración",
      [
        ["flower", "Flor"],
        ["orbit", "Órbita"],
        ["leaf", "Hojas"],
        ["sun", "Sol"],
        ["star", "Estrella"],
        ["spark", "Destellos"],
      ],
      c.symbol,
    )}</div>`,
    "course-edit",
    (d) => ({ ...d, id: +d.id, teacher: +d.teacher }),
    "Aula actualizada.",
  );
}
function editResource(id) {
  const r = id ? S.resources.find((r) => r.id === id) : null;
  const header = r
    ? `<input type="hidden" name="id" value="${id}">`
    : courseSelect();
  formModal(
    r ? "Renueva este material" : "Una idea para compartir",
    `${header}${field("title", "Título del material", "text", r?.title || "", "required")}${field("url", "Enlace (opcional)", "url", r?.url || "")}${textarea("body", "Contenido o apuntes (opcional)", r?.body || "", 'maxlength="10000"')}${r?.file ? `<p class="form-help">Archivo actual: ${esc(r.file)}. Adjunta otro para reemplazarlo.</p>` : ""}${attachmentField("Archivo (opcional) · máximo 5 MB")}`,
    r ? "resource-edit" : "resource",
    null,
    "Material guardado y disponible para tu aula.",
    true,
  );
}
function editEvent(id) {
  const e = id ? S.events.find((e) => e.id === id) : null;
  formModal(
    e ? "Renueva este encuentro" : "Algo bonito está por venir",
    `${e ? `<input name="id" type="hidden" value="${id}">` : ""}${field("title", "Nombre del evento", "text", e?.title || "", "required")}<div class="form-grid">${field("date", "Fecha", "date", e?.date || todayISO(), "required")}${field("time", "Hora", "time", e?.time || "09:00", "required")}</div>${select(
      "kind",
      "Tipo",
      [
        ["Campus", "Campus"],
        ["Comunidad", "Comunidad"],
        ["Familias", "Familias"],
        ["Académico", "Académico"],
      ],
      e?.kind,
    )}${textarea("description", "Detalles", e?.description || "", 'maxlength="2000"')}`,
    e ? "event-edit" : "event",
    (d) => ({ ...d, ...(e ? { id: +d.id } : {}) }),
    "Encuentro guardado en el calendario.",
  );
}
function editUser(id) {
  const p = person(id);
  formModal(
    "Acompaña a esta persona",
    `<input name="id" type="hidden" value="${id}"><span class="badge">${roleNames[p.role]}</span>${field("name", "Nombre completo", "text", p.name, 'required maxlength="100"')}${field("email", "Correo electrónico", "email", p.email, "required")}${field("password", "Nueva contraseña (opcional) · mínimo 10 caracteres", "password", "", 'minlength="10" autocomplete="new-password"')}<p class="form-help">Deja la contraseña vacía para conservar la actual. Las matrículas y el rol se conservan.</p>`,
    "user-edit",
    (d) => ({ ...d, id: +d.id }),
    "Datos de la cuenta actualizados.",
  );
}
function editPost(id) {
  const p = S.posts.find((p) => p.id === id);
  formModal(
    "Tu idea, un poquito más clara",
    `<input type="hidden" name="id" value="${id}">${textarea("body", "Publicación", p.body, 'required maxlength="4000"')}`,
    "post-edit",
    (d) => ({ ...d, id: +d.id }),
    "Publicación actualizada.",
  );
}
function bindEnhanced() {
  $$("[data-favorite]").forEach(
    (b) =>
      (b.onclick = async () => {
        if (b.disabled) return;
        b.disabled = true;
        try {
          S = await api("favorite", {
            course: +b.dataset.favorite,
            favorite: !S.me.preferences?.favorites?.includes(
              +b.dataset.favorite,
            ),
          });
          render({ preserve: true });
        } catch (error) {
          toast(error.message);
        } finally {
          b.disabled = false;
        }
      }),
  );
  $$("[data-edit-task]").forEach(
    (b) => (b.onclick = () => editTask(+b.dataset.editTask)),
  );
  $$("[data-edit-course]").forEach(
    (b) => (b.onclick = () => editCourse(+b.dataset.editCourse)),
  );
  $$("[data-edit-user]").forEach(
    (b) => (b.onclick = () => editUser(+b.dataset.editUser)),
  );
  $$("[data-edit-post]").forEach(
    (b) => (b.onclick = () => editPost(+b.dataset.editPost)),
  );
  $$("[data-delete-post]").forEach(
    (b) =>
      (b.onclick = () =>
        confirmDelete(
          "Eliminar publicación",
          "Esta idea se quitará del muro de tu aula.",
          "post-delete",
          { id: +b.dataset.deletePost },
        )),
  );
  $$("[data-pin-post]").forEach(
    (b) =>
      (b.onclick = async () => {
        b.disabled = true;
        try {
          const p = S.posts.find((p) => p.id === +b.dataset.pinPost);
          S = await api("post-pin", { id: p.id, pinned: !p.pinned });
          render({ preserve: true });
        } catch (error) {
          toast(error.message);
        } finally {
          b.disabled = false;
        }
      }),
  );
  for (const [id, apply] of [
    ["course-search", (value) => (courseQuery = value)],
    ["people-search", (value) => (peopleQuery = value)],
    ["thread-search", (value) => (threadQuery = value)],
  ]) {
    const el = document.getElementById(id);
    if (el)
      el.oninput = (e) => {
        apply(e.target.value);
        render({ preserve: true });
      };
  }
  for (const [id, apply] of [
    ["task-course", (v) => (taskCourse = v)],
    ["task-sort", (v) => (taskSort = v)],
    ["people-role", (v) => (peopleRole = v)],
  ]) {
    const el = document.getElementById(id);
    if (el)
      el.onchange = (e) => {
        apply(e.target.value);
        render({ preserve: true });
      };
  }
  if ($("#favorites-filter"))
    $("#favorites-filter").onclick = () => {
      favoritesOnly = !favoritesOnly;
      render({ preserve: true });
    };
  if (view === "messages" && $("#message-form")) {
    const input = $("#message-form input"),
      key = `luma-message-${S.me.id}-${thread}`;
    try {
      input.value = sessionStorage.getItem(key) || "";
    } catch {}
    input.addEventListener("input", () => {
      try {
        sessionStorage.setItem(key, input.value);
      } catch {}
    });
    markCurrentThread();
  }
  setSync(syncStatus);
}
function syncRoute() {
  const parts = [view];
  if (view === "classroom" && currentCourse) parts.push(currentCourse, tab);
  if (view === "messages" && thread) parts.push(thread);
  if (view === "ai" && aiSelected) parts.push(aiSelected);
  if (view === "student") parts.push(studentTab);
  if (view === "support") parts.push(supportTab);
  if (view === "search" && searchQuery)
    parts.push(encodeURIComponent(searchQuery));
  const hash = "#/" + parts.join("/");
  if (location.hash !== hash) history.pushState(null, "", hash);
}
function readRoute() {
  const parts = location.hash.replace(/^#\//, "").split("/");
  const allowed = [
    "ai",
    "student",
    "support",
    "home",
    "studio",
    "classroom",
    "tasks",
    "messages",
    "calendar",
    "grades",
    "profile",
    "admin",
    "search",
  ];
  view = allowed.includes(parts[0]) ? parts[0] : "home";
  if (view === "studio" && !can("teaching.customize")) view = "home";
  if (view === "admin" && S.me.role !== "admin") view = "home";
  if (
    (["student", "ai"].includes(view) && S.me.role !== "student") ||
    (view === "support" && S.me.role !== "teacher")
  )
    view = "home";
  if (view === "ai") {
    aiSelected = /^\d+$/.test(parts[1] || "") ? Number(parts[1]) : null;
    if (aiData && aiData.session?.id !== aiSelected)
      setTimeout(() => loadAI(aiSelected), 0);
  }
  if (view === "student")
    studentTab = studentTabs.some(([id]) => id === parts[1]) ? parts[1] : "day";
  if (view === "support")
    supportTab = parts[1] === "portfolio" ? "portfolio" : "help";
  currentCourse = view === "classroom" && course(+parts[1]) ? +parts[1] : null;
  tab = ["wall", "work", "resources", "people", "attendance"].includes(parts[2])
    ? parts[2]
    : "wall";
  if (view === "messages")
    thread = person(+parts[1]) && +parts[1] !== S.me.id ? +parts[1] : null;
  if (view === "search")
    try {
      searchQuery = decodeURIComponent(parts[1] || "");
    } catch {
      searchQuery = "";
    }
}
window.addEventListener("popstate", () => {
  if (S) {
    if (!canNavigate()) {
      syncRoute();
      return;
    }
    closeModal();
    readRoute();
    render();
  }
});
let markingRead = false;
async function markCurrentThread() {
  if (
    markingRead ||
    view !== "messages" ||
    !thread ||
    document.hidden ||
    !S?.messages.some(
      (m) => m.sender === thread && m.recipient === S.me.id && !m.read,
    )
  )
    return;
  markingRead = true;
  try {
    const next = await api("read", { sender: thread }, "POST", {
      background: true,
    });
    if (S && next.me.id === S.me.id) {
      S = next;
      reindex();
      if (!dirtyForm && !$(".modal")) render({ preserve: true });
    }
  } catch {
  } finally {
    markingRead = false;
  }
}
function patchConversation() {
  if (view !== "messages") return;
  const body = $(".chat-body");
  if (!body) return;
  const ms = S.messages.filter(
    (m) =>
      (m.sender === S.me.id && m.recipient === thread) ||
      (m.sender === thread && m.recipient === S.me.id),
  );
  const nearBottom =
      body.scrollHeight - body.scrollTop - body.clientHeight < 70,
    top = body.scrollTop;
  body.innerHTML =
    ms.map(messageBubble).join("") ||
    empty("Una conversación puede empezar con un simple hola. ✦");
  body.scrollTo(0, nearBottom ? 999999 : top);
}

let syncFailures = 0,
  pollingView = null;
async function poll() {
  clearTimeout(pollTimer);
  try {
    if (
      !S ||
      document.hidden ||
      !navigator.onLine ||
      modalBusy ||
      $(".modal") ||
      pendingRequests
    )
      return;
    const epoch = requestEpoch;
    const next = await api("state", null, "GET", { background: true });
    if (epoch !== requestEpoch || !S) return;
    if (next !== S && JSON.stringify(next) !== JSON.stringify(S)) {
      S = next;
      reindex();
      const editing =
        dirtyForm || document.activeElement?.matches("input,textarea,select");
      if (editing) patchConversation();
      else render({ preserve: true });
      markCurrentThread();
    }
    syncFailures = 0;
  } catch (error) {
    syncFailures++;
    setSync("retrying");
    if (error.status === 401) {
      loginPage();
      toast("Tu sesión terminó. Inicia sesión para continuar.");
    }
  } finally {
    pollTimer = setTimeout(
      poll,
      Math.min(
        60000,
        (view === "messages" ? 6000 : 20000) * Math.max(1, syncFailures),
      ),
    );
  }
}
async function bootstrap() {
  try {
    publicInstitution = await api("institution", null, "GET");
    S = await api("state", null, "GET");
    reindex();
    readRoute();
    render();
    poll();
  } catch (error) {
    if (error.status === 401) loginPage();
    else {
      $("#app").innerHTML =
        `<main class="bootstrap-error">${brand()}<h1>No pudimos abrir tu campus</h1><p>${esc(error.message)}</p><button class="btn primary" id="retry-campus">Volver a intentar ${icon("arrow", 14)}</button></main>`;
      $("#retry-campus").onclick = bootstrap;
    }
  }
}
document.addEventListener("input", (e) => {
  if (e.target.closest("#profile-form,#post-form")) dirtyForm = true;
});
window.addEventListener("beforeunload", (e) => {
  if (
    dirtyForm ||
    modalBusy ||
    $("#modal-form")?.dataset.dirty === "true" ||
    $("#help-reply-form")?.dataset.dirty === "true"
  ) {
    e.preventDefault();
    e.returnValue = "";
  }
});
window.addEventListener("offline", () => setSync("offline"));
window.addEventListener("online", () => {
  setSync("retrying");
  poll();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) poll();
});
bootstrap();
function attachmentField(label = "Adjuntar archivo · máximo 5 MB") {
  return `<div class="form-field"><label for="f-file">${esc(label)}</label><label class="file-drop" for="f-file">${icon("file", 25)}<strong>Elige un archivo o arrástralo aquí</strong><span>Documento, imagen o material de estudio · hasta 5 MB</span><input id="f-file" name="file" type="file" class="file-input"></label></div>`;
}
function bindFileDrops() {
  document.querySelectorAll(".file-drop").forEach((zone) => {
    const input = zone.querySelector("input"),
      title = zone.querySelector("strong");
    input.addEventListener("change", () => {
      const f = input.files[0];
      if (f && f.size > 5 * 1024 * 1024) {
        input.value = "";
        title.textContent = "Elige un archivo o arrástralo aquí";
        modalError(new Error("El archivo no puede superar 5 MB."));
        return;
      }
      title.textContent = f ? f.name : "Elige un archivo o arrástralo aquí";
    });
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("dragging");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("dragging");
      if (e.dataTransfer.files.length) {
        const transfer = new DataTransfer();
        transfer.items.add(e.dataTransfer.files[0]);
        input.files = transfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });
}

function roleScope() {
  return (
    {
      student:
        "Puedes entregar tus actividades, participar en tus aulas y personalizar tu cuenta. La administración corresponde a otros perfiles.",
      teacher:
        "Puedes gestionar actividades, materiales, notas y asistencia de las aulas que tienes asignadas. Las materias y matrículas las gestiona administración.",
      admin:
        "Puedes gestionar las materias, las cuentas y las matrículas del colegio, además de acompañar el trabajo académico.",
    }[S.me.role] || "Consulta a administración sobre tu acceso."
  );
}
function guardForm(path) {
  const permission = {
    ...Object.fromEntries(
      [
        "planner",
        "planner-edit",
        "goal",
        "goal-edit",
        "note",
        "note-edit",
        "portfolio",
        "portfolio-edit",
        "student-settings",
      ].map((k) => [k, "learning.manage"]),
    ),
    "help-ask": "help.ask",
    "course-timetable": "assignments.manage",
    institution: "institution.manage",
    "institution-logo": "institution.manage",
    "membership-bulk": "membership.manage",
    "teacher-assign": "courses.manage",
    "user-details": "users.manage",
    "user-role": "users.manage",
    "teaching-template": "teaching.customize",
    "teaching-template-edit": "teaching.customize",
    "teaching-preferences": "teaching.customize",
    task: "assignments.manage",
    "task-edit": "assignments.manage",
    course: "courses.manage",
    "course-edit": "courses.manage",
    user: "users.manage",
    "user-edit": "users.manage",
    membership: "membership.manage",
    attendance: "attendance.manage",
    resource: "materials.manage",
    "resource-edit": "materials.manage",
    event: "events.manage",
    "event-edit": "events.manage",
    appearance: "appearance.edit",
    password: "profile.edit",
    "post-edit": "wall.participate",
  }[path];
  if (!permission || !can(permission)) {
    toast("Tu perfil no tiene permiso para abrir este formulario.");
    return false;
  }
  return true;
}
function editorSection(number, title, description, fields) {
  return `<section class="editor-section"><div class="editor-section-head"><span>${number}</span><div><h3>${title}</h3><p>${description}</p></div></div><div class="editor-section-body">${fields}</div></section>`;
}
function formMeta(path) {
  const type = path.split("-")[0];
  const map = {
    planner: [
      "Agenda privada",
      "calendar",
      "Organiza tu tiempo. Tus planes personales solo los ves tú.",
      "Mi tiempo",
      "Guardar plan",
    ],
    goal: [
      "Meta personal",
      "leaf",
      "Practica, cuenta tus avances y date espacio para reflexionar.",
      "Mi próximo paso",
      "Guardar meta",
    ],
    note: [
      "Cuaderno privado",
      "book",
      "Guarda tus ideas por materia, con etiquetas y texto propio.",
      "Mi apunte",
      "Guardar apunte",
    ],
    portfolio: [
      "Portafolio",
      "star",
      "Tu aprendizaje, con la privacidad que tú eliges.",
      "Mi proyecto",
      "Guardar proyecto",
    ],
    student: [
      "Mi espacio",
      "flower",
      "Personaliza tu imagen, tus tarjetas y tu comodidad al leer.",
      "Mi propia esencia",
      "Guardar mi espacio",
    ],
    help: [
      "Acompañamiento",
      "heart",
      "Una consulta privada entre tú y el profesor de esta actividad.",
      "Mi pregunta",
      "Enviar consulta",
    ],
    institution: [
      "Institución",
      "flower",
      "Publica la identidad y los apartados que representan a toda tu comunidad.",
      "Identidad institucional",
      "Publicar cambios",
    ],
    teacher: [
      "Asignación docente",
      "profile",
      "El responsable gestiona las materias seleccionadas sin modificar sus matrículas.",
      "Aulas y profesores",
      "Guardar asignación",
    ],
    teaching: [
      "Herramienta docente",
      "flower",
      "Crea, prueba y guarda una herramienta que puedas reutilizar en tus aulas.",
      "Mi herramienta",
      "Guardar herramienta",
    ],
    task: [
      "Actividad",
      "file",
      "Una actividad clara empieza con una buena idea. Define qué aprenderán, cómo entregarán y dale tu estilo.",
      "Contenido y propósito",
      "Publicar actividad",
    ],
    course: [
      "Materia / aula",
      "class",
      "Crea un espacio para aprender. Organiza su identidad, su profesor y las personas que lo acompañan.",
      "Identidad del aula",
      "Crear aula",
    ],
    user: [
      "Persona",
      "users",
      "Una cuenta, un rol y los permisos que le corresponden. Elige el acceso con cuidado.",
      "Datos de la cuenta",
      "Crear cuenta",
    ],
    membership: [
      "Matrículas",
      "users",
      "Selecciona a los estudiantes que participarán en esta aula.",
      "Personas del aula",
      "Guardar matrículas",
    ],
    attendance: [
      "Asistencia",
      "check",
      "Registra quién estuvo presente en la fecha seleccionada.",
      "Encuentro del día",
      "Guardar asistencia",
    ],
    resource: [
      "Material",
      "book",
      "Comparte apuntes, un enlace o un archivo para acompañar el aprendizaje.",
      "Tu material de estudio",
      "Publicar material",
    ],
    event: [
      "Evento",
      "calendar",
      "Organiza el próximo encuentro de tu comunidad.",
      "Detalles del encuentro",
      "Crear evento",
    ],
    password: [
      "Seguridad",
      "shield",
      "Elige una contraseña de al menos diez caracteres para proteger tu cuenta.",
      "Acceso seguro",
      "Actualizar contraseña",
    ],
    appearance: [
      "Personalización",
      "flower",
      "Haz que Luma se sienta más tuyo. Estos ajustes se guardan en tu cuenta.",
      "Tu estilo en el campus",
      "Guardar mi estilo",
    ],
    post: [
      "Publicación",
      "message",
      "Comparte tu idea con las personas de tu aula.",
      "Tu publicación",
      "Guardar publicación",
    ],
  };
  const [label, icon, description, section, save] = map[type] || map.post;
  return {
    label,
    icon,
    description,
    section,
    save: path.endsWith("-edit") ? "Guardar cambios" : save,
  };
}
function paletteField(name, value = "purple", label = "Elige una paleta") {
  const labels = {
    pink: "Rosa flor",
    purple: "Lavanda",
    green: "Salvia",
    peach: "Durazno",
    blue: "Cielo",
    yellow: "Vainilla",
  };
  return `<fieldset class="palette-field"><legend>${label}</legend><div class="palette-options">${Object.entries(
    labels,
  )
    .map(
      ([id, title]) =>
        `<label class="palette-option"><input type="radio" name="${name}" value="${id}" ${id === value ? "checked" : ""}><span class="palette-swatch ${id}">${icon("check", 16)}</span><small>${title}</small></label>`,
    )
    .join("")}</div></fieldset>`;
}
function taskKind(kind) {
  return (
    {
      assignment: "Actividad",
      project: "Proyecto",
      quiz: "Cuestionario",
      reading: "Lectura",
    }[kind] || "Actividad"
  );
}
function deliveryName(mode) {
  return (
    { both: "Texto o archivo", text: "Solo texto", file: "Archivo requerido" }[
      mode
    ] || "Texto o archivo"
  );
}
function openTaskEditor(id) {
  if (!can("assignments.manage"))
    return toast(
      "La creación de actividades corresponde al profesor y a administración.",
    );
  if (!S.courses.length)
    return toast("Necesitas un aula asignada para crear una actividad.");
  const t = id ? indexMaps.tasks.get(id) : null;
  if (id && !t) return;
  const defaults = S.me.preferences?.teaching || {};
  const hasSubmissions = t && S.submissions.some((s) => s.task === id);
  const preset = !t
    ? `<div class="editor-presets" aria-label="Ideas para empezar"><span>Empieza con una idea</span><button type="button" data-preset="assignment">${icon("file", 16)} Actividad</button><button type="button" data-preset="project">${icon("star", 16)} Proyecto</button><button type="button" data-preset="reading">${icon("book", 16)} Lectura</button></div>`
    : "";
  const body =
    `${t ? `<input type="hidden" name="id" value="${id}">` : ""}${preset}` +
    editorSection(
      "01",
      "La idea y su propósito",
      "Dales a tus estudiantes un título claro y las instrucciones que necesitan.",
      `${t ? `<div class="editor-course-context">${icon("class", 18)} ${esc(course(t.course)?.title)}</div>` : courseSelect()}${field("title", "Nombre de la actividad *", "text", t?.title || "", 'required maxlength="200" placeholder="Por ejemplo: Mi jardín de ideas"')}${textarea("description", "Instrucciones *", t?.description || "", 'required maxlength="5000" placeholder="¿Qué van a hacer? ¿Qué deben incluir? ¿Cómo lo revisarás?"')}`,
    ) +
    editorSection(
      "02",
      "Cómo y cuándo entregar",
      "Define las condiciones que verá el estudiante antes de empezar.",
      `<div class="form-grid">${field("due", "Fecha de entrega *", "date", t?.due || defaultDueDate(defaults.due_days || 7), "required")}${field("points", "Puntos *", "number", t?.points ?? defaults.points ?? 100, `required min="1" max="1000" ${hasSubmissions ? "readonly" : ""}`)}${select(
        "kind",
        "Tipo de actividad",
        [
          ["assignment", "Actividad"],
          ["project", "Proyecto"],
          ["quiz", "Cuestionario"],
          ["reading", "Lectura"],
        ],
        t?.kind || defaults.kind || "assignment",
      )}${
        hasSubmissions
          ? `<input type="hidden" name="submission_mode" value="${t.submission_mode}"><div class="form-field"><label>Formato de entrega</label><p class="locked-field">${icon("shield", 15)} ${deliveryName(t.submission_mode)}</p></div>`
          : select(
              "submission_mode",
              "Formato de entrega",
              [
                ["both", "Texto o archivo"],
                ["text", "Solo texto"],
                ["file", "Archivo requerido"],
              ],
              t?.submission_mode || defaults.submission_mode || "both",
            )
      }</div><label class="setting-toggle"><input type="checkbox" name="allow_late" ${(t?.allow_late ?? defaults.allow_late ?? true) ? "checked" : ""}><span><strong>Permitir entregas después de la fecha</strong><small>El cierre manual de la actividad siempre bloquea nuevas entregas.</small></span></label>${hasSubmissions ? '<p class="form-help">Los puntos y el formato se conservan porque ya hay entregas.</p>' : ""}`,
    ) +
    editorSection(
      "03",
      "Un toque de tu estilo",
      "Elige el color que acompañará a esta actividad.",
      paletteField("color", t?.color || defaults.color || "purple"),
    ) +
    teachingTaskOptions(t);
  formModal(
    t ? "Renueva tu actividad" : "Crea algo que inspire",
    body,
    t ? "task-edit" : "task",
    (d, f) => ({
      ...d,
      ...(t ? { id: +d.id } : { course: +d.course }),
      points: +d.points,
      allow_late: f.has("allow_late"),
      ...taskTeachingData(d, t),
    }),
    t
      ? "Actividad actualizada. Sus entregas se conservan."
      : "Actividad publicada en el aula.",
  );
  bindTaskTeaching(t);
}
function bindEditorPresets() {
  const presets = {
    assignment: {
      title: "Mi jardín de ideas",
      description:
        "Explora el tema visto en clase. Explica tres ideas que te llamaron la atención y acompaña cada una con un ejemplo propio.",
      mode: "both",
    },
    project: {
      title: "Un proyecto que transforma",
      description:
        "Investiga una situación de tu comunidad. Propón una solución, documenta tu proceso y entrega un archivo con tus hallazgos y conclusiones.",
      mode: "file",
    },
    reading: {
      title: "Leer, descubrir y compartir",
      description:
        "Lee el material de la clase. Escribe una reflexión sobre la idea principal e incluye una pregunta para conversar en el aula.",
      mode: "text",
    },
  };
  $$("[data-preset]").forEach(
    (b) =>
      (b.onclick = () => {
        const f = $("#modal-form"),
          v = presets[b.dataset.preset];
        if (
          (f.elements.title.value || f.elements.description.value) &&
          !confirm(
            "¿Quieres reemplazar el título y las instrucciones con esta idea?",
          )
        )
          return;
        f.elements.title.value = v.title;
        f.elements.description.value = v.description;
        f.elements.kind.value = b.dataset.preset;
        f.elements.submission_mode.value = v.mode;
        f.dataset.dirty = "true";
        updateFormPreview();
      }),
  );
}
function updateFormPreview() {
  const f = $("#modal-form"),
    el = $("#form-preview");
  if (!f || !el) return;
  const d = Object.fromEntries(new FormData(f)),
    type = f.dataset.path.split("-")[0],
    c = course(+d.course) || course(currentCourse),
    color = d.color || d.accent || c?.color || "purple";
  const name =
    d.title ||
    d.name ||
    (type === "appearance" ? "Mi Luma, a mi manera" : "Tu próxima gran idea");
  const desc =
    d.description ||
    d.summary ||
    d.body ||
    d.reflection ||
    d.question ||
    d.notes ||
    (type === "appearance"
      ? "Un campus cómodo, colorido y con tu esencia."
      : "Tus palabras darán vida a este espacio. Aquí puedes ver cómo va quedando.");
  el.innerHTML = `<div class="preview-card ${esc(color)}"><div class="preview-art">${art(c?.symbol || "flower")}<span>✧</span></div><span class="preview-badge">${type === "task" ? taskKind(d.kind) : formMeta(f.dataset.path).label}</span><h3>${esc(name)}</h3><p>${esc(desc)}</p>${type === "task" ? `<div class="preview-details"><span>${icon("calendar", 14)} ${d.due ? dateFormat(d.due) : "Elige una fecha"}</span><span>${d.points || 100} puntos</span><span>${deliveryName(d.submission_mode)}</span></div>` : type === "user" ? `<div class="preview-details">${roleNames[d.role] || roleNames[person(+d.id)?.role] || "Estudiante"}</div>` : ""}</div>${type === "user" ? `<div class="preview-role"><strong>Permisos de ${roleNames[d.role] || roleNames[person(+d.id)?.role] || "Estudiante"}</strong><p>${scopeForRole(d.role || person(+d.id)?.role || "student")}</p></div>` : ""}`;
  f.querySelectorAll("[required]").forEach((input) => {
    const label = f.querySelector(`label[for="${input.id}"]`);
    if (label && !label.textContent.includes("*")) label.textContent += " *";
  });
  f.querySelectorAll("textarea[maxlength]").forEach((input) => {
    let counter = input.parentElement.querySelector(".character-count");
    if (!counter) {
      counter = document.createElement("small");
      counter.className = "character-count";
      input.after(counter);
    }
    counter.textContent = `${input.value.length} / ${input.maxLength}`;
  });
}
function scopeForRole(role) {
  return (
    {
      student:
        "Sus aulas matriculadas, sus propias entregas y notas, sus conversaciones y su perfil. No crea materias, actividades ni cuentas.",
      teacher:
        "Actividades, materiales, calificaciones y asistencia de sus aulas asignadas; sus propios eventos. No crea materias, cuentas ni matrículas.",
      admin:
        "Materias, cuentas y matrículas de todo el colegio, y gestión académica. Las conversaciones privadas pertenecen a sus participantes.",
    }[role] || "Sin permisos asignados."
  );
}
function profileOptions() {
  return `<div class="profile-options"><div><span class="option-icon purple">${icon("flower", 22)}</span><h3>Tu Luma, a tu manera</h3><p>Colores, comodidad y movimiento. Tu estilo se guarda en tu cuenta.</p><button class="btn small" data-action="appearance">Personalizar mi campus</button></div><div><span class="option-icon green">${icon("shield", 22)}</span><h3>Mi perfil y sus permisos</h3><p>${scopeForRole(S.me.role)}</p><button class="btn small" data-action="permissions">Ver permisos por perfil</button></div></div>`;
}
function openAppearance() {
  const a = S.me.preferences?.appearance || {};
  formModal(
    "Tu Luma, a tu manera",
    editorSection(
      "01",
      "Un color que te represente",
      "Acentos de botones y navegación para tu cuenta.",
      paletteField("accent", a.accent || "institution", "Mi color favorito") +
        `<label class="setting-toggle"><input type="radio" name="accent" value="institution" ${!a.accent || a.accent === "institution" ? "checked" : ""}><span><strong>Usar los colores de mi institución</strong><small>El acento sigue la identidad del colegio.</small></span></label>`,
    ) +
      editorSection(
        "02",
        "Encuentra tu comodidad",
        "Estos ajustes solo cambian cómo tú ves el campus.",
        `${select(
          "density",
          "Espacio entre elementos",
          [
            ["comfortable", "Cómodo y espacioso"],
            ["compact", "Más compacto"],
          ],
          a.density || "comfortable",
        )} ${select(
          "font_size",
          "Tamaño de letra",
          [
            ["standard", "Estándar"],
            ["large", "Más grande"],
            ["extra", "Grande extra"],
          ],
          a.font_size || "standard",
        )}<label class="setting-toggle"><input type="checkbox" name="high_contrast" ${a.high_contrast ? "checked" : ""}><span><strong>Mayor contraste</strong><small>Textos y bordes más definidos.</small></span></label><label class="setting-toggle"><input type="checkbox" name="reduce_motion" ${a.reduce_motion ? "checked" : ""}><span><strong>Reducir animaciones</strong><small>Prefiere transiciones suaves y menos movimiento.</small></span></label>`,
      ),
    "appearance",
    (d, f) => ({
      ...d,
      reduce_motion: f.has("reduce_motion"),
      high_contrast: f.has("high_contrast"),
    }),
    "Tu estilo quedó guardado en tu cuenta.",
  );
}
function applyAppearance() {
  const a = S?.me.preferences?.appearance || {};
  document.body.dataset.accent = a.accent || "institution";
  document.body.style.setProperty(
    "--institution-primary",
    institutionData().primary,
  );
  document.body.style.setProperty(
    "--institution-secondary",
    institutionData().secondary,
  );
  document.body.dataset.density = a.density || "comfortable";
  document.body.classList.toggle("reduce-motion", !!a.reduce_motion);
  document.body.dataset.fontSize = a.font_size || "standard";
  document.body.classList.toggle("high-contrast", !!a.high_contrast);
}
function openPermissions() {
  const rows = [
    ["Identidad, logo y módulos institucionales", "No", "No", "Sí"],
    ["Desactivar cuentas y archivar materias", "No", "No", "Sí"],
    ["Crear y editar materias", "No", "No", "Sí"],
    ["Crear cuentas y matricular", "No", "No", "Sí"],
    [
      "Actividades, materiales y asistencia",
      "Consultar",
      "Sus aulas",
      "Todas las aulas",
    ],
    ["Calificar entregas", "No", "Sus aulas", "Todas las aulas"],
    ["Entregar actividades", "Sus entregas", "No", "No"],
    ["Ver notas y asistencia", "Sus registros", "Sus aulas", "Todo el colegio"],
    ["Publicar en el muro", "Sus aulas", "Sus aulas", "Todas las aulas"],
    [
      "Editar / eliminar publicaciones",
      "Las propias",
      "Sus aulas",
      "Todas las aulas",
    ],
    ["Crear / editar eventos", "No", "Los propios", "Todos"],
    ["Rúbricas y formularios docentes", "No", "Su biblioteca", "Su biblioteca"],
    ["Agenda, metas y cuaderno", "Solo su cuenta", "No", "No"],
    ["Luma AI, fuentes y sesiones", "Solo su cuenta", "No", "No"],
    [
      "Portafolio del estudiante",
      "Sus entradas",
      "Compartido de sus aulas",
      "No",
    ],
    ["Consultas de actividades", "Las propias", "Sus aulas", "No"],
    ["Perfil y apariencia", "Su cuenta", "Su cuenta", "Su cuenta"],
    [
      "Mensajes privados",
      "Sus conversaciones",
      "Sus conversaciones",
      "Sus conversaciones",
    ],
  ];
  modal(
    "Cada perfil, su espacio",
    `<p class="modal-description">Tu perfil actual: <strong>${roleNames[S.me.role]}</strong>. ${roleScope()}</p><div class="table-wrap permissions-table"><table><thead><tr><th>Acción</th><th>Estudiante</th><th>Profesor</th><th>Administrador</th></tr></thead><tbody>${rows.map((row) => `<tr>${row.map((v, i) => (i ? `<td class="${v === "No" ? "permission-no" : "permission-yes"}">${esc(v)}</td>` : `<th scope="row">${esc(v)}</th>`)).join("")}</tr>`).join("")}</tbody></table></div>`,
  );
}
