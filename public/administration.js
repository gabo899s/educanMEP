/* Administrative workspace: institutional identity, people, catalog and enrollment. */
let publicInstitution = null,
  adminTab = "overview",
  adminQuery = "",
  adminRole = "all",
  adminStatus = "all";
const adminTabs = [
  ["overview", "Vista general", "home"],
  ["identity", "Identidad", "flower"],
  ["courses", "Materias", "class"],
  ["people", "Personas", "users"],
  ["enrollment", "Matrículas", "book"],
  ["modules", "Módulos y apartados", "menu"],
  ["history", "Historial", "clock"],
];
function institutionData() {
  return (
    S?.institution ||
    publicInstitution || {
      name: "Mi institución",
      short_name: "luma",
      motto: "Un lugar para aprender y florecer.",
      year: "2026",
      primary: "#70547e",
      secondary: "#f0e5f1",
      modules: {},
      sections: [],
    }
  );
}
function moduleEnabled(key) {
  return institutionData().modules?.[key]?.enabled !== false;
}
function moduleLabel(key, fallback) {
  return institutionData().modules?.[key]?.label || fallback;
}
function institutionPayload(overrides = {}) {
  const i = institutionData();
  return { ...i, ...overrides };
}
function adminPeople() {
  return S.administration?.people || [];
}
function adminPerson(id) {
  return adminPeople().find((p) => p.id === id);
}
function adminProfileCard() {
  if (S.me.role !== "admin") return "";
  return `<section class="admin-profile-banner"><div class="option-icon purple">${icon("shield", 25)}</div><div><span class="eyebrow">DIRECCIÓN Y ADMINISTRACIÓN</span><h2>Tu colegio, con tu identidad.</h2><p>${esc(institutionData().name)} · Gestiona marca, personas, materias y matrículas.</p></div><button class="btn primary" data-view="admin">Abrir centro de gestión ${icon("arrow", 14)}</button></section>`;
}
function institutionSections() {
  return (institutionData().sections || []).length
    ? `<section class="institution-sections"><div class="section-head"><h2>En nuestra institución ✦</h2></div><div class="admin-card-grid">${institutionData()
        .sections.map(
          (s, i) =>
            `<article class="panel institutional-card ${["pink", "green", "purple"][i % 3]}"><span class="eyebrow">COMUNIDAD · ${String(i + 1).padStart(2, "0")}</span><h3>${esc(s.title)}</h3><p>${esc(s.body)}</p>${s.url ? `<a class="btn small" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Más información ${icon("arrow", 13)}</a>` : ""}</article>`,
        )
        .join("")}</div></section>`
    : "";
}
function adminWorkspace() {
  if (S.me.role !== "admin")
    return empty("Esta área corresponde a administración.");
  const active = adminPeople().filter((p) => p.active),
    cs = S.courses.filter((c) => !c.archived),
    teachers = active.filter((p) => p.role === "teacher"),
    students = active.filter((p) => p.role === "student");
  const bodies = {
    overview: adminOverview,
    identity: adminIdentity,
    courses: adminCourses,
    people: adminDirectory,
    enrollment: adminEnrollment,
    modules: adminModules,
    history: adminHistory,
  };
  return `${heading("Todo un colegio, bien acompañado ✦", "Un centro de gestión con la identidad y las conexiones de tu comunidad.", '<button class="btn primary" data-admin-action="identity">' + icon("flower", 15) + " Personalizar colegio</button>")}<section class="admin-hero"><div><span class="mini-tag">CENTRO DE ADMINISTRACIÓN</span><h2>${esc(institutionData().name)}</h2><p>${esc(institutionData().motto)}</p><span class="badge">Curso lectivo · ${esc(institutionData().year)}</span></div><div class="admin-seal">${institutionData().logo ? `<img src="${esc(institutionData().logo)}" alt="Logo institucional">` : art("flower", 105)}<span>Tu comunidad<br>empieza aquí ✧</span></div></section><div class="stats">${stat(students.length, "Estudiantes activos", "book", "pink")}${stat(teachers.length, "Profesores activos", "profile", "green")}${stat(cs.length, "Materias activas", "class", "purple")}${stat(
    cs.reduce((n, c) => n + c.students.length, 0),
    "Matrículas",
    "users",
    "peach",
  )}</div><nav class="admin-tabs" aria-label="Gestión institucional">${adminTabs.map(([id, label, name]) => `<button data-admin-tab="${id}" aria-current="${adminTab === id ? "page" : "false"}" class="${adminTab === id ? "active" : ""}">${icon(name, 16)}${label}</button>`).join("")}</nav><section class="admin-body">${(bodies[adminTab] || adminOverview)()}</section>`;
}
function adminOverview() {
  const i = institutionData(),
    cs = S.courses.filter((c) => !c.archived),
    people = adminPeople().filter((p) => p.active),
    noStudents = cs.filter((c) => !c.students.length),
    idle = people.filter(
      (p) => p.role === "teacher" && !cs.some((c) => c.teacher === p.id),
    ),
    unassigned = people.filter(
      (p) => p.role === "student" && !cs.some((c) => c.students.includes(p.id)),
    );
  const cards = [
    [
      "identity",
      "Una identidad que se reconoce",
      "Nombre, logo, colores y mensajes de tu institución.",
      "flower",
      "pink",
    ],
    [
      "courses",
      "Materias con su propia esencia",
      "Profesores responsables, grupos, horarios y archivo.",
      "class",
      "purple",
    ],
    [
      "people",
      "Cada persona, su espacio",
      "Cuentas, fichas, acceso y permisos por perfil.",
      "users",
      "green",
    ],
    [
      "enrollment",
      "Conexiones que hacen escuela",
      "Matrícula de varios estudiantes en varias materias.",
      "book",
      "peach",
    ],
    [
      "modules",
      "Un campus a tu medida",
      "Activa herramientas y publica apartados de inicio.",
      "menu",
      "blue",
    ],
    [
      "history",
      "Cambios con contexto",
      "Consulta quién gestionó el colegio y cuándo.",
      "clock",
      "yellow",
    ],
  ];
  return `<div class="admin-card-grid">${cards.map(([tab, title, desc, name, color]) => `<button class="panel admin-shortcut" data-admin-tab="${tab}"><span class="option-icon ${color}">${icon(name, 23)}</span><h3>${title}</h3><p>${desc}</p><span class="link-btn">Abrir ${icon("arrow", 13)}</span></button>`).join("")}</div><div class="admin-two-columns"><section class="panel"><div class="section-head"><h2>Pequeños pendientes, grandes mejoras</h2>${icon("spark", 18)}</div>${[
    [noStudents.length, "materias sin estudiantes", "enrollment"],
    [idle.length, "profesores sin materia activa", "courses"],
    [unassigned.length, "estudiantes sin matrícula", "enrollment"],
  ]
    .map(
      ([n, label, tab]) =>
        `<button class="admin-health-row" data-admin-tab="${tab}"><strong>${n}</strong><span>${label}</span>${icon("arrow", 14)}</button>`,
    )
    .join(
      "",
    )}<p class="form-help">Los indicadores usan cuentas y materias activas. El archivo conserva el historial académico.</p></section><section class="panel"><div class="section-head"><h2>Tu configuración institucional</h2><button class="link-btn" data-admin-action="identity">Editar</button></div><div class="brand-sample" style="--sample-primary:${esc(i.primary)};--sample-secondary:${esc(i.secondary)}">${i.logo ? `<img src="${esc(i.logo)}" alt="Logo institucional">` : art("flower", 50)}<div><strong>${esc(i.short_name)}</strong><p>${esc(i.motto)}</p></div></div><div class="admin-colors"><span style="background:${esc(i.primary)}"></span><span style="background:${esc(i.secondary)}"></span><small>${esc(i.primary)} · ${esc(i.secondary)}</small></div><p class="form-help">${Object.values(i.modules).filter((m) => m.enabled).length} apartados activos · ${i.sections.length} tarjetas institucionales en el inicio</p></section></div>${adminHistory(true)}`;
}
function adminIdentity() {
  const i = institutionData();
  return `<div class="admin-two-columns"><section class="panel"><span class="eyebrow">LA ESENCIA DE TU INSTITUCIÓN</span><h2 style="margin:12px 0">Deja que tu colegio se reconozca.</h2><p class="muted">Los cambios se aplican al acceso, la navegación y los botones de toda la comunidad. Las preferencias personales pueden elegir otro acento.</p><div class="brand-sample" style="--sample-primary:${esc(i.primary)};--sample-secondary:${esc(i.secondary)}">${i.logo ? `<img src="${esc(i.logo)}" alt="Logo institucional">` : art("flower", 65)}<div><strong>${esc(i.short_name)}</strong><p>${esc(i.name)}</p><small>${esc(i.year)}</small></div></div><button class="btn primary" data-admin-action="identity">Editar identidad ${icon("flower", 15)}</button></section><section class="panel"><span class="eyebrow">UN SÍMBOLO QUE NOS UNE</span><h2 style="margin:12px 0">Logo institucional</h2><div class="logo-stage">${i.logo ? `<img src="${esc(i.logo)}" alt="Logo actual de ${esc(i.name)}">` : art("flower", 110)}</div><p class="form-help">PNG · hasta 2 MB y 2048 × 2048 píxeles. La transparencia queda preservada.</p><div class="admin-actions"><button class="btn" data-admin-action="logo">${icon("file", 15)} ${i.logo ? "Cambiar logo" : "Subir logo"}</button>${i.logo ? '<button class="link-btn danger" data-admin-action="logo-delete">Retirar logo</button>' : ""}</div></section></div>`;
}
function adminCourses() {
  const list = S.courses.filter(
    (c) =>
      normalize(
        c.title +
          " " +
          c.code +
          " " +
          c.room +
          " " +
          (adminPerson(c.teacher)?.name || ""),
      ).includes(normalize(adminQuery)) &&
      (adminStatus === "all" || (adminStatus === "archived") === c.archived),
  );
  return `<div class="section-head"><div><h2>Catálogo de materias</h2><p class="muted">Identidad, responsables, grupos y matrículas. Archivar conserva los datos.</p></div><div class="admin-actions"><button class="btn" data-admin-action="assign">Reasignar profesores</button><button class="btn primary" data-action="new-course">${icon("plus", 14)} Crear materia</button></div></div>${adminFilter("courses")}<div class="admin-course-grid">${list.map((c) => `<article class="panel admin-course ${esc(c.color)}"><div class="section-head"><span class="badge">${esc(c.code)}</span><span class="badge">${c.archived ? "Archivada" : "Activa"}</span></div><div class="admin-course-heading"><div><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p></div>${art(c.symbol, 64)}</div><dl><div><dt>Profesor</dt><dd>${esc(adminPerson(c.teacher)?.name || "Sin responsable")}</dd></div><div><dt>Grupo y horario</dt><dd>${esc(c.room)} · ${esc(c.schedule || "Por definir")}</dd></div><div><dt>Matrículas</dt><dd>${c.students.length} estudiantes · ${S.tasks.filter((t) => t.course === c.id).length} actividades</dd></div></dl><div class="admin-actions"><button class="btn small" data-edit-course="${c.id}">Personalizar</button>${!c.archived ? `<button class="btn small" data-admin-enroll="${c.id}">Matricular</button>` : ""}<button class="link-btn ${c.archived ? "" : "danger"}" data-admin-archive="${c.id}">${c.archived ? "Restaurar" : "Archivar"}</button></div></article>`).join("") || empty("No encontramos materias con estos filtros.")}</div>`;
}
function adminFilter(kind) {
  return `<div class="admin-filter"><label class="search">${icon("search", 15)}<input id="admin-query" value="${esc(adminQuery)}" placeholder="Buscar ${kind === "courses" ? "materia, profesor o grupo" : "nombre, correo o identificador"}…" aria-label="Buscar en administración"></label>${
    kind === "people"
      ? `<select id="admin-role" aria-label="Filtrar perfil">${[
          ["all", "Todos los perfiles"],
          ["teacher", "Profesores"],
          ["guardian", "Familiares"],
          ["student", "Estudiantes"],
          ["admin", "Administradores"],
        ]
          .map(
            ([k, v]) =>
              `<option value="${k}" ${adminRole === k ? "selected" : ""}>${v}</option>`,
          )
          .join("")}</select>`
      : ""
  }<select id="admin-status" aria-label="Filtrar estado">${[
    ["all", "Todos los estados"],
    [kind === "courses" ? "active" : "enabled", "Activos"],
    [
      kind === "courses" ? "archived" : "disabled",
      kind === "courses" ? "Archivadas" : "Inactivos",
    ],
  ]
    .map(
      ([k, v]) =>
        `<option value="${k}" ${adminStatus === k ? "selected" : ""}>${v}</option>`,
    )
    .join("")}</select></div>`;
}
function adminDirectory() {
  const list = adminPeople().filter(
    (p) =>
      (adminRole === "all" || p.role === adminRole) &&
      (adminStatus === "all" || (adminStatus === "enabled") === p.active) &&
      normalize(
        p.name + " " + p.email + " " + p.department + " " + p.identifier,
      ).includes(normalize(adminQuery)),
  );
  return `<div class="section-head"><div><h2>Una comunidad con nombres propios</h2><p class="muted">${list.length} personas · Perfiles y acceso controlados por administración.</p></div><div class="admin-actions"><a class="btn" href="/api/people-export">${icon("download", 14)} Exportar CSV</a><button class="btn primary" data-action="new-user">${icon("plus", 14)} Nueva persona</button></div></div>${adminFilter("people")}<div class="table-wrap"><table><thead><tr><th>Persona</th><th>Perfil / ficha</th><th>Materias activas</th><th>Acceso</th><th>Gestionar</th></tr></thead><tbody>${list.map((p) => `<tr><td><div class="admin-person">${avatar(p)}<div><strong>${esc(p.name)}</strong><small>${esc(p.email)}</small></div></div></td><td><span class="badge">${roleNames[p.role]}</span><small class="admin-cell-note">${esc(p.department || p.identifier || "Ficha por completar")}</small></td><td>${S.courses.filter((c) => !c.archived && (c.teacher === p.id || c.students.includes(p.id))).length}</td><td><span class="badge ${p.active ? "done" : ""}">${p.active ? "Activo" : "Inactivo"}</span></td><td><div class="admin-actions">${p.active ? `<button class="link-btn" data-edit-user="${p.id}">Cuenta</button>` : ""}<button class="link-btn" data-admin-details="${p.id}">Ficha</button>${p.id !== S.me.id ? `<button class="link-btn" data-admin-role="${p.id}">Perfil</button>` : ""}${p.role === "teacher" && p.active ? `<button class="link-btn" data-admin-teacher="${p.id}">Materias</button>` : ""}${p.id !== S.me.id ? `<button class="link-btn ${p.active ? "danger" : ""}" data-admin-status="${p.id}">${p.active ? "Desactivar" : "Reactivar"}</button>` : '<span class="muted">Tu cuenta</span>'}</div></td></tr>`).join("") || '<tr><td colspan="5">No encontramos personas con estos filtros.</td></tr>'}</tbody></table></div><div class="admin-explanation"><span>${icon("shield", 22)}</span><p>Desactivar bloquea el acceso y conserva entregas, notas y matrículas. Un profesor con materias activas necesita una reasignación previa. Los mensajes privados solo los ven sus participantes.</p></div>`;
}
function adminEnrollment() {
  const cs = S.courses.filter((c) => !c.archived);
  return `<div class="section-head"><div><h2>Matrículas que conectan</h2><p class="muted">Selecciona estudiantes y materias, revisa el impacto y guarda en un solo paso.</p></div><button class="btn primary" data-admin-action="enroll">${icon("plus", 14)} Matricular por lote</button></div><div class="admin-explanation"><span>${icon("book", 23)}</span><p>Añadir conserva las matrículas actuales; retirar quita acceso al aula; reemplazar deja únicamente los estudiantes seleccionados. Las entregas y calificaciones se conservan en las tres operaciones.</p></div><div class="table-wrap"><table><thead><tr><th>Materia / grupo</th><th>Responsable</th><th>Estudiantes matriculados</th><th>Gestionar</th></tr></thead><tbody>${
    cs
      .map(
        (c) =>
          `<tr><td><strong>${esc(c.title)}</strong><small class="admin-cell-note">${esc(c.code)} · ${esc(c.room)}</small></td><td>${esc(adminPerson(c.teacher)?.name)}</td><td>${c.students.length}<small class="admin-cell-note">${esc(
            c.students
              .slice(0, 3)
              .map((id) => adminPerson(id)?.name || "Cuenta inactiva")
              .join(", "),
          )}${c.students.length > 3 ? "…" : ""}</small></td><td><button class="btn small" data-admin-enroll="${c.id}">Gestionar matrícula</button></td></tr>`,
      )
      .join("") ||
    '<tr><td colspan="4">Crea una materia para empezar.</td></tr>'
  }</tbody></table></div>`;
}
function adminModules() {
  const i = institutionData();
  return `<div class="section-head"><div><h2>Tu campus, a tu manera</h2><p class="muted">Nombres propios, herramientas activas y apartados para tu comunidad.</p></div><button class="btn primary" data-admin-action="modules">Configurar apartados</button></div><div class="admin-card-grid">${Object.entries(
    i.modules,
  )
    .map(
      ([key, m]) =>
        `<article class="panel module-card"><div class="section-head"><span class="option-icon ${m.enabled ? "green" : "pink"}">${icon(m.enabled ? "check" : "shield", 22)}</span><span class="badge">${["home", "classroom", "tasks"].includes(key) ? "Esencial" : m.enabled ? "Activo" : "Desactivado"}</span></div><h3>${esc(m.label)}</h3><p>${esc(moduleDescriptions[key] || "Un espacio para tu comunidad.")}</p></article>`,
    )
    .join(
      "",
    )}</div><div class="section-head" style="margin-top:28px"><h2>Tarjetas institucionales del inicio</h2><button class="btn" data-admin-action="sections">Editar tarjetas</button></div>${institutionSections() || empty("Publica bienvenida, biblioteca, orientación o enlaces para las familias. Hasta seis tarjetas.")}`;
}
const moduleDescriptions = {
  home: "El inicio reúne actividades y novedades del colegio.",
  classroom: "Aulas, materias y personas de cada grupo.",
  tasks: "Creación de actividades y entregas de estudiantes.",
  messages: "Conversaciones privadas entre miembros del campus.",
  calendar: "Encuentros y eventos de la comunidad.",
  grades: "Revisión de entregas, calificaciones y exportación.",
  attendance: "Registro de asistencia por aula y fecha.",
  families: "Vínculos familiares, comunicación oficial, permisos y trámites.",
  studio: "Biblioteca personal de rúbricas y campos inteligentes.",
  materials: "Apuntes, archivos y enlaces de estudio.",
  wall: "Publicaciones e ideas compartidas dentro de cada aula.",
};
function adminHistory(compact = false) {
  const items = (S.administration?.log || []).slice(0, compact ? 5 : 100);
  return `<section class="panel admin-history"><div class="section-head"><div><h2>${compact ? "Lo último en tu colegio" : "Historial de administración"}</h2><p class="muted">${compact ? "Cambios recientes" : "Hasta 100 cambios recientes, con responsable y fecha."}</p></div>${compact ? '<button class="link-btn" data-admin-tab="history">Ver historial</button>' : icon("clock", 21)}</div>${items.map((l) => `<div class="admin-log-row"><span class="option-icon ${l.action.includes("institution") ? "pink" : l.action.includes("membership") ? "green" : "purple"}">${icon(l.action.includes("institution") ? "flower" : "check", 16)}</span><div><strong>${esc(l.summary)}</strong><small>${esc(l.actor_name)} · ${dateFormat(l.created)} · ${new Date(l.created).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}</small></div></div>`).join("") || empty("Aquí aparecerán los cambios que guardes desde administración.")}</section>`;
}
function openInstitutionIdentity() {
  const i = institutionData();
  formModal(
    "La identidad de nuestro colegio",
    editorSection(
      "01",
      "Así nos presentamos",
      "Nombre completo para la institución; nombre corto para la marca.",
      `${field("name", "Nombre de la institución", "text", i.name, 'required maxlength="120"')}${field("short_name", "Nombre corto de la marca", "text", i.short_name, 'required maxlength="30"')}${textarea("motto", "Lema o mensaje de bienvenida", i.motto, 'maxlength="200"')}${field("year", "Curso lectivo / período", "text", i.year, 'required maxlength="40"')}`,
    ) +
      editorSection(
        "02",
        "Colores que nos representan",
        "El principal se usa en botones y navegación. El fondo acompaña las tarjetas; la vista previa se actualiza al escribir.",
        `<div class="form-grid">${field("primary", "Color principal", "color", i.primary, "required")}${field("secondary", "Color de acompañamiento", "color", i.secondary, "required")}</div><p class="form-help">El principal debe tener suficiente contraste con el blanco. Puedes probar #70547e, #40684b o #335d89.</p>`,
      ),
    "institution",
    (d) => institutionPayload(d),
    "La identidad institucional quedó publicada.",
  );
  const f = $("#modal-form");
  if (!f) return;
  const preview = () => {
    const d = Object.fromEntries(new FormData(f));
    $("#form-preview").innerHTML =
      `<div class="institution-live-preview" style="--sample-primary:${esc(d.primary)};--sample-secondary:${esc(d.secondary)}"><span class="eyebrow">TU INSTITUCIÓN</span>${i.logo ? `<img src="${esc(i.logo)}" alt="Logo de vista previa">` : art("flower", 85)}<h3>${esc(d.short_name)}</h3><p>${esc(d.name)}</p><small>${esc(d.year)}</small><blockquote>${esc(d.motto)}</blockquote><span class="preview-brand-button">Entrar a mi campus ✦</span></div>`;
  };
  f.addEventListener("input", preview);
  f.addEventListener("change", preview);
  preview();
}
function openInstitutionLogo() {
  formModal(
    "Un símbolo de nuestra comunidad",
    editorSection(
      "01",
      "Comparte el logo institucional",
      "PNG transparente o con fondo; hasta 2 MB y 2048 × 2048 píxeles.",
      `<div class="form-field"><label for="institution-logo-file">Selecciona tu logo PNG</label><input type="file" id="institution-logo-file" name="file" accept="image/png,.png" required><p class="form-help">Si lo tienes en JPG, expórtalo como PNG desde tu editor de imágenes.</p></div><div id="logo-upload-preview" class="logo-stage"></div>`,
    ),
    "institution-logo",
    null,
    "Logo publicado para toda la institución.",
    true,
  );
  const f = $("#institution-logo-file");
  if (!f) return;
  f.onchange = () => {
    const file = f.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      f.value = "";
      toast("El logo no puede superar 2 MB.");
      return;
    }
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.alt = "Vista previa del nuevo logo";
    image.onload = () => URL.revokeObjectURL(url);
    image.onerror = () => {
      URL.revokeObjectURL(url);
      $("#logo-upload-preview").textContent =
        "No se pudo leer la imagen. Selecciona otro PNG.";
    };
    image.src = url;
    $("#logo-upload-preview").replaceChildren(image);
  };
}
function openInstitutionModules() {
  const i = institutionData();
  formModal(
    "Un campus con nuestros apartados",
    editorSection(
      "01",
      "Nombra y activa cada herramienta",
      "Los módulos esenciales permanecen activos. Desactivar una herramienta conserva sus datos y bloquea las acciones en el servidor.",
      `<div class="module-editor">${Object.entries(i.modules)
        .map(
          ([key, m]) =>
            `<div class="module-editor-row"><label class="setting-toggle"><input name="enabled_${key}" type="checkbox" ${m.enabled ? "checked" : ""} ${["home", "classroom", "tasks"].includes(key) ? "disabled" : ""}><span><strong>${esc(moduleDescriptions[key])}</strong><small>${["home", "classroom", "tasks"].includes(key) ? "Apartado esencial" : "Herramienta opcional"}</small></span></label>${field("label_" + key, "Nombre visible", "text", m.label, 'required maxlength="35"')}</div>`,
        )
        .join("")}</div>`,
    ),
    "institution",
    (d, f) =>
      institutionPayload({
        modules: Object.fromEntries(
          Object.keys(i.modules).map((key) => [
            key,
            {
              label: d["label_" + key],
              enabled:
                ["home", "classroom", "tasks"].includes(key) ||
                f.has("enabled_" + key),
            },
          ]),
        ),
      }),
    "Apartados y módulos actualizados.",
  );
}
function openInstitutionSections() {
  const sections = institutionData().sections;
  const cards = Array.from({ length: 6 }, (_, n) =>
    editorSection(
      String(n + 1).padStart(2, "0"),
      `Tarjeta ${n + 1}`,
      "Deja el título vacío para retirar esta tarjeta. Las tarjetas completas se publican en el inicio de todos los perfiles.",
      `${field("title_" + n, "Título", "text", sections[n]?.title || "", 'maxlength="80"')}${textarea("body_" + n, "Mensaje", sections[n]?.body || "", 'maxlength="500"')}${field("url_" + n, "Enlace opcional", "url", sections[n]?.url || "", 'maxlength="500"')}`,
    ),
  ).join("");
  formModal(
    "Un inicio que habla de nuestro colegio",
    cards,
    "institution",
    (d) =>
      institutionPayload({
        sections: Array.from({ length: 6 }, (_, n) => ({
          title: d["title_" + n].trim(),
          body: d["body_" + n].trim(),
          url: d["url_" + n].trim(),
        })).filter((s) => s.title || s.body || s.url),
      }),
    "Tarjetas institucionales publicadas.",
  );
}
function checkList(name, items, selected = [], title = "Selecciona registros") {
  return `<fieldset class="admin-checklist"><legend>${title}</legend><input class="admin-list-search" placeholder="Buscar en la lista…" aria-label="${title}: buscar"><div class="admin-select-actions"><button type="button" class="link-btn" data-select-visible="${name}">Seleccionar visibles</button><button type="button" class="link-btn" data-clear-checks="${name}">Limpiar selección</button></div><div class="admin-check-scroll">${items.map(([id, label, detail]) => `<label class="admin-check-row" data-check-label="${esc(normalize(label + " " + (detail || "")))}"><input type="checkbox" name="${name}" value="${id}" ${selected.includes(id) ? "checked" : ""}><span><strong>${esc(label)}</strong><small>${esc(detail || "")}</small></span></label>`).join("") || '<p class="form-help">No hay registros activos disponibles.</p>'}</div></fieldset>`;
}
function bindAdminChecklists(form, onChange = () => {}) {
  form.querySelectorAll(".admin-checklist").forEach((list) => {
    list.querySelector(".admin-list-search").addEventListener("input", (e) => {
      list
        .querySelectorAll(".admin-check-row")
        .forEach(
          (row) =>
            (row.hidden = !row.dataset.checkLabel.includes(
              normalize(e.target.value),
            )),
        );
    });
    list.querySelector("[data-select-visible]").onclick = () => {
      list
        .querySelectorAll(".admin-check-row:not([hidden]) input")
        .forEach((c) => (c.checked = true));
      form.dataset.dirty = "true";
      onChange();
    };
    list.querySelector("[data-clear-checks]").onclick = () => {
      list
        .querySelectorAll("input[type=checkbox]")
        .forEach((c) => (c.checked = false));
      form.dataset.dirty = "true";
      onChange();
    };
  });
  form.addEventListener("change", onChange);
  onChange();
}
function openAdminEnrollment(courseId = null) {
  const cs = S.courses.filter((c) => !c.archived),
    students = adminPeople().filter((p) => p.role === "student" && p.active),
    current = courseId ? course(courseId) : null;
  formModal(
    current
      ? `Matrícula de ${current.title}`
      : "Matrículas con un solo recorrido",
    editorSection(
      "01",
      "Elige qué quieres hacer",
      "Revisa el impacto antes de guardar. Las notas y entregas permanecen conservadas.",
      select(
        "mode",
        "Operación",
        [
          ["add", "Añadir estudiantes"],
          ["remove", "Retirar estudiantes"],
          ["replace", "Reemplazar matrículas"],
        ],
        current ? "replace" : "add",
      ),
    ) +
      editorSection(
        "02",
        "Materias que conectamos",
        "Puedes elegir varias materias activas.",
        checkList(
          "courses",
          cs.map((c) => [c.id, c.title, c.code + " · " + c.room]),
          current ? [current.id] : [],
          "Materias",
        ),
      ) +
      editorSection(
        "03",
        "Estudiantes que acompañamos",
        "Busca por nombre, correo o identificador.",
        checkList(
          "students",
          students.map((p) => [p.id, p.name, p.email + " · " + p.identifier]),
          current ? current.students : [],
          "Estudiantes",
        ),
      ) +
      '<div class="admin-impact" id="enrollment-impact" aria-live="polite"></div>',
    "membership-bulk",
    (d, f) => ({
      ...d,
      courses: f.getAll("courses").map(Number),
      students: f.getAll("students").map(Number),
    }),
    "Matrículas actualizadas; las entregas y calificaciones se conservaron.",
  );
  const form = $("#modal-form");
  if (!form) return;
  bindAdminChecklists(form, () => {
    const f = new FormData(form),
      ids = f.getAll("courses").map(Number),
      members = f.getAll("students").map(Number),
      selected = cs.filter((c) => ids.includes(c.id));
    let add = 0,
      remove = 0;
    for (const c of selected) {
      if (f.get("mode") !== "remove")
        add += members.filter((id) => !c.students.includes(id)).length;
      if (f.get("mode") === "remove")
        remove += members.filter((id) => c.students.includes(id)).length;
      else if (f.get("mode") === "replace")
        remove += c.students.filter((id) => !members.includes(id)).length;
    }
    $("#enrollment-impact").innerHTML =
      `<strong>Antes de guardar</strong><p>${ids.length} materias · ${members.length} estudiantes seleccionados · ${add} matrículas nuevas · ${remove} matrículas retiradas.</p>${f.get("mode") === "replace" ? "<small>Reemplazar retira a cualquier estudiante no seleccionado de las materias elegidas.</small>" : ""}`;
    $("#form-preview").innerHTML =
      `<div class="preview-card green">${art("leaf", 80)}<h3>Una comunidad conectada</h3><p>${ids.length} materias · ${members.length} estudiantes</p><span class="badge">+${add} nuevas / −${remove} retiradas</span></div>`;
  });
}
function openTeacherAssignment(teacherId = null) {
  const teachers = adminPeople().filter(
      (p) => p.role === "teacher" && p.active,
    ),
    cs = S.courses.filter((c) => !c.archived);
  formModal(
    "Un profesor para cada aula",
    editorSection(
      "01",
      "Responsable académico",
      "El profesor elegido podrá gestionar únicamente estas aulas. Los estudiantes, actividades y notas se conservan.",
      select(
        "teacher",
        "Profesor responsable",
        teachers.map((p) => [p.id, p.name]),
        teacherId || teachers[0]?.id,
      ),
    ) +
      editorSection(
        "02",
        "Aulas que acompañará",
        "Al guardar, sustituye al responsable anterior de las materias seleccionadas.",
        checkList(
          "courses",
          cs.map((c) => [
            c.id,
            c.title,
            (adminPerson(c.teacher)?.name || "") + " · " + c.code,
          ]),
          teacherId
            ? cs.filter((c) => c.teacher === teacherId).map((c) => c.id)
            : [],
          "Materias a asignar",
        ),
      ),
    "teacher-assign",
    (d, f) => ({
      teacher: Number(d.teacher),
      courses: f.getAll("courses").map(Number),
    }),
    "Responsables actualizados sin modificar matrículas ni actividades.",
  );
  const form = $("#modal-form");
  if (form) bindAdminChecklists(form);
}
function openAdminDetails(id) {
  const p = adminPerson(id);
  if (!p) return;
  formModal(
    `La ficha de ${p.name}`,
    editorSection(
      "01",
      "Su lugar en la comunidad",
      "Estos datos de gestión son visibles para administración. El teléfono no aparece en el directorio general.",
      `<input type="hidden" name="id" value="${id}"><span class="badge">${roleNames[p.role]}</span>${field("identifier", "Identificador / expediente", "text", p.identifier, 'maxlength="60"')}${field("department", p.role === "teacher" ? "Departamento / especialidad" : "Grupo / área", "text", p.department, 'maxlength="100"')}${field("phone", "Teléfono de contacto", "tel", p.phone, 'maxlength="40"')}${textarea("bio", "Presentación pública en el perfil", p.bio, 'maxlength="1000"')}`,
    ),
    "user-details",
    (d) => ({ ...d, id: Number(d.id) }),
    "Ficha actualizada. El rol y sus permisos se conservaron.",
  );
}
function adminConfirm(title, description, path, payload) {
  modal(
    title,
    `<p class="modal-description">${esc(description)}</p><p class="form-help">Esta acción queda registrada en el historial de administración.</p><div class="form-actions"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="admin-confirm">Confirmar cambio ${icon("check", 14)}</button></div>`,
  );
  $("#admin-confirm").onclick = async (e) => {
    const b = e.currentTarget;
    busy(b, true);
    modalPending(true);
    try {
      S = await api(path, payload);
      modalPending(false);
      closeModal(true);
      render();
      toast("Cambio guardado.");
    } catch (error) {
      modalError(error);
    } finally {
      modalPending(false);
      busy(b, false);
    }
  };
}
function bindAdministration() {
  $$("[data-admin-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!canNavigate()) return;
        adminTab = b.dataset.adminTab;
        adminQuery = "";
        adminStatus = "all";
        render();
      }),
  );
  $("#admin-query")?.addEventListener("input", (e) => {
    adminQuery = e.target.value;
    render({ preserve: true });
  });
  $("#admin-role")?.addEventListener("change", (e) => {
    adminRole = e.target.value;
    render({ preserve: true });
  });
  $("#admin-status")?.addEventListener("change", (e) => {
    adminStatus = e.target.value;
    render({ preserve: true });
  });
  $$("[data-admin-action]").forEach(
    (b) =>
      (b.onclick = () => {
        if (S.me.role !== "admin") return;
        ({
          identity: openInstitutionIdentity,
          logo: openInstitutionLogo,
          modules: openInstitutionModules,
          sections: openInstitutionSections,
          enroll: openAdminEnrollment,
          assign: openTeacherAssignment,
          "logo-delete": () =>
            adminConfirm(
              "Retirar el logo institucional",
              "Se mostrará la ilustración de Luma hasta que subas otro logo.",
              "institution-logo-delete",
              {},
            ),
        })[b.dataset.adminAction]?.();
      }),
  );
  $$("[data-admin-enroll]").forEach(
    (b) =>
      (b.onclick = () => openAdminEnrollment(Number(b.dataset.adminEnroll))),
  );
  $$("[data-admin-role]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = adminPerson(Number(b.dataset.adminRole));
        formModal(
          "El perfil de " + p.name,
          editorSection(
            "01",
            "Permisos para su lugar en el campus",
            "El nuevo perfil se aplica en el servidor. Las cuentas administrativas acceden a la gestión de todo el colegio.",
            `<input type="hidden" name="id" value="${p.id}">${select(
              "role",
              "Perfil de acceso",
              [
                ["student", "Estudiante"],
                ["teacher", "Profesor"],
                ["guardian", "Familiar / encargado"],
                ["admin", "Administrador"],
              ],
              p.role,
            )}<p class="form-help">Conserva sus registros anteriores. Si es profesor con materias activas, reasígnalas primero.</p>`,
          ),
          "user-role",
          (d) => ({ ...d, id: Number(d.id) }),
          "Perfil y permisos actualizados.",
        );
      }),
  );
  $$("[data-admin-details]").forEach(
    (b) => (b.onclick = () => openAdminDetails(Number(b.dataset.adminDetails))),
  );
  $$("[data-admin-teacher]").forEach(
    (b) =>
      (b.onclick = () => openTeacherAssignment(Number(b.dataset.adminTeacher))),
  );
  $$("[data-admin-archive]").forEach(
    (b) =>
      (b.onclick = () => {
        const c = course(Number(b.dataset.adminArchive));
        adminConfirm(
          c.archived ? "Restaurar esta materia" : "Archivar esta materia",
          c.archived
            ? "Volverá a estar disponible para su profesor y estudiantes matriculados."
            : "Se retirará de las aulas activas de estudiantes y profesores. Sus matrículas, actividades, entregas y notas se conservan.",
          "course-archive",
          { id: c.id, archived: !c.archived },
        );
      }),
  );
  $$("[data-admin-status]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = adminPerson(Number(b.dataset.adminStatus));
        adminConfirm(
          p.active ? "Desactivar esta cuenta" : "Reactivar esta cuenta",
          `${p.name}: ${p.active ? "se bloqueará su acceso y se conservarán sus registros académicos" : "podrá volver a iniciar sesión con su contraseña actual"}.`,
          "user-status",
          { id: p.id, active: !p.active },
        );
      }),
  );
  $$("[data-view]").forEach((b) => {
    if (!moduleEnabled(b.dataset.view)) b.hidden = true;
  });
  $$("[data-message-to]").forEach((b) => {
    if (!moduleEnabled("messages")) b.hidden = true;
  });
}
