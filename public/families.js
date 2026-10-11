/* Luma Familias: verified school-home relationships and actionable workflows. */
let familyTab = "overview",
  familyChild = "",
  familyQuery = "";
const familyPermissions = {
  "family-retry-delivery": "families.manage",
  "family-translation": "families.manage",
  "family-enroll": "families.admin",
  "family-link": "families.admin",
  "family-publish": "families.manage",
  "family-review-absence": "families.manage",
  "family-appointment": "families.manage",
  "family-book": "families.guardian",
  "family-agreement": "families.manage",
  "family-justify": "families.guardian",
  "family-request": "families.guardian",
  "family-request-update": "families.use",
  "family-support": "families.manage",
  "family-settings": "families.use",
  "family-conversation": "families.use",
  "family-reply": "families.use",
  "family-respond": "families.use",
};
const familySpace = () => S.families || {};
const familyPerson = (id) =>
  familySpace().people?.find((p) => p.id === id) ||
  familySpace().students?.find((p) => p.id === id) ||
  person(id);
const familyName = (id) => familyPerson(id)?.name || "Persona";
const familyLabels = {
  announcement: "Comunicado",
  permission: "Autorización",
  event: "Evento",
  onboarding: "Bienvenida / matrícula",
  received: "Recibido",
  review: "En revisión",
  information: "Requiere información",
  resolved: "Resuelto",
  rejected: "Rechazado",
  justified: "Justificada",
  accepted: "Autorizado",
  declined: "No aceptado",
  attending: "Asistirá",
  volunteer: "Voluntariado",
  waitlist: "Lista de espera",
  confirmed: "Confirmado",
  pending: "Pendiente",
  sent: "Aceptado por proveedor",
  failed: "No enviado",
  cancelled: "Cancelado",
  unknown: "Resultado desconocido",
  sending: "Enviando",
  open: "Abierto",
  completed: "Completado",
};
const familyLabel = (v) => familyLabels[v] || v;
const familySelected = (r) =>
  !familyChild || String(r.student ?? r.student_id) === familyChild;
