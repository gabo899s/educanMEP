/* Estudio docente: rúbricas, plantillas y campos condicionales de Luma. */
function teacherProfileCard() {
  if (!can("teaching.customize")) return "";
  const pending = S.submissions.filter((s) => s.grade == null).length;
  return `<section class="teacher-profile-banner"><div><span class="eyebrow">TU IDENTIDAD DOCENTE</span><h2>Tu manera de enseñar tiene un lugar ✦</h2><p>${S.courses.length} aulas a tu cargo · ${pending} entregas por revisar. Diseña criterios claros y formularios que acompañen el aprendizaje.</p></div><button class="btn primary" data-view="studio">Abrir mi estudio ${icon("arrow", 15)}</button></section>`;
}
function teacherStudio() {
  if (!can("teaching.customize"))
    return empty("Este espacio corresponde al equipo docente.");
  const templates = S.teaching_templates || [],
    rubrics = templates.filter((t) => t.kind === "rubric"),
    fields = templates.filter((t) => t.kind === "fields"),
    review = S.submissions.filter((s) => s.grade == null),
    prefs = S.me.preferences?.teaching || {};
  return `${heading("Mi estudio docente 🌷", "Tus criterios, tus herramientas y tu manera de acompañar.", '<button class="btn primary" data-action="new-task">' + icon("plus", 15) + " Crear actividad</button>")}<section class="studio-hero"><div><span class="eyebrow">DISEÑAR. ACOMPAÑAR. EVALUAR.</span><h2>Más claridad para ellos.<br><em>Más espacio para tus ideas.</em></h2><p>Guarda tus rúbricas y campos. Reutilízalos en tus aulas y da retroalimentación con tu propia voz.</p><button class="btn" data-action="teaching-preferences">${icon("profile", 16)} Mi estilo de enseñanza</button></div>${art("flower", 145)}</section><div class="studio-stats"><div><span>${icon("class", 21)}</span><strong>${S.courses.length}</strong><small>Aulas asignadas</small></div><div><span>${icon("task", 21)}</span><strong>${review.length}</strong><small>Por evaluar</small></div><div><span>${icon("chart", 21)}</span><strong>${rubrics.length}</strong><small>Rúbricas propias</small></div><div><span>${icon("file", 21)}</span><strong>${fields.length}</strong><small>Formularios guardados</small></div></div><div class="studio-columns"><section class="panel studio-library"><div class="section-head"><div><span class="eyebrow">EVALUAR CON CRITERIO</span><h2>Mi biblioteca de rúbricas</h2></div><button class="btn small" data-teaching-create="rubric">${icon("plus", 14)} Nueva rúbrica</button></div><p class="studio-description">Criterios, niveles y comentarios. Al usarlas, la actividad conserva su propia copia.</p>${rubrics.map(templateCard).join("") || studioEmpty("chart", "Una evaluación más clara empieza aquí", "Crea una rúbrica o parte de un ejemplo editable.")}<button class="link-btn" data-teaching-preset="rubric">Probar ejemplo de proyecto ${icon("arrow", 12)}</button></section><section class="panel studio-library"><div class="section-head"><div><span class="eyebrow">PREGUNTAR CON INTENCIÓN</span><h2>Mis campos inteligentes</h2></div><button class="btn small" data-teaching-create="fields">${icon("plus", 14)} Nuevo formulario</button></div><p class="studio-description">Texto, números, opciones y casillas. Muestra preguntas según respuestas anteriores.</p>${fields.map(templateCard).join("") || studioEmpty("file", "Preguntas que se adaptan al estudiante", "Guarda formularios y reutilízalos en tus actividades.")}<button class="link-btn" data-teaching-preset="fields">Probar reflexión individual o en equipo ${icon("arrow", 12)}</button></section></div><section class="panel studio-workflow"><div><span class="eyebrow">TU RITMO DE TRABAJO</span><h3>${prefs.points || 100} puntos · ${prefs.due_days || 7} días · ${deliveryName(prefs.submission_mode || "both")}</h3><p>Estos valores preparan tus nuevas actividades. Puedes cambiarlos antes de publicar.</p></div><button class="btn small" data-action="teaching-preferences">Personalizar valores y comentarios</button></section><section class="panel"><div class="section-head"><h2>Próximas revisiones</h2><button class="link-btn" data-view="tasks">Ver actividades ${icon("arrow", 12)}</button></div>${
    review
      .slice(0, 4)
      .map((s) => {
        const t = indexMaps.tasks.get(s.task);
        return `<button class="studio-review" data-task="${s.task}">${avatar(person(s.student))}<div><strong>${esc(person(s.student)?.name)}</strong><small>${esc(t?.title)} · ${esc(course(t?.course)?.title)}</small></div><span class="badge">${t?.rubric?.criteria ? "Con rúbrica" : "Calificación directa"}</span>${icon("arrow", 14)}</button>`;
      })
      .join("") ||
    '<p class="studio-description">No tienes entregas pendientes de revisión. ✦</p>'
  }</section>`;
}
function studioEmpty(symbol, title, description) {
  return `<div class="studio-empty"><span>${icon(symbol, 30)}</span><h3>${title}</h3><p>${description}</p></div>`;
}
function templateCard(t) {
  const count =
    t.kind === "rubric" ? t.definition.criteria.length : t.definition.length;
  return `<article class="teaching-template"><div><span class="template-icon ${t.kind === "rubric" ? "purple" : "green"}">${icon(t.kind === "rubric" ? "chart" : "file", 19)}</span><div><h3>${esc(t.title)}</h3><p>${count} ${t.kind === "rubric" ? "criterios" : "campos"} · Privada de tu cuenta</p></div></div><div class="template-actions"><button class="link-btn" data-teaching-edit="${t.id}">Editar</button><button class="link-btn" data-teaching-copy="${t.id}">Duplicar</button><button class="icon-btn" aria-label="Eliminar ${esc(t.title)}" data-teaching-delete="${t.id}">${icon("close", 14)}</button></div></article>`;
}
function bindTeaching() {
  $$("[data-teaching-create]").forEach(
    (b) => (b.onclick = () => openTeachingTemplate(b.dataset.teachingCreate)),
  );
  $$("[data-teaching-preset]").forEach(
    (b) =>
      (b.onclick = () =>
        openTeachingTemplate(b.dataset.teachingPreset, null, true)),
  );
  $$("[data-teaching-edit]").forEach(
    (b) =>
      (b.onclick = () => {
        const t = S.teaching_templates.find(
          (t) => t.id === +b.dataset.teachingEdit,
        );
        openTeachingTemplate(t.kind, t.id);
      }),
  );
  $$("[data-teaching-copy]").forEach(
    (b) =>
      (b.onclick = () => {
        const t = S.teaching_templates.find(
          (t) => t.id === +b.dataset.teachingCopy,
        );
        openTeachingTemplate(t.kind, t.id, false, true);
      }),
  );
  $$("[data-teaching-delete]").forEach(
    (b) =>
      (b.onclick = () =>
        confirmDelete(
          "Eliminar plantilla",
          "Las actividades que ya usan esta plantilla conservan su copia.",
          "teaching-template-delete",
          { id: +b.dataset.teachingDelete },
        )),
  );
}
function newTeachingId(prefix) {
  return prefix + "_" + crypto.randomUUID().replaceAll("-", "").slice(0, 12);
}
function newCriterion(title = "Nuevo criterio") {
  return {
    id: newTeachingId("criterion"),
    title,
    description: "",
    levels: [
      {
        id: newTeachingId("level"),
        label: "Logrado",
        description: "El trabajo cumple con lo esperado.",
        points: 4,
      },
      {
        id: newTeachingId("level"),
        label: "En proceso",
        description: "Hay avances y aspectos por mejorar.",
        points: 2,
      },
      {
        id: newTeachingId("level"),
        label: "Por iniciar",
        description: "Aún no se presenta evidencia suficiente.",
        points: 0,
      },
    ],
  };
}
function exampleRubric() {
  const titles = [
    "Comprensión del tema",
    "Evidencia y argumentos",
    "Claridad y presentación",
  ];
  return {
    title: "Rúbrica de proyecto",
    criteria: titles.map((title) => newCriterion(title)),
  };
}
function exampleFields() {
  return [
    {
      id: "modalidad",
      type: "choice",
      label: "¿Cómo realizaste el trabajo?",
      required: true,
      help: "Elige la modalidad de tu actividad.",
      options: ["Individual", "En equipo"],
    },
    {
      id: "integrantes",
      type: "textarea",
      label: "¿Quiénes participaron y qué aportó cada persona?",
      required: true,
      help: "Describe los aportes del equipo.",
      show_if: { field: "modalidad", equals: "En equipo" },
    },
    {
      id: "reflexion",
      type: "textarea",
      label: "¿Qué aprendiste y qué mejorarías?",
      help: "Conecta tu reflexión con el proceso.",
      required: true,
    },
  ];
}
function openTeachingTemplate(kind, id, preset = false, duplicate = false) {
  if (!can("teaching.customize"))
    return toast("Este espacio corresponde al equipo docente.");
  const template = id ? S.teaching_templates.find((t) => t.id === id) : null,
    editing = template && !duplicate;
  const def = structuredClone(
    template?.definition ||
      (kind === "rubric"
        ? exampleRubric()
        : preset
          ? exampleFields()
          : [
              {
                id: newTeachingId("field"),
                type: "text",
                label: "Mi pregunta",
                help: "",
                required: false,
              },
            ]),
  );
  const title = template
    ? template.title + (duplicate ? " · copia" : "")
    : kind === "rubric"
      ? "Rúbrica de proyecto"
      : preset
        ? "Reflexión individual o en equipo"
        : "";
  const builder = kind === "rubric" ? rubricBuilder(def) : fieldsBuilder(def);
  formModal(
    editing ? "Afina tu herramienta docente" : "Diseña tu próxima herramienta",
    editorSection(
      "01",
      "Una herramienta con tu identidad",
      "Solo tú puedes editar esta biblioteca.",
      `${field("title", "Nombre de la plantilla *", "text", title, 'required maxlength="120"')}<input type="hidden" name="kind" value="${kind}">`,
    ) +
      editorSection(
        "02",
        kind === "rubric"
          ? "Criterios y niveles de logro"
          : "Preguntas, validación y condiciones",
        kind === "rubric"
          ? "Cada criterio incluye un nivel de 0 puntos. La nota se ajusta a los puntos de la actividad."
          : "Las condiciones usan opciones o casillas anteriores; los campos ocultos no son obligatorios.",
        `<div id="teaching-builder" data-kind="${kind}">${builder}</div>`,
      ),
    editing ? "teaching-template-edit" : "teaching-template",
    (d) => ({
      ...d,
      ...(editing ? { id: template.id } : {}),
      definition:
        kind === "rubric"
          ? { title: d.title, criteria: collectRubricBuilder() }
          : collectFieldsBuilder(),
    }),
    "Tu plantilla quedó guardada en tu biblioteca.",
  );
  bindTeachingBuilder();
  updateTeachingPreview();
}
function rubricBuilder(rubric) {
  return `${rubric.criteria.map((c, i) => `<article class="rubric-builder-criterion" data-criterion="${c.id}"><div class="builder-card-head"><strong>Criterio ${i + 1}</strong><button type="button" class="icon-btn" data-remove-criterion aria-label="Eliminar criterio ${i + 1}">${icon("close", 15)}</button></div><div class="form-field"><label>Nombre del criterio *</label><input data-criterion-title value="${esc(c.title)}" required maxlength="100" aria-label="Nombre del criterio ${i + 1}"></div><div class="form-field"><label>Qué observarás</label><input data-criterion-description value="${esc(c.description)}" maxlength="500" aria-label="Descripción del criterio ${i + 1}"></div><div class="rubric-levels">${c.levels.map((l, j) => levelEditor(l, j, i)).join("")}</div><button type="button" class="link-btn" data-add-level>+ Añadir nivel</button></article>`).join("")}<button type="button" class="btn builder-add" data-add-criterion>${icon("plus", 14)} Añadir criterio</button><p class="form-help">Hasta 10 criterios, con 2 a 5 niveles cada uno. Diferencia los puntos de los niveles.</p>`;
}
function levelEditor(l, j, i) {
  return `<div class="rubric-level-editor" data-level="${l.id}"><div><label>Nivel ${j + 1}</label><input data-level-label value="${esc(l.label)}" required maxlength="80" aria-label="Nombre del nivel ${j + 1} del criterio ${i + 1}"><textarea data-level-description maxlength="500" placeholder="Describe qué demuestra este nivel" aria-label="Descripción del nivel ${j + 1} del criterio ${i + 1}">${esc(l.description)}</textarea></div><div class="level-points"><label>Puntos</label><input data-level-points type="number" min="0" max="1000" step="1" required value="${l.points}" aria-label="Puntos del nivel ${j + 1} del criterio ${i + 1}"><button type="button" class="link-btn danger" data-remove-level>Quitar</button></div></div>`;
}
function collectRubricBuilder() {
  return $$("[data-criterion]").map((c) => ({
    id: c.dataset.criterion,
    title: c.querySelector("[data-criterion-title]").value,
    description: c.querySelector("[data-criterion-description]").value,
    levels: [...c.querySelectorAll("[data-level]")].map((l) => ({
      id: l.dataset.level,
      label: l.querySelector("[data-level-label]").value,
      description: l.querySelector("[data-level-description]").value,
      points: Number(l.querySelector("[data-level-points]").value),
    })),
  }));
}
function fieldsBuilder(fields) {
  return (
    fields.map((f, i) => fieldEditor(f, i, fields)).join("") +
    `<button type="button" class="btn builder-add" data-add-field>${icon("plus", 14)} Añadir campo</button><p class="form-help">Hasta 12 campos. Una condición puede depender de una opción o casilla anterior.</p>`
  );
}
function fieldEditor(f, i, fields) {
  const sources = fields
      .slice(0, i)
      .filter((s) => ["choice", "checkbox"].includes(s.type)),
    source = sources.find((s) => s.id === f.show_if?.field);
  const options =
    source?.type === "checkbox"
      ? [
          ["true", "Sí"],
          ["false", "No"],
        ]
      : (source?.options || []).map((v) => [v, v]);
  return `<article class="smart-field-editor" data-field-id="${f.id}"><div class="builder-card-head"><strong>Campo ${i + 1}</strong><button type="button" class="icon-btn" data-remove-field aria-label="Eliminar campo ${i + 1}">${icon("close", 15)}</button></div><div class="form-grid"><div class="form-field"><label>Pregunta *</label><input data-field-label value="${esc(f.label)}" required maxlength="100" aria-label="Pregunta del campo ${i + 1}"></div><div class="form-field"><label>Tipo de respuesta</label><select data-field-type aria-label="Tipo del campo ${i + 1}">${[
    ["text", "Texto corto"],
    ["textarea", "Texto largo"],
    ["number", "Número"],
    ["choice", "Opciones"],
    ["checkbox", "Casilla de confirmación"],
  ]
    .map(
      ([v, l]) =>
        `<option value="${v}" ${f.type === v ? "selected" : ""}>${l}</option>`,
    )
    .join(
      "",
    )}</select></div></div><div class="form-field"><label>Ayuda para el estudiante</label><input data-field-help value="${esc(f.help)}" maxlength="200" aria-label="Ayuda del campo ${i + 1}"></div>${f.type === "choice" ? `<div class="form-field"><label>Opciones · una por línea *</label><textarea data-field-options required aria-label="Opciones del campo ${i + 1}">${esc((f.options || ["Opción 1", "Opción 2"]).join("\n"))}</textarea></div>` : ""}${f.type === "number" ? `<div class="form-grid"><div class="form-field"><label>Mínimo (opcional)</label><input data-field-min type="number" step="any" value="${f.min ?? ""}" aria-label="Mínimo del campo ${i + 1}"></div><div class="form-field"><label>Máximo (opcional)</label><input data-field-max type="number" step="any" value="${f.max ?? ""}" aria-label="Máximo del campo ${i + 1}"></div></div>` : ""}<label class="setting-toggle"><input data-field-required type="checkbox" ${f.required ? "checked" : ""}><span><strong>Respuesta obligatoria</strong><small>Solo se exigirá cuando este campo esté visible.</small></span></label><div class="field-condition"><label>Mostrar este campo</label><select data-field-condition aria-label="Condición del campo ${i + 1}"><option value="">Siempre</option>${sources.map((s) => `<option value="${s.id}" ${f.show_if?.field === s.id ? "selected" : ""}>Cuando responda a: ${esc(s.label)}</option>`).join("")}</select>${source ? `<label>Con esta respuesta</label><select data-field-expected aria-label="Respuesta que activa el campo ${i + 1}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(f.show_if?.equals) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>` : ""}</div></article>`;
}
function collectFieldsBuilder() {
  const fields = $$("[data-field-id]").map((c) => {
    const f = {
      id: c.dataset.fieldId,
      label: c.querySelector("[data-field-label]").value,
      type: c.querySelector("[data-field-type]").value,
      help: c.querySelector("[data-field-help]").value,
      required: c.querySelector("[data-field-required]").checked,
    };
    if (f.type === "choice")
      f.options = (
        c.querySelector("[data-field-options]")?.value || "Opción 1\nOpción 2"
      )
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
    if (f.type === "number")
      for (const key of ["min", "max"]) {
        const v = c.querySelector("[data-field-" + key + "]")?.value;
        if (v !== undefined && v !== "") f[key] = Number(v);
      }
    const source = c.querySelector("[data-field-condition]").value;
    if (source)
      f.show_if = {
        field: source,
        equals: c.querySelector("[data-field-expected]")?.value ?? "",
      };
    return f;
  });
  fields.forEach((f) => {
    if (f.show_if) {
      const s = fields.find((s) => s.id === f.show_if.field);
      if (s?.type === "checkbox")
        f.show_if.equals = f.show_if.equals === "true";
    }
  });
  return fields;
}
function refreshTeachingBuilder(kind, definition) {
  $("#teaching-builder").innerHTML =
    kind === "rubric"
      ? rubricBuilder({ criteria: definition })
      : fieldsBuilder(definition);
  $("#modal-form").dataset.dirty = "true";
  bindTeachingBuilder();
  updateTeachingPreview();
}
function bindTeachingBuilder() {
  const root = $("#teaching-builder");
  if (!root) return;
  root.oninput = () => updateTeachingPreview();
  root.onchange = (e) => {
    if (
      e.target.matches(
        "[data-field-type],[data-field-condition],[data-field-options]",
      )
    ) {
      const fields = collectFieldsBuilder();
      fields.forEach((f) => {
        if (f.show_if) {
          const source = fields.find((s) => s.id === f.show_if.field);
          if (
            source?.type === "choice" &&
            !source.options.includes(f.show_if.equals)
          )
            f.show_if.equals = source.options[0];
        }
      });
      refreshTeachingBuilder("fields", fields);
    } else updateTeachingPreview();
  };
  $$("[data-add-criterion]").forEach(
    (b) =>
      (b.onclick = () => {
        const rows = collectRubricBuilder();
        if (rows.length >= 10) return toast("Puedes usar hasta 10 criterios.");
        rows.push(newCriterion());
        refreshTeachingBuilder("rubric", rows);
      }),
  );
  $$("[data-remove-criterion]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.closest("[data-criterion]").dataset.criterion;
        refreshTeachingBuilder(
          "rubric",
          collectRubricBuilder().filter((c) => c.id !== id),
        );
      }),
  );
  $$("[data-add-level]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.closest("[data-criterion]").dataset.criterion,
          rows = collectRubricBuilder(),
          c = rows.find((c) => c.id === id);
        if (c.levels.length >= 5)
          return toast("Cada criterio admite hasta 5 niveles.");
        const used = new Set(c.levels.map((l) => l.points));
        let points = 1;
        while (used.has(points)) points++;
        c.levels.push({
          id: newTeachingId("level"),
          label: "Nuevo nivel",
          description: "",
          points,
        });
        refreshTeachingBuilder("rubric", rows);
      }),
  );
  $$("[data-remove-level]").forEach(
    (b) =>
      (b.onclick = () => {
        const cid = b.closest("[data-criterion]").dataset.criterion,
          lid = b.closest("[data-level]").dataset.level,
          rows = collectRubricBuilder(),
          c = rows.find((c) => c.id === cid);
        if (c.levels.length <= 2)
          return toast("Conserva al menos dos niveles.");
        c.levels = c.levels.filter((l) => l.id !== lid);
        refreshTeachingBuilder("rubric", rows);
      }),
  );
  $$("[data-add-field]").forEach(
    (b) =>
      (b.onclick = () => {
        const fields = collectFieldsBuilder();
        if (fields.length >= 12) return toast("Puedes usar hasta 12 campos.");
        fields.push({
          id: newTeachingId("field"),
          type: "text",
          label: "Mi pregunta",
          help: "",
          required: false,
        });
        refreshTeachingBuilder("fields", fields);
      }),
  );
  $$("[data-remove-field]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.closest("[data-field-id]").dataset.fieldId,
          fields = collectFieldsBuilder().filter((f) => f.id !== id);
        fields.forEach((f) => {
          if (f.show_if?.field === id) delete f.show_if;
        });
        refreshTeachingBuilder("fields", fields);
      }),
  );
}
function updateTeachingPreview() {
  const form = $("#modal-form"),
    builder = $("#teaching-builder");
  if (!form || !builder) return;
  const target = $("#form-preview");
  if (builder.dataset.kind === "rubric") {
    const cs = collectRubricBuilder(),
      max = cs.reduce(
        (sum, c) => sum + Math.max(0, ...c.levels.map((l) => l.points)),
        0,
      );
    target.innerHTML = `<div class="preview-card purple">${art("star", 65)}<span class="preview-badge">Rúbrica privada</span><h3>${esc(form.elements.title.value || "Mi rúbrica")}</h3><p>${cs.length} criterios · ${max} puntos de escala</p>${cs.map((c) => `<div class="rubric-preview-row"><strong>${esc(c.title)}</strong><span>${Math.max(0, ...c.levels.map((l) => l.points))} pts</span></div>`).join("")}<p>La nota se ajusta a los puntos de cada actividad.</p></div>`;
  } else {
    const fs = collectFieldsBuilder();
    target.innerHTML = `<div class="preview-card green"><span class="preview-badge">Vista del estudiante</span><h3>${esc(form.elements.title.value || "Mi formulario")}</h3>${smartFieldsHTML(fs, {})}</div>`;
    bindSmartFields(target, fs);
  }
}
function teachingTaskOptions(t) {
  const templates = S.teaching_templates || [],
    locked = t?.configuration_locked;
  return (
    editorSection(
      "04",
      "Evalúa con criterios claros",
      "La rúbrica se copia a la actividad. Los cambios futuros de la biblioteca no la alteran.",
      locked
        ? `<div class="locked-field">${icon("shield", 17)} ${esc(t.rubric?.title || "Calificación directa")} · configuración protegida</div>${rubricView(t.rubric)}`
        : `${select("rubric_template", "Usar una rúbrica", [["", "Calificación directa"], ...(t?.rubric?.criteria ? [["current", `Conservar: ${t.rubric.title}`]] : []), ...templates.filter((x) => x.kind === "rubric").map((x) => [String(x.id), x.title])], t?.rubric?.criteria ? "current" : "")}<div id="task-rubric-preview">${rubricView(t?.rubric)}</div><p class="form-help">Crea y guarda tus rúbricas desde Mi estudio antes de utilizarlas aquí.</p>`,
    ) +
    editorSection(
      "05",
      "Campos que acompañan el aprendizaje",
      "Añade preguntas estructuradas y condiciones para guiar la entrega.",
      locked
        ? `<div class="locked-field">${icon("shield", 17)} ${t.fields.length} campos · configuración protegida</div>`
        : `${select("fields_template", "Usar un formulario", [["", "Sin campos adicionales"], ...(t?.fields?.length ? [["current", "Conservar los campos actuales"]] : []), ...templates.filter((x) => x.kind === "fields").map((x) => [String(x.id), x.title])], t?.fields?.length ? "current" : "")}<div id="task-fields-preview"></div><p class="form-help">Los campos obligatorios se validan en la entrega. Los borradores pueden estar incompletos.</p>`,
    )
  );
}
function taskTeachingData(d, t) {
  if (t?.configuration_locked) return { rubric: t.rubric, fields: t.fields };
  const rubric =
    d.rubric_template === "current"
      ? t.rubric
      : S.teaching_templates?.find(
          (x) => x.kind === "rubric" && x.id === +d.rubric_template,
        )?.definition || {};
  const fields =
    d.fields_template === "current"
      ? t.fields
      : S.teaching_templates?.find(
          (x) => x.kind === "fields" && x.id === +d.fields_template,
        )?.definition || [];
  return { rubric: structuredClone(rubric), fields: structuredClone(fields) };
}
function bindTaskTeaching(t) {
  const r = $("[name=rubric_template]"),
    f = $("[name=fields_template]");
  const refresh = () => {
    const d = Object.fromEntries(new FormData($("#modal-form"))),
      settings = taskTeachingData(d, t);
    if ($("#task-rubric-preview"))
      $("#task-rubric-preview").innerHTML = rubricView(settings.rubric);
    if ($("#task-fields-preview")) {
      const target = $("#task-fields-preview");
      target.innerHTML = settings.fields.length
        ? `<div class="task-form-sample"><small>Prueba cómo responderá el estudiante</small>${smartFieldsHTML(settings.fields, {})}</div>`
        : "";
      bindSmartFields(target, settings.fields);
    }
  };
  if (r) r.addEventListener("change", refresh);
  if (f) f.addEventListener("change", refresh);
  refresh();
}
function rubricView(rubric, assessment) {
  if (!rubric?.criteria?.length) return "";
  const maximum = rubric.criteria.reduce(
    (sum, c) => sum + Math.max(...c.levels.map((l) => l.points)),
    0,
  );
  return `<details class="rubric-view" ${assessment ? "open" : ""}><summary>${icon("chart", 17)} ${esc(rubric.title)} <span>${rubric.criteria.length} criterios · ${maximum} puntos de escala</span></summary><div>${rubric.criteria.map((c) => `<article><h4>${esc(c.title)}</h4>${c.description ? `<p>${esc(c.description)}</p>` : ""}<div class="rubric-student-levels">${c.levels.map((l) => `<div class="${assessment?.selections?.[c.id] === l.id ? "selected" : ""}"><strong>${esc(l.label)} <span>${l.points} pts</span></strong><p>${esc(l.description)}</p></div>`).join("")}</div>${assessment?.feedback?.[c.id] ? `<p class="criterion-note">${icon("message", 13)} ${esc(assessment.feedback[c.id])}</p>` : ""}</article>`).join("")}${assessment ? `<p class="rubric-result">${assessment.total}/${assessment.maximum} en la rúbrica → ${assessment.grade} puntos en la actividad</p>` : '<p class="form-help">La puntuación total se convierte proporcionalmente a los puntos de la actividad.</p>'}</div></details>`;
}
function smartFieldsHTML(schema, answers) {
  return schema
    .map((f) => {
      const id = "answer_" + f.id,
        value = answers[f.id],
        required = f.required ? "required" : "",
        attrs = `name="${id}" data-answer="${f.id}" ${required}`;
      let control =
        f.type === "textarea"
          ? `<textarea id="${id}" ${attrs} maxlength="3000">${esc(value || "")}</textarea>`
          : f.type === "choice"
            ? `<select id="${id}" ${attrs}><option value="">Selecciona una opción</option>${f.options.map((v) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(v)}</option>`).join("")}</select>`
            : f.type === "checkbox"
              ? `<label class="smart-checkbox"><input id="${id}" ${attrs} type="checkbox" ${value === true ? "checked" : ""}><span>Confirmo</span></label>`
              : `<input id="${id}" ${attrs} type="${f.type === "number" ? "number" : "text"}" value="${esc(value ?? "")}" ${f.type === "number" ? `step="any" ${f.min !== undefined ? `min="${f.min}"` : ""} ${f.max !== undefined ? `max="${f.max}"` : ""}` : 'maxlength="300"'}>`;
      return `<div class="smart-answer-field form-field" data-smart-field="${f.id}"><label for="${id}">${esc(f.label)}${f.required ? " *" : ""}</label>${control}${f.help ? `<small class="form-help">${esc(f.help)}</small>` : ""}</div>`;
    })
    .join("");
}
function bindSmartFields(root, schema) {
  if (!root) return;
  const update = () => {
    const active = {};
    schema.forEach((f) => {
      const row = root.querySelector(`[data-smart-field="${f.id}"]`);
      if (!row) return;
      const input = row.querySelector("[data-answer]");
      if (root.id !== "submit-form") {
        input.required = false;
        input.setAttribute("form", "luma-preview-no-form");
      }
      const rule = f.show_if,
        visible =
          !rule ||
          (Object.hasOwn(active, rule.field) &&
            active[rule.field] === rule.equals);
      row.hidden = !visible;
      input.disabled = !visible;
      if (visible) {
        if (f.type === "checkbox") active[f.id] = input.checked;
        else if (input.value !== "")
          active[f.id] =
            f.type === "number" ? Number(input.value) : input.value;
      }
    });
  };
  root.addEventListener("input", update);
  root.addEventListener("change", update);
  update();
}
function collectSmartAnswers(form) {
  const result = {};
  form.querySelectorAll("[data-answer]").forEach((input) => {
    if (input.disabled) return;
    const id = input.dataset.answer;
    if (input.type === "checkbox") result[id] = input.checked;
    else if (input.value !== "")
      result[id] = input.type === "number" ? Number(input.value) : input.value;
  });
  return result;
}
function submissionFieldsView(t, answers) {
  const rows =
    t.fields?.filter((f) => Object.hasOwn(answers || {}, f.id)) || [];
  return rows.length
    ? `<div class="submission-answers">${rows.map((f) => `<div><strong>${esc(f.label)}</strong><p>${esc(typeof answers[f.id] === "boolean" ? (answers[f.id] ? "Sí" : "No") : answers[f.id])}</p></div>`).join("")}</div>`
    : "";
}
function gradingFields(t, s) {
  const assessment = s.rubric_assessment || {},
    bank = S.me.preferences?.teaching?.feedback_bank || [
      "Tu trabajo muestra un buen avance.",
      "Revisa los ejemplos y conecta mejor tus ideas.",
      "Incluye evidencia que respalde tus conclusiones.",
    ];
  const rubric = t.rubric?.criteria?.length
    ? `<div class="rubric-grading"><h3>Evaluar con ${esc(t.rubric.title)}</h3>${t.rubric.criteria.map((c) => `<div class="criterion-grade"><label>${esc(c.title)}</label><select name="rubric_${c.id}" required aria-label="Nivel para ${esc(c.title)}"><option value="">Selecciona un nivel</option>${c.levels.map((l) => `<option value="${l.id}" data-points="${l.points}" ${assessment.selections?.[c.id] === l.id ? "selected" : ""}>${esc(l.label)} · ${l.points} pts${l.description ? " · " + esc(l.description) : ""}</option>`).join("")}</select><input name="criterion_${c.id}" value="${esc(assessment.feedback?.[c.id] || "")}" maxlength="1000" placeholder="Comentario para este criterio (opcional)" aria-label="Comentario para ${esc(c.title)}"></div>`).join("")}<output class="rubric-live-score" aria-live="polite">Selecciona todos los niveles para calcular la nota.</output></div>`
    : field(
        "grade",
        "Calificación",
        "number",
        s.grade ?? "",
        `required min="0" max="${t.points}"`,
      ).replaceAll("f-grade", "grade-" + s.id);
  return `${rubric}${textarea("feedback", "Retroalimentación", s.feedback, 'maxlength="2000" placeholder="Acompaña el siguiente paso de tu estudiante…"').replaceAll("f-feedback", "feedback-" + s.id)}<div class="feedback-bank">${bank
    .slice(0, 10)
    .map(
      (v, i) =>
        `<button type="button" data-feedback-text="${esc(v)}" title="${esc(v)}">${icon("plus", 11)} ${esc(v.length > 46 ? v.slice(0, 43) + "…" : v)}</button>`,
    )
    .join("")}</div>`;
}
function gradingPayload(form, t) {
  const d = Object.fromEntries(new FormData(form));
  if (!t.rubric?.criteria) return d;
  const selections = {},
    comments = {};
  t.rubric.criteria.forEach((c) => {
    selections[c.id] = d["rubric_" + c.id];
    comments[c.id] = d["criterion_" + c.id] || "";
  });
  return {
    feedback: d.feedback,
    rubric_selections: selections,
    criterion_feedback: comments,
  };
}
function bindGrading(form, t) {
  const update = () => {
    const out = form.querySelector(".rubric-live-score");
    if (!out) return;
    let total = 0,
      maximum = 0,
      complete = true;
    t.rubric.criteria.forEach((c) => {
      const value = form.elements["rubric_" + c.id].value,
        l = c.levels.find((l) => l.id === value);
      if (!l) complete = false;
      else total += l.points;
      maximum += Math.max(...c.levels.map((l) => l.points));
    });
    out.textContent = complete
      ? `${total}/${maximum} en la rúbrica → ${Math.round((total * t.points) / maximum)}/${t.points} puntos`
      : "Selecciona todos los niveles para calcular la nota.";
  };
  form.addEventListener("change", update);
  form.querySelectorAll("[data-feedback-text]").forEach(
    (b) =>
      (b.onclick = () => {
        const input = form.elements.feedback,
          value =
            (input.value ? input.value + "\n" : "") + b.dataset.feedbackText;
        if (value.length > 2000)
          return toast("El comentario puede tener hasta 2000 caracteres.");
        input.value = value;
        input.focus();
      }),
  );
  update();
}
function openTeachingPreferences() {
  if (!can("teaching.customize")) return;
  const p = S.me.preferences?.teaching || {},
    bank = p.feedback_bank || [
      "Tu trabajo muestra un buen avance.",
      "Revisa los ejemplos y conecta mejor tus ideas.",
      "Incluye evidencia que respalde tus conclusiones.",
    ];
  formModal(
    "Tu manera de acompañar",
    editorSection(
      "01",
      "Una base para tus próximas actividades",
      "Estos valores se aplican al crear, y puedes ajustarlos en cada actividad.",
      `<div class="form-grid">${field("points", "Puntos habituales", "number", p.points || 100, 'required min="1" max="1000"')}${field("due_days", "Días para entregar", "number", p.due_days || 7, 'required min="1" max="60"')}${select(
        "kind",
        "Tipo habitual",
        [
          ["assignment", "Actividad"],
          ["project", "Proyecto"],
          ["reading", "Lectura"],
          ["quiz", "Cuestionario"],
        ],
        p.kind || "assignment",
      )}${select(
        "submission_mode",
        "Formato habitual",
        [
          ["both", "Texto o archivo"],
          ["text", "Solo texto"],
          ["file", "Archivo requerido"],
        ],
        p.submission_mode || "both",
      )}</div>${paletteField("color", p.color || "purple", "Color de mis actividades")}<label class="setting-toggle"><input name="allow_late" type="checkbox" ${(p.allow_late ?? true) ? "checked" : ""}><span><strong>Permitir entregas tardías por defecto</strong><small>El cierre de una actividad bloquea siempre las entregas.</small></span></label>`,
    ) +
      editorSection(
        "02",
        "Retroalimentación con tu voz",
        "Guarda hasta 10 comentarios. Separa cada uno con una línea en blanco.",
        textarea(
          "feedback_bank",
          "Mis comentarios frecuentes",
          bank.join("\n\n"),
          'maxlength="11000"',
        ),
      ),
    "teaching-preferences",
    (d, f) => ({
      ...d,
      points: +d.points,
      due_days: +d.due_days,
      allow_late: f.has("allow_late"),
      feedback_bank: d.feedback_bank
        .split(/\n\s*\n/)
        .map((v) => v.trim())
        .filter(Boolean),
    }),
    "Tu estilo docente quedó guardado.",
  );
}
function defaultDueDate(days) {
  const d = new Date(todayISO() + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-CA");
}
