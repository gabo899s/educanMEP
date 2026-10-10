function resetTeacherWorkspace() {
  teacherTab = "review";
  teacherCourse = "";
  teacherFilter = "pending";
  teacherSearch = "";
  libraryFolder = "";
  teacherPlanWeek = "";
}
/* Luma Campus: herramientas docentes con datos reales y borradores revisables. */
let teacherTab = "review",
  teacherCourse = "",
  teacherFilter = "pending",
  teacherSearch = "",
  libraryFolder = "",
  teacherPlanWeek = "";
const teacherSpace = () =>
  S.teacher_workspace || {
    plans: [],
    library: [],
    competencies: [],
    adaptations: [],
    slots: [],
    ai_drafts: [],
  };
function teacherStudio() {
  if (!can("teaching.customize"))
    return empty("Este espacio corresponde al equipo docente.");
  const tabs = [
    ["review", "Revisión", "task"],
    ["planner", "Planificación", "calendar"],
    ["tracking", "Seguimiento", "chart"],
    ["competencies", "Competencias", "star"],
    ["library", "Biblioteca", "book"],
    ["tools", "Rúbricas y campos", "flower"],
    ["tutoring", "Tutorías", "heart"],
    ["ai", "Luma AI Docente", "spark"],
  ];
  return `${heading("Mi estudio docente 🌷", "Diseñar, acompañar y evaluar con espacio para tus ideas.", '<button class="btn primary" data-action="new-task">' + icon("plus", 15) + " Crear actividad</button>")}<section class="studio-hero compact"><div><span class="eyebrow">TU MANERA DE ENSEÑAR</span><h2>Ideas que florecen.<br><em>Aprendizajes que se acompañan.</em></h2><p>Tu planificación, tus evidencias y tus herramientas en un mismo lugar.</p><button class="btn small" data-action="teaching-preferences">Mi estilo de enseñanza</button></div>${art("flower", 115)}</section><nav class="student-tabs teacher-tabs" aria-label="Herramientas docentes">${tabs.map(([id, label, name]) => `<button data-teacher-tab="${id}" class="${teacherTab === id ? "active" : ""}" aria-current="${teacherTab === id ? "page" : "false"}">${icon(name, 16)} ${label}</button>`).join("")}</nav><div class="teacher-workspace-body">${({ review: teacherReview, planner: teacherPlanner, tracking: teacherTracking, competencies: teacherCompetencies, library: teacherLibrary, tools: teacherStudioBase, tutoring: teacherTutoring, ai: teacherAI }[teacherTab] || teacherReview)()}</div>`;
}
function teacherCourseFilter() {
  return `<label class="teacher-filter">Materia<select id="teacher-course"><option value="">Todas mis materias</option>${S.courses
    .filter((c) => !c.archived)
    .map(
      (c) =>
        `<option value="${c.id}" ${String(c.id) === teacherCourse ? "selected" : ""}>${esc(c.title)}</option>`,
    )
    .join("")}</select></label>`;
}
function teacherTasks() {
  return S.tasks.filter((t) => !teacherCourse || t.course === +teacherCourse);
}
function publicationLabel(t) {
  return t.publication === "draft"
    ? "Borrador"
    : t.publication === "scheduled" && new Date(t.publish_at) > new Date()
      ? "Programada · " + dateFormat(t.publish_at)
      : "Publicada";
}
function teacherReview() {
  const tasks = teacherTasks();
  let submissions = S.submissions.filter((s) =>
    tasks.some((t) => t.id === s.task),
  );
  const counts = {
    pending: submissions.filter((s) => s.grade == null && !s.returned).length,
    graded: submissions.filter((s) => s.grade != null).length,
    returned: submissions.filter((s) => s.returned).length,
  };
  const matches = (s, t) =>
    teacherFilter === "all" ||
    (teacherFilter === "pending" && s.grade == null && !s.returned) ||
    (teacherFilter === "graded" && s.grade != null) ||
    (teacherFilter === "returned" && s.returned) ||
    (teacherFilter === "late" &&
      localSchoolDateTime(s.created).slice(0, 10) >
        teacherStudentDue(t, s.student));
  submissions = submissions.filter(
    (s) =>
      matches(s, indexMaps.tasks.get(s.task)) &&
      normalize(
        (person(s.student)?.name || "") +
          " " +
          indexMaps.tasks.get(s.task)?.title,
      ).includes(normalize(teacherSearch)),
  );
  const missing = tasks
    .filter(
      (t) =>
        t.publication !== "draft" &&
        (t.publication !== "scheduled" || new Date(t.publish_at) <= new Date()),
    )
    .flatMap((t) =>
      (course(t.course)?.students || [])
        .filter(
          (id) =>
            !S.submissions.some((s) => s.task === t.id && s.student === id),
        )
        .map((id) => ({ t, id })),
    );
  return `<div class="studio-stats"><div><strong>${counts.pending}</strong><small>Por evaluar</small></div><div><strong>${counts.graded}</strong><small>Evaluadas</small></div><div><strong>${counts.returned}</strong><small>Devueltas</small></div><div><strong>${missing.length}</strong><small>Sin entrega</small></div></div><section class="panel"><div class="teacher-filters">${teacherCourseFilter()}<label>Estado<select id="teacher-review-filter">${[
    ["pending", "Por evaluar"],
    ["all", "Todas"],
    ["late", "Tardías"],
    ["graded", "Evaluadas"],
    ["returned", "Devueltas"],
    ["missing", "Sin entrega"],
    ["publication", "Publicación"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${teacherFilter === v ? "selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></label><label>Buscar<input id="teacher-search" value="${esc(teacherSearch)}" placeholder="Estudiante o actividad"></label></div>${
    teacherFilter === "publication"
      ? tasks
          .map(
            (t) =>
              `<article class="teacher-list-row"><div><h3>${esc(t.title)}</h3><p>${esc(course(t.course)?.title)} · ${esc(publicationLabel(t))}</p></div><button class="btn small" data-edit-task="${t.id}">Editar publicación</button><button class="btn small" data-adapt-task="${t.id}">Adaptaciones</button><button class="btn small" data-save-task="${t.id}">Guardar en biblioteca</button></article>`,
          )
          .join("") || empty("No hay actividades en esta materia.")
      : teacherFilter === "missing"
        ? missing
            .map(
              ({ t, id }) =>
                `<article class="teacher-list-row"><div><h3>${esc(person(id)?.name)}</h3><p>${esc(t.title)} · ${teacherStudentDue(t, id)}</p></div><button class="btn small" data-adapt-task="${t.id}" data-student="${id}">Acompañar</button>${moduleEnabled("messages") ? `<button class="btn small" data-message-to="${id}">Escribir</button>` : ""}</article>`,
            )
            .join("") || empty("No hay entregas pendientes de enviar.")
        : submissions
            .map((s) => {
              const t = indexMaps.tasks.get(s.task);
              return `<article class="teacher-list-row"><div>${avatar(person(s.student))}<h3>${esc(person(s.student)?.name)}</h3><p>${esc(t.title)} · ${esc(course(t.course)?.title)} · Versión ${s.version || 1}</p><span class="badge">${s.returned ? "Esperando nueva versión" : s.grade != null ? s.grade + "/" + t.points : "Por evaluar"}</span></div><button class="btn primary small" data-review-submission="${s.id}">${s.returned ? "Consultar" : "Evaluar aquí"}</button><button class="btn small" data-history="${s.id}">Historial</button><button class="btn small" data-adapt-task="${t.id}" data-student="${s.student}">Adaptar</button></article>`;
            })
            .join("") || empty("No hay entregas para este filtro.")
  }</section>`;
}
function teacherStudentDue(t, id) {
  return (
    teacherSpace().adaptations?.find(
      (a) => a.task_id === t.id && a.student_id === id,
    )?.due || t.due
  );
}
function teacherReviewSubmission(id) {
  const s = S.submissions.find((s) => s.id === id),
    t = indexMaps.tasks.get(s?.task);
  if (!t) return;
  modal(
    "Revisar · " + person(s.student)?.name,
    `<div class="editor-course-context">${esc(t.title)} · ${esc(course(t.course)?.title)} · Versión ${s.version || 1}</div><section class="submission"><p class="preserve-lines">${esc(s.body)}</p>${submissionFieldsView(t, s.answers)}${s.file ? `<a class="btn small" href="/api/file/${s.id}">Descargar ${esc(s.file)}</a>` : ""}</section>${s.returned ? `<div class="notice">Devuelta para corregir: ${esc(s.return_message)}</div>` : `<form id="teacher-grade-form">${gradingFields(t, s)}<div class="form-actions"><button type="button" class="btn" data-return-submission="${id}">Devolver para corregir</button><button class="btn primary">Guardar evaluación</button></div></form>`}`,
    true,
  );
  const f = $("#teacher-grade-form");
  if (f) {
    bindGrading(f, t);
    f.onsubmit = async (e) => {
      e.preventDefault();
      await teacherMutation(
        "grade",
        { submission: id, ...gradingPayload(f, t) },
        e.submitter,
        () => {
          closeModal(true);
          render();
          toast("Evaluación guardada.");
        },
      );
    };
  }
  bindTeacherWorkspace();
}
async function teacherMutation(path, data, button, success) {
  busy(button, true, "Guardando…");
  modalPending(true);
  try {
    const next = await api(path, data);
    if (!S || next.me.id !== S.me.id) return;
    S = next;
    reindex();
    modalPending(false);
    success?.();
  } catch (e) {
    modalError(e);
  } finally {
    modalPending(false);
    busy(button, false);
  }
}
function teacherPlanner() {
  const plans = (teacherSpace().plans || []).filter(
    (p) =>
      (!teacherCourse || p.course_id === +teacherCourse) &&
      (!teacherPlanWeek ||
        (p.date >= teacherPlanWeek && p.date < teacherWeekEnd())),
  );
  return `<section class="panel"><div class="section-head"><div><h2>Planificador de clases</h2><p>Objetivos, contenidos y reflexión. Planes privados que puedes reutilizar.</p></div><button class="btn primary" data-new-lesson>Planificar clase</button></div>${teacherCourseFilter()}<div class="teacher-filters"><label>Semana a partir de<input type="date" id="teacher-plan-week" value="${teacherPlanWeek}"></label><button class="btn small" data-teacher-clear-week>Ver todas las fechas</button></div><div class="student-card-grid">${plans.map((p) => `<article class="student-card"><span class="badge">${dateFormat(p.date)} · ${p.duration} min</span><h3>${esc(p.title)}</h3><small>${esc(course(p.course_id)?.title)}</small><p class="preserve-lines">${esc(p.objectives)}</p><div class="student-row-actions"><button class="btn small" data-lesson-edit="${p.id}">Abrir y editar</button><button class="btn small" data-lesson-copy="${p.id}">Reutilizar</button><button class="link-btn" data-lesson-delete="${p.id}">Eliminar</button></div></article>`).join("") || empty("Planifica tu primera clase con objetivos y actividades claros.")}</div></section>`;
}
function teacherWeekEnd() {
  const d = new Date(teacherPlanWeek + "T12:00:00");
  d.setDate(d.getDate() + 7);
  return d.toLocaleDateString("en-CA");
}
function openLesson(id, copy = false, preset = null) {
  const p = preset || teacherSpace().plans.find((p) => p.id === id) || {};
  const body =
    editorSection(
      "01",
      "El propósito de esta clase",
      "La planificación es privada de tu cuenta.",
      `${courseSelect()}${field("title", "Título de la clase", "text", p.title || "", 'required maxlength="160"')}<div class="form-grid">${field("date", "Fecha", "date", p.date || todayISO(), "required")}${field("duration", "Duración (minutos)", "number", p.duration || 60, 'required min="5" max="480"')}</div>${textarea("objectives", "Objetivos de aprendizaje", p.objectives || "", 'required maxlength="5000"')}`,
    ) +
    editorSection(
      "02",
      "Preparar y acompañar",
      "Guarda lo que necesitas antes y después de la clase.",
      ["content", "materials", "activities", "reflection"]
        .map((k, i) =>
          textarea(
            k,
            [
              "Contenidos",
              "Materiales y enlaces",
              "Actividades y evaluación formativa",
              "Reflexión después de la clase",
            ][i],
            p[k] || "",
            'maxlength="10000"',
          ),
        )
        .join(""),
    );
  formModal(
    copy
      ? "Reutilizar planificación"
      : id
        ? "Editar planificación"
        : "Una clase con propósito",
    body,
    "lesson-save",
    (d) => ({
      ...d,
      ...(id && !copy ? { id } : {}),
      course: +d.course,
      duration: +d.duration,
    }),
    "Planificación guardada.",
  );
  if (p.course_id && $("#f-course")) $("#f-course").value = p.course_id;
}
function teacherTracking() {
  const ts = teacherTasks().filter(
    (t) =>
      t.publication !== "draft" &&
      (t.publication !== "scheduled" || new Date(t.publish_at) <= new Date()),
  );
  const ids = [
    ...new Set(
      S.courses
        .filter((c) => !teacherCourse || c.id === +teacherCourse)
        .flatMap((c) => c.students),
    ),
  ];
  return `<section class="panel"><div class="section-head"><div><h2>Evidencias de aprendizaje</h2><p>Porcentaje ponderado por puntos. Las alertas describen evidencias; no diagnostican estudiantes.</p></div>${teacherCourseFilter()}</div><div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Evaluadas</th><th>Promedio</th><th>Sin entregar</th><th>Evolución</th><th>Criterios a acompañar</th></tr></thead><tbody>${
    ids
      .map((id) => {
        const assigned = ts.filter((t) =>
            course(t.course)?.students.includes(id),
          ),
          ss = S.submissions.filter(
            (s) => s.student === id && assigned.some((t) => t.id === s.task),
          ),
          graded = ss
            .filter((s) => s.grade != null)
            .sort((a, b) =>
              (a.reviewed_at || a.created).localeCompare(
                b.reviewed_at || b.created,
              ),
            );
        const total = graded.reduce(
            (n, s) => n + indexMaps.tasks.get(s.task).points,
            0,
          ),
          avg = total
            ? Math.round(
                (graded.reduce((n, s) => n + s.grade, 0) / total) * 100,
              )
            : null;
        const previous = graded.at(-2),
          last = graded.at(-1),
          delta =
            previous && last
              ? Math.round(
                  (last.grade / indexMaps.tasks.get(last.task).points) * 100 -
                    (previous.grade /
                      indexMaps.tasks.get(previous.task).points) *
                      100,
                )
              : null;
        const weak = graded.flatMap((s) => {
          const t = indexMaps.tasks.get(s.task);
          return (t.rubric?.criteria || [])
            .filter((c) => {
              const l = c.levels.find(
                (l) => l.id === s.rubric_assessment?.selections?.[c.id],
              );
              return (
                l && l.points / Math.max(...c.levels.map((l) => l.points)) < 0.7
              );
            })
            .map((c) => c.title);
        });
        return `<tr><td>${esc(person(id)?.name)}</td><td>${graded.length}</td><td>${avg == null ? "Sin evidencia" : avg + "%"}</td><td>${assigned.filter((t) => teacherStudentDue(t, id) < todayISO() && !ss.some((s) => s.task === t.id)).length}</td><td>${delta == null ? "Se necesitan 2 evaluaciones" : (delta > 0 ? "+" : "") + delta + " puntos porcentuales entre las dos últimas"}</td><td>${esc([...new Set(weak)].join(", ") || "Sin criterios por debajo del 70%")}</td></tr>`;
      })
      .join("") ||
    '<tr><td colspan="6">Matricula estudiantes para ver sus evidencias.</td></tr>'
  }</tbody></table></div></section>`;
}
function teacherCompetencies() {
  const comps = (teacherSpace().competencies || []).filter(
    (c) => !teacherCourse || c.course_id === +teacherCourse,
  );
  return `<section class="panel"><div class="section-head"><div><h2>Evaluar por competencias</h2><p>Vincula competencias en cada actividad. El avance usa sus calificaciones; no inventa niveles.</p></div><button class="btn primary" data-new-competency>Nueva competencia</button></div>${teacherCourseFilter()}${
    comps
      .map((c) => {
        const ts = S.tasks.filter(
          (t) => t.course === c.course_id && t.competencies?.includes(c.id),
        );
        return `<article class="competency-card"><div class="section-head"><div><h3>${esc(c.title)}</h3><p>${esc(course(c.course_id)?.title)} · Meta ${c.target}% · ${ts.length} actividades vinculadas</p></div><button class="btn small" data-competency-edit="${c.id}">Editar</button><button class="link-btn" data-competency-delete="${c.id}">Eliminar</button></div><p>${esc(c.description)}</p><div class="competency-students">${
          (course(c.course_id)?.students || [])
            .map((id) => {
              const ss = S.submissions.filter(
                  (s) =>
                    s.student === id &&
                    s.grade != null &&
                    ts.some((t) => t.id === s.task),
                ),
                max = ss.reduce(
                  (a, s) => a + indexMaps.tasks.get(s.task).points,
                  0,
                ),
                pct = max
                  ? Math.round(
                      (ss.reduce((a, s) => a + s.grade, 0) / max) * 100,
                    )
                  : null;
              return `<div><strong>${esc(person(id)?.name)}</strong><span class="badge">${pct == null ? "Sin evidencia" : pct + "% · " + (pct >= c.target ? "Meta alcanzada" : "En proceso")}</span><small>${ss.length} actividades evaluadas</small></div>`;
            })
            .join("") || "<p>Aún no hay estudiantes matriculados.</p>"
        }</div></article>`;
      })
      .join("") ||
    empty(
      "Define una competencia y vincúlala a una actividad desde su formulario.",
    )
  }</section>`;
}
function openCompetency(id) {
  const c = teacherSpace().competencies.find((c) => c.id === id) || {};
  formModal(
    id ? "Editar competencia" : "Una competencia para crecer",
    `${courseSelect()}${field("title", "Nombre", "text", c.title || "", 'required maxlength="160"')}${textarea("description", "Qué evidencia esperamos", c.description || "", 'maxlength="3000"')}${field("target", "Meta porcentual", "number", c.target || 70, 'required min="1" max="100"')}`,
    "competency-save",
    (d) => ({
      ...d,
      ...(id ? { id } : {}),
      course: +d.course,
      target: +d.target,
    }),
    "Competencia guardada.",
  );
  if (c.course_id) $("#f-course").value = c.course_id;
}
function teacherLibrary() {
  let rows = teacherSpace().library || [];
  const folders = [...new Set(rows.map((r) => r.folder).filter(Boolean))];
  rows = rows.filter(
    (r) =>
      (!libraryFolder || r.folder === libraryFolder) &&
      normalize(r.title + " " + r.folder + " " + r.tags.join(" ")).includes(
        normalize(teacherSearch),
      ),
  );
  return `<section class="panel"><div class="section-head"><div><h2>Mi biblioteca docente</h2><p>Recursos y actividades privados. Cada copia conserva sus propios datos.</p></div><button class="btn primary" data-new-library>Guardar recurso</button></div><div class="teacher-filters"><label>Buscar por título o etiqueta<input id="teacher-search" value="${esc(teacherSearch)}"></label><label>Carpeta<select id="library-folder"><option value="">Todas las carpetas</option>${folders.map((f) => `<option ${libraryFolder === f ? "selected" : ""} value="${esc(f)}">${esc(f)}</option>`).join("")}</select></label></div><div class="student-card-grid">${rows.map((r) => `<article class="student-card"><span class="badge">${r.kind === "task" ? "Actividad" : "Material"} · ${esc(r.folder || "Sin carpeta")}</span><h3>${esc(r.title)}</h3><p>${esc(r.tags.join(" · "))}</p><p>${esc((r.definition.body || r.definition.description || r.definition.url || "Archivo de estudio").slice(0, 180))}</p>${r.file ? `<a class="btn small" href="/api/library-file/${r.id}">Descargar ${esc(r.file)}</a>` : ""}<div class="student-row-actions"><button class="btn small" data-library-edit="${r.id}">Editar</button><button class="btn primary small" data-library-publish="${r.id}">${r.kind === "task" ? "Copiar como borrador" : "Publicar copia"}</button><button class="link-btn" data-library-delete="${r.id}">Eliminar</button></div></article>`).join("") || empty("Guarda materiales aquí o copia actividades desde el centro de revisión.")}</div><details><summary>Guardar material existente de Classroom</summary>${S.resources.map((r) => `<button class="btn small" data-save-resource="${r.id}">${esc(r.title)} · ${esc(course(r.course_id)?.title)}</button>`).join("") || "<p>Classroom aún no tiene materiales.</p>"}</details></section>`;
}
function openLibrary(id, source, kind = "resource") {
  const r = teacherSpace().library.find((r) => r.id === id) || {},
    obj = source
      ? kind === "task"
        ? indexMaps.tasks.get(source)
        : S.resources.find((r) => r.id === source)
      : null;
  formModal(
    source
      ? "Guardar una copia en mi biblioteca"
      : id
        ? "Editar recurso privado"
        : "Guardar un recurso privado",
    `${field("title", "Título", "text", r.title || obj?.title || "", 'required maxlength="200"')}${field("folder", "Carpeta", "text", r.folder || "", 'maxlength="100"')}${field("tags", "Etiquetas separadas por comas", "text", (r.tags || []).join(", "), 'maxlength="330"')}${!source && (r.kind || kind) === "resource" ? `${textarea("body", "Contenido", r.definition?.body || "", 'maxlength="10000"')}${field("url", "Enlace", "url", r.definition?.url || "", 'maxlength="500"')}${attachmentField("Archivo opcional · máximo 5 MB")}` : '<p class="notice">Se conserva una copia de las instrucciones, rúbrica y campos actuales. Para renovar una actividad, edita una copia en Classroom y vuelve a guardarla.</p>'}`,
    "library-save",
    (d, f) => {
      const v = {
        ...d,
        ...(id ? { id } : {}),
        ...(source ? { source } : {}),
        kind: r.kind || kind,
        tags: d.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };
      if (f.get("file")?.size) {
        const payload = new FormData();
        for (const [k, val] of Object.entries(v))
          payload.set(k, k === "tags" ? JSON.stringify(val) : val);
        payload.set("file", f.get("file"));
        return payload;
      }
      return v;
    },
    "Recurso guardado en tu biblioteca.",
  );
}
function openLibraryPublish(id) {
  const r = teacherSpace().library.find((r) => r.id === id);
  formModal(
    r.kind === "task"
      ? "Copiar actividad como borrador"
      : "Publicar material en Classroom",
    `${courseSelect()}<p class="notice">${esc(r.title)}. ${r.kind === "task" ? "Se crea un borrador; revisa fechas, competencias y adaptaciones antes de publicar." : "Los estudiantes de esta materia podrán consultar la copia."}</p>${r.kind === "task" ? field("due", "Fecha de entrega", "date", defaultDueDate(7), "required") : ""}`,
    "library-publish",
    (d) => ({ ...d, id, course: +d.course }),
    "Copia guardada en Classroom.",
  );
}
function openAdaptation(taskId, studentId) {
  const t = indexMaps.tasks.get(taskId),
    members = course(t.course)?.students || [];
  if (!members.length)
    return toast("Esta materia no tiene estudiantes matriculados.");
  const id = studentId || members[0],
    a =
      teacherSpace().adaptations.find(
        (a) => a.task_id === taskId && a.student_id === id,
      ) || {};
  formModal(
    "Acompañar a su ritmo",
    `<div class="editor-course-context">${esc(t.title)}</div><p class="notice">El estudiante ve solo su fecha e instrucciones. Las notas docentes son privadas del equipo que administra esta materia.</p>${select(
      "student",
      "Estudiante",
      members.map((id) => [id, person(id)?.name]),
      id,
    )}${field("due", "Fecha individual (opcional)", "date", a.due || "")}${textarea("instructions", "Instrucciones individuales adicionales", a.instructions || "", 'maxlength="5000"')}${textarea("private_notes", "Notas privadas del equipo docente", a.private_notes || "", 'maxlength="3000"')}<button type="button" class="link-btn" id="remove-adaptation">Retirar adaptación individual</button>`,
    "task-adaptation",
    (d) => ({ ...d, task: taskId, student: +d.student }),
    "Adaptación guardada.",
  );
  $("#f-student").onchange = (e) => {
    const a =
      teacherSpace().adaptations.find(
        (a) => a.task_id === taskId && a.student_id === +e.target.value,
      ) || {};
    $("#f-due").value = a.due || "";
    $("#f-instructions").value = a.instructions || "";
    $("#f-private_notes").value = a.private_notes || "";
  };
  $("#remove-adaptation").onclick = (e) =>
    teacherMutation(
      "adaptation-delete",
      { task: taskId, student: +$("#f-student").value },
      e.target,
      () => {
        closeModal(true);
        render();
        toast("Adaptación retirada.");
      },
    );
}
function openReturn(id) {
  formModal(
    "Devolver para una nueva oportunidad",
    `${textarea("message", "Qué debe revisar el estudiante", "", 'required maxlength="2000"')}<p class="notice">La versión y su evaluación quedan en el historial. La nota actual se retira hasta revisar la nueva entrega. Si la actividad está cerrada o vencida, reábrela o ajusta la fecha individual.</p>`,
    "submission-return",
    (d) => ({ ...d, submission: id }),
    "Trabajo devuelto para corregir.",
  );
}
async function openHistory(id) {
  modal(
    "Historial de entregas",
    '<div class="teacher-loading" role="status">' +
      icon("flower", 32) +
      "<p>Cargando versiones y comentarios…</p></div>",
    true,
  );
  const target = $(".teacher-loading");
  try {
    const data = await api("submission-history/" + id, null, "GET");
    if (!target?.isConnected) return;
    target.className = "teacher-history";
    target.innerHTML =
      data.versions
        .map(
          (v) =>
            `<section class="submission"><h3>Versión ${v.number} · ${dateFormat(v.created)}</h3><p class="preserve-lines">${esc(v.body)}</p>${submissionFieldsView(indexMaps.tasks.get(S.submissions.find((s) => s.id === id)?.task), v.answers)}${v.file ? `<a class="btn small" href="/api/version-file/${v.id}">Descargar ${esc(v.file)}</a>` : ""}<p class="notice">${v.return_message ? "Devuelta: " + esc(v.return_message) : ""}</p><p>${v.grade == null ? "Sin calificación" : v.grade + " puntos"} · ${esc(v.feedback)}</p>${rubricView(indexMaps.tasks.get(S.submissions.find((s) => s.id === id)?.task)?.rubric, v.rubric_assessment?.selections ? v.rubric_assessment : null)}</section>`,
        )
        .join("") ||
      empty(
        "Esta entrega anterior a la actualización aún no tiene versiones. Se conservará al revisarla o actualizarla.",
      );
  } catch (e) {
    if (target?.isConnected)
      target.innerHTML = `<div class="notice" role="alert">${esc(e.message)} <button class="btn small" id="retry-history">Reintentar</button></div>`;
    $("#retry-history")?.addEventListener("click", () => openHistory(id));
  }
}
function teacherTutoring() {
  return `<section class="panel"><div class="section-head"><div><h2>Tutorías y acompañamiento</h2><p>Ofrece horarios individuales, consulta la pregunta y guarda acuerdos visibles al estudiante.</p></div><button class="btn primary" data-new-tutoring>Ofrecer horario</button></div>${teacherCourseFilter()}${tutoringCards(true)}</section>`;
}
function tutoringCards(teacher = false) {
  const slots = (teacherSpace().slots || []).filter(
    (s) => !teacher || !teacherCourse || s.course === +teacherCourse,
  );
  return `<div class="student-card-grid">${slots.map((s) => `<article class="student-card"><span class="badge">${s.cancelled ? "Cancelada" : s.student ? "Reservada" : "Disponible"}</span><h3>${dateFormat(s.starts)} · ${new Date(s.starts).toLocaleTimeString("es-CR", { timeZone: "America/Costa_Rica", hour: "2-digit", minute: "2-digit" })}</h3><p>${esc(course(s.course)?.title)} · ${s.minutes} min</p><p>${esc(s.location)}</p>${s.student ? `<p>${teacher ? esc(person(s.student)?.name) : "Tu reserva"}</p><p class="preserve-lines">${esc(s.question)}</p>${s.agreement ? `<p class="notice preserve-lines">Acuerdos: ${esc(s.agreement)}</p>` : ""}` : ""}<div class="student-row-actions">${teacher ? `${s.student && !s.cancelled ? `<button class="btn small" data-tutoring-agreement="${s.id}">Guardar acuerdos</button>` : ""}${!s.cancelled ? `<button class="link-btn" data-tutoring-cancel="${s.id}">Cancelar horario</button>` : ""}` : !s.cancelled && new Date(s.starts) > new Date() ? (s.student ? `<button class="btn small" data-tutoring-release="${s.id}">Liberar mi reserva</button>` : `<button class="btn primary small" data-tutoring-book="${s.id}">Reservar tutoría</button>`) : ""}</div></article>`).join("") || empty("No hay horarios disponibles o reservas en esta materia.")}</div>`;
}
function studentTutoring() {
  return `<section class="panel"><div class="section-head"><div><h2>Un espacio para conversar 🌱</h2><p>Reserva una tutoría con el profesor de una de tus materias.</p></div></div>${tutoringCards()}</section>`;
}
function openTutoring() {
  formModal(
    "Un horario para acompañar",
    `${courseSelect()}${field("starts", "Fecha y hora (hora del colegio)", "datetime-local", "", "required")}${field("minutes", "Duración en minutos", "number", 30, 'required min="10" max="120"')}${field("location", "Lugar o enlace de encuentro", "text", "", 'required maxlength="160"')}`,
    "tutoring-save",
    (d) => ({ ...d, course: +d.course, minutes: +d.minutes }),
    "Horario disponible para tus estudiantes.",
  );
}
function teacherAI() {
  const data = teacherSpace();
  return `<section class="panel teacher-ai-intro"><span class="eyebrow">IDEAS PARA TU ENSEÑANZA</span><h2>Luma AI Docente ✦</h2><p>Prepara planes, actividades, propuestas de rúbricas y comentarios. Revisa cada borrador antes de usarlo. Este espacio no accede a los cuadernos privados de estudiantes ni asigna notas.</p>${!data.ai_configured ? '<div class="notice">Para responder, configura NVIDIA en el servidor con <code>python3 configure_ai.py</code> y reinicia el campus.</div>' : ""}<button class="btn primary" data-new-teacher-ai ${!data.ai_configured ? "disabled" : ""}>Preparar un borrador</button></section><div class="student-card-grid">${(data.ai_drafts || []).map((a) => `<article class="student-card"><span class="badge">${a.status === "reviewed" ? "Revisado por mí" : "Pendiente de revisar"}</span><h3>${esc(a.title)}</h3><p>${esc(course(a.course_id)?.title || "Materia anterior")} · ${esc(a.kind)}</p><p>${esc(a.content.slice(0, 200))}…</p><div class="student-row-actions"><button class="btn primary small" data-teacher-ai-edit="${a.id}">Abrir y revisar</button>${a.status === "reviewed" ? `<button class="btn small" data-teacher-ai-use="${a.id}">Usar borrador</button>` : ""}<button class="link-btn" data-teacher-ai-delete="${a.id}">Eliminar</button></div></article>`).join("") || empty("Tus borradores serán privados de tu cuenta. La IA puede equivocarse; contrasta contenido y criterios.")}</div>`;
}
function openTeacherAI() {
  modal(
    "Una idea que puedes hacer tuya",
    `<form id="teacher-ai-form">${courseSelect()}${select(
      "kind",
      "Qué quieres preparar",
      [
        ["plan", "Plan de clase"],
        ["rubric", "Propuesta de rúbrica"],
        ["feedback", "Comentario formativo"],
        ["activity", "Actividad"],
      ],
      "plan",
    )}${field("title", "Título", "text", "", 'required maxlength="160"')}${textarea("prompt", "Contexto, nivel, objetivos y lo que necesitas", "", 'required maxlength="6000" placeholder="Incluye el tema y lo que esperas que aprendan. Evita datos personales de estudiantes."')}<p class="form-help">La solicitud y el nombre de la materia se enviarán a NVIDIA. No añadas información privada del alumnado.</p><div class="form-actions"><button type="button" class="btn" data-close>Cancelar</button><button class="btn primary">Preparar borrador</button></div><div id="teacher-ai-progress" role="status" hidden>Preparando tu borrador con Kimi K2…</div></form>`,
    true,
  );
  const form = $("#teacher-ai-form");
  form.id = "modal-form";
  form.addEventListener("input", () => {
    form.dataset.dirty = "true";
  });
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const user = S.me.id;
    busy(e.submitter, true, "Pensando…");
    modalPending(true);
    $("#teacher-ai-progress").hidden = false;
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 40000);
    setLoading(1);
    try {
      const response = await fetch("/api/teacher-ai/generate", {
        method: "POST",
        credentials: "same-origin",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrf() },
        body: JSON.stringify({ ...data, course: +data.course }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (S?.me.id !== user) return;
      S = await api("state", null, "GET");
      reindex();
      modalPending(false);
      closeModal(true);
      render();
      toast("Borrador guardado. Revísalo antes de usarlo.");
    } catch (err) {
      modalError(
        new Error(
          err.name === "AbortError"
            ? "La IA tardó demasiado. Consulta tus borradores antes de reintentar; tu solicitud sigue aquí."
            : err.message,
        ),
      );
    } finally {
      clearTimeout(timer);
      setLoading(-1);
      modalPending(false);
      busy(e.submitter, false);
      if ($("#teacher-ai-progress")) $("#teacher-ai-progress").hidden = true;
    }
  };
}
function openTeacherAIDraft(id) {
  const a = teacherSpace().ai_drafts.find((a) => a.id === id);
  formModal(
    "Revisar mi borrador docente",
    `${field("title", "Título", "text", a.title, 'required maxlength="160"')}${textarea("content", "Contenido editable", a.content, 'required maxlength="15000"')}<p class="notice">Verifica exactitud, nivel, inclusión y criterios. No se publica ni se califica automáticamente.</p>${select(
      "status",
      "Mi revisión",
      [
        ["draft", "Todavía estoy revisando"],
        ["reviewed", "Revisado por mí y listo para adaptar"],
      ],
      a.status,
    )}`,
    "teacher-ai-save",
    (d) => ({ ...d, id }),
    "Tu revisión quedó guardada.",
  );
}
function useTeacherAIDraft(id) {
  const a = teacherSpace().ai_drafts.find((a) => a.id === id);
  if (a.status !== "reviewed") return toast("Revisa el borrador primero.");
  if (a.kind === "plan")
    return openLesson(null, false, {
      title: a.title,
      course_id: a.course_id,
      objectives: "",
      activities: a.content.slice(0, 10000),
    });
  if (a.kind === "rubric") {
    openTeachingTemplate("rubric");
    const f = $("#modal-form");
    if (f?.elements.title) f.elements.title.value = a.title;
    const box = document.createElement("details");
    box.className = "notice";
    const summary = document.createElement("summary");
    summary.textContent =
      "Consultar mi propuesta revisada mientras diseño los criterios";
    box.append(summary);
    const p = document.createElement("p");
    p.className = "preserve-lines";
    p.textContent = a.content;
    box.append(p);
    f.prepend(box);
    return;
  }
  if (a.kind === "activity") {
    openTaskEditor();
    $("#f-title").value = a.title;
    $("#f-description").value = a.content.slice(0, 5000);
    $("#f-publication").value = "draft";
    if (a.course_id) $("#f-course").value = a.course_id;
    return;
  }
  const ss = S.submissions.filter((s) => !s.returned && s.grade == null);
  if (!ss.length)
    return toast("No hay entregas pendientes para adaptar este comentario.");
  formModal(
    "Adaptar comentario a una entrega",
    `${select(
      "submission",
      "Entrega",
      ss.map((s) => [
        s.id,
        (person(s.student)?.name || "") +
          " · " +
          indexMaps.tasks.get(s.task)?.title,
      ]),
      ss[0].id,
    )}${textarea("feedback", "Comentario revisado", a.content.slice(0, 2000), 'required maxlength="2000"')}<p class="notice">A continuación se abrirá la evaluación. El comentario se insertará para que lo adaptes; la nota sigue siendo tu decisión.</p>`,
    "unused",
    (d) => d,
  );
  const f = $("#modal-form");
  f.onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    closeModal(true);
    teacherReviewSubmission(+d.submission);
    $("#teacher-grade-form").elements.feedback.value = d.feedback;
  };
}
function teacherPublicationFields(t) {
  const comps = (teacherSpace().competencies || []).filter(
    (c) =>
      c.course_id === (t?.course || +$("#f-course")?.value || currentCourse),
  );
  return editorSection(
    "06",
    "Publicación y evidencias",
    "Los borradores y actividades futuras permanecen privados hasta su publicación.",
    `${select(
      "publication",
      "Visibilidad",
      [
        ["published", "Publicar ahora"],
        ["draft", "Guardar como borrador"],
        ["scheduled", "Programar publicación"],
      ],
      t?.publication || "published",
    )}${field("publish_at", "Publicar el día y la hora del colegio", "datetime-local", t?.publish_at ? localSchoolDateTime(t.publish_at) : "")}<div id="teacher-competency-options">${teacherCompetencyOptions(comps, t?.competencies || [])}</div>`,
  );
}
function localSchoolDateTime(value) {
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
  return p.replace(" ", "T");
}
function teacherCompetencyOptions(comps, selected) {
  return `<label>Competencias de esta materia</label>${comps.map((c) => `<label class="setting-toggle"><input name="competency" value="${c.id}" type="checkbox" ${selected.includes(c.id) ? "checked" : ""}><span>${esc(c.title)}</span></label>`).join("") || '<p class="form-help">Crea competencias en Mi estudio para vincularlas aquí.</p>'}`;
}
function bindTeacherPublication(t) {
  const publication = $("#f-publication"),
    clock = $("#f-publish_at");
  if (!publication) return;
  const refresh = () => {
    clock.required = publication.value === "scheduled";
    clock.closest(".form-field").hidden = publication.value !== "scheduled";
  };
  publication.onchange = refresh;
  refresh();
  if (!t)
    $("#teacher-competency-options").innerHTML = teacherCompetencyOptions(
      teacherSpace().competencies.filter(
        (c) => c.course_id === +$("#f-course").value,
      ),
      [],
    );
  if (!t)
    $("#f-course").addEventListener("change", () => {
      $("#teacher-competency-options").innerHTML = teacherCompetencyOptions(
        teacherSpace().competencies.filter(
          (c) => c.course_id === +$("#f-course").value,
        ),
        [],
      );
    });
}
function bindTeacherWorkspace() {
  $("#teacher-plan-week")?.addEventListener("change", (e) => {
    teacherPlanWeek = e.target.value;
    render();
  });
  $("[data-teacher-clear-week]")?.addEventListener("click", () => {
    teacherPlanWeek = "";
    render();
  });
  $$("[data-teacher-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        teacherTab = b.dataset.teacherTab;
        teacherSearch = "";
        render();
      }),
  );
  $("#teacher-course")?.addEventListener("change", (e) => {
    teacherCourse = e.target.value;
    render();
  });
  $("#teacher-review-filter")?.addEventListener("change", (e) => {
    teacherFilter = e.target.value;
    render();
  });
  $("#teacher-search")?.addEventListener("input", (e) => {
    teacherSearch = e.target.value;
    const pos = e.target.selectionStart;
    render({ preserve: true });
    $("#teacher-search")?.focus();
    $("#teacher-search")?.setSelectionRange(pos, pos);
  });
  $("#library-folder")?.addEventListener("change", (e) => {
    libraryFolder = e.target.value;
    render();
  });
  const actions = {
    "new-lesson": () => openLesson(),
    "lesson-edit": (id) => openLesson(id),
    "lesson-copy": (id) => openLesson(id, true),
    "lesson-delete": (id) =>
      confirmDelete(
        "Eliminar planificación",
        "Se elimina este plan privado.",
        "lesson-delete",
        { id },
      ),
    "review-submission": teacherReviewSubmission,
    "return-submission": openReturn,
    history: openHistory,
    "new-competency": () => openCompetency(),
    "competency-edit": openCompetency,
    "competency-delete": (id) => {
      const c = teacherSpace().competencies.find((c) => c.id === id);
      confirmDelete(
        "Eliminar competencia",
        "Retira sus vínculos de las actividades antes de eliminarla.",
        "competency-delete",
        { id, course: c.course_id },
      );
    },
    "new-library": () => openLibrary(),
    "library-edit": (id) => openLibrary(id),
    "library-publish": openLibraryPublish,
    "library-delete": (id) =>
      confirmDelete(
        "Eliminar de mi biblioteca",
        "Las copias publicadas en Classroom se conservan.",
        "library-delete",
        { id },
      ),
    "save-task": (id) => openLibrary(null, id, "task"),
    "save-resource": (id) => openLibrary(null, id),
    "new-tutoring": openTutoring,
    "tutoring-cancel": (id) =>
      confirmDelete(
        "Cancelar tutoría",
        "El estudiante conservará la cancelación en sus reservas.",
        "tutoring-cancel",
        { id },
      ),
    "tutoring-agreement": (id) => {
      const s = teacherSpace().slots.find((s) => s.id === id);
      formModal(
        "Acuerdos de acompañamiento",
        textarea(
          "agreement",
          "Acuerdos y siguiente paso",
          s.agreement,
          'required maxlength="5000"',
        ),
        "tutoring-agreement",
        (d) => ({ ...d, id }),
        "Acuerdos guardados.",
      );
    },
    "tutoring-book": (id) =>
      formModal(
        "Reservar un espacio contigo",
        textarea(
          "question",
          "Qué quieres consultar",
          "",
          'required maxlength="2000"',
        ),
        "tutoring-book",
        (d) => ({ ...d, id }),
        "Tutoría reservada.",
      ),
    "tutoring-release": (id) =>
      confirmDelete(
        "Liberar mi reserva",
        "Otra persona podrá reservar este horario.",
        "tutoring-release",
        { id },
      ),
    "new-teacher-ai": openTeacherAI,
    "teacher-ai-edit": openTeacherAIDraft,
    "teacher-ai-use": useTeacherAIDraft,
    "teacher-ai-delete": (id) =>
      confirmDelete(
        "Eliminar borrador",
        "Se elimina este borrador privado.",
        "teacher-ai-delete",
        { id },
      ),
  };
  for (const [key, fn] of Object.entries(actions))
    $$(`[data-${key}]`).forEach(
      (b) => (b.onclick = () => fn(+b.getAttribute("data-" + key))),
    );
  $$("[data-adapt-task]").forEach(
    (b) =>
      (b.onclick = () =>
        openAdaptation(+b.dataset.adaptTask, +b.dataset.student)),
  );
}
