/* A private learning workspace, with deliberate sharing and real academic data. */
let studentTab = "day",
  studentQuery = "",
  studentCourseFilter = "all",
  plannerMode = "week",
  plannerAnchor = "",
  supportTab = "help";
const studentTabs = [
  ["day", "Mi día", "sun"],
  ["planner", "Mi agenda", "calendar"],
  ["progress", "Mi progreso", "chart"],
  ["portfolio", "Portafolio", "star"],
  ["goals", "Mis metas", "leaf"],
  ["feedback", "Retroalimentación", "message"],
  ["notes", "Cuaderno", "book"],
  ["help", "Pedir ayuda", "heart"],
];
const homeCardNames = {
  classes: "Mis próximas clases",
  tasks: "Entregas que tengo cerca",
  planner: "Mi agenda personal",
  goals: "Metas que me acompañan",
  progress: "Así voy aprendiendo",
  notes: "Apuntes para tener cerca",
};
function studentSpace() {
  return (
    S.student_space || {
      planner: [],
      goals: [],
      notes: [],
      portfolio: [],
      help: [],
      feedback_seen: [],
    }
  );
}
function studentSettings() {
  return S.me.preferences?.student || {};
}
function resetStudentUi() {
  studentTab = "day";
  studentQuery = "";
  studentCourseFilter = "all";
  plannerAnchor = "";
  supportTab = "help";
}
function schoolClock() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Costa_Rica",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}
function dayAdd(iso, n) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function weekStart(iso) {
  const day = new Date(iso + "T12:00:00").getDay();
  return dayAdd(iso, -((day + 6) % 7));
}
function lessonsOn(date) {
  const weekday = (new Date(date + "T12:00:00").getDay() + 6) % 7;
  return S.courses
    .filter((c) => !c.archived)
    .flatMap((c) =>
      (c.timetable || [])
        .filter((r) => r.weekday === weekday)
        .map((r) => ({ course: c, date, ...r })),
    )
    .sort((a, b) => a.start.localeCompare(b.start));
}
function nextLessons() {
  const today = todayISO(),
    clock = schoolClock(),
    list = [];
  for (let offset = 0; offset < 8; offset++) {
    const date = dayAdd(today, offset),
      weekday = (new Date(date + "T12:00:00").getDay() + 6) % 7;
    for (const c of S.courses.filter((c) => !c.archived))
      for (const slot of c.timetable || []) {
        if (slot.weekday === weekday && (offset > 0 || slot.end > clock))
          list.push({ course: c, date, ...slot });
      }
  }
  return list.sort((a, b) =>
    (a.date + a.start).localeCompare(b.date + b.start),
  );
}
function learningCourseTitle(id, fallback = "Sin materia") {
  return course(id)?.title || fallback;
}
function pendingLearning() {
  return S.tasks
    .filter(needsSubmission)
    .sort((a, b) => a.due.localeCompare(b.due) || a.id - b.id);
}
function progressFor(c) {
  const ts = S.tasks.filter((t) => t.course === c.id),
    ss = S.submissions.filter((s) => ts.some((t) => t.id === s.task)),
    graded = ss.filter((s) => s.grade !== null),
    possible = graded.reduce(
      (n, s) => n + indexMaps.tasks.get(s.task).points,
      0,
    ),
    score = graded.reduce((n, s) => n + s.grade, 0);
  return {
    tasks: ts,
    submissions: ss,
    graded,
    total: ts.length,
    done: ss.length,
    percent: ts.length ? Math.round((ss.length / ts.length) * 100) : 0,
    average: possible ? Math.round((score / possible) * 100) : null,
  };
}
function studentBanner() {
  const p = studentSettings();
  return `<section class="student-hero cover-${esc(p.cover || "garden")}"><div><span class="mini-tag">MI PEQUEÑO GRAN MUNDO</span><h2>Hola, ${esc(S.me.name.split(" ")[0])}.<br><em>Hoy también puedes florecer.</em></h2><p>Tu tiempo, tus ideas y cada paso que vas dando.</p><div class="student-interests">${
    (p.interests || [])
      .slice(0, 4)
      .map((t) => `<span class="badge">${esc(t)}</span>`)
      .join("") || '<span class="badge">A mi ritmo, a mi manera ✦</span>'
  }</div></div><div class="student-hero-art">${art(p.avatar && p.avatar !== "initials" ? p.avatar : "flower", 120)}<span>stay curious ✧</span></div></section>`;
}
function studentProfileCard() {
  if (S.me.role !== "student") return "";
  const p = studentSettings();
  return `<section class="student-profile-banner cover-${esc(p.cover || "garden")}">${avatar(S.me, true)}<div><span class="eyebrow">TU ESPACIO PERSONAL</span><h2>Un campus con tu propia esencia.</h2><p>Agenda, metas, apuntes y recuerdos de lo que aprendes.</p><div class="student-interests">${(p.interests || []).map((t) => `<span class="badge">${esc(t)}</span>`).join("")}</div></div><div class="student-banner-actions"><button class="btn primary" data-view="student">Abrir mi espacio ${icon("arrow", 14)}</button><button class="btn" data-student-settings>Personalizar mi espacio</button></div></section>`;
}
function studentHome() {
  return `${heading("Mi día, a mi manera 🌷", "Lo que necesito hoy, con espacio para mis propias ideas.", '<button class="btn" data-student-settings>' + icon("flower", 15) + " Personalizar mi espacio</button>")}${studentBanner()}<div class="student-shortcuts">${studentTabs
    .slice(1)
    .map(
      ([id, label, name]) =>
        `<button data-student-tab="${id}">${icon(name, 20)}<span>${label}</span>${id === "feedback" && unreadFeedback() ? `<b>${unreadFeedback()}</b>` : ""}</button>`,
    )
    .join("")}</div>${institutionSections()}${studentDay()}`;
}
function studentWorkspace() {
  if (S.me.role !== "student")
    return empty("Este espacio personal pertenece al estudiante.");
  const bodies = {
    day: studentDay,
    planner: studentPlanner,
    progress: studentProgress,
    portfolio: studentPortfolio,
    goals: studentGoals,
    feedback: studentFeedback,
    notes: studentNotes,
    help: studentHelp,
  };
  return `${heading("Mi espacio para crecer ✦", "Aprender, organizarme y guardar lo que voy descubriendo.", '<button class="btn" data-student-settings>' + icon("flower", 15) + " Mi estilo y accesibilidad</button>")}${studentBanner()}<nav class="student-tabs" aria-label="Mi espacio personal">${studentTabs.map(([id, label, name]) => `<button data-student-tab="${id}" aria-current="${studentTab === id ? "page" : "false"}" class="${studentTab === id ? "active" : ""}">${icon(name, 16)}${label}</button>`).join("")}</nav><div class="student-body">${(bodies[studentTab] || studentDay)()}${studentTab === "help" ? studentTutoring() : ""}</div>`;
}
function studentDay() {
  const p = studentSettings(),
    order = p.home_order || Object.keys(homeCardNames),
    hidden = p.home_hidden || [],
    sp = studentSpace(),
    lessons = nextLessons(),
    tasks = pendingLearning(),
    plan = sp.planner
      .filter((e) => !e.completed)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    goals = sp.goals.filter((g) => g.progress < g.target),
    cards = {
      classes: () =>
        lessons.length
          ? lessons.slice(0, 3).map(lessonCard).join("")
          : `<p class="student-empty">Tu profesor puede publicar los bloques de clase. Mientras tanto, consulta el horario de tus materias.</p>${S.courses
              .slice(0, 3)
              .map(
                (c) =>
                  `<button class="student-mini-row" data-course="${c.id}"><span class="todo-icon ${esc(c.color)}">${icon("class", 17)}</span><div><strong>${esc(c.title)}</strong><small>${esc(c.schedule || "Horario por confirmar")}</small></div>${icon("arrow", 13)}</button>`,
              )
              .join("")}`,
      tasks: () =>
        tasks
          .slice(0, 4)
          .map(
            (t) =>
              `<button class="student-mini-row" data-task="${t.id}"><span class="todo-icon ${t.due < todayISO() ? "peach" : esc(t.color || "purple")}">${icon("task", 18)}</span><div><strong>${esc(t.title)}</strong><small>${esc(learningCourseTitle(t.course))} · ${dueLabel(t.due)}</small></div>${icon("arrow", 13)}</button>`,
          )
          .join("") ||
        empty("Tus entregas están al día. Deja espacio para una nueva idea. ✦"),
      planner: () =>
        plan.slice(0, 3).map(plannerCard).join("") ||
        empty(
          "Planea tu primera sesión de estudio o un recordatorio personal.",
        ),
      goals: () =>
        goals.slice(0, 3).map(goalCard).join("") ||
        empty("Una meta pequeña puede acompañar un gran aprendizaje."),
      progress: () =>
        S.courses
          .slice(0, 4)
          .map((c) => {
            const p = progressFor(c);
            return `<button class="student-progress-mini" data-student-tab="progress"><strong>${esc(c.title)}</strong><small>${p.done}/${p.total} entregas</small><div class="progress"><i style="width:${p.percent}%"></i></div></button>`;
          })
          .join("") ||
        empty("Aquí aparecerán tus avances cuando tengas materias."),
      notes: () =>
        sp.notes
          .slice(0, 3)
          .map(
            (n) =>
              `<button class="student-mini-row" data-note="${n.id}"><span class="todo-icon green">${icon("book", 18)}</span><div><strong>${n.pinned ? "✦ " : ""}${esc(n.title)}</strong><small>${esc(learningCourseTitle(n.course_id, n.course_title || "Mi cuaderno"))}</small></div>${icon("arrow", 13)}</button>`,
          )
          .join("") ||
        empty("Guarda lo que quieres recordar en tu cuaderno privado."),
    };
  return `<div class="student-day-status"><span>${icon("task", 17)} ${tasks.filter((t) => t.due <= todayISO()).length} entregas para atender</span><span>${icon("calendar", 17)} ${sp.planner.filter((p) => !p.completed && p.date === todayISO()).length} planes para hoy</span><span>${icon("message", 17)} ${unreadFeedback()} revisiones nuevas</span></div><div class="student-day-grid">${order
    .filter((id) => !hidden.includes(id))
    .map(
      (id) =>
        `<section class="panel student-day-card"><div class="section-head"><h2>${homeCardNames[id]}</h2><button class="link-btn" ${id === "classes" ? 'data-view="classroom"' : `data-student-tab="${id === "tasks" ? "planner" : id === "planner" ? "planner" : id}"`}>Ver más ${icon("arrow", 12)}</button></div>${cards[id]?.() || ""}${["planner", "goals", "notes"].includes(id) ? `<button class="btn small student-card-add" data-student-new="${id}">${icon("plus", 13)} ${id === "planner" ? "Organizar mi tiempo" : id === "goals" ? "Crear una meta" : "Guardar un apunte"}</button>` : ""}</section>`,
    )
    .join("")}</div>`;
}
function lessonCard(l) {
  return `<button class="student-lesson" data-course="${l.course.id}"><span class="lesson-date">${dateFormat(l.date, { weekday: "short", day: "numeric" })}<b>${esc(l.start)}</b></span><div><strong>${esc(l.course.title)}</strong><small>${esc(l.room || l.course.room)} · ${esc(l.start)}–${esc(l.end)}</small><small>${esc(person(l.course.teacher)?.name || "Tu profesor")}</small></div>${art(l.course.symbol, 37)}</button>`;
}
function studentToolbar(placeholder = "Buscar en mi espacio…") {
  return `<div class="student-filter"><label class="search">${icon("search", 15)}<input id="student-query" value="${esc(studentQuery)}" placeholder="${esc(placeholder)}" aria-label="Buscar en mi espacio"></label><select id="student-course-filter" aria-label="Filtrar por materia"><option value="all">Todas las materias</option><option value="personal" ${studentCourseFilter === "personal" ? "selected" : ""}>Sin materia</option>${S.courses.map((c) => `<option value="${c.id}" ${studentCourseFilter == c.id ? "selected" : ""}>${esc(c.title)}</option>`).join("")}</select></div>`;
}
function matchesLearning(record) {
  return (
    (studentCourseFilter === "all" ||
      (studentCourseFilter === "personal"
        ? !record.course_id
        : record.course_id === Number(studentCourseFilter))) &&
    normalize(
      [
        record.title,
        record.body,
        record.notes,
        record.reflection,
        ...(record.tags || []),
      ]
        .filter(Boolean)
        .join(" "),
    ).includes(normalize(studentQuery))
  );
}
function plannerCard(e) {
  return `<article class="planner-entry ${e.completed ? "completed" : ""} priority-${esc(e.priority)}"><span class="todo-icon ${e.kind === "study" ? "purple" : e.kind === "reminder" ? "peach" : "green"}">${icon(e.kind === "study" ? "book" : "calendar", 18)}</span><div><strong>${esc(e.title)}</strong><small>${dateFormat(e.date)}${e.time ? " · " + esc(e.time) : ""}${e.kind === "study" ? " · " + e.duration + " min" : ""}</small><small>${esc(learningCourseTitle(e.course_id, e.course_title || "Plan personal"))}</small></div><div class="planner-entry-actions"><button class="icon-btn" data-planner-toggle="${e.id}" aria-label="${e.completed ? "Reabrir" : "Completar"} ${esc(e.title)}" aria-pressed="${e.completed}">${icon(e.completed ? "back" : "check", 17)}</button><button class="icon-btn" data-planner="${e.id}" aria-label="Editar ${esc(e.title)}">${icon("profile", 15)}</button></div></article>`;
}
function studentPlanner() {
  if (!plannerAnchor) plannerAnchor = todayISO();
  const start =
      plannerMode === "week" ? weekStart(plannerAnchor) : plannerAnchor,
    days =
      plannerMode === "week"
        ? Array.from({ length: 7 }, (_, i) => dayAdd(start, i))
        : [plannerAnchor],
    records = studentSpace().planner.filter(matchesLearning);
  return `<div class="section-head"><div><h2>Un tiempo para cada idea</h2><p class="muted">Agenda privada, recordatorios y sesiones de estudio. Los avisos aparecen dentro de Luma.</p></div><button class="btn primary" data-student-new="planner">${icon("plus", 14)} Nuevo plan</button></div>${studentToolbar("Buscar planes o recordatorios…")}<div class="planner-navigation"><div class="chips">${[
    ["week", "Semana"],
    ["day", "Día"],
    ["all", "Todos mis planes"],
  ]
    .map(
      ([id, label]) =>
        `<button class="chip ${plannerMode === id ? "active" : ""}" data-planner-mode="${id}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="planner-date-actions"><button class="icon-btn" data-planner-shift="-1" aria-label="Período anterior">${icon("back", 15)}</button><input type="date" id="planner-anchor" value="${plannerAnchor}" aria-label="Fecha de mi agenda"><button class="icon-btn" data-planner-shift="1" aria-label="Período siguiente">${icon("arrow", 15)}</button><button class="btn small" data-planner-today>Hoy</button></div></div>${
    plannerMode === "all"
      ? `<div class="panel">${records.map(plannerCard).join("") || empty("Todavía no hay planes con estos filtros.")}</div>`
      : `<div class="planner-week">${days
          .map((date) => {
            const list = records.filter((e) => e.date === date),
              tasks = pendingLearning().filter((t) => t.due === date),
              lessons = lessonsOn(date);
            return `<section class="planner-day ${date === todayISO() ? "today" : ""}"><header><span>${dateFormat(date, { weekday: "short" })}</span><strong>${dateFormat(date, { day: "numeric", month: "short" })}</strong><button class="icon-btn" data-planner-date="${date}" aria-label="Crear plan para ${date}">${icon("plus", 15)}</button></header>${list.map(plannerCard).join("")}${tasks.map((t) => `<button class="planner-academic task" data-task="${t.id}">${icon("task", 14)}<span><strong>${esc(t.title)}</strong><small>Entrega académica · ${esc(learningCourseTitle(t.course))}</small></span></button>`).join("")}${lessons.map((l) => `<button class="planner-academic" data-course="${l.course.id}">${icon("class", 14)}<span><strong>${esc(l.start)} · ${esc(l.course.title)}</strong><small>${esc(l.room || l.course.room)}</small></span></button>`).join("")}${!list.length && !tasks.length && !lessons.length ? '<p class="student-empty">Espacio para un pequeño plan.</p>' : ""}</section>`;
          })
          .join("")}</div>`
  }<div class="student-info">${icon("shield", 20)}<p>Tu agenda no cambia las fechas oficiales de las actividades. Solo tú puedes ver y editar tus planes personales.</p></div>`;
}
function goalCard(g) {
  const done = g.progress >= g.target;
  return `<article class="goal-card ${done ? "achieved" : ""}"><div class="section-head"><span class="badge ${done ? "done" : ""}">${done ? "Meta alcanzada ✦" : g.due < todayISO() ? "Fecha pasada" : "Paso a paso"}</span><button class="icon-btn" data-goal="${g.id}" aria-label="Editar ${esc(g.title)}">${icon("profile", 15)}</button></div><h3>${esc(g.title)}</h3><p>${esc(learningCourseTitle(g.course_id, g.course_title || "Meta personal"))} · ${dateFormat(g.due)}</p><div class="goal-progress"><strong>${g.progress}<small> / ${g.target} ${esc(g.unit)}</small></strong><div class="progress"><i style="width:${Math.round((g.progress / g.target) * 100)}%"></i></div></div><div class="goal-controls"><button class="btn small" data-goal-step="${g.id}" data-step="-1" ${g.progress === 0 ? "disabled" : ""} aria-label="Restar avance de ${esc(g.title)}">−</button><button class="btn small" data-goal-step="${g.id}" data-step="1" ${done ? "disabled" : ""}>${icon("plus", 13)} Registrar un avance</button></div>${g.reflection ? `<p class="goal-reflection">${esc(g.reflection)}</p>` : ""}</article>`;
}
function studentGoals() {
  const goals = studentSpace().goals.filter(matchesLearning),
    complete = goals.filter((g) => g.progress >= g.target);
  return `<div class="section-head"><div><h2>Pequeñas metas, grandes pasos 🌱</h2><p class="muted">${complete.length} de ${goals.length} metas alcanzadas. Tú registras tus avances.</p></div><button class="btn primary" data-student-new="goals">${icon("plus", 14)} Nueva meta</button></div>${studentToolbar("Buscar metas o reflexiones…")}<div class="student-card-grid">${goals.map(goalCard).join("") || empty("Elige una meta concreta: leer, practicar, preguntar o terminar un proyecto.")}</div>`;
}
function studentProgress() {
  const list = S.courses.filter(
    (c) =>
      studentCourseFilter === "all" || c.id === Number(studentCourseFilter),
  );
  return `<div class="section-head"><div><h2>Mi aprendizaje tiene un recorrido</h2><p class="muted">Entregas, asistencia y resultados de mis propias actividades.</p></div><button class="btn" data-student-tab="feedback">Leer mis comentarios ${icon("message", 14)}</button></div>${studentToolbar("Buscar una materia…")}<div class="student-progress-grid">${
    list
      .filter((c) => normalize(c.title).includes(normalize(studentQuery)))
      .map((c) => {
        const p = progressFor(c),
          attendance = S.attendance.filter((a) => a.course_id === c.id),
          rate = attendance.length
            ? Math.round(
                (attendance.filter((a) => a.present).length /
                  attendance.length) *
                  100,
              )
            : null;
        return `<section class="panel learning-progress-card"><div class="section-head"><span class="badge ${esc(c.color)}">${esc(c.code)}</span>${art(c.symbol, 38)}</div><h3>${esc(c.title)}</h3><div class="learning-numbers"><div><strong>${p.done}/${p.total}</strong><small>Actividades entregadas</small></div>${moduleEnabled("grades") ? `<div><strong>${p.average === null ? "—" : p.average + "%"}</strong><small>Promedio por puntos evaluados</small></div>` : ""}${moduleEnabled("attendance") ? `<div><strong>${rate === null ? "—" : rate + "%"}</strong><small>Asistencia registrada</small></div>` : ""}</div><div class="progress"><i style="width:${p.percent}%"></i></div><p class="form-help">${p.graded.length} actividades evaluadas · ${p.total - p.done} por entregar.</p>${moduleEnabled("grades") ? progressHistory(p.graded) : ""}${moduleEnabled("grades") ? rubricFocus(c.id) : ""}<button class="btn small" data-course="${c.id}">Ir a mi aula ${icon("arrow", 13)}</button></section>`;
      })
      .join("") ||
    empty("Aquí verás tus avances en las materias que tengas matriculadas.")
  }</div>`;
}
function progressHistory(graded) {
  if (!graded.length)
    return '<p class="student-empty">Tus resultados aparecerán cuando el profesor evalúe tus trabajos.</p>';
  const data = [...graded].sort((a, b) =>
    (a.reviewed_at || a.created).localeCompare(b.reviewed_at || b.created),
  );
  return `<details class="learning-history"><summary>Mi recorrido · ${data.length} resultados</summary><ol>${data
    .map((s) => {
      const t = indexMaps.tasks.get(s.task);
      return `<li><button class="link-btn" data-task="${t.id}">${esc(t.title)}</button><b>${s.grade}/${t.points}</b><div class="progress"><i style="width:${Math.round((s.grade / t.points) * 100)}%"></i></div></li>`;
    })
    .join("")}</ol></details>`;
}
function rubricFocus(courseId) {
  const focus = [];
  for (const s of S.submissions.filter((s) => s.grade !== null)) {
    const t = indexMaps.tasks.get(s.task);
    if (t?.course !== courseId) continue;
    for (const c of t.rubric?.criteria || []) {
      const selected = c.levels.find(
        (l) => l.id === s.rubric_assessment?.selections?.[c.id],
      );
      if (!selected) continue;
      const max = Math.max(...c.levels.map((l) => l.points)),
        percent = Math.round((selected.points / max) * 100);
      if (percent < 70)
        focus.push({
          title: c.title,
          task: t,
          percent,
          comment: s.rubric_assessment.feedback?.[c.id] || selected.description,
        });
    }
  }
  return focus.length
    ? `<div class="rubric-focus"><h4>Criterios para seguir practicando</h4>${focus
        .slice(0, 3)
        .map(
          (f) =>
            `<button data-task="${f.task.id}"><strong>${esc(f.title)} · ${f.percent}%</strong><span>${esc(f.comment || f.task.title)}</span></button>`,
        )
        .join("")}</div>`
    : "";
}
function unreadFeedback() {
  return moduleEnabled("grades")
    ? S.submissions.filter(
        (s) => s.grade !== null && !studentSpace().feedback_seen.includes(s.id),
      ).length
    : 0;
}
function studentFeedback() {
  if (!moduleEnabled("grades"))
    return empty(
      "La institución tiene desactivado el módulo de calificaciones. Tus registros se conservan.",
    );
  const list = S.submissions
    .filter((s) => s.grade !== null)
    .map((s) => ({ s, t: indexMaps.tasks.get(s.task) }))
    .filter(
      ({ s, t }) =>
        t &&
        (studentCourseFilter === "all" ||
          t.course === Number(studentCourseFilter)) &&
        normalize(t.title + " " + s.feedback).includes(normalize(studentQuery)),
    )
    .sort((a, b) =>
      (b.s.reviewed_at || b.s.created).localeCompare(
        a.s.reviewed_at || a.s.created,
      ),
    );
  return `<div class="section-head"><div><h2>Comentarios que me ayudan a crecer</h2><p class="muted">${unreadFeedback()} revisiones por leer. Consulta tus rúbricas y prepara el siguiente paso.</p></div><a class="btn" href="/api/grades-export">${icon("download", 14)} Mis calificaciones</a></div>${studentToolbar("Buscar una actividad o un comentario…")}<div class="student-feedback-list">${list.map(({ s, t }) => `<article class="panel feedback-card"><div class="section-head"><span class="badge ${studentSpace().feedback_seen.includes(s.id) ? "done" : "wait"}">${studentSpace().feedback_seen.includes(s.id) ? "Leída" : "Nueva revisión"}</span><strong class="feedback-score">${s.grade}<small> / ${t.points}</small></strong></div><h3>${esc(t.title)}</h3><p class="muted">${esc(learningCourseTitle(t.course))} · ${dateFormat(s.reviewed_at || s.created)}</p><blockquote>${esc(s.feedback || "Tu profesor registró la evaluación de esta actividad.")}</blockquote>${rubricView(t.rubric, s.rubric_assessment?.selections ? s.rubric_assessment : null)}<div class="student-row-actions"><button class="btn small" data-feedback="${s.id}">Ver mi entrega ${icon("arrow", 13)}</button>${!studentSpace().feedback_seen.includes(s.id) ? `<button class="btn small" data-feedback-read="${s.id}">${icon("check", 14)} Marcar como leída</button>` : ""}<button class="btn small" data-student-goal-task="${t.id}">Crear meta de mejora</button>${moduleEnabled("messages") ? `<button class="link-btn" data-help-task="${t.id}">Preguntar al profesor</button>` : ""}</div></article>`).join("") || empty("Aquí se reunirán las evaluaciones y los comentarios de tu profesor.")}</div>`;
}
function studentNotes() {
  const notes = studentSpace().notes.filter(matchesLearning);
  return `<div class="section-head"><div><h2>Mi cuaderno de ideas 📖</h2><p class="muted">Apuntes privados por materia, etiquetas y notas destacadas.</p></div><div class="student-row-actions"><a class="btn" href="/api/notes-export">${icon("download", 14)} Exportar cuaderno</a><button class="btn primary" data-student-new="notes">${icon("plus", 14)} Nuevo apunte</button></div></div>${studentToolbar("Buscar en títulos, texto o etiquetas…")}<div class="student-card-grid">${notes.map((n) => `<article class="panel student-note"><div class="section-head"><span class="badge green">${esc(learningCourseTitle(n.course_id, n.course_title || "Cuaderno personal"))}</span><button class="icon-btn ${n.pinned ? "saved" : ""}" data-note-pin="${n.id}" aria-label="${n.pinned ? "Quitar destacado" : "Destacar"} ${esc(n.title)}" aria-pressed="${n.pinned}">${icon("star", 17)}</button></div><h3>${esc(n.title)}</h3><p>${esc(n.body.slice(0, 190))}${n.body.length > 190 ? "…" : ""}</p><div class="student-tags">${n.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div><div class="student-row-actions"><button class="btn small" data-note="${n.id}">Leer y editar</button><a class="link-btn" href="/api/notes-export/${n.id}">Descargar</a><button class="link-btn danger" data-learning-delete="note" data-id="${n.id}">Eliminar</button></div></article>`).join("") || empty("Una definición, una idea o lo que aprendiste hoy: empieza tu primer apunte.")}</div>`;
}
function portfolioCard(p, received = false) {
  return `<article class="panel portfolio-card"><div class="portfolio-card-art ${["pink", "purple", "green"][p.id % 3]}">${art(p.tags.length ? "spark" : "flower", 65)}<span class="badge">${received ? "Compartido contigo" : p.sharing === "teacher" ? "Con mi profesor" : "Solo yo"}</span></div><h3>${esc(p.title)}</h3><small>${received ? esc(p.student_name) + " · " : ""}${esc(p.course_title || "Mi portafolio personal")}</small><p>${esc(p.reflection.slice(0, 180) || p.task_title || "Un recuerdo de mi aprendizaje.")}</p><div class="student-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div><div class="student-row-actions"><button class="btn small" data-portfolio-view="${p.id}" data-received="${received}">Ver proyecto ${icon("arrow", 13)}</button>${!received ? `<button class="link-btn" data-portfolio="${p.id}">Editar</button>` : ""}</div></article>`;
}
function studentPortfolio() {
  const entries = studentSpace().portfolio.filter((p) =>
    matchesLearning({ ...p, course_id: p.course }),
  );
  return `<div class="section-head"><div><h2>Lo que aprendo merece un lugar ✦</h2><p class="muted">Guarda proyectos, archivos y reflexiones. Cada entrada es privada hasta que decides compartirla.</p></div><button class="btn primary" data-student-new="portfolio">${icon("plus", 14)} Nuevo proyecto</button></div>${studentToolbar("Buscar proyectos o etiquetas…")}<div class="student-info">${icon("shield", 20)}<p>Compartir da acceso únicamente al profesor responsable de la materia mientras tu matrícula esté vigente. Puedes volver a «Solo yo» cuando quieras.</p></div><div class="student-card-grid">${entries.map((p) => portfolioCard(p)).join("") || empty("Guarda tu primer proyecto, una reflexión o una actividad que te dé orgullo.")}</div>`;
}
function openPortfolioView(id, received = false) {
  const p = (
    received ? S.learning_received?.portfolio : studentSpace().portfolio
  )?.find((p) => p.id === id);
  if (!p) return;
  modal(
    p.title,
    `<span class="badge">${received ? "Compartido por " + esc(p.student_name) : p.sharing === "teacher" ? "Compartido con mi profesor" : "Solo yo"}</span><p class="modal-description">${esc(p.course_title || "Mi portafolio personal")}</p><div class="portfolio-reflection">${esc(p.reflection)}</div>${
      p.artifact?.body || Object.keys(p.artifact?.answers || {}).length
        ? `<section class="submission"><h3>Trabajo guardado · ${esc(p.artifact.title)}</h3><p>${esc(p.artifact.body)}</p>${Object.entries(
            p.artifact.answers || {},
          )
            .map(
              ([key, value]) =>
                `<p><strong>${esc(p.artifact.fields?.find((f) => f.id === key)?.label || key)}:</strong> ${esc(typeof value === "boolean" ? (value ? "Sí" : "No") : value)}</p>`,
            )
            .join("")}</section>`
        : ""
    }${p.file ? `<a class="btn" href="/api/portfolio-file/${p.id}">${icon("download", 15)} ${esc(p.file)}</a>` : ""}${p.submission && indexMaps.tasks.has(S.submissions.find((s) => s.id === p.submission)?.task) ? `<button class="btn" data-portfolio-source="${p.submission}">Ver actividad original</button>` : ""}<div class="student-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>${!received ? `<div class="form-actions"><button class="btn" id="edit-portfolio">Editar proyecto</button><button class="link-btn danger" id="delete-portfolio">Eliminar proyecto</button></div>` : ""}`,
  );
  $("#edit-portfolio")?.addEventListener("click", () =>
    openPortfolioEditor(id),
  );
  $("#delete-portfolio")?.addEventListener("click", () =>
    confirmDelete(
      "Eliminar proyecto",
      "Se eliminarán esta entrada y su archivo guardado. La actividad original se conserva.",
      "portfolio-delete",
      { id },
    ),
  );
  $("[data-portfolio-source]")?.addEventListener("click", () => {
    const s = S.submissions.find((s) => s.id === p.submission);
    if (s) openTask(s.task);
  });
}
function helpCard(h, received = false) {
  return `<article class="panel help-card"><div class="section-head"><span class="badge ${h.status === "resolved" ? "done" : h.status === "answered" ? "wait" : ""}">${{ open: "Por responder", answered: "Con respuesta", resolved: "Resuelta" }[h.status]}</span><small>${dateFormat(h.updated)}</small></div><h3>${esc(h.task_title)}</h3><small>${received ? esc(h.student_name) + " · " : ""}${esc(h.course_title)}</small><p>${esc(h.question.slice(0, 200))}${h.question.length > 200 ? "…" : ""}</p><button class="btn small" data-help="${h.id}" data-received="${received}">${received ? "Acompañar" : "Ver conversación"} · ${h.replies.length} respuestas ${icon("arrow", 13)}</button></article>`;
}
function studentHelp() {
  const list = studentSpace().help.filter(
    (h) =>
      (studentCourseFilter === "all" ||
        h.course === Number(studentCourseFilter)) &&
      normalize(h.task_title + " " + h.question).includes(
        normalize(studentQuery),
      ),
  );
  return `<div class="section-head"><div><h2>Preguntar también es aprender 💛</h2><p class="muted">Consultas sobre tus actividades, con archivos y respuestas de tu profesor.</p></div>${moduleEnabled("messages") ? '<button class="btn primary" data-student-new="help">' + icon("plus", 14) + " Pedir ayuda</button>" : ""}</div>${!moduleEnabled("messages") ? '<div class="notice">La institución tiene desactivada la mensajería. Puedes consultar tus conversaciones anteriores.</div>' : ""}${studentToolbar("Buscar consultas o actividades…")}<div class="student-card-grid">${list.map((h) => helpCard(h)).join("") || empty("Puedes pedir ayuda desde cualquier actividad de tus materias.")}</div>`;
}
function teacherLearningInbox() {
  if (S.me.role !== "teacher")
    return empty("Este acompañamiento corresponde al profesor.");
  const received = S.learning_received || { help: [], portfolio: [] };
  return `${heading("Acompañar también es escuchar 💛", "Consultas de tus aulas y proyectos que los estudiantes decidieron compartir contigo.")}<div class="student-tabs"><button data-support-tab="help" class="${supportTab === "help" ? "active" : ""}">${icon("heart", 17)} Consultas · ${received.help.filter((h) => h.status === "open").length} pendientes</button><button data-support-tab="portfolio" class="${supportTab === "portfolio" ? "active" : ""}">${icon("star", 17)} Portafolios compartidos · ${received.portfolio.length}</button></div><div class="student-card-grid">${supportTab === "portfolio" ? received.portfolio.map((p) => portfolioCard(p, true)).join("") || empty("Aquí aparecen solo los proyectos que tus estudiantes comparten contigo.") : received.help.map((h) => helpCard(h, true)).join("") || empty("No tienes consultas de actividades pendientes.")}</div>`;
}
function openHelp(id, received = false) {
  const h = (received ? S.learning_received?.help : studentSpace().help)?.find(
    (h) => h.id === id,
  );
  if (!h) return;
  const writable =
    moduleEnabled("messages") && course(h.course) && !course(h.course).archived;
  modal(
    "Una pregunta, un nuevo paso",
    `<span class="badge">${esc(h.course_title)} · ${esc(h.task_title)}</span><section class="help-message"><strong>${esc(h.student_name)}</strong><p>${esc(h.question)}</p>${h.file ? `<a class="btn small" href="/api/help-file/${h.id}">${icon("download", 14)} ${esc(h.file)}</a>` : ""}</section>${h.replies.map((r) => `<section class="help-message ${r.author === h.student ? "from-student" : "from-teacher"}"><strong>${esc(r.author_name)}</strong><small>${dateFormat(r.created)}</small><p>${esc(r.body)}</p></section>`).join("")}${writable && h.status !== "resolved" ? `<form id="help-reply-form">${textarea("body", received ? "Mi respuesta para acompañar" : "Quiero añadir algo más", "", 'required maxlength="4000"')}<div class="form-actions"><button class="btn primary">Enviar respuesta ${icon("send", 14)}</button></div></form>` : ""}${!received && writable ? `<div class="form-actions"><button class="btn" id="help-status">${h.status === "resolved" ? "Reabrir consulta" : "Marcar como resuelta"}</button></div>` : ""}${!writable ? '<p class="form-help">La consulta se conserva para lectura; la materia o la mensajería no están disponibles para nuevas respuestas.</p>' : ""}`,
  );
  const form = $("#help-reply-form");
  if (form) {
    form.addEventListener("input", () => (form.dataset.dirty = "true"));
    form.onsubmit = async (e) => {
      e.preventDefault();
      const b = e.submitter;
      busy(b, true);
      modalPending(true);
      try {
        S = await api("help-reply", { id, body: form.elements.body.value });
        form.dataset.dirty = "false";
        modalPending(false);
        closeModal(true);
        render();
        openHelp(id, received);
        toast("Respuesta enviada.");
      } catch (error) {
        modalError(error);
      } finally {
        modalPending(false);
        busy(b, false);
      }
    };
  }
  $("#help-status")?.addEventListener("click", async (e) => {
    const b = e.currentTarget;
    if (
      form?.dataset.dirty === "true" &&
      !confirm(
        "Tienes una respuesta sin enviar. ¿Quieres descartarla para cambiar el estado?",
      )
    )
      return;
    busy(b, true);
    modalPending(true);
    try {
      S = await api("help-status", {
        id,
        status: h.status === "resolved" ? "open" : "resolved",
      });
      modalPending(false);
      closeModal(true);
      render();
      openHelp(id, false);
    } catch (error) {
      modalError(error);
    } finally {
      modalPending(false);
      busy(b, false);
    }
  });
}
function privateCourseSelect(selected = null) {
  const options = [
    ["", "Sin materia / personal"],
    ...S.courses.filter((c) => !c.archived).map((c) => [c.id, c.title]),
  ];
  if (selected && !options.some(([id]) => Number(id) === selected))
    options.push([selected, "Materia anterior · registros conservados"]);
  return select(
    "course",
    "Materia (opcional)",
    options,
    selected || "",
  ).replace(" required", "");
}
function openPlannerEditor(id = null, date = null, taskId = null) {
  const p = studentSpace().planner.find((p) => p.id === id),
    t = taskId ? indexMaps.tasks.get(taskId) : null;
  formModal(
    p ? "Renueva este pequeño plan" : "Un tiempo para mi próxima idea",
    `${p ? `<input name="id" type="hidden" value="${id}">` : ""}${editorSection(
      "01",
      "Lo que quiero organizar",
      "Este plan es privado y no cambia fechas académicas.",
      `${field("title", "Nombre de mi plan", "text", p?.title || t?.title || "", 'required maxlength="160"')}${select(
        "kind",
        "Tipo de plan",
        [
          ["personal", "Tarea personal"],
          ["reminder", "Recordatorio"],
          ["study", "Sesión de estudio"],
        ],
        p?.kind || "study",
      )}${privateCourseSelect(p?.course_id || t?.course)}${select("task", "Actividad vinculada (opcional)", [["", "Sin actividad"], ...S.tasks.map((t) => [t.id, t.title])], p?.task_id || t?.id || "").replace(" required", "")}`,
    )}${editorSection(
      "02",
      "Fecha, tiempo y recordatorio",
      "Los recordatorios se muestran en Mi día y en la campana cuando abres el campus.",
      `<div class="form-grid">${field("date", "Fecha", "date", p?.date || date || t?.due || todayISO(), "required")}${field("time", "Hora (opcional)", "time", p?.time || "")}${field("duration", "Duración estimada en minutos", "number", p?.duration || 30, 'required min="5" max="480"')}${select(
        "priority",
        "Prioridad",
        [
          ["low", "Con calma"],
          ["normal", "Normal"],
          ["high", "Importante"],
        ],
        p?.priority || "normal",
      )}${select(
        "remind_minutes",
        "Avisarme dentro de Luma",
        [
          ["0", "Al llegar la hora"],
          ["15", "15 minutos antes"],
          ["60", "Una hora antes"],
          ["1440", "Un día antes"],
        ],
        p?.remind_minutes ?? 60,
      )}</div>${textarea("notes", "Notas para mí", p?.notes || "", 'maxlength="2000"')}`,
    )}`,
    p ? "planner-edit" : "planner",
    (d) => ({
      ...d,
      ...(p ? { id } : {}),
      course: d.course ? Number(d.course) : null,
      task: d.task ? Number(d.task) : null,
      duration: Number(d.duration),
      remind_minutes: Number(d.remind_minutes),
    }),
    "Tu plan quedó guardado en tu agenda personal.",
  );
  if (p)
    addPersonalDelete(
      "planner",
      id,
      "Eliminar este plan",
      "El plan se retirará de tu agenda. Las actividades académicas se conservan.",
    );
  const f = $("#modal-form");
  if (f)
    f.elements.task.onchange = () => {
      const t = indexMaps.tasks.get(Number(f.elements.task.value));
      if (t) f.elements.course.value = String(t.course);
    };
}
function openGoalEditor(id = null, taskId = null) {
  const g = studentSpace().goals.find((g) => g.id === id),
    t = taskId ? indexMaps.tasks.get(taskId) : null;
  formModal(
    g ? "Cada paso merece atención" : "Una meta para acompañarme",
    `${g ? `<input name="id" type="hidden" value="${id}">` : ""}${editorSection("01", "Una meta concreta", "Elige algo que puedas practicar y contar a lo largo de la semana.", `${field("title", "Mi meta", "text", g?.title || (t ? "Mejorar mi trabajo: " + t.title : ""), 'required maxlength="160"')}${privateCourseSelect(g?.course_id || t?.course)}<div class="form-grid">${field("due", "Quiero lograrla para", "date", g?.due || dayAdd(todayISO(), 7), "required")}${field("target", "Cantidad que quiero alcanzar", "number", g?.target || 5, 'required min="1" max="1000"')}${field("progress", "Avance actual", "number", g?.progress || 0, 'required min="0" max="1000"')}${field("unit", "Qué estoy contando", "text", g?.unit || "sesiones", 'required maxlength="30"')}</div>${textarea("reflection", "Cómo quiero avanzar", g?.reflection || "", 'maxlength="2000"')}`)}`,
    g ? "goal-edit" : "goal",
    (d) => ({
      ...d,
      ...(g ? { id } : {}),
      course: d.course ? Number(d.course) : null,
      target: Number(d.target),
      progress: Number(d.progress),
    }),
    "Meta guardada. Un paso a la vez.",
  );
  if (g)
    addPersonalDelete(
      "goal",
      id,
      "Eliminar esta meta",
      "Se eliminará esta meta personal; tus registros académicos se conservan.",
    );
}
function splitTags(value) {
  return [
    ...new Set(
      value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}
function openNoteEditor(id = null) {
  const n = studentSpace().notes.find((n) => n.id === id);
  formModal(
    n ? "Una idea que sigue creciendo" : "Una nueva página de mi cuaderno",
    `${n ? `<input name="id" type="hidden" value="${id}">` : ""}${editorSection("01", "Mi apunte, solo para mí", "Puedes escribir párrafos, listas o fórmulas como texto. Tus apuntes no se comparten con otros perfiles.", `${field("title", "Título del apunte", "text", n?.title || "", 'required maxlength="160"')}${privateCourseSelect(n?.course_id)}${textarea("body", "Lo que quiero recordar", n?.body || "", 'required maxlength="20000"')}${field("tags", "Etiquetas separadas por comas", "text", n?.tags.join(", ") || "", 'maxlength="250"')}<p class="form-help">Hasta ocho etiquetas, de 30 caracteres cada una.</p>`)}`,
    n ? "note-edit" : "note",
    (d) => ({
      ...d,
      ...(n ? { id } : {}),
      course: d.course ? Number(d.course) : null,
      tags: splitTags(d.tags),
    }),
    "Apunte guardado en tu cuaderno privado.",
  );
  if (n)
    addPersonalDelete(
      "note",
      id,
      "Eliminar este apunte",
      "Se eliminará este apunte de tu cuaderno privado.",
    );
}
function openPortfolioEditor(id = null, sourceId = null) {
  const p = studentSpace().portfolio.find((p) => p.id === id),
    s = sourceId ? S.submissions.find((s) => s.id === sourceId) : null,
    t = s ? indexMaps.tasks.get(s.task) : null,
    options = [
      ["", "Sin entrega vinculada"],
      ...S.submissions.map((s) => [
        s.id,
        indexMaps.tasks.get(s.task)?.title || "Actividad entregada",
      ]),
    ];
  if (p?.submission && !options.some(([id]) => Number(id) === p.submission))
    options.push([p.submission, p.task_title || "Trabajo anterior conservado"]);
  formModal(
    p
      ? "Mi proyecto, con una nueva mirada"
      : "Algo que quiero guardar de mi aprendizaje",
    `${p ? `<input name="id" type="hidden" value="${id}">` : ""}${editorSection("01", "Lo que aprendí", "Guarda una reflexión, un archivo o una copia de tu entrega.", `${field("title", "Nombre del proyecto", "text", p?.title || t?.title || "", 'required maxlength="160"')}${privateCourseSelect(p?.course || t?.course)}${select("submission", "Mi entrega como punto de partida", options, p?.submission || sourceId || "").replace(" required", "")}${textarea("reflection", "Lo que aprendí y lo que mejoraría", p?.reflection || "", 'maxlength="5000"')}${field("tags", "Etiquetas separadas por comas", "text", p?.tags.join(", ") || "", 'maxlength="250"')}`)}${editorSection(
      "02",
      "Archivo y privacidad",
      "Solo tú ves el proyecto hasta que decides compartirlo con el profesor responsable de la materia.",
      `${p?.file ? `<p class="form-help">Archivo guardado: ${esc(p.file)}. Adjunta otro para reemplazarlo.</p>` : ""}${attachmentField("Archivo de mi proyecto (opcional) · máximo 5 MB")}${select(
        "sharing",
        "Quién puede ver esta entrada",
        [
          ["private", "Solo yo"],
          ["teacher", "Mi profesor de esta materia"],
        ],
        p?.sharing || "private",
      )}<p class="form-help">El acceso compartido depende de tu matrícula y del profesor asignado. No se publica un enlace abierto.</p>`,
    )}`,
    p ? "portfolio-edit" : "portfolio",
    (d, f) => {
      f.set("tags", JSON.stringify(splitTags(d.tags)));
      return d;
    },
    "Proyecto guardado con la privacidad que elegiste.",
    true,
  );
  if (p)
    addPersonalDelete(
      "portfolio",
      id,
      "Eliminar este proyecto",
      "Se eliminará el proyecto y su archivo guardado. La entrega original se conserva.",
    );
  const form = $("#modal-form");
  if (form)
    form.elements.submission.onchange = () => {
      const s = S.submissions.find(
          (s) => s.id === Number(form.elements.submission.value),
        ),
        t = s ? indexMaps.tasks.get(s.task) : null;
      if (t) {
        form.elements.course.value = String(t.course);
        if (!form.elements.title.value) form.elements.title.value = t.title;
      }
    };
}
function openAskHelp(taskId = null) {
  if (!moduleEnabled("messages"))
    return toast("La mensajería está desactivada por la institución.");
  if (!S.tasks.length)
    return toast(
      "Necesitas una actividad de tus materias para abrir una consulta.",
    );
  formModal(
    "Una pregunta puede abrir un camino",
    editorSection(
      "01",
      "La actividad y mi duda",
      "La consulta y el archivo los ven únicamente tú y el profesor responsable de la materia.",
      `${select(
        "task",
        "Actividad sobre la que necesito ayuda",
        S.tasks.map((t) => [
          t.id,
          learningCourseTitle(t.course) + " · " + t.title,
        ]),
        taskId || S.tasks[0].id,
      )}${textarea("question", "¿Qué necesito comprender?", "", 'required maxlength="4000" placeholder="Explica qué intentaste y dónde necesitas acompañamiento…"')}${attachmentField("Archivo para explicar mi duda (opcional) · máximo 5 MB")}`,
    ),
    "help-ask",
    null,
    "Consulta enviada a tu profesor.",
    true,
  );
}
function addPersonalDelete(type, id, title, message) {
  const actions = $("#modal-form .editor-actions");
  if (!actions) return;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "link-btn danger personal-delete";
  b.textContent = "Eliminar";
  b.onclick = () => confirmDelete(title, message, type + "-delete", { id });
  actions.insertBefore(b, actions.querySelector(".editor-save-note"));
}
function openStudentSettings() {
  const p = studentSettings(),
    a = S.me.preferences?.appearance || {},
    order = p.home_order || Object.keys(homeCardNames);
  formModal(
    "Mi espacio, mi propia esencia",
    editorSection(
      "01",
      "Una imagen que me represente",
      "Avatar y portada, con el estilo cálido de Luma.",
      `<fieldset class="student-avatar-options"><legend>Mi avatar</legend>${[
        "initials",
        "flower",
        "orbit",
        "leaf",
        "sun",
        "star",
        "spark",
      ]
        .map(
          (id) =>
            `<label><input type="radio" name="avatar" value="${id}" ${(p.avatar || "initials") === id ? "checked" : ""}><span>${
              id === "initials"
                ? esc(
                    S.me.name
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join(""),
                  )
                : art(id, 37)
            }</span><small>${{ initials: "Mis iniciales", flower: "Flor", orbit: "Órbita", leaf: "Hojas", sun: "Sol", star: "Estrella", spark: "Destellos" }[id]}</small></label>`,
        )
        .join("")}</fieldset>${select(
        "cover",
        "Mi portada",
        [
          ["garden", "Jardín de ideas"],
          ["constellation", "Constelación curiosa"],
          ["sunrise", "Un nuevo amanecer"],
          ["confetti", "Pequeñas celebraciones"],
        ],
        p.cover || "garden",
      )}${field("interests", "Mis intereses, separados por comas", "text", p.interests?.join(", ") || "", 'maxlength="250"')}<p class="form-help">Hasta ocho intereses. Se muestran en tu espacio personal.</p>`,
    ) +
      editorSection(
        "02",
        "Un inicio que se adapte a mí",
        "Cambia el orden de las tarjetas y elige cuáles quieres ver. Conserva al menos una.",
        `<div id="student-home-order">${order.map((id) => `<div class="home-order-row" data-home-card="${id}"><label><input type="checkbox" name="show_${id}" ${!(p.home_hidden || []).includes(id) ? "checked" : ""}>${homeCardNames[id]}</label><button type="button" class="icon-btn" data-order-move="-1" aria-label="Subir ${homeCardNames[id]}">↑</button><button type="button" class="icon-btn" data-order-move="1" aria-label="Bajar ${homeCardNames[id]}">↓</button></div>`).join("")}</div>`,
      ) +
      editorSection(
        "03",
        "Una lectura más cómoda",
        "Elige color, tamaño de letra, espacio y movimiento para tu cuenta.",
        `${select(
          "accent",
          "Acento de mi campus",
          [
            ["institution", "Colores de mi institución"],
            ["pink", "Rosa flor"],
            ["purple", "Lavanda"],
            ["green", "Salvia"],
            ["blue", "Cielo"],
            ["peach", "Durazno"],
            ["yellow", "Vainilla"],
          ],
          a.accent || "institution",
        )}${select(
          "font_size",
          "Tamaño de letra",
          [
            ["standard", "Estándar"],
            ["large", "Más grande"],
            ["extra", "Grande extra"],
          ],
          a.font_size || "standard",
        )}${select(
          "density",
          "Espacio entre elementos",
          [
            ["comfortable", "Cómodo y espacioso"],
            ["compact", "Más compacto"],
          ],
          a.density || "comfortable",
        )}<label class="setting-toggle"><input name="high_contrast" type="checkbox" ${a.high_contrast ? "checked" : ""}><span><strong>Mayor contraste</strong><small>Textos y bordes más definidos para leer con comodidad.</small></span></label><label class="setting-toggle"><input name="reduce_motion" type="checkbox" ${a.reduce_motion ? "checked" : ""}><span><strong>Reducir animaciones</strong><small>Menos movimiento en mi campus.</small></span></label>`,
      ),
    "student-settings",
    (d, f) => {
      const order = [...$("#student-home-order").children].map(
        (r) => r.dataset.homeCard,
      );
      return {
        avatar: d.avatar,
        cover: d.cover,
        interests: splitTags(d.interests),
        home_order: order,
        home_hidden: order.filter((id) => !f.has("show_" + id)),
        appearance: {
          accent: d.accent,
          density: d.density,
          font_size: d.font_size,
          high_contrast: f.has("high_contrast"),
          reduce_motion: f.has("reduce_motion"),
        },
      };
    },
    "Tu estilo, tu inicio y tu accesibilidad quedaron guardados.",
  );
  const form = $("#modal-form");
  if (!form) return;
  form.querySelectorAll("[data-order-move]").forEach(
    (b) =>
      (b.onclick = () => {
        const row = b.closest("[data-home-card]"),
          prev = row.previousElementSibling,
          next = row.nextElementSibling;
        if (b.dataset.orderMove === "-1" && prev) prev.before(row);
        if (b.dataset.orderMove === "1" && next) next.after(row);
        form.dataset.dirty = "true";
      }),
  );
  const preview = () => {
    const d = Object.fromEntries(new FormData(form));
    $("#form-preview").innerHTML =
      `<div class="student-settings-preview cover-${esc(d.cover)}">${art(d.avatar === "initials" ? "flower" : d.avatar, 95)}<h3>${esc(S.me.name.split(" ")[0])}</h3><p>Mi pequeño gran mundo.</p><div class="student-tags">${splitTags(
        d.interests,
      )
        .map((t) => `<span>${esc(t)}</span>`)
        .join("")}</div></div>`;
  };
  form.addEventListener("input", preview);
  form.addEventListener("change", preview);
  preview();
}
function openTimetable(courseId) {
  const c = course(courseId);
  if (!c) return;
  let rows = structuredClone(c.timetable || []);
  const rowHtml = (r, i) =>
    `<div class="timetable-row"><label>Día<select data-slot-day aria-label="Día del bloque ${i + 1}">${["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((s, n) => `<option value="${n}" ${r.weekday === n ? "selected" : ""}>${s}</option>`).join("")}</select></label><label>Inicio<input type="time" data-slot-start value="${esc(r.start)}" required aria-label="Inicio del bloque ${i + 1}"></label><label>Fin<input type="time" data-slot-end value="${esc(r.end)}" required aria-label="Fin del bloque ${i + 1}"></label><label>Aula<input data-slot-room value="${esc(r.room || c.room)}" maxlength="60" aria-label="Aula del bloque ${i + 1}"></label><button class="icon-btn" type="button" data-slot-remove aria-label="Retirar bloque ${i + 1}">${icon("close", 14)}</button></div>`;
  formModal(
    "El horario semanal de " + c.title,
    editorSection(
      "01",
      "Cuándo nos encontramos",
      "Estos bloques aparecen en Mi día y en la agenda del estudiante. Las horas siguen la zona del campus: Costa Rica.",
      `<div id="timetable-rows">${rows.map(rowHtml).join("")}</div><button type="button" class="btn" id="timetable-add">${icon("plus", 14)} Añadir bloque semanal</button>`,
    ),
    "course-timetable",
    () => ({
      course: courseId,
      timetable: [...$("#timetable-rows").children].map((row) => ({
        weekday: Number(row.querySelector("[data-slot-day]").value),
        start: row.querySelector("[data-slot-start]").value,
        end: row.querySelector("[data-slot-end]").value,
        room: row.querySelector("[data-slot-room]").value,
      })),
    }),
    "Horario semanal publicado para tus estudiantes.",
  );
  const f = $("#modal-form");
  if (!f) return;
  const bind = () =>
    f.querySelectorAll("[data-slot-remove]").forEach(
      (b) =>
        (b.onclick = () => {
          b.closest(".timetable-row").remove();
          f.dataset.dirty = "true";
        }),
    );
  $("#timetable-add").onclick = () => {
    const list = $("#timetable-rows");
    if (list.children.length >= 14)
      return toast("Puedes publicar hasta 14 bloques semanales.");
    list.insertAdjacentHTML(
      "beforeend",
      rowHtml(
        { weekday: 0, start: "08:00", end: "09:00", room: c.room },
        list.children.length,
      ),
    );
    f.dataset.dirty = "true";
    bind();
  };
  bind();
}
function personalNotifications() {
  if (S.me.role !== "student") return [];
  const today = todayISO(),
    clock = schoolClock(),
    now = new Date(today + "T" + clock + ":00-06:00").getTime();
  const plans = studentSpace()
    .planner.filter(
      (p) =>
        !p.completed &&
        now >=
          new Date(p.date + "T" + (p.time || "00:00") + ":00-06:00").getTime() -
            p.remind_minutes * 60000,
    )
    .slice(0, 8)
    .map((p) => ({
      type: "planner",
      id: p.id,
      title: p.title,
      body:
        "Mi agenda · " + dateFormat(p.date) + (p.time ? " · " + p.time : ""),
      icon: "calendar",
      color: "green",
    }));
  const feedback = moduleEnabled("grades")
    ? S.submissions
        .filter(
          (s) =>
            s.grade !== null && !studentSpace().feedback_seen.includes(s.id),
        )
        .slice(0, 5)
        .map((s) => ({
          type: "feedback",
          id: s.id,
          title: "Nueva revisión: " + indexMaps.tasks.get(s.task)?.title,
          body: "Tu profesor dejó una evaluación para ti.",
          icon: "message",
          color: "purple",
        }))
    : [];
  const help = studentSpace()
    .help.filter((h) => h.status === "answered")
    .slice(0, 5)
    .map((h) => ({
      type: "help",
      id: h.id,
      title: "Tu profesor respondió",
      body: h.task_title,
      icon: "heart",
      color: "pink",
    }));
  return [...plans, ...feedback, ...help];
}
async function personalMutation(
  button,
  path,
  payload,
  message = "Cambio guardado.",
) {
  if (button.disabled) return;
  busy(button, true);
  try {
    S = await api(path, payload);
    render({ preserve: true });
    toast(message);
  } catch (e) {
    toast(e.message);
  } finally {
    busy(button, false);
  }
}
function bindStudent() {
  if (!S) return;
  $$("[data-student-settings]").forEach(
    (b) =>
      (b.onclick = () => {
        if (canNavigate()) openStudentSettings();
      }),
  );
  $$("[data-student-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        if (!canNavigate() || S.me.role !== "student") return;
        studentTab = b.dataset.studentTab;
        view = "student";
        studentQuery = "";
        studentCourseFilter = "all";
        render();
        window.scrollTo(0, 0);
      }),
  );
  $("#student-query")?.addEventListener("input", (e) => {
    studentQuery = e.target.value;
    render({ preserve: true });
  });
  $("#student-course-filter")?.addEventListener("change", (e) => {
    studentCourseFilter = e.target.value;
    render({ preserve: true });
  });
  $$("[data-student-new]").forEach(
    (b) =>
      (b.onclick = () =>
        ({
          planner: openPlannerEditor,
          goals: openGoalEditor,
          notes: openNoteEditor,
          portfolio: openPortfolioEditor,
          help: openAskHelp,
        })[b.dataset.studentNew]?.()),
  );
  $$("[data-planner]").forEach(
    (b) => (b.onclick = () => openPlannerEditor(Number(b.dataset.planner))),
  );
  $$("[data-planner-toggle]").forEach(
    (b) =>
      (b.onclick = () => {
        const p = studentSpace().planner.find(
          (p) => p.id === Number(b.dataset.plannerToggle),
        );
        personalMutation(b, "planner-toggle", {
          id: p.id,
          completed: !p.completed,
        });
      }),
  );
  $$("[data-planner-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        plannerMode = b.dataset.plannerMode;
        render();
      }),
  );
  $$("[data-planner-shift]").forEach(
    (b) =>
      (b.onclick = () => {
        plannerAnchor = dayAdd(
          plannerAnchor || todayISO(),
          Number(b.dataset.plannerShift) * (plannerMode === "week" ? 7 : 1),
        );
        render();
      }),
  );
  $("#planner-anchor")?.addEventListener("change", (e) => {
    if (e.target.value) {
      plannerAnchor = e.target.value;
      render();
    }
  });
  $("[data-planner-today]")?.addEventListener("click", () => {
    plannerAnchor = todayISO();
    render();
  });
  $$("[data-planner-date]").forEach(
    (b) => (b.onclick = () => openPlannerEditor(null, b.dataset.plannerDate)),
  );
  $$("[data-goal]").forEach(
    (b) => (b.onclick = () => openGoalEditor(Number(b.dataset.goal))),
  );
  $$("[data-goal-step]").forEach(
    (b) =>
      (b.onclick = () => {
        const g = studentSpace().goals.find(
          (g) => g.id === Number(b.dataset.goalStep),
        );
        personalMutation(
          b,
          "goal-progress",
          { id: g.id, progress: g.progress + Number(b.dataset.step) },
          "Avance registrado. Sigue a tu ritmo.",
        );
      }),
  );
  $$("[data-note]").forEach(
    (b) => (b.onclick = () => openNoteEditor(Number(b.dataset.note))),
  );
  $$("[data-note-pin]").forEach(
    (b) =>
      (b.onclick = () => {
        const n = studentSpace().notes.find(
          (n) => n.id === Number(b.dataset.notePin),
        );
        personalMutation(b, "note-pin", { id: n.id, pinned: !n.pinned });
      }),
  );
  $$("[data-portfolio]").forEach(
    (b) => (b.onclick = () => openPortfolioEditor(Number(b.dataset.portfolio))),
  );
  $$("[data-portfolio-view]").forEach(
    (b) =>
      (b.onclick = () =>
        openPortfolioView(
          Number(b.dataset.portfolioView),
          b.dataset.received === "true",
        )),
  );
  $$("[data-feedback]").forEach(
    (b) =>
      (b.onclick = async () => {
        const s = S.submissions.find(
          (s) => s.id === Number(b.dataset.feedback),
        );
        try {
          S = await api("feedback-read", { submission: s.id });
          render();
          openTask(s.task);
        } catch (error) {
          toast(error.message);
        }
      }),
  );
  $$("[data-feedback-read]").forEach(
    (b) =>
      (b.onclick = () =>
        personalMutation(
          b,
          "feedback-read",
          { submission: Number(b.dataset.feedbackRead) },
          "Revisión marcada como leída.",
        )),
  );
  $$("[data-student-goal-task]").forEach(
    (b) =>
      (b.onclick = () =>
        openGoalEditor(null, Number(b.dataset.studentGoalTask))),
  );
  $$("[data-help-task]").forEach(
    (b) => (b.onclick = () => openAskHelp(Number(b.dataset.helpTask))),
  );
  $$("[data-help]").forEach(
    (b) =>
      (b.onclick = () =>
        openHelp(Number(b.dataset.help), b.dataset.received === "true")),
  );
  $$("[data-support-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        supportTab = b.dataset.supportTab;
        render();
      }),
  );
  $$("[data-timetable]").forEach(
    (b) => (b.onclick = () => openTimetable(Number(b.dataset.timetable))),
  );
  $$("[data-learning-delete]").forEach(
    (b) =>
      (b.onclick = () =>
        confirmDelete(
          "Eliminar este registro",
          "Se eliminará de tu espacio personal. Tus materias, notas y entregas se conservan.",
          b.dataset.learningDelete + "-delete",
          { id: Number(b.dataset.id) },
        )),
  );
}
function closeTaskForPersonal() {
  const f = $("#submit-form");
  if (f?.dataset.saving) {
    toast("Espera a que se guarde tu borrador.");
    return false;
  }
  if (
    f &&
    (f.elements.body.value !== f.dataset.savedBody ||
      JSON.stringify(collectSmartAnswers(f)) !== f.dataset.savedAnswers ||
      f.elements.file.files.length)
  ) {
    toast(
      "Guarda tu borrador y cierra la actividad antes de abrir otra herramienta.",
    );
    return false;
  }
  closeModal();
  return !$(".modal");
}