const familyTime = (d) =>
  dateFormat(String(d), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
const familyBadge = (s) =>
  `<span class="badge ${["accepted", "resolved", "confirmed", "sent", "completed"].includes(s) ? "done" : ""}">${esc(familyLabel(s))}</span>`;
function familyFile(kind, r) {
  return r.file
    ? `<a class="btn small" href="/api/family-file/${kind}/${r.id}">${icon("download", 14)} ${esc(r.file)}</a>`
    : "";
}
function familyChildSelect(name = "student", selected = "") {
  return select(
    name,
    "Estudiante",
    (familySpace().students || []).map((p) => [p.id, p.name]),
    selected,
  );
}
function familyCourseSelect(name = "course", selected = "") {
  return select(
    name,
    "Materia",
    [
      ["", "Atención institucional (administración)"],
      ...S.courses.filter((c) => !c.archived).map((c) => [c.id, c.title]),
    ],
    selected,
    S.me.role !== "admin",
  );
}
function familyWorkspace() {
  if (!can("families.use"))
    return empty("Este espacio está desactivado o no corresponde a tu perfil.");
  const g = S.me.role === "guardian",
    fs = familySpace(),
    tabs = [
      ["overview", "Mi familia", "home"],
      ["publications", "Comunicados", "bell"],
      ["conversations", "Conversaciones", "message"],
      ["attendance", "Asistencia", "check"],
      ["appointments", "Citas", "calendar"],
      ["requests", "Trámites", "file"],
      ["support", "Acompañamiento", "heart"],
      ...(!g ? [["ai", "Asistente", "spark"]] : []),
      ...(S.me.role === "admin" ? [["links", "Vínculos", "users"]] : []),
      ["settings", "Preferencias", "flower"],
    ];
  return `${heading(g ? "El colegio, cerquita de casa 🌷" : "Hogar y colegio, conectados 🌷", "Cada mensaje, acuerdo y pequeño avance tiene su lugar.")}<section class="studio-hero compact family-hero"><div><span class="eyebrow">LUMA FAMILIAS</span><h2>Aprender también<br><em>nos conecta.</em></h2><p>${g ? "Tus hijos, sus novedades y lo que necesita tu atención." : "Comunicación oficial y acompañamiento con las familias de tu comunidad."}</p></div>${art("flower", 110)}</section><div class="family-toolbar"><label>Ver estudiante<select id="family-child"><option value="">Todos</option>${(fs.students || []).map((p) => `<option value="${p.id}" ${familyChild === String(p.id) ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label><label>Buscar<input id="family-query" placeholder="Comunicado, asunto o trámite…" value="${esc(familyQuery)}"></label></div><nav class="student-tabs family-tabs" aria-label="Hogar y colegio">${tabs.map(([id, label, i]) => `<button data-family-tab="${id}" class="${familyTab === id ? "active" : ""}" aria-current="${familyTab === id ? "page" : "false"}">${icon(i, 16)} ${label}</button>`).join("")}</nav><div class="family-body">${({ overview: familyOverview, publications: familyPublications, conversations: familyConversations, attendance: familyAttendance, appointments: familyAppointments, requests: familyRequests, support: familySupport, links: familyLinks, settings: familySettings, ai: familyAI }[familyTab] || familyOverview)()}</div>`;
}
function familyOverview() {
  const fs = familySpace(),
    g = S.me.role === "guardian",
    pending = (fs.receipts || []).filter(
      (r) => familySelected(r) && !r.confirmed_at,
    ),
    requests = (fs.requests || []).filter(familySelected);
  const count = pending.length,
    ap = (fs.appointments || []).filter(
      (a) =>
        familySelected(a) &&
        a.guardian &&
        !a.cancelled &&
        new Date(a.starts) > new Date(),
    );
  return `<div class="stats">${stat(fs.students?.length || 0, g ? "Hijos vinculados" : "Estudiantes", "users", "purple")}${stat(count, g ? "Respuestas pendientes" : "Respuestas por recibir", "bell", "peach")}${stat(ap.length, "Citas próximas", "calendar", "green")}${stat(requests.filter((r) => !["resolved", "rejected"].includes(r.status)).length, "Trámites abiertos", "file", "pink")}</div>${
    g
      ? `<div class="family-grid">${
          (fs.students || [])
            .filter((p) => !familyChild || String(p.id) === familyChild)
            .map((p) => {
              const academic = fs.academic?.[p.id],
                summary = fs.summaries?.find((s) => s.student === p.id),
                link = fs.links.find((l) => l.student === p.id);
              return `<article class="panel family-child-card ${esc(p.color)}"><div class="section-head">${avatar(p, true)}<span class="badge">${esc(link?.relationship)}</span></div><h2>${esc(p.name)}</h2><p class="muted">Vínculo verificado por la institución.</p>${
                academic
                  ? `<div class="family-metrics"><span><strong>${summary?.average ?? "—"}${summary?.average !== null ? "%" : ""}</strong>Promedio de actividades calificadas</span><span><strong>${summary?.absences_week || 0}</strong>Ausencias en 7 días</span></div><h3>Esta semana</h3>${summary?.upcoming.map((t) => `<div class="family-task-row"><span>${esc(t.title)}</span><span>${dateFormat(t.due)}</span></div>`).join("") || '<p class="muted">Sin actividades pendientes para los próximos 7 días.</p>'}<details><summary>Materias y resultados publicados</summary>${academic.courses
                      .map(
                        (c) =>
                          `<div class="family-course"><h3>${esc(c.title)}</h3><p>${esc(familyName(c.teacher))} · ${esc(c.schedule)}</p>${
                            academic.tasks
                              .filter((t) => t.course === c.id)
                              .map(
                                (t) =>
                                  `<div class="family-result"><strong>${esc(t.title)}</strong><span>${dateFormat(t.due)} · ${t.grade !== null ? `${t.grade}/${t.points}` : t.returned ? "Devuelta para mejorar" : t.submitted ? "Entregada" : "Pendiente"}</span>${t.feedback ? `<p>${esc(t.feedback)}</p>` : ""}</div>`,
                              )
                              .join("") || "<p>Sin actividades publicadas.</p>"
                          }</div>`,
                      )
                      .join("")}</details>`
                  : "<p>Este vínculo permite comunicación y trámites. La consulta académica requiere autorización de administración.</p>"
              }<button class="btn small" data-family-child-card="${p.id}">Ver sus pendientes ${icon("arrow", 14)}</button></article>`;
            })
            .join("") ||
          empty(
            "La institución debe verificar el vínculo con tus hijos para comenzar.",
          )
        }</div>`
      : `<div class="family-grid"><section class="panel"><h2>Lo que necesita atención</h2><p>${count} respuestas por recibir, ${requests.filter((r) => r.status === "received").length} trámites recibidos y ${(fs.justifications || []).filter((j) => j.status === "received").length} justificaciones por revisar.</p><button class="btn" data-family-tab="publications">Revisar comunicados</button></section><section class="panel"><h2>Acompañamiento oportuno</h2><p>${fs.alerts?.length || 0} estudiantes alcanzan los umbrales configurados de ausencias o entregas pendientes.</p><button class="btn" data-family-tab="support">Revisar señales y evidencias</button></section></div>`
  }${g ? familyWelcome() : ""}<section class="panel family-pending"><h2>Para resolver ahora</h2>${
    pending
      .slice(0, 12)
      .map((r) => {
        const p = fs.publications.find((p) => p.id === r.publication);
        return `<button class="family-pending-row" data-family-publication="${p.id}"><span>${icon(p.kind === "permission" ? "shield" : "bell", 18)} ${esc(p.title)}</span><small>${esc(familyName(r.student))} · ${p.deadline ? familyTime(p.deadline) : "Sin fecha límite"}</small></button>`;
      })
      .join("") || '<p class="muted">No hay confirmaciones pendientes.</p>'
  }</section>`;
}
function familyPublications() {
  const fs = familySpace(),
    g = S.me.role === "guardian";
  const list = (fs.publications || []).filter(
    (p) =>
      (!familyChild ||
        fs.receipts.some((r) => r.publication === p.id && familySelected(r))) &&
      `${p.title} ${p.body}`.toLowerCase().includes(familyQuery.toLowerCase()),
  );
  return `<div class="section-head"><div><h2>La información que nos une</h2><p class="muted">Comunicados, permisos, eventos y bienvenida.</p></div>${!g ? '<button class="btn primary" data-family-new="publication">' + icon("plus", 15) + " Crear publicación</button>" : ""}</div><div class="family-grid">${
    list
      .map((p) => {
        const rs = fs.receipts.filter((r) => r.publication === p.id),
          confirmed = rs.filter((r) => r.confirmed_at).length;
        return `<article class="panel family-publication ${p.urgent ? "family-urgent" : ""}"><div class="section-head"><span class="badge">${esc(familyLabel(p.kind))}</span>${p.cancelled ? familyBadge("cancelled") : new Date(p.publish_at) > new Date() ? '<span class="badge">Programada</span>' : p.urgent ? '<span class="badge">Prioridad urgente</span>' : ""}</div><h3>${esc(p.title)}</h3><p class="family-excerpt">${esc(p.body.slice(0, 230))}</p><p class="muted">${familyTime(p.publish_at)}${p.deadline ? " · Responder antes de " + familyTime(p.deadline) : ""}</p>${!g ? `<div class="progress"><i style="width:${rs.length ? (confirmed / rs.length) * 100 : 0}%"></i></div><small>${confirmed}/${rs.length} respuestas · ${rs.filter((r) => r.read_at).length} lecturas</small>` : ""}<div class="form-actions"><button class="btn" data-family-publication="${p.id}">${g ? "Abrir y responder" : "Ver seguimiento"} ${icon("arrow", 14)}</button></div></article>`;
      })
      .join("") || empty("Los comunicados oficiales aparecerán aquí.")
  }</div>`;
}
function familyPublicationForm(draft = null) {
  const opts = [
    ["announcement", "Comunicado"],
    ["permission", "Autorización"],
    ["event", "Evento / voluntariado"],
    ["onboarding", "Bienvenida / matrícula"],
  ];
  formModal(
    "Una publicación que conecta",
    editorSection(
      "01",
      "Mensaje y destinatarios",
      "Selecciona una materia o estudiantes concretos. Solo reciben familias con vínculo verificado.",
      `${select("kind", "Tipo de publicación", opts, "announcement")}${field("title", "Título", "text", draft?.title || "", 'required maxlength="160"')}${textarea("body", "Contenido", draft?.content || "", 'required maxlength="10000"')}${familyCourseSelect()}${
        S.me.role === "admin"
          ? `<details><summary>Elegir estudiantes concretos</summary><div class="family-checklist">${familySpace()
              .students.map(
                (p) =>
                  `<label><input type="checkbox" name="students" value="${p.id}"> ${esc(p.name)}</label>`,
              )
              .join("")}</div></details>`
          : ""
      }`,
    ) +
      editorSection(
        "02",
        "Fechas y participación",
        "Las fechas usan la hora de Costa Rica. Los cupos cuentan estudiantes, no encargados.",
        `${field("publish_at", "Publicar desde (opcional)", "datetime-local")}${field("deadline", "Fecha límite de respuesta (opcional)", "datetime-local")}<div class="form-grid">${field("event_at", "Fecha del evento (solo eventos)", "datetime-local")}${field("capacity", "Cupos (0 = sin límite)", "number", 0, 'min="0" max="10000"')}</div>${field("location", "Lugar / enlace", "text", "", 'maxlength="200"')}<label class="setting-toggle"><input name="acknowledgement" type="checkbox"><span>Solicitar confirmación explícita</span></label><label class="setting-toggle"><input name="urgent" type="checkbox"><span>Urgente: permite avisos durante el horario de silencio</span></label>`,
      ) +
      editorSection(
        "03",
        "Formulario y documentos",
        "Añade preguntas, opciones y condiciones usando el editor de Luma.",
        `<div id="teaching-builder">${fieldsBuilder([])}</div>${field("file", "Adjuntar archivo (máximo 5 MB)", "file")}`,
      ),
    "family-publish",
    (d, f) => {
      f.set("students", JSON.stringify(f.getAll("students").map(Number)));
      f.set("fields", JSON.stringify(collectFieldsBuilder()));
      f.set(
        "acknowledgement",
        JSON.stringify(f.get("acknowledgement") === "on"),
      );
      f.set("urgent", JSON.stringify(f.get("urgent") === "on"));
      return d;
    },
    "La publicación y sus destinatarios quedaron guardados.",
    true,
  );
  bindTeachingBuilder();
}
function openFamilyPublication(id) {
  const fs = familySpace(),
    p = fs.publications.find((p) => p.id === id);
  if (!p) return;
  const g = S.me.role === "guardian",
    rs = fs.receipts.filter(
      (r) => r.publication === id && (!g || familySelected(r)),
    ),
    event = p.kind === "event";
  modal(
    p.title,
    `<div class="family-document-header"><span class="badge">${esc(familyLabel(p.kind))}</span><small>${familyTime(p.publish_at)}</small></div><p class="family-fulltext">${esc(p.body)}</p>${p.original_body && p.original_body !== p.body ? `<details><summary>Ver mensaje original</summary><p class="family-fulltext">${esc(p.original_body)}</p></details>` : ""}${p.event_at ? `<div class="admin-explanation">${icon("calendar", 22)}<p>${familyTime(p.event_at)} · ${esc(p.location)}${p.capacity ? " · " + p.capacity + " cupos" : ""}</p></div>` : ""}${familyFile("publication", p)}${p.cancelled ? "<p>La institución canceló esta publicación. Se conserva su historial.</p>" : ""}<div class="family-receipt-list">${rs.map((r) => `<article><strong>${esc(familyName(r.student))}${!g ? " · " + esc(familyName(r.guardian)) : ""}</strong><div>${r.read_at ? "Leído " + familyTime(r.read_at) : "Sin lectura registrada"} · ${familyBadge(r.response || "pending")}</div>${r.signature ? `<small>Confirmó: ${esc(r.signature)} · ${familyTime(r.responded_at)}</small>` : ""}${submissionFieldsView({ fields: p.fields }, r.answers)}${g && !r.responded_at && !p.cancelled ? `<button class="btn primary" data-family-respond="${r.id}">${event ? "Inscribirme" : p.kind === "permission" ? "Registrar autorización" : "Completar y confirmar"}</button>` : ""}</article>`).join("")}</div>${!g ? `<div class="form-actions">${!p.cancelled ? `<button class="btn danger" id="family-cancel-publication">Cancelar publicación</button>` : ""}<button class="btn" id="family-translate">Preparar traducción</button></div>` : ""}`,
  );
  $$("[data-family-respond]").forEach(
    (b) => (b.onclick = () => familyRespond(+b.dataset.familyRespond)),
  );
  if (g)
    (async () => {
      for (const r of rs.filter((r) => !r.read_at))
        S = await api("family-read", { id: r.id });
      reindex();
    })().catch((e) => toast(e.message));
  const cancel = $("#family-cancel-publication");
  if (cancel)
    cancel.onclick = () =>
      familyAct(cancel, "family-cancel-publication", { id });
  const tr = $("#family-translate");
  if (tr)
    tr.onclick = () =>
      familyAIForm("translate", {
        publication: id,
        title: "Traducción: " + p.title,
      });
}
function familyRespond(id) {
  const r = familySpace().receipts.find((r) => r.id === id),
    p = familySpace().publications.find((p) => p.id === r.publication);
  const responses =
    p.kind === "permission"
      ? [
          ["accepted", "Autorizo"],
          ["declined", "No autorizo"],
        ]
      : p.kind === "event"
        ? [
            ["attending", "Asistirá"],
            ["volunteer", "Participaré como voluntario/a"],
            ["declined", "No participará"],
          ]
        : [["confirmed", "Confirmo recepción y respuestas"]];
  formModal(
    "Tu respuesta para " + familyName(r.student),
    `${select("response", "Respuesta", responses, responses[0][0])}<div id="family-answer-fields">${smartFieldsHTML(p.fields, {})}</div>${p.kind === "permission" || p.kind === "onboarding" || p.acknowledgement ? `${field("signature", "Nombre de quien responde", "text", S.me.name, 'required maxlength="100"')}<label class="setting-toggle"><input name="consent" type="checkbox" required><span>Confirmo que soy el encargado y registro mi propia respuesta.</span></label>` : ""}<p class="form-help">Se guardará tu respuesta con fecha y cuenta. Los eventos con cupo completo pasan a lista de espera.</p>`,
    "family-respond",
    (d) => ({
      ...d,
      id,
      consent: d.consent === "on",
      answers: collectSmartAnswers($("#modal-form")),
    }),
    "Tu respuesta quedó registrada.",
  );
  const form = $("#modal-form");
  bindSmartFields(form, p.fields);
  $("#f-response").addEventListener("change", () => {
    $$("[data-answer]").forEach((input) => {
      input.required = false;
      input.disabled =
        $("#f-response").value === "declined" ||
        input.closest("[data-smart-field]").hidden;
    });
  });
}
function familyConversations() {
  const list = (familySpace().conversations || [])
    .filter(familySelected)
    .filter((c) =>
      `${c.subject} ${familyName(c.student)}`
        .toLowerCase()
        .includes(familyQuery.toLowerCase()),
    );
  return `<div class="section-head"><div><h2>Conversaciones con propósito</h2><p class="muted">Asuntos claros, archivos y acuerdos con sus participantes.</p></div><button class="btn primary" data-family-new="conversation">${icon("plus", 15)} Nueva conversación</button></div><div class="family-grid">${list.map((c) => `<article class="panel"><span class="badge">${c.closed ? "Cerrada" : "Abierta"}</span><h3>${esc(c.subject)}</h3><p>${esc(familyName(c.student))} · ${esc(familyName(S.me.role === "guardian" ? c.staff : c.guardian))}</p><p class="family-excerpt">${esc(c.replies.at(-1)?.body || "")}</p><small>${c.replies.filter((r) => r.author !== S.me.id && !r.read_at).length} mensajes sin leer</small><div class="form-actions"><button class="btn" data-family-conversation="${c.id}">Abrir conversación</button></div></article>`).join("") || empty("Tu primera conversación puede comenzar aquí.")}</div>`;
}
function familyConversationForm() {
  const fs = familySpace(),
    g = S.me.role === "guardian",
    people = g
      ? fs.people.filter((p) => ["teacher", "admin"].includes(p.role))
      : fs.people.filter((p) => p.role === "guardian");
  formModal(
    "Conversemos con el colegio",
    `${familyChildSelect()}${select(
      g ? "staff" : "guardian",
      g ? "Docente / administración" : "Encargado",
      people.map((p) => [p.id, p.name]),
    )}${select(
      "category",
      "Tema",
      [
        ["academic", "Consulta académica"],
        ["attendance", "Asistencia"],
        ["procedure", "Trámite"],
        ["wellbeing", "Acompañamiento"],
      ],
      "academic",
    )}${field("subject", "Asunto", "text", "", 'required maxlength="160"')}${textarea("body", "Mensaje", "", 'required maxlength="6000"')}${field("file", "Adjunto (máximo 5 MB)", "file")}<p class="form-help">El servidor verifica que el destinatario esté vinculado al estudiante seleccionado.</p>`,
    "family-conversation",
    null,
    "Conversación creada.",
    true,
  );
}
function openFamilyConversation(id) {
  const c = familySpace().conversations.find((c) => c.id === id);
  if (!c) return;
  modal(
    c.subject,
    `<p class="muted">${esc(familyName(c.student))} · ${esc(familyName(c.staff))} / ${esc(familyName(c.guardian))}</p><p class="form-help">Horario de atención: ${esc(familySpace().staff_hours?.[c.staff] || "Consulta con el colegio")}</p><div class="family-chat">${c.replies.map((r) => `<article class="${r.author === S.me.id ? "mine" : ""}"><strong>${esc(familyName(r.author))}</strong><small>${familyTime(r.created)}</small><p>${esc(r.body)}</p>${familyFile("reply", r)}</article>`).join("")}</div><div class="form-actions">${!c.closed ? '<button class="btn primary" id="family-write">Responder</button>' : ""}<button class="btn" id="family-close">${c.closed ? "Reabrir" : "Cerrar"} conversación</button>${S.me.role !== "guardian" ? '<button class="btn" id="family-summarize">Borrador de resumen</button>' : ""}</div>`,
  );
  if (c.replies.some((r) => r.author !== S.me.id && !r.read_at))
    api("family-read-conversation", { id })
      .then((next) => {
        S = next;
        reindex();
      })
      .catch((e) => toast(e.message));
  const wr = $("#family-write");
  if (wr)
    wr.onclick = () =>
      formModal(
        "Tu respuesta",
        `${textarea("body", "Mensaje", "", 'required maxlength="6000"')}${field("file", "Adjunto (máximo 5 MB)", "file")}`,
        "family-reply",
        (d, f) => {
          f.set("id", id);
          return d;
        },
        "Respuesta enviada.",
        true,
      );
  $("#family-close").onclick = (e) =>
    familyAct(e.currentTarget, "family-close-conversation", {
      id,
      closed: !c.closed,
    });
  const sum = $("#family-summarize");
  if (sum)
    sum.onclick = () =>
      familyAIForm("summary", {
        conversation: id,
        title: "Resumen: " + c.subject,
      });
}
function familyAttendance() {
  const fs = familySpace(),
    g = S.me.role === "guardian";
  const attendance = g
    ? Object.entries(fs.academic || {}).flatMap(([id, a]) =>
        a.attendance.map((r) => ({ ...r, student: +id })),
      )
    : S.attendance.map((r) => ({ ...r, student: r.student_id }));
  const list = attendance
    .filter(familySelected)
    .filter(
      (r) =>
        !r.present || fs.justifications?.some((j) => j.attendance === r.id),
    );
  return `<div class="section-head"><div><h2>Asistencia y justificaciones</h2><p class="muted">Una ausencia justificada conserva su registro de ausencia.</p></div></div><div class="table-wrap"><table><thead><tr><th>Estudiante / materia</th><th>Fecha</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${
    list
      .map((a) => {
        const j = fs.justifications.find((j) => j.attendance === a.id),
          c =
            course(a.course_id) ||
            fs.academic?.[a.student]?.courses.find((c) => c.id === a.course_id);
        return `<tr><td>${esc(familyName(a.student))}<small class="admin-cell-note">${esc(c?.title)}</small></td><td>${dateFormat(String(a.date))}</td><td>${j ? familyBadge(j.status === "accepted" ? "justified" : j.status) : familyBadge("pending")}</td><td>${j ? `<button class="btn small" data-family-absence="${j.id}">Ver justificación</button>` : g ? `<button class="btn small" data-family-justify="${a.id}">Justificar</button>` : "Sin solicitud familiar"}</td></tr>`;
      })
      .join("") ||
    '<tr><td colspan="4">No hay ausencias o justificaciones disponibles.</td></tr>'
  }</tbody></table></div>${
    g
      ? '<p class="form-help">Para registrar una tardía, usa un registro de asistencia de la lista completa de abajo.</p><details><summary>Todos los registros de asistencia</summary>' +
        attendance
          .filter(familySelected)
          .slice(0, 100)
          .map(
            (a) =>
              `<div class="family-task-row"><span>${esc(familyName(a.student))} · ${dateFormat(String(a.date))} · ${a.present ? "Presente" : "Ausente"}</span><button class="btn small" data-family-justify="${a.id}">Ausencia / tardía</button></div>`,
          )
          .join("") +
        "</details>"
      : ""
  }`;
}
function familyJustify(id, existing = null) {
  formModal(
    "Contemos qué ocurrió",
    `${select(
      "kind",
      "Tipo",
      [
        ["absence", "Ausencia"],
        ["late", "Tardía"],
      ],
      existing?.kind || "absence",
    )}${textarea("reason", "Motivo", existing?.reason || "", 'required maxlength="4000"')}${field("file", "Comprobante (máximo 5 MB)", "file")}`,
    "family-justify",
    (d, f) => {
      f.set("attendance", id);
      return d;
    },
    "Justificación recibida.",
    true,
  );
}
function openFamilyAbsence(id) {
  const j = familySpace().justifications.find((j) => j.id === id);
  if (!j) return;
  modal(
    "Justificación de " + familyName(j.student),
    `${familyBadge(j.status === "accepted" ? "justified" : j.status)}<p class="family-fulltext">${esc(j.reason)}</p>${familyFile("absence", j)}${j.review ? `<div class="admin-explanation"><p>${esc(j.review)}</p></div>` : ""}<div class="form-actions">${S.me.role === "guardian" && j.status === "information" ? '<button class="btn primary" id="family-absence-more">Completar información</button>' : ""}${S.me.role !== "guardian" ? '<button class="btn primary" id="family-review-absence">Revisar solicitud</button>' : ""}</div>`,
  );
  const more = $("#family-absence-more");
  if (more) more.onclick = () => familyJustify(j.attendance, j);
  const review = $("#family-review-absence");
  if (review)
    review.onclick = () =>
      formModal(
        "Revisar justificación",
        `${select(
          "status",
          "Decisión",
          [
            ["accepted", "Aceptar como justificada"],
            ["information", "Solicitar información"],
            ["rejected", "Rechazar"],
          ],
          "accepted",
        )}${textarea("review", "Respuesta a la familia", j.review, 'required maxlength="2000"')}`,
        "family-review-absence",
        (d) => ({ ...d, id }),
      );
}
function familyAppointments() {
  const g = S.me.role === "guardian",
    list = (familySpace().appointments || []).filter(
      (a) => !familyChild || !a.student || familySelected(a),
    );
  return `<div class="section-head"><div><h2>Un momento para conversar</h2><p class="muted">Horarios disponibles, reservas y acuerdos de seguimiento.</p></div>${!g ? '<button class="btn primary" data-family-new="appointment">' + icon("plus", 15) + " Abrir horario</button>" : ""}</div><div class="family-grid">${list.map((a) => `<article class="panel"><span class="badge">${a.cancelled ? "Cancelada" : a.guardian ? "Reservada" : "Disponible"}</span><h3>${familyTime(a.starts)}</h3><p>${esc(familyName(a.staff))} · ${a.minutes} minutos</p><p>${esc(a.location)}</p>${a.student ? `<p>${esc(familyName(a.student))} · ${esc(a.question)}</p>` : ""}${a.agreement ? `<div class="admin-explanation"><p>${esc(a.agreement)}</p></div>` : ""}<div class="form-actions">${g && !a.cancelled && !a.guardian ? `<button class="btn primary" data-family-book="${a.id}">Reservar</button>` : ""}${g && a.guardian === S.me.id && !a.cancelled && new Date(a.starts) > new Date() ? `<button class="btn" data-family-release="${a.id}">Cancelar reserva</button>` : ""}${!g && !a.cancelled ? `${a.guardian ? `<button class="btn" data-family-agreement="${a.id}">Registrar acuerdos</button>` : ""}<button class="btn danger" data-family-cancel-appointment="${a.id}">Cancelar horario</button>` : ""}</div></article>`).join("") || empty("Los horarios que publique el colegio aparecerán aquí.")}</div>`;
}
function familyAppointmentForm() {
  formModal(
    "Un horario para las familias",
    `${familyCourseSelect()}${field("starts", "Fecha y hora (Costa Rica)", "datetime-local", "", "required")}${field("minutes", "Duración en minutos", "number", 30, 'required min="10" max="120"')}${field("location", "Lugar / enlace de reunión", "text", "", 'required maxlength="200"')}`,
    "family-appointment",
    (d) => ({ ...d, minutes: +d.minutes }),
  );
}
function familyRequests() {
  const fs = familySpace(),
    g = S.me.role === "guardian",
    list = (fs.requests || [])
      .filter(familySelected)
      .filter((r) =>
        `${r.title} ${r.body}`
          .toLowerCase()
          .includes(familyQuery.toLowerCase()),
      );
  return `<div class="section-head"><div><h2>Trámites con un camino claro</h2><p class="muted">Documentos, constancias, matrícula y actualización de datos.</p></div>${g ? '<button class="btn primary" data-family-new="request">' + icon("plus", 15) + " Nueva solicitud</button>" : ""}</div><div class="family-grid">${list.map((r) => `<article class="panel">${familyBadge(r.status)}<h3>${esc(r.title)}</h3><p>${esc(familyName(r.student))}</p><p class="family-excerpt">${esc(r.body.slice(0, 180))}</p><small>Responsable: ${r.responsible ? esc(familyName(r.responsible)) : "Por asignar"}</small><div class="form-actions"><button class="btn" data-family-request="${r.id}">Ver seguimiento</button></div></article>`).join("") || empty("Cada solicitud conservará su historial y sus documentos.")}</div>`;
}
function familyRequestForm() {
  formModal(
    "Un trámite sin vueltas",
    `${familyChildSelect()}${select(
      "kind",
      "Tipo",
      [
        ["certificate", "Constancia"],
        ["data", "Actualizar datos"],
        ["documents", "Presentar documentos"],
        ["enrollment", "Matrícula"],
        ["other", "Otro"],
      ],
      "certificate",
    )}${field("title", "Asunto", "text", "", 'required maxlength="160"')}${textarea("body", "Detalles", "", 'required maxlength="6000"')}${field("file", "Documento (máximo 5 MB)", "file")}`,
    "family-request",
    null,
    "Solicitud recibida.",
    true,
  );
}
function openFamilyRequest(id) {
  const r = familySpace().requests.find((r) => r.id === id);
  if (!r) return;
  modal(
    r.title,
    `${familyBadge(r.status)}<p class="family-fulltext">${esc(r.body)}</p>${familyFile("request", r)}${S.me.role === "admin" && r.kind === "enrollment" && !["resolved", "rejected"].includes(r.status) ? '<div class="form-actions"><button class="btn primary" id="family-enroll">Revisar y matricular</button></div>' : ""}<div class="family-timeline">${r.history.map((h) => `<article><strong>${esc(familyName(h.author))}</strong><small>${familyTime(h.created)} · ${esc(familyLabel(h.status))}</small><p>${esc(h.body)}</p>${familyFile("request-update", h)}</article>`).join("")}</div>${S.me.role === "admin" || r.status === "information" ? '<div class="form-actions"><button class="btn primary" id="family-update-request">' + (S.me.role === "admin" ? "Actualizar seguimiento" : "Enviar información") + "</button></div>" : ""}`,
  );
  const enroll = $("#family-enroll");
  if (enroll) enroll.onclick = () => familyEnrollmentForm(r);
  const b = $("#family-update-request");
  if (b)
    b.onclick = () =>
      formModal(
        "Seguimiento de la solicitud",
        `${
          S.me.role === "admin"
            ? `${select(
                "status",
                "Estado",
                [
                  "received",
                  "review",
                  "information",
                  "resolved",
                  "rejected",
                ].map((v) => [v, familyLabel(v)]),
                r.status,
              )}${select(
                "responsible",
                "Responsable",
                familySpace()
                  .people.filter((p) => p.role === "admin")
                  .map((p) => [p.id, p.name]),
                r.responsible || S.me.id,
              )}`
            : ""
        }${textarea("body", "Respuesta / información", "", 'required maxlength="6000"')}${field("file", "Documento de respuesta (máximo 5 MB)", "file")}`,
        "family-request-update",
        (d, f) => {
          f.set("id", id);
          return d;
        },
        "Seguimiento actualizado.",
        true,
      );
}
function familySupport() {
  const fs = familySpace(),
    g = S.me.role === "guardian",
    plans = (fs.plans || []).filter(familySelected),
    alerts = (fs.alerts || []).filter(familySelected);
  return `<div class="section-head"><div><h2>Acompañar con acuerdos</h2><p class="muted">Evidencias claras, una persona responsable y una fecha de seguimiento.</p></div>${!g ? '<button class="btn primary" data-family-new="support">' + icon("plus", 15) + " Crear plan</button>" : ""}</div>${!g ? `<section class="panel"><h3>Señales para revisar</h3><p class="muted">Últimos 30 días: ${fs.options.absence_threshold} ausencias. Actividades vencidas abiertas: ${fs.options.missing_threshold} pendientes. Revisa la evidencia antes de contactar a la familia.</p>${alerts.map((a) => `<div class="family-task-row"><span><strong>${esc(familyName(a.student))}</strong> · ${a.absences} ausencias · ${a.missing} entregas pendientes</span><button class="btn small" data-family-support-student="${a.student}">Preparar acompañamiento</button></div>`).join("") || "<p>Sin señales que alcancen tus umbrales.</p>"}</section>` : ""}<div class="family-grid">${plans.map((p) => `<article class="panel">${familyBadge(p.status)}<h3>${esc(p.title)}</h3><p>${esc(familyName(p.student_id))} · Responsable: ${esc(familyName(p.author_id))}</p><p class="family-fulltext">${esc(p.evidence)}</p><div class="admin-explanation"><p>${esc(p.agreement)}</p></div><small>Seguimiento: ${dateFormat(String(p.follow_up))} · ${p.shared ? "Compartido con familia" : "Borrador interno"}</small>${!g ? `<div class="form-actions"><button class="btn" data-family-support="${p.id}">Editar seguimiento</button></div>` : ""}</article>`).join("") || empty("Los acuerdos de acompañamiento aparecerán aquí.")}</div>`;
}
function familySupportForm(existing = null, child = "") {
  formModal(
    "Un plan para acompañar",
    `${existing ? `<input type="hidden" name="id" value="${existing.id}">` : ""}${familyChildSelect("student", existing?.student_id || child)}${familyCourseSelect("course", existing?.course_id)}${field("title", "Título", "text", existing?.title || "", 'required maxlength="160"')}${textarea("evidence", "Evidencia que revisó el docente", existing?.evidence || "", 'required maxlength="4000"')}${textarea("agreement", "Acuerdos y acciones", existing?.agreement || "", 'required maxlength="4000"')}${field("follow_up", "Fecha de seguimiento", "date", existing?.follow_up || todayISO(), "required")}${select(
      "status",
      "Estado",
      ["open", "review", "completed"].map((v) => [v, familyLabel(v)]),
      existing?.status || "open",
    )}<label class="setting-toggle"><input name="shared" type="checkbox" ${existing?.shared ? "checked" : ""}><span>Compartir estas evidencias y acuerdos con los encargados vinculados</span></label>`,
    "family-support",
    (d) => ({ ...d, shared: d.shared === "on" }),
  );
}
function familyLinks() {
  if (S.me.role !== "admin")
    return empty("Los vínculos los verifica administración.");
  const fs = familySpace();
  return `<div class="section-head"><div><h2>Vínculos verificados</h2><p class="muted">Crea la cuenta familiar desde Administración y verifica su relación con el estudiante.</p></div><button class="btn primary" data-family-new="link">${icon("plus", 15)} Verificar vínculo</button></div><div class="table-wrap"><table><thead><tr><th>Estudiante</th><th>Encargado</th><th>Relación</th><th>Consulta académica</th><th>Acción</th></tr></thead><tbody>${fs.links.map((l) => `<tr><td>${esc(familyName(l.student))}</td><td>${esc(familyName(l.guardian))}</td><td>${esc(l.relationship)}</td><td>${l.academic ? "Autorizada" : "Solo comunicación"}</td><td><button class="link-btn" data-family-link-edit="${l.id}">Editar</button> <button class="link-btn danger" data-family-unlink="${l.id}">Revocar acceso</button></td></tr>`).join("") || '<tr><td colspan="5">Aún no hay vínculos verificados.</td></tr>'}</tbody></table></div><section class="panel"><h3>Familias por contactar</h3>${
    fs.contactability
      .filter((r) => !r.guardians)
      .map(
        (r) =>
          `<div class="family-task-row">${esc(familyName(r.student))}<span class="badge">Sin encargado verificado</span></div>`,
      )
      .join("") ||
    "<p>Todos los estudiantes activos tienen al menos un vínculo familiar.</p>"
  }</section>`;
}
function familyLinkForm(existing = null) {
  const guardians =
    S.administration?.people?.filter(
      (p) => p.role === "guardian" && p.active,
    ) || [];
  if (!guardians.length)
    return toast(
      "Crea primero una persona con perfil Familiar / encargado en Administración.",
    );
  formModal(
    "Verificar vínculo familiar",
    `${familyChildSelect("student", existing?.student)}${select(
      "guardian",
      "Encargado",
      guardians.map((p) => [p.id, p.name]),
      existing?.guardian,
    )}${field("relationship", "Relación con el estudiante", "text", existing?.relationship || "Encargado", 'required maxlength="60"')}<label class="setting-toggle"><input name="academic" type="checkbox" ${existing?.academic !== false ? "checked" : ""}><span>Permitir consulta de calificaciones, entregas y asistencia</span></label><p class="form-help">Verifica la identidad y autorización de la persona antes de vincularla. El acceso no incluye apuntes privados ni sesiones de Luma AI.</p>`,
    "family-link",
    (d) => ({ ...d, academic: d.academic === "on" }),
  );
}
function familySettings() {
  const fs = familySpace(),
    o = fs.options || {},
    g = S.me.role === "guardian";
  return `<section class="panel"><h2>A tu ritmo, con información clara</h2><p>Los canales externos necesitan configuración del servidor y un proceso de envío programado.</p><div class="family-channel-status">${["email", "sms", "push"].map((c) => `<span class="badge">${{ email: "Correo", sms: "SMS", push: "Push" }[c]}: ${fs.channels?.[c] ? "configurado" : "sin configurar"}</span>`).join("")}</div><button class="btn primary" data-family-new="settings">Personalizar avisos y atención</button>${g ? '<button class="btn" id="family-enable-push">Activar avisos en este navegador</button><button class="btn" id="family-disable-push">Desactivar avisos del navegador</button>' : ""}<p class="muted">Frecuencia: ${esc({ immediate: "Inmediata", daily: "Resumen diario", weekly: "Resumen semanal" }[o.frequency])} · Silencio: ${esc(o.quiet_start)}–${esc(o.quiet_end)}. El resumen semanal se envía los lunes.</p><p>Idioma preferido: ${esc(o.language)}. Las traducciones se preparan y revisan por el personal; el mensaje original se conserva.</p>${!g ? `<p>Horario de atención: ${esc(o.office_hours)}</p>` : ""}</section><section class="panel"><h3>Registro de entregas externas</h3><p class="muted">“Aceptado por proveedor” no equivale a leído ni a confirmado por la familia.</p><div class="table-wrap"><table><thead><tr><th>Aviso</th><th>Canal</th><th>Estado</th>${!g ? "<th>Detalle</th>" : ""}</tr></thead><tbody>${(fs.deliveries || []).map((d) => `<tr><td>${esc(d.title || "Publicación #" + d.publication_id)}</td><td>${esc(d.channel)}</td><td>${familyBadge(d.status)}</td>${!g ? `<td>${esc(d.error || "")}${["failed", "unknown"].includes(d.status) ? `<button class="link-btn" data-family-retry="${d.id}">Revisar y reintentar</button>` : ""}</td>` : ""}</tr>`).join("") || `<tr><td colspan="4">Sin entregas externas registradas.</td></tr>`}</tbody></table></div></section>`;
}
function familySettingsForm() {
  const o = familySpace().options;
  formModal(
    "Tus preferencias de comunicación",
    `<div class="family-checklist">${[
      ["inapp", "Dentro de Luma"],
      ["email", "Correo electrónico"],
      ["sms", "SMS"],
      ["push", "Notificación del navegador"],
    ]
      .map(
        ([v, l]) =>
          `<label><input name="channels" value="${v}" type="checkbox" ${o.channels.includes(v) ? "checked" : ""} ${v === "inapp" ? "disabled" : ""}> ${l}</label>`,
      )
      .join("")}</div>${select(
      "frequency",
      "Frecuencia de avisos",
      [
        ["immediate", "Inmediata"],
        ["daily", "Resumen diario"],
        ["weekly", "Resumen semanal"],
      ],
      o.frequency,
    )}${select(
      "language",
      "Idioma preferido",
      [
        ["es", "Español"],
        ["en", "Inglés"],
        ["pt", "Portugués"],
        ["fr", "Francés"],
      ],
      o.language,
    )}<div class="form-grid">${field("quiet_start", "Silencio desde", "time", o.quiet_start, "required")}${field("quiet_end", "Silencio hasta", "time", o.quiet_end, "required")}</div>${field("office_hours", "Horario de atención", "text", o.office_hours, 'maxlength="200"')}<label class="setting-toggle"><input name="remind_appointments" type="checkbox" ${o.remind_appointments !== false ? "checked" : ""}><span>Recordarme mis citas durante las 24 horas previas</span></label><div class="form-grid">${field("absence_threshold", "Umbral de ausencias en 30 días", "number", o.absence_threshold, 'required min="1" max="30"')}${field("missing_threshold", "Umbral de actividades pendientes", "number", o.missing_threshold, 'required min="1" max="30"')}</div><p class="form-help">Para SMS, registra tu teléfono internacional en Mi perfil. Los avisos urgentes pueden llegar durante el horario de silencio.</p>`,
    "family-settings",
    (d, f) => ({
      ...d,
      remind_appointments: d.remind_appointments === "on",
      channels: ["inapp", ...f.getAll("channels")],
      absence_threshold: +d.absence_threshold,
      missing_threshold: +d.missing_threshold,
    }),
  );
}
function familyAI() {
  return `<div class="section-head"><div><h2>Palabras que acompañan</h2><p class="muted">Borradores de comunicación con NVIDIA Kimi K2, siempre revisados por ti.</p></div><button class="btn primary" data-family-new="ai">${icon("spark", 15)} Preparar borrador</button></div><div class="family-grid">${(familySpace().drafts || []).map((d) => `<article class="panel"><span class="badge">Borrador privado</span><h3>${esc(d.title)}</h3><p class="family-excerpt">${esc(d.content.slice(0, 220))}</p><div class="form-actions"><button class="btn" data-family-draft="${d.id}">Revisar borrador</button><button class="link-btn danger" data-family-draft-delete="${d.id}">Eliminar</button></div></article>`).join("") || empty("Puedes preparar un comunicado, resumir una conversación propia o traducir una publicación.")}</div>`;
}
function familyAIForm(mode = "draft", extra = {}) {
  modal(
    "Asistente de comunicación",
    `<p class="modal-description">La IA prepara texto; tú revisas los hechos, fechas y destinatarios antes de publicar.</p><form id="family-ai-form">${field("title", "Título", "text", extra.title || "", 'required maxlength="160"')}${
      mode === "translate"
        ? select(
            "language",
            "Idioma de destino",
            [
              ["es", "Español"],
              ["en", "Inglés"],
              ["pt", "Portugués"],
              ["fr", "Francés"],
            ],
            "en",
          )
        : ""
    }${textarea("prompt", mode === "translate" ? "Idioma de destino e indicaciones" : "Qué necesitas preparar", "", 'required maxlength="6000"')}<div class="form-actions"><button class="btn primary" type="submit">Preparar borrador ${icon("spark", 15)}</button></div></form>`,
  );
  $("#family-ai-form").onsubmit = async (e) => {
    e.preventDefault();
    const b = e.submitter;
    busy(b, true, "Preparando…");
    modalPending(true);
    try {
      const r = await api("family-ai/generate", {
        ...extra,
        ...Object.fromEntries(new FormData(e.target)),
        mode,
      });
      S = await api("state", null, "GET");
      modalPending(false);
      familyDraftReview(r.id);
      render();
    } catch (err) {
      modalError(err);
    } finally {
      busy(b, false);
      modalPending(false);
    }
  };
}
function familyDraftReview(id) {
  const d = familySpace().drafts.find((d) => d.id === id);
  if (!d) return;
  modal(
    "Revisar: " + d.title,
    `<p class="modal-description">Revisa el borrador y corrige lo necesario antes de pasarlo al formulario de publicación.</p>${textarea("content", "Borrador editable", d.content, 'maxlength="10000"')}<label class="setting-toggle"><input id="family-draft-reviewed" type="checkbox"><span>Revisé hechos, fechas, tono e información personal.</span></label><div class="form-actions"><button class="btn primary" id="family-use-draft">Continuar a publicación</button></div>`,
  );
  $("#family-use-draft").onclick = () => {
    if (!$("#family-draft-reviewed").checked)
      return toast("Revisa el borrador y confirma antes de continuar.");
    if (d.publication_id)
      return familyTranslationForm(d, $("#f-content").value);
    familyPublicationForm({ title: d.title, content: $("#f-content").value });
  };
}
async function familyAct(button, path, data) {
  busy(button, true);
  modalPending(true);
  try {
    S = await api(path, data);
    modalPending(false);
    closeModal(true);
    render();
    toast("El cambio quedó guardado.");
  } catch (e) {
    modalError(e);
    toast(e.message);
  } finally {
    busy(button, false);
    modalPending(false);
  }
}
function bindFamilies() {
  $$("[data-family-tab]").forEach(
    (b) =>
      (b.onclick = async () => {
        const next = b.dataset.familyTab;
        busy(b, true);
        const area = $(".family-body");
        if (area)
          area.innerHTML =
            '<section class="panel" aria-busy="true"><div class="skeleton-line"></div><p>Actualizando la información del colegio…</p></section>';
        try {
          S = await api("state", null, "GET");
          familyTab = next;
          render();
        } catch (e) {
          toast(e.message);
        } finally {
          busy(b, false);
        }
      }),
  );
  const child = $("#family-child");
  if (child)
    child.onchange = () => {
      familyChild = child.value;
      render();
    };
  const query = $("#family-query");
  if (query)
    query.oninput = () => {
      familyQuery = query.value;
      render({ preserve: true });
    };
  $$("[data-family-child-card]").forEach(
    (b) =>
      (b.onclick = () => {
        familyChild = b.dataset.familyChildCard;
        familyTab = "publications";
        render();
      }),
  );
  $$("[data-family-new]").forEach(
    (b) =>
      (b.onclick = () =>
        ({
          publication: familyPublicationForm,
          conversation: familyConversationForm,
          appointment: familyAppointmentForm,
          request: familyRequestForm,
          support: familySupportForm,
          link: familyLinkForm,
          settings: familySettingsForm,
          ai: familyAIForm,
        })[b.dataset.familyNew]()),
  );
  const openers = {
    publication: openFamilyPublication,
    conversation: openFamilyConversation,
    absence: openFamilyAbsence,
    request: openFamilyRequest,
    justify: familyJustify,
    draft: familyDraftReview,
  };
  for (const [key, fn] of Object.entries(openers))
    $$("[data-family-" + key + "]").forEach(
      (b) => (b.onclick = () => fn(+b.getAttribute("data-family-" + key))),
    );
  $$("[data-family-unlink]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = +b.dataset.familyUnlink;
        modal(
          "Revocar vínculo familiar",
          `<p>El encargado perderá acceso a la información y archivos de este estudiante. El historial se conserva.</p><div class="form-actions"><button class="btn" data-close>Conservar vínculo</button><button class="btn danger" id="family-revoke">Revocar acceso</button></div>`,
        );
        $("#family-revoke").onclick = (e) =>
          familyAct(e.currentTarget, "family-unlink", { id });
      }),
  );
  $$("[data-family-link-edit]").forEach(
    (b) =>
      (b.onclick = () =>
        familyLinkForm(
          familySpace().links.find((l) => l.id === +b.dataset.familyLinkEdit),
        )),
  );
  $$("[data-family-book]").forEach(
    (b) =>
      (b.onclick = () =>
        formModal(
          "Reservar una cita",
          `${familyChildSelect()}${textarea("question", "Tema que deseas conversar", "", 'maxlength="3000"')}`,
          "family-book",
          (d) => ({ ...d, id: +b.dataset.familyBook }),
        )),
  );
  $$("[data-family-release]").forEach(
    (b) =>
      (b.onclick = () =>
        familyAct(b, "family-release", { id: +b.dataset.familyRelease })),
  );
  $$("[data-family-cancel-appointment]").forEach(
    (b) =>
      (b.onclick = () =>
        familyAct(b, "family-cancel-appointment", {
          id: +b.dataset.familyCancelAppointment,
        })),
  );
  $$("[data-family-agreement]").forEach(
    (b) =>
      (b.onclick = () => {
        const a = familySpace().appointments.find(
          (a) => a.id === +b.dataset.familyAgreement,
        );
        formModal(
          "Acuerdos de la reunión",
          textarea(
            "agreement",
            "Acuerdos y próximos pasos",
            a.agreement,
            'required maxlength="4000"',
          ),
          "family-agreement",
          (d) => ({ ...d, id: a.id }),
        );
      }),
  );
  $$("[data-family-support]").forEach(
    (b) =>
      (b.onclick = () =>
        familySupportForm(
          familySpace().plans.find((p) => p.id === +b.dataset.familySupport),
        )),
  );
  $$("[data-family-support-student]").forEach(
    (b) =>
      (b.onclick = () =>
        familySupportForm(null, b.dataset.familySupportStudent)),
  );
  $$("[data-family-draft-delete]").forEach(
    (b) =>
      (b.onclick = () =>
        familyAct(b, "family-draft-delete", {
          id: +b.dataset.familyDraftDelete,
        })),
  );
  $$("[data-family-retry]").forEach(
    (b) =>
      (b.onclick = () =>
        formModal(
          "Revisar el envío antes de reintentar",
          '<p>Corrige la configuración o los datos de contacto y consulta el registro del proveedor para evitar duplicados.</p><label class="setting-toggle"><input name="verified" type="checkbox" required><span>Verifiqué que el proveedor no aceptó este envío anteriormente.</span></label>',
          "family-retry-delivery",
          (d) => ({
            ...d,
            id: +b.dataset.familyRetry,
            verified: d.verified === "on",
          }),
        )),
  );
  const push = $("#family-enable-push");
  if (push) push.onclick = () => familyPush(true);
  const unpush = $("#family-disable-push");
  if (unpush) unpush.onclick = () => familyPush(false);
}
async function familyPush(enable) {
  try {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !window.isSecureContext
    )
      throw new Error("Web Push necesita HTTPS y un navegador compatible.");
    const reg = await navigator.serviceWorker.register("/api/family-sw", {
      scope: "/",
    });
    await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!enable) {
      if (sub) {
        S = await api("family-push-delete", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      toast("Avisos de este navegador desactivados.");
      return;
    }
    const key = familySpace().channels?.vapid_public_key;
    if (!key)
      throw new Error(
        "El administrador debe configurar las claves VAPID del servidor.",
      );
    if ((await Notification.requestPermission()) !== "granted")
      throw new Error("El navegador no autorizó las notificaciones.");
    if (!sub) {
      const raw = atob(key.replace(/-/g, "+").replace(/_/g, "/"));
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: Uint8Array.from(raw, (c) => c.charCodeAt(0)),
      });
    }
    S = await api("family-push", sub.toJSON());
    toast(
      "Navegador registrado. Selecciona Push en tus preferencias de avisos.",
    );
  } catch (e) {
    toast(e.message);
  }
}
function familyNotifications() {
  if (!S.families || !can("families.use")) return [];
  const fs = familySpace(),
    seen = new Set(),
    items = [];
  for (const r of fs.receipts || []) {
    if (S.me.role !== "guardian" || r.read_at || seen.has(r.publication))
      continue;
    const p = fs.publications.find((p) => p.id === r.publication);
    if (!p || p.cancelled) continue;
    seen.add(p.id);
    items.push({
      type: "family",
      id: p.id,
      title: p.title,
      body: p.body,
      icon: "bell",
      color: "pink",
    });
  }
  for (const c of fs.conversations || [])
    if (c.replies.some((r) => r.author !== S.me.id && !r.read_at))
      items.push({
        type: "family-conversation",
        id: c.id,
        title: c.subject,
        body:
          "Tienes mensajes nuevos de " +
          familyName(S.me.role === "guardian" ? c.staff : c.guardian),
        icon: "message",
        color: "purple",
      });
  if (S.me.role === "guardian" && fs.options.remind_appointments !== false)
    for (const appointment of fs.appointments || []) {
      const start = new Date(appointment.starts),
        now = new Date();
      if (
        appointment.guardian === S.me.id &&
        !appointment.cancelled &&
        start > now &&
        start - now <= 86400000
      )
        items.push({
          type: "family-appointment",
          id: appointment.id,
          title: "Tu cita con el colegio",
          body: familyTime(appointment.starts) + " · " + appointment.location,
          icon: "calendar",
          color: "green",
        });
    }
  return items;
}
function familyFormMeta(path) {
  const labels = {
    "family-link": "Vínculo familiar",
    "family-publish": "Publicación oficial",
    "family-respond": "Respuesta familiar",
    "family-conversation": "Nueva conversación",
    "family-reply": "Respuesta",
    "family-justify": "Justificación",
    "family-review-absence": "Revisión de asistencia",
    "family-appointment": "Horario familiar",
    "family-book": "Reserva de cita",
    "family-agreement": "Acuerdos de reunión",
    "family-request": "Solicitud al colegio",
    "family-retry-delivery": "Reintento de entrega",
    "family-enroll": "Matrícula confirmada",
    "family-request-update": "Seguimiento del trámite",
    "family-support": "Plan de acompañamiento",
    "family-settings": "Preferencias de comunicación",
  };
  const label = labels[path] || "Hogar y colegio";
  return {
    label,
    icon: "heart",
    description:
      "Información clara, acceso verificado y cambios guardados en tu institución.",
    section: label,
    save:
      path === "family-publish"
        ? "Guardar publicación"
        : path === "family-respond"
          ? "Registrar respuesta"
          : "Guardar cambios",
    type: "family",
  };
}
async function clearFamilyPush() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    const sub = await reg?.pushManager?.getSubscription();
    if (sub) {
      await api("family-push-delete", { endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
  } catch (e) {
    throw new Error(
      "No se pudo desactivar la suscripción del navegador. Revisa la conexión antes de cerrar sesión.",
    );
  }
}
function familyWelcome() {
  const fs = familySpace(),
    people = fs.students.filter(
      (p) => !familyChild || String(p.id) === familyChild,
    );
  return `<section class="panel"><h2>Bienvenidos a nuestra comunidad ✦</h2><p class="muted">Una guía para llegar al colegio con todo a mano.</p>${people
    .map((p) => {
      const welcome = fs.receipts.filter(
        (r) =>
          r.student === p.id &&
          fs.publications.some(
            (x) => x.id === r.publication && x.kind === "onboarding",
          ),
      );
      const enrolled = (fs.academic?.[p.id]?.courses.length || 0) > 0,
        documents = fs.requests.some(
          (r) =>
            r.student === p.id &&
            ["documents", "enrollment"].includes(r.kind) &&
            r.status === "resolved",
        );
      const steps = [
        ["Vínculo con la institución verificado", true],
        ["Datos de contacto completos", !!S.me.phone],
        ["Materias y docentes disponibles", enrolled],
        ["Documentación revisada por el colegio", documents],
        [
          "Bienvenida y autorizaciones completadas",
          welcome.length > 0 && welcome.every((r) => r.confirmed_at),
        ],
      ];
      return `<div class="family-welcome"><h3>${esc(p.name)}</h3><div class="progress"><i style="width:${(steps.filter((s) => s[1]).length / steps.length) * 100}%"></i></div>${steps.map(([label, done]) => `<div class="family-task-row"><span>${icon(done ? "check" : "task", 16)} ${label}</span><span class="badge ${done ? "done" : ""}">${done ? "Listo" : "Por completar"}</span></div>`).join("")}<div class="form-actions"><button class="btn small" data-view="profile">Mis datos de contacto</button><button class="btn small" data-family-tab="requests">Documentos / matrícula</button><button class="btn small" data-family-tab="publications">Bienvenida y permisos</button></div></div>`;
    })
    .join("")}</section>`;
}
function familyEnrollmentForm(r) {
  formModal(
    "Revisar y confirmar matrícula",
    `<p>Estudiante: <strong>${esc(familyName(r.student))}</strong>. Selecciona las materias que corresponden a la solicitud. Se conservarán las matrículas existentes.</p><div class="family-checklist">${S.courses
      .filter((c) => !c.archived)
      .map(
        (c) =>
          `<label><input type="checkbox" name="courses" value="${c.id}" ${c.students.includes(r.student) ? "checked" : ""}> ${esc(c.title)}</label>`,
      )
      .join("")}</div>`,
    "family-enroll",
    (d, f) => ({ ...d, id: r.id, courses: f.getAll("courses").map(Number) }),
    "Matrícula confirmada y registrada en el trámite.",
  );
}
function familyTranslationForm(d, content) {
  const p = familySpace().publications.find((p) => p.id === d.publication_id);
  if (!p) return toast("La publicación original ya no está disponible.");
  formModal(
    "Publicar traducción revisada",
    `${select(
      "language",
      "Idioma",
      [
        ["es", "Español"],
        ["en", "Inglés"],
        ["pt", "Portugués"],
        ["fr", "Francés"],
      ],
      d.language,
    )}${field("title", "Título traducido", "text", p.title, 'required maxlength="160"')}${textarea("body", "Traducción revisada", content, 'required maxlength="10000"')}<label class="setting-toggle"><input name="reviewed" type="checkbox" required><span>Verifiqué que conserva las fechas, condiciones y significado del original.</span></label>`,
    "family-translation",
    (data) => ({ ...data, id: p.id, reviewed: data.reviewed === "on" }),
    "Traducción publicada para las familias que prefieren este idioma.",
  );
}
function familySearchResults() {
  if (!can("families.use"))
    return empty("El módulo familiar está desactivado.");
  const q = searchQuery.toLocaleLowerCase(),
    fs = familySpace();
  const groups = [
    [
      "Comunicados",
      fs.publications.filter((p) =>
        (p.title + " " + p.body).toLocaleLowerCase().includes(q),
      ),
      "publication",
      "title",
    ],
    [
      "Conversaciones",
      fs.conversations.filter((c) =>
        (c.subject + " " + c.replies.map((r) => r.body).join(" "))
          .toLocaleLowerCase()
          .includes(q),
      ),
      "conversation",
      "subject",
    ],
    [
      "Trámites",
      fs.requests.filter((r) =>
        (r.title + " " + r.body).toLocaleLowerCase().includes(q),
      ),
      "request",
      "title",
    ],
  ];
  return `${heading("Lo encontramos en familia 🔎", `Resultados para «${esc(searchQuery)}»`)}<div class="family-body">${groups.map(([label, list, type, key]) => `<section class="panel"><h2>${label}</h2>${list.map((r) => `<button class="family-pending-row" data-family-${type}="${r.id}"><span>${esc(r[key])}</span>${icon("arrow", 16)}</button>`).join("") || '<p class="muted">Sin coincidencias.</p>'}</section>`).join("")}</div>`;
}
