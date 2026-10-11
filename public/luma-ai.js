/* Private student study notebooks. No API key or provider URL reaches this client. */
let aiData = null,
  aiSelected = null,
  aiLoading = false,
  aiBusy = false,
  aiError = "",
  aiEpoch = 0,
  aiSearch = "";
let aiDrafts = {},
  aiSelection = {},
  aiRequestIds = {};
const aiKinds = {
  text: "Texto pegado",
  pdf: "PDF",
  image: "Imagen · OCR",
  file: "Archivo",
  link: "Enlace",
  youtube: "YouTube",
  classroom: "Classroom",
  note: "Mi cuaderno",
};
function resetAI() {
  aiEpoch++;
  aiData = null;
  aiSelected = null;
  aiLoading = false;
  aiBusy = false;
  aiError = "";
  aiSearch = "";
  aiDrafts = {};
  aiSelection = {};
  aiRequestIds = {};
}
async function aiRequest(path, data = null) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 110000);
  try {
    const form = data instanceof FormData;
    const response = await fetch("/api/ai/" + path, {
      method: data ? "POST" : "GET",
      credentials: "same-origin",
      signal: controller.signal,
      headers: {
        "X-CSRFToken": csrf(),
        ...(form ? {} : { "Content-Type": "application/json" }),
      },
      ...(data ? { body: form ? data : JSON.stringify(data) } : {}),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("No se pudo completar la solicitud. Intenta de nuevo.");
    }
    if (!response.ok) {
      const e = new Error(result.error || "No se pudo completar la solicitud.");
      e.status = response.status;
      throw e;
    }
    return result;
  } catch (e) {
    if (e.name === "AbortError")
      throw new Error(
        "La conexión tardó demasiado. La pregunta puede seguir procesándose: actualiza la sesión antes de reintentar.",
      );
    if (e instanceof TypeError)
      throw new Error(
        "No hay conexión. Conservamos lo que estás escribiendo; vuelve a intentar.",
      );
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
function aiCurrent() {
  return aiData?.session?.id === aiSelected ? aiData.session : null;
}
function aiSelectedSources() {
  const session = aiCurrent();
  if (!session) return [];
  if (!(session.id in aiSelection))
    aiSelection[session.id] = session.sources
      .filter((s) => s.status === "ready")
      .slice(0, 10)
      .map((s) => s.id);
  return aiSelection[session.id].filter((id) =>
    session.sources.some((s) => s.id === id && s.status === "ready"),
  );
}
function aiAccept(data) {
  aiData = data;
  aiSelected = data.session?.id || null;
  aiError = "";
  aiSelectedSources();
}
async function loadAI(id = aiSelected) {
  if (!can("ai.study")) return;
  const epoch = aiEpoch;
  aiLoading = true;
  aiError = "";
  if (view === "ai") render({ preserve: true });
  try {
    const data = await aiRequest("state" + (id ? "?session=" + id : ""));
    if (epoch !== aiEpoch) return;
    aiAccept(data);
  } catch (e) {
    if (epoch === aiEpoch) aiError = e.message;
  } finally {
    if (epoch === aiEpoch) {
      aiLoading = false;
      if (view === "ai") render({ preserve: true });
    }
  }
}
function aiRichText(value) {
  return esc(value)
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
function aiWorkspace() {
  if (S.me.role !== "student")
    return empty("Este espacio es exclusivo para estudiantes.");
  if (!aiData && !aiLoading && !aiError) setTimeout(() => loadAI(), 0);
  const session = aiCurrent(),
    sessions = (aiData?.sessions || []).filter((s) =>
      normalize(s.title + " " + s.course_title).includes(normalize(aiSearch)),
    );
  return `${heading('Luma AI <span class="ai-heading-star">✧</span>', "Tus fuentes, tus preguntas y tu propia forma de aprender.", `<button class="btn primary" data-ai-new>${icon("plus", 15)} Nueva sesión</button>`)}<section class="ai-banner"><div class="ai-banner-art">${art("spark", 54)}${art("flower", 30)}</div><div><span class="eyebrow">TU COMPAÑERA DE ESTUDIO</span><h2>Entender también es florecer.</h2><p>Reúne tus materiales y conversa para comprenderlos. Si aparece una tarea o proyecto, Luma te acompaña con pistas y preguntas para que lo construyas tú.</p></div><span class="badge ${aiData?.configured ? "green" : "wait"}">${icon("shield", 14)} ${aiData?.configured ? "Chat de estudio activo" : "Chat pendiente de activar"}</span></section>${aiData && !aiData.configured ? '<div class="ai-notice">El chat aún no está activado por la institución. Puedes crear sesiones y guardar materiales mientras tanto.</div>' : ""}${aiError ? `<div class="ai-error" role="alert">${esc(aiError)} <button class="link-btn" data-ai-refresh>Volver a intentar</button></div>` : ""}<div class="ai-workspace"><aside class="panel ai-library"><div class="section-head"><h2>Mis sesiones <small>${aiData?.sessions.length || 0}</small></h2><button class="icon-btn" data-ai-refresh aria-label="Actualizar sesiones">${icon("back", 16)}</button></div><label class="ai-library-search">${icon("search", 15)}<input id="ai-session-search" aria-label="Buscar sesiones de estudio" placeholder="Buscar un tema…" value="${esc(aiSearch)}"></label><div class="ai-session-list">${sessions.map((s) => `<button class="ai-session ${s.id === aiSelected ? "active" : ""}" data-ai-session="${s.id}" aria-pressed="${s.id === aiSelected}"><span class="ai-session-icon">${icon(s.tutor_mode ? "heart" : "book", 18)}</span><span><strong>${esc(s.title)}</strong><small>${esc(s.course_title || "Mi estudio personal")}</small><small>${s.source_count} fuentes · ${s.turn_count} preguntas</small></span></button>`).join("") || (aiLoading ? '<p class="muted" role="status">Abriendo tus sesiones…</p>' : '<div class="ai-library-empty">' + art("leaf", 55) + "<p>Un tema, un cuaderno.<br>Empieza tu primera sesión.</p></div>")}</div><div class="ai-privacy">${icon("shield", 17)}<p>Solo tú puedes abrir tus sesiones, fuentes y conversaciones.</p></div></aside>${session ? aiNotebook(session) : aiWelcome()}</div>`;
}
function aiWelcome() {
  return `<section class="panel ai-welcome">${art("orbit", 106)}<span class="eyebrow">UN ESPACIO PARA TUS IDEAS</span><h2>¿Qué quieres comprender hoy?</h2><p>Crea una sesión, elige una de tus materias y añade los materiales que quieres estudiar. Tus conversaciones se guardan en tu cuenta.</p><div class="ai-welcome-kinds"><span>${icon("file", 20)} PDF y apuntes</span><span>${icon("link", 20)} Enlaces y YouTube</span><span>${icon("class", 20)} Tu Classroom</span><span>${icon("flower", 20)} Imágenes con texto</span></div><button class="btn primary" data-ai-new>${icon("plus", 16)} Crear mi primera sesión</button><small>Chat de texto. No genera audio, video ni imágenes.</small></section>`;
}
function aiNotebook(session) {
  const selected = aiSelectedSources(),
    meta = aiData.sessions.find((s) => s.id === session.id),
    draft = aiDrafts[session.id] || "";
  return `<section class="ai-notebook"><header class="panel ai-notebook-head"><div><span class="eyebrow">${esc(meta?.course_title || "MI ESTUDIO PERSONAL")}</span><h2>${esc(session.title)}</h2><span class="badge ${session.tutor_mode ? "peach" : "purple"}">${icon(session.tutor_mode ? "heart" : "spark", 13)} ${session.tutor_mode ? "Tutoría · tu razonamiento primero" : "Conversación de estudio"}</span></div><div class="ai-head-actions"><button class="icon-btn" data-ai-edit aria-label="Editar sesión">${icon("profile", 16)}</button><a class="icon-btn" href="/api/ai/export/${session.id}" aria-label="Exportar sesión">${icon("download", 16)}</a><button class="icon-btn danger" data-ai-delete aria-label="Eliminar sesión">${icon("close", 16)}</button></div></header><div class="ai-notebook-body"><section class="panel ai-sources"><div class="section-head"><div><h3>Mis fuentes</h3><small>${selected.length} de ${session.sources.length} seleccionadas</small></div><button class="btn small" data-ai-source-new>${icon("plus", 13)} Añadir</button></div><p class="form-help">Elige hasta 10 fuentes para cada pregunta. Solo sus fragmentos relevantes se envían al servicio de IA cuando chateas.</p><div class="ai-source-list">${session.sources.map((source) => `<article class="ai-source ${source.status !== "ready" ? "needs-text" : ""}"><label class="ai-source-check"><input type="checkbox" data-ai-source-select="${source.id}" ${selected.includes(source.id) ? "checked" : ""} ${source.status !== "ready" ? "disabled" : ""}><span><strong>${esc(source.title)}</strong><small>${aiKinds[source.kind] || "Material"} · ${source.status === "ready" ? source.characters.toLocaleString("es") + " caracteres" : "Necesita transcripción"}</small></span></label><div class="ai-source-tools">${source.assignment ? '<span class="badge peach">Tutoría</span>' : ""}<button class="icon-btn" data-ai-source-view="${source.id}" aria-label="Leer ${esc(source.title)}">${icon("book", 14)}</button></div></article>`).join("") || `<div class="ai-sources-empty">${art("flower", 51)}<h4>Tu colección empieza aquí</h4><p>Añade apuntes, archivos o materiales de tus aulas.</p><button class="btn small" data-ai-source-new>Añadir mi primera fuente</button></div>`}</div><div class="ai-source-legend">${icon("file", 15)} PDF, PNG/JPG y texto · hasta 8 MB</div></section><section class="panel ai-conversation"><div class="ai-chat-heading"><span>${art("spark", 29)} <strong>Conversa con Luma</strong></span><span class="ai-saved">${icon("check", 13)} Guardado en tu cuenta</span></div><div class="ai-chat-body" role="log" aria-label="Conversación con Luma AI">${session.turns.map((turn) => aiTurn(turn)).join("") || `<div class="ai-chat-welcome">${art("leaf", 72)}<h3>Hagamos espacio para entender.</h3><p>Pregúntame por una idea de tus materiales, relaciona conceptos o cuéntame qué parte te cuesta.</p><div class="ai-prompts"><button data-ai-prompt="Ayúdame a comprender las ideas principales de mis apuntes.">Comprender una idea</button><button data-ai-prompt="Hazme una pregunta conceptual para practicar con mis apuntes.">Practicar lo aprendido</button><button data-ai-prompt="¿Cómo se relacionan los conceptos de las fuentes seleccionadas?">Conectar conceptos</button></div></div>`}${aiBusy || session.busy ? `<div class="ai-thinking" role="status"><span>✧</span> Luma está leyendo y preparando tu acompañamiento…</div>` : ""}</div><form id="ai-chat-form" class="ai-composer"><label for="ai-question" class="sr-only">Mi pregunta para Luma AI</label><textarea id="ai-question" name="question" rows="3" maxlength="4000" required placeholder="Una duda, una idea o lo que has intentado…" ${aiBusy ? "readonly" : ""}>${esc(draft)}</textarea><div class="ai-composer-bottom"><small>${selected.length ? `${selected.length} fuentes seleccionadas` : "Sin fuentes: orientación conceptual general"} · Ctrl/⌘ + Enter</small><button class="btn primary" type="submit" ${aiBusy || session.busy || !aiData.configured ? "disabled" : ""}>Preguntar ${icon("send", 14)}</button></div><p>Luma puede equivocarse. Contrasta las referencias con tus materiales. Te ayuda a aprender; tu trabajo sigue siendo tuyo.</p></form></section></div></section>`;
}
function aiTurn(turn) {
  return `<article class="ai-turn"><div class="ai-message ai-message-user"><span>YO</span>${aiRichText(turn.question)}</div>${turn.status === "complete" ? `<div class="ai-message ai-message-luma"><div class="ai-answer-label">${art("spark", 23)} <strong>Luma AI</strong>${turn.mode === "tutor" ? '<span class="badge peach">Pista para pensar</span>' : ""}</div>${aiRichText(turn.answer)}${turn.citations.length ? `<div class="ai-citations">${turn.citations.map((c) => `<button data-ai-source-view="${c.source}" class="ai-citation">[${esc(c.label)}] ${esc(c.title)}<small>${esc(c.location)}</small></button>`).join("")}</div>` : ""}</div>` : turn.status === "failed" ? `<div class="ai-turn-error" role="alert"><p>${esc(turn.error)}</p><button class="btn small" data-ai-retry="${turn.id}">Reintentar pregunta ${icon("back", 13)}</button></div>` : '<p class="muted">Pregunta en proceso. Actualiza si se interrumpió la conexión.</p>'}</article>`;
}
function aiCourseOptions(existing = null) {
  const opts = [
    ["", "Sin materia · estudio personal"],
    ...S.courses.map((c) => [c.id, c.title]),
  ];
  if (existing?.course && !S.courses.some((c) => c.id === existing.course))
    opts.push([existing.course, existing.course_title || "Materia anterior"]);
  return opts;
}
function aiEditor(title, body, onSave) {
  if (!can("ai.study")) return;
  modal(
    title,
    `<form id="modal-form" class="ai-editor"><div class="ai-editor-intro">${art("flower", 38)}<p>Un espacio privado para aprender a tu manera.</p></div><div class="ai-editor-fields">${body}</div><div class="form-actions"><button type="button" class="btn" data-close>Cancelar</button><button type="submit" class="btn primary">Guardar ${icon("check", 14)}</button></div></form>`,
    true,
  );
  $("[data-close]").onclick = () => closeModal();
  $$(".modal [data-close]").forEach((b) => (b.onclick = () => closeModal()));
  const form = $("#modal-form");
  form.addEventListener("input", () => (form.dataset.dirty = "true"));
  form.addEventListener("change", () => (form.dataset.dirty = "true"));
  form.onsubmit = async (e) => {
    e.preventDefault();
    const epoch = aiEpoch;
    busy(e.submitter, true, "Guardando…");
    modalPending(true);
    try {
      const data = await onSave(form);
      if (epoch !== aiEpoch) return;
      aiAccept(data);
      modalPending(false);
      closeModal(true);
      view = "ai";
      render();
      toast("Guardado en tu espacio de estudio.");
    } catch (error) {
      if (epoch === aiEpoch) modalError(error);
    } finally {
      if (epoch === aiEpoch) {
        modalPending(false);
        busy(e.submitter, false);
      }
    }
  };
}
function openAISession(edit = false) {
  const existing = edit
    ? aiData?.sessions.find((s) => s.id === aiSelected)
    : null;
  if (edit && !existing) return;
  aiEditor(
    existing ? "Personalizar esta sesión" : "Una nueva sesión para aprender",
    `${field("title", "Nombre de mi sesión", "text", existing?.title || "", 'required maxlength="160" placeholder="Por ejemplo: Entender la fotosíntesis"')}${select("course", "Mi materia", aiCourseOptions(existing), existing?.course || "").replace(" required>", ">")}<div class="ai-editor-hint">${icon("shield", 18)}<p>Solo tú puedes abrir esta sesión. Cambiar el nombre o la materia conserva las fuentes y la conversación.</p></div>`,
    (form) =>
      aiRequest(existing ? "session-edit" : "session", {
        ...Object.fromEntries(new FormData(form)),
        ...(existing ? { id: existing.id } : {}),
      }),
  );
}
function openAISource(preset = {}) {
  if (!aiCurrent() && !preset.classroom_id)
    return toast("Crea o abre una sesión antes de añadir materiales.");
  const kind = preset.classroom_id ? "classroom" : "text",
    sessions = aiData?.sessions || [];
  const resources = moduleEnabled("materials") ? S.resources : [];
  const items = [
    ...resources.map((r) => [
      "resource:" + r.id,
      "Material · " + r.title + " · " + learningCourseTitle(r.course_id),
    ]),
    ...S.tasks.map((t) => [
      "task:" + t.id,
      "Actividad · " + t.title + " · " + learningCourseTitle(t.course),
    ]),
  ];
  const notes = studentSpace().notes;
  let destination = preset.classroom_id
    ? select(
        "destination",
        "Guardar en la sesión",
        [
          ["new", "Crear una sesión con este material"],
          ...sessions.map((s) => [s.id, s.title]),
        ],
        aiSelected || "new",
      )
    : "";
  aiEditor(
    "Una fuente para comprender",
    `${destination}${field("title", "Nombre de la fuente", "text", (preset.title || "").slice(0, 180), 'required maxlength="180"')}${select(
      "kind",
      "¿Qué quiero estudiar?",
      [
        ["text", "Pegar contenido"],
        ["file", "Subir PDF, imagen o texto"],
        ["youtube", "Video de YouTube"],
        ["link", "Enlace público"],
        ["classroom", "Contenido de Classroom"],
        ["note", "Un apunte de mi cuaderno"],
      ],
      kind,
    )}<div data-ai-kind="file" hidden><div class="form-field"><label for="ai-source-file">Archivo de estudio</label><input type="file" id="ai-source-file" name="file" accept=".pdf,.png,.jpg,.jpeg,.txt,.md"></div><p class="form-help">Hasta 8 MB. Las imágenes aportan su texto mediante OCR; Luma no analiza su aspecto visual. Los PDF admiten hasta 80 páginas.</p><div id="ai-file-info" class="file-preview" hidden></div></div><div data-ai-kind="link youtube" hidden>${field("url", "Enlace", "url", "", ' maxlength="1000" placeholder="https://…"')}<p class="form-help" id="ai-link-help"></p></div><div data-ai-kind="classroom" ${kind === "classroom" ? "" : "hidden"}>${select("classroom_item", "Material o actividad de mi aula", items, preset.classroom_id ? preset.classroom_type + ":" + preset.classroom_id : "")}<p class="form-help">Se guarda una copia privada. Importar una actividad activa tutoría: pistas y preguntas, sin resolver la entrega.</p></div><div data-ai-kind="note" hidden>${select(
      "note",
      "Mi apunte",
      notes.map((n) => [n.id, n.title]),
    )}<p class="form-help">Una copia de tus propias notas. El apunte original conserva su privacidad.</p></div><div id="ai-text-field">${textarea("content", "Contenido que quiero estudiar", "", 'maxlength="100000" placeholder="Pega tus apuntes o la transcripción del material…"')}</div><div class="ai-editor-hint">${icon("shield", 18)}<p>El material permanece en tu sesión. Al preguntar, se envían a NVIDIA tu pregunta, historial reciente y fragmentos de las fuentes seleccionadas.</p></div>`,
    async (form) => {
      const d = new FormData(form);
      let session = aiSelected;
      if (preset.classroom_id) {
        const dest = d.get("destination");
        if (dest === "new") {
          const data = await aiRequest("session", {
            title: String(d.get("title") || "").slice(0, 160),
            course: preset.course,
          });
          session = data.session.id;
          aiAccept(data);
        } else session = Number(dest);
      }
      d.set("session", session);
      if (d.get("kind") === "classroom") {
        const [type, id] = String(d.get("classroom_item") || "").split(":");
        d.set("classroom_type", type);
        d.set("classroom_id", id);
      }
      const result = await aiRequest("source", d);
      const added = result.session.sources.at(-1);
      if (added?.status === "ready") {
        const ids = aiSelection[session] || [];
        aiSelection[session] = [...new Set([...ids, added.id])].slice(0, 10);
      }
      return result;
    },
  );
  const form = $("#modal-form");
  const change = () => {
    const kind = form.elements.kind.value;
    $$(".modal [data-ai-kind]").forEach((el) => {
      const show = el.dataset.aiKind.split(" ").includes(kind);
      el.hidden = !show;
      el.querySelectorAll("input,select").forEach(
        (input) => (input.disabled = !show),
      );
    });
    const content = form.elements.content;
    content.required = kind === "text";
    $("#ai-text-field").hidden = ["classroom", "note"].includes(kind);
    content.disabled = ["classroom", "note"].includes(kind);
    content.previousElementSibling.textContent =
      kind === "text"
        ? "Contenido que quiero estudiar *"
        : "Transcripción o texto adicional (opcional)";
    form.elements.file.required = kind === "file";
    form.elements.url.required = ["link", "youtube"].includes(kind);
    $("#ai-link-help").textContent =
      kind === "youtube"
        ? "Se usan subtítulos públicos, no el audio ni las imágenes del video. Si no están disponibles, pega la transcripción."
        : "Solo se leen páginas públicas. Para contenido con acceso privado, pega el texto que puedes consultar.";
  };
  form.elements.kind.onchange = change;
  change();
  form.elements.file.onchange = () => {
    const f = form.elements.file.files[0],
      el = $("#ai-file-info");
    el.hidden = !f;
    if (f) {
      el.textContent =
        f.name + " · " + (f.size / 1024 / 1024).toFixed(2) + " MB";
      if (f.size > 8 * 1024 * 1024) {
        form.elements.file.setCustomValidity("El archivo supera 8 MB.");
      } else form.elements.file.setCustomValidity("");
    }
  };
}
async function aiViewSource(id) {
  const epoch = aiEpoch;
  try {
    const src = await aiRequest("source/" + id);
    if (epoch !== aiEpoch) return;
    aiEditor(
      "Leer y personalizar mi fuente",
      `${field("title", "Nombre de la fuente", "text", src.title, 'required maxlength="180"')}<div class="ai-source-meta"><span class="badge">${aiKinds[src.kind] || "Material"}</span>${src.assignment ? '<span class="badge peach">Esta fuente usa tutoría</span>' : ""}${src.file ? `<a class="btn small" href="/api/ai/file/${src.id}">${icon("download", 14)} ${esc(src.file)}</a>` : ""}</div>${src.notice ? `<p class="ai-notice">${esc(src.notice)}</p>` : ""}${src.url ? `<p class="ai-source-url">${esc(src.url)}</p>` : ""}${textarea("content", src.status === "needs_text" ? "Añadir transcripción" : "Texto de la fuente", src.content, 'required maxlength="100000"')}<div class="ai-editor-hint">${icon("shield", 17)}<p>Revisa el texto extraído, especialmente las fórmulas. La tutoría se conserva aunque edites o retires la consigna.</p></div><button type="button" class="link-btn danger" id="ai-remove-source">Retirar esta fuente</button>`,
      (form) =>
        aiRequest("source-edit", {
          id: src.id,
          ...Object.fromEntries(new FormData(form)),
        }),
    );
    $("#ai-remove-source").onclick = async () => {
      if (
        !confirm("¿Retirar esta fuente? La conversación anterior se conserva.")
      )
        return;
      modalPending(true);
      try {
        aiAccept(await aiRequest("source-delete", { id: src.id }));
        modalPending(false);
        closeModal(true);
        render();
      } catch (e) {
        modalError(e);
      } finally {
        modalPending(false);
      }
    };
  } catch (e) {
    toast(e.message);
  }
}
async function sendAI(question, requestId = null, sourceIds = null) {
  if (aiBusy) return;
  const session = aiCurrent();
  if (!session) return;
  question = question.trim();
  if (!question) return;
  const epoch = aiEpoch;
  const sources = sourceIds || aiSelectedSources();
  const key = session.id + ":" + question + ":" + sources.join(",");
  const id = requestId || aiRequestIds[key] || crypto.randomUUID();
  aiRequestIds[key] = id;
  aiBusy = true;
  aiError = "";
  render({ preserve: true });
  $(".ai-chat-body")?.scrollTo(0, 999999);
  try {
    const data = await aiRequest("chat", {
      session: session.id,
      question,
      request_id: id,
      sources,
    });
    if (epoch !== aiEpoch) return;
    aiAccept(data);
    aiDrafts[session.id] = "";
    delete aiRequestIds[key];
  } catch (e) {
    if (epoch === aiEpoch) {
      aiError = e.message;
      try {
        aiAccept(await aiRequest("state?session=" + session.id));
        aiError = e.message;
        const done = aiCurrent().turns.find(
          (t) => t.request_id === id && t.status === "complete",
        );
        if (done) {
          aiDrafts[session.id] = "";
          aiError = "";
          delete aiRequestIds[key];
        }
      } catch {}
    }
  } finally {
    if (epoch === aiEpoch) {
      aiBusy = false;
      if (view === "ai") {
        render({ preserve: true });
        $(".ai-chat-body")?.scrollTo(0, 999999);
        $("#ai-question")?.focus({ preventScroll: true });
      }
    }
  }
}
async function aiClassroomImport(id, type) {
  if (!can("ai.study")) return;
  if ($(".modal") && !closeTaskForPersonal()) return;
  const obj = (type === "resource" ? S.resources : S.tasks).find(
    (o) => o.id === id,
  );
  if (!obj) return;
  if (!aiData) await loadAI(null);
  openAISource({
    classroom_id: id,
    classroom_type: type,
    title: obj.title,
    course: obj.course ?? obj.course_id,
  });
}
function bindAI() {
  if (S?.me.role !== "student") return;
  $$("[data-ai-new]").forEach((b) => (b.onclick = () => openAISession()));
  $$("[data-ai-refresh]").forEach((b) => (b.onclick = () => loadAI()));
  $$("[data-ai-session]").forEach(
    (b) =>
      (b.onclick = () => {
        if (aiBusy) return toast("Espera a que termine la pregunta actual.");
        if (aiLoading) return;
        aiSelected = Number(b.dataset.aiSession);
        loadAI(aiSelected);
      }),
  );
  $("#ai-session-search")?.addEventListener("input", (e) => {
    aiSearch = e.target.value;
    render({ preserve: true });
  });
  $("[data-ai-edit]")?.addEventListener("click", () => openAISession(true));
  $("[data-ai-delete]")?.addEventListener("click", async () => {
    if (
      !confirm("¿Eliminar esta sesión y sus fuentes, archivos y conversación?")
    )
      return;
    try {
      aiAccept(await aiRequest("session-delete", { id: aiSelected }));
      render();
    } catch (e) {
      toast(e.message);
    }
  });
  $$("[data-ai-source-new]").forEach((b) => (b.onclick = () => openAISource()));
  $$("[data-ai-source-view]").forEach(
    (b) => (b.onclick = () => aiViewSource(Number(b.dataset.aiSourceView))),
  );
  $$("[data-ai-source-select]").forEach(
    (input) =>
      (input.onchange = () => {
        const selected = aiSelectedSources(),
          id = Number(input.dataset.aiSourceSelect);
        if (input.checked && selected.length >= 10) {
          input.checked = false;
          return toast("Puedes elegir hasta 10 fuentes por pregunta.");
        }
        aiSelection[aiSelected] = input.checked
          ? [...selected, id]
          : selected.filter((v) => v !== id);
        render({ preserve: true });
      }),
  );
  $$("[data-ai-prompt]").forEach(
    (b) =>
      (b.onclick = () => {
        aiDrafts[aiSelected] = b.dataset.aiPrompt;
        $("#ai-question").value = b.dataset.aiPrompt;
        $("#ai-question").focus();
      }),
  );
  $("#ai-question")?.addEventListener("input", (e) => {
    aiDrafts[aiSelected] = e.target.value;
  });
  $("#ai-question")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      $("#ai-chat-form").requestSubmit();
    }
  });
  $("#ai-chat-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!aiData.configured)
      return toast("El chat aún no está activado por la institución.");
    sendAI($("#ai-question").value);
  });
  $$("[data-ai-retry]").forEach(
    (b) =>
      (b.onclick = () => {
        const turn = aiCurrent().turns.find(
          (t) => t.id === Number(b.dataset.aiRetry),
        );
        sendAI(turn.question, turn.request_id, turn.sources);
      }),
  );
}
window.addEventListener("beforeunload", (e) => {
  if (aiBusy || Object.values(aiDrafts).some((v) => v.trim())) {
    e.preventDefault();
    e.returnValue = "";
  }
});
