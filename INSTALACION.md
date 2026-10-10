# Luma Campus — instalación y ejecución

## 1. Preparar el equipo

Instala **Python 3.10 o superior**. Se recomienda **Python 3.12**.

- Windows: instala Python desde python.org y marca **Add Python to PATH**. El lanzador `py` también funciona.
- macOS: instala Python 3 desde python.org o con tu gestor habitual.
- Ubuntu/Debian: `sudo apt install python3 python3-venv`.

El ZIP incluye las dependencias de Python en `vendor/wheels/`: **la instalación de la aplicación no necesita Internet**, después de disponer de Python con `venv` y `pip`. SQLite viene con Python. No necesitas Node.js, MongoDB ni MySQL. Luma AI requiere una clave de NVIDIA para chatear; el campus y el guardado de sesiones funcionan sin ella.

## 2. Extraer el ZIP

Extrae todo el archivo. Entra en la carpeta `LumaCampus`; no ejecutes archivos directamente desde la vista comprimida del ZIP.

## 3. Iniciar — método rápido

### Windows

Haz doble clic en **start.bat** o abre una terminal en la carpeta y ejecuta:

```powershell
py -3 run.py
```

Si no tienes el lanzador `py`, usa:

```powershell
python run.py
```

### macOS y Linux

Abre una terminal en la carpeta y ejecuta:

```bash
python3 run.py
```

También puedes usar:

```bash
sh start.sh
```

En el primer inicio se crea `.venv`, se instalan las dependencias incluidas, se crea la base de datos y se solicita crear tu primera cuenta administrativa real. No hay cuentas de prueba. Los siguientes inicios conservan tus cambios.

Abre **http://127.0.0.1:8000** en tu navegador. Mantén la terminal abierta mientras uses la plataforma. Para detenerla, presiona **Ctrl+C**.

## 4. Entrar al campus

Accede con la cuenta real de tu institución. En una instalación nueva, `run.py` solicita en la terminal el correo, nombre y contraseña del primer administrador. Al escribir la contraseña no se ven caracteres; es normal.

Si prefieres crear esa cuenta antes de arrancar:

```bash
python3 install.py
python3 bootstrap_admin.py
python3 run.py
```

En Windows sustituye `python3` por `py -3`. El asistente utiliza el entorno virtual instalado; no necesitas instalar Django globalmente.

1. Administración → Identidad: cambia nombre, colores y logo.
2. Administración → Personas: crea los profesores y estudiantes con correos y contraseñas reales.
3. Administración → Materias: crea materias y asigna un profesor real.
4. Administración → Matrículas: incorpora estudiantes.
5. El profesor entra con su cuenta → Mi estudio → planifica, crea actividades y materiales.
6. El estudiante entra con su cuenta → Classroom → entrega su trabajo; el profesor lo revisa.

Las cuentas antiguas de demostración se desactivan al instalar o iniciar esta versión. Sus registros académicos permanecen en la base; no se borran automáticamente. Si antes solo usabas perfiles de prueba, crea tu cuenta real de administración y reasigna o archiva las materias anteriores desde Administración.

Las conversaciones se actualizan cada 6 segundos mientras esa pantalla está abierta. Si quieres probar dos cuentas simultáneamente, abre una en una ventana privada o en otro navegador.

## 5. Instalación y ejecución por separado

Windows:

```powershell
py -3 install.py
py -3 run.py
```

macOS/Linux:

```bash
python3 install.py
python3 run.py
```

Para usar otro puerto:

```bash
python3 run.py --port 8001
```

En Windows, reemplaza `python3` por `py -3` o `python`.

## 6. Comprobar la instalación

Windows:

```powershell
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe manage.py test
```

macOS/Linux:

```bash
.venv/bin/python manage.py check
.venv/bin/python manage.py test
```

Se incluyen **164 pruebas** del servidor. No necesitas Node.js para ejecutar la aplicación ni sus pruebas de Python.

## 7. Problemas habituales

- **Python no encontrado:** instala Python y vuelve a abrir la terminal. En Windows revisa PATH o usa `py -3`.
- **No existe `venv`/`ensurepip`:** en Ubuntu/Debian instala `python3-venv`; en macOS/Windows utiliza el instalador oficial de Python.
- **Puerto ocupado:** inicia con `--port 8001` y abre `http://127.0.0.1:8001`.
- **Dependencias incluidas no encontradas:** extrae todo el ZIP, incluida `vendor/wheels/`.
- **No aparece el sitio:** comprueba que la terminal siga abierta y que la dirección coincida con el puerto indicado.
- **Permiso de escritura:** extrae el proyecto a una carpeta de tu usuario; evita directorios del sistema o de solo lectura.
- **Entorno virtual movido desde otro equipo:** los entornos virtuales no son portables. El ZIP no contiene uno; deja que el instalador lo cree en tu equipo. Si moviste el proyecto después de instalarlo, elimina solo `.venv/` y vuelve a ejecutar `install.py`.

## 8. Tus datos

`campus.sqlite3` guarda los registros y `uploads/` guarda los archivos entregados. Ambos se crean localmente; el ZIP no incluye sesiones ni una base de datos anterior. Cierra el servidor antes de hacer una copia de seguridad de estos archivos.

Este paquete permite ejecutar y probar el campus localmente. Para ponerlo en Internet, consulta la sección Publicación del README y configura un servidor Python con HTTPS. La instalación nueva requiere configurar cuentas reales.

## 9. Actualizar Luma Campus conservando tus datos (Linux / Chromebook)

Detén el servidor con **Ctrl+C**. Ejecuta estos comandos en la terminal; respeta las mayúsculas de `LumaCampus`:

```bash
cd ~
cp -a LumaCampus "LumaCampus-respaldo-$(date +%Y%m%d-%H%M%S)"
wget -O LumaCampus-actualizacion.zip https://raw.githubusercontent.com/gabo899s/educanMEP/luma-campus/downloads/LumaCampus.zip
unzip -o LumaCampus-actualizacion.zip
cd LumaCampus
python3 install.py
python3 run.py
```

La extracción reemplaza el código. El ZIP excluye `campus.sqlite3`, `uploads/` y `.venv/`, por lo que conserva tus datos y archivos. El instalador aplica la nueva migración sin borrar las notas, entregas ni matrículas. Abre **http://127.0.0.1:8000**. En Linux usa `python3`: `py -3` corresponde al lanzador de Windows.

Para una instalación nueva en Chromebook/Linux:

```bash
sudo apt update
sudo apt install -y python3 python3-venv unzip wget
cd ~
wget -O LumaCampus.zip https://raw.githubusercontent.com/gabo899s/educanMEP/luma-campus/downloads/LumaCampus.zip
unzip LumaCampus.zip
cd LumaCampus
python3 run.py
```

## 10. Personalización y permisos

En **Mi perfil → Personalizar mi campus**, elige un acento de color, el espacio entre elementos y si prefieres menos animaciones. Los ajustes se guardan en tu cuenta.

El profesor crea actividades desde **Actividades → Nueva actividad**. El editor muestra una vista previa y permite configurar categoría, color, puntos, fecha, formato de entrega y entregas tardías. El formato «Archivo requerido» exige un archivo real en el servidor; «Solo texto» no acepta archivos. El formato y los puntos quedan protegidos cuando ya hay entregas.

Solo administración crea o edita materias, cuentas y matrículas. El profesor gestiona el trabajo académico únicamente en sus aulas asignadas. El estudiante gestiona sus propias entregas y consulta sus propias notas. Los mensajes son privados entre sus participantes, también frente a administración.

Consulta la tabla completa en **Mi perfil → Ver permisos por perfil**. El rol no se puede cambiar desde el perfil ni desde la personalización.

## 11. Trabajar con el perfil del profesor

1. Entra como profesor y abre **Mi perfil → Abrir mi estudio**, o **Mi estudio** en el menú.
2. Abre **Mi estilo de enseñanza** para guardar los valores habituales de tus actividades y hasta diez comentarios frecuentes. Separa los comentarios con una línea en blanco.
3. En **Mi biblioteca de rúbricas**, crea una rúbrica. Define criterios, niveles, descripciones y puntos. Cada criterio necesita un nivel de 0 puntos y al menos otro de puntuación positiva. Puedes partir del ejemplo editable.
4. En **Mis campos inteligentes**, crea un formulario. El ejemplo «Reflexión individual o en equipo» muestra una pregunta de integrantes solo si el estudiante elige trabajo en equipo. Configura tipos, ayudas, obligatoriedad y límites numéricos.
5. Crea una actividad y elige las plantillas en **Evalúa con criterios claros** y **Campos que acompañan el aprendizaje**. La vista previa permite probar las condiciones sin responder el formulario completo antes de publicar.
6. El estudiante consulta los criterios, responde los campos visibles y guarda un borrador o entrega. Los campos ocultos no son obligatorios ni se guardan como respuestas activas.
7. Abre **Revisar**. Selecciona un nivel por criterio, añade comentarios específicos y retroalimentación general; luego pulsa **Guardar calificación**. El servidor calcula la nota y el estudiante puede consultar el desglose.

Ejemplo de cálculo: una rúbrica de 12 puntos con un resultado de 6 se convierte a **38/75** en una actividad de 75 puntos: `6 ÷ 12 × 75 = 37,5`, redondeado a 38. La calificación directa se mantiene en las actividades sin rúbrica.

Las plantillas pertenecen a su autor, incluso frente a otras cuentas administrativas. Cada actividad guarda su propia copia: editar o borrar la plantilla no cambia evaluaciones existentes. Una vez que hay borradores o entregas, los campos y la rúbrica de la actividad se conservan. El estudiante no administra estas herramientas.

La actualización se realiza con los comandos de la sección 9. La migración 0004 conserva usuarios, aulas, entregas y notas anteriores.


## 12. Centro de administración institucional

Entra con una cuenta de administrador y abre **Administración**, o **Mi perfil → Abrir centro de gestión**.

1. **Vista general:** consulta estudiantes, profesores, materias activas, matrículas y pendientes como estudiantes sin aula o profesores sin asignación.
2. **Identidad:** cambia nombre completo, nombre corto, lema, período y colores. La vista previa permite comprobar la marca antes de publicar. Usa un principal oscuro, por ejemplo `#335d89`; el servidor exige contraste legible con blanco. Sube un logo **PNG de hasta 2 MB y 2048 × 2048 píxeles**. La identidad se aplica al acceso, navegación y acento por defecto; las preferencias personales de color se conservan.
3. **Materias:** crea o personaliza título, código único, descripción, ilustración, color, grupo, horario y profesor. Reasigna varias materias a un profesor activo. Archivar retira la materia de las aulas activas de profesores y estudiantes; restaurarla recupera su acceso, matrículas y contenido académico.
4. **Personas:** filtra por nombre, correo, identificador, perfil o estado. Crea cuentas; edita datos de acceso; completa fichas de contacto, departamento e identificador. El teléfono solo aparece en su propia cuenta y en la ficha administrativa. Exporta el directorio con **Exportar CSV**.
5. **Perfil y acceso:** el botón **Perfil** cambia permisos mediante una operación exclusiva de administración. No puedes cambiar tu propio perfil administrativo ni desactivar tu cuenta. Un profesor con materias activas necesita una reasignación previa para cambiar de perfil o desactivarse. Desactivar bloquea también sus sesiones abiertas y conserva registros; reactivar devuelve el acceso con su contraseña actual. Para editar una cuenta inactiva, reactívala primero.
6. **Matrículas:** selecciona materias y estudiantes, con búsqueda y selección de visibles. **Añadir** conserva las matrículas actuales; **Retirar** quita a los seleccionados; **Reemplazar** deja únicamente a los seleccionados en las materias elegidas. Revisa el resumen de altas y bajas antes de guardar. Las notas y entregas nunca se borran por estas operaciones. Para dejar un aula vacía, retira sus estudiantes mediante la operación Retirar.
7. **Módulos y apartados:** cambia los nombres visibles y activa/desactiva mensajería, calendario, notas, asistencia, estudio docente, materiales y muro. Inicio, aulas y actividades son esenciales. La gestión administrativa y el perfil propio siempre quedan disponibles. Desactivar conserva datos y bloquea las acciones del módulo en el servidor; reactivarlo permite continuar. Las notas anteriores siguen asociadas a las entregas y se conservan en la base de datos.
8. **Tarjetas institucionales:** publica hasta seis tarjetas de bienvenida, orientación, biblioteca o familias. Completa título y mensaje; el enlace HTTP/HTTPS es opcional. Deja la tarjeta completamente vacía para retirarla. Estos apartados y la identidad institucional son públicos; no incluyas datos personales en sus textos.
9. **Historial:** consulta hasta 100 cambios administrativos recientes con actor y fecha. No almacena contraseñas ni mensajes privados.

Para actualizar tu instalación de Linux / Chromebook, detén primero el servidor con **Ctrl+C** y ejecuta:

```bash
cd ~
cp -a LumaCampus "LumaCampus-respaldo-$(date +%Y%m%d-%H%M%S)"
wget -O LumaCampus-actualizacion.zip 'https://raw.githubusercontent.com/gabo899s/educanMEP/luma-campus/downloads/LumaCampus.zip?v=8'
unzip -o LumaCampus-actualizacion.zip
cd LumaCampus
python3 install.py
python3 run.py
```

Abre **http://127.0.0.1:8000**. El ZIP conserva `campus.sqlite3`, `uploads/` y `.venv/`; el instalador aplica las migraciones hasta 0007. Guarda juntos la base y `uploads/` en tus respaldos: allí se almacena también el logo institucional. El paquete continúa sin necesitar Node ni nuevas dependencias Python.


## 13. Espacio del estudiante

Entra como estudiante y abre **Mi espacio**. Las ocho pestañas reúnen Mi día, agenda, progreso, portafolio, metas, retroalimentación, cuaderno y ayuda.

1. **Mi día:** consulta clases, entregas pendientes, planes, metas y apuntes. El profesor configura los bloques reales desde su aula → Horario semanal. Las agendas usan la fecha del colegio en Costa Rica; un horario sin bloques estructurados no genera clases inventadas.
2. **Agenda:** crea recordatorios, planes personales o sesiones de estudio, con fecha, hora, duración, prioridad y notas. Puedes relacionarlos con una actividad y completarlos o reabrirlos. Los avisos aparecen en la campana al entrar o sincronizar el campus; no se envían correos ni notificaciones fuera del navegador.
3. **Progreso:** consulta tus entregas, asistencia y promedio calculado como suma de puntos obtenidos dividida entre los puntos evaluados. Las rúbricas muestran criterios que necesitan práctica; las metas personales no cambian calificaciones.
4. **Portafolio:** crea un proyecto propio o parte de una entrega. Se conserva una copia del texto, respuestas y archivo original. Adjunta archivos de hasta 5 MB. Cada proyecto nace privado: compartir con el profesor es una elección explícita y exige matrícula vigente. Volver a privado revoca también el acceso al archivo. El profesor consulta los compartidos desde Acompañamiento.
5. **Metas:** define objetivo, plazo, cantidad, unidad y reflexión. Registra tu avance con los controles del objetivo; completar una meta es un registro personal.
6. **Retroalimentación:** lee calificaciones, comentarios y desglose de rúbricas. Marca una revisión como leída o crea una meta para mejorar. Una nueva evaluación vuelve a aparecer como revisión pendiente.
7. **Cuaderno:** guarda apuntes, etiquetas y favoritos; busca por contenido y exporta un apunte o todos como Markdown. Son privados incluso frente a profesores y administración.
8. **Ayuda:** elige una actividad, explica tu duda y adjunta un archivo si hace falta. El profesor responsable responde desde Acompañamiento. Puedes continuar el hilo, resolverlo o reabrirlo. No es un chat con respuestas automáticas.
9. **Personalizar mi espacio:** cambia avatar, portada, intereses, acento y tarjetas del inicio. Puedes ordenar las seis tarjetas y ocultar hasta cinco. También ajusta letra, contraste, densidad y animaciones. Los intereses son privados; el avatar aparece en el directorio del campus.

Los formularios avisan al cerrar con cambios sin guardar. Guarda explícitamente tus apuntes y proyectos. Retirar una matrícula conserva tus registros personales, pero cancela el acceso docente al portafolio y bloquea nuevas consultas sobre esa aula.

La actualización completa está en la sección 9: detén el servidor, respalda la carpeta, extrae el ZIP encima y ejecuta `python3 install.py` seguido de `python3 run.py`. Guarda juntos `campus.sqlite3` y `uploads/`: incluyen agenda, cuaderno, metas, proyectos y archivos. El ZIP no contiene tus datos privados.


## 14. Luma AI: sesiones privadas de estudio

### Actualizar y activar en Linux / Chromebook

Detén el servidor con **Ctrl+C**. Copia los comandos completos; respeta las mayúsculas:

```bash
sudo apt update
sudo apt install -y python3 python3-venv unzip wget tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng poppler-utils
cd ~
cp -a LumaCampus "LumaCampus-respaldo-$(date +%Y%m%d-%H%M%S)"
wget -O LumaCampus-actualizacion.zip 'https://raw.githubusercontent.com/gabo899s/educanMEP/luma-campus/downloads/LumaCampus.zip?v=8'
unzip -o LumaCampus-actualizacion.zip
cd LumaCampus
python3 install.py
python3 configure_ai.py
python3 run.py
```

`configure_ai.py` solicita la clave sin mostrarla ni guardarla en el historial de comandos. Obtén una clave de **NVIDIA API Catalog** en https://build.nvidia.com/moonshotai/kimi-k2-instruct. Pégala únicamente en ese asistente local; no la escribas en el código ni en mensajes del campus. La clave se guarda en `.env`, que el ZIP excluye. La actualización conserva `.env`, `campus.sqlite3`, `.venv/` y `uploads/`. La migración 0007 mantiene tus registros anteriores.

Si ya tienes una clave configurada, omite `python3 configure_ai.py`. Para cambiarla, detén el campus, vuelve a ejecutar el asistente y reinicia. También se admite la variable de entorno `NVIDIA_API_KEY` o `LUMA_NVIDIA_API_KEY`. Por defecto se usa `LUMA_NVIDIA_MODEL=moonshotai/kimi-k2-instruct` y el endpoint de chat de NVIDIA. Una variable de entorno existente tiene prioridad sobre `.env`.

Abre **http://127.0.0.1:8000** y entra como estudiante. Luma AI no aparece para profesores ni administración. Sin una clave válida, la interfaz explica que el chat está pendiente de activar; permite guardar sesiones y fuentes sin inventar respuestas.

### Instalación nueva en Linux / Chromebook

```bash
sudo apt update
sudo apt install -y python3 python3-venv unzip wget tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng poppler-utils
cd ~
wget -O LumaCampus.zip 'https://raw.githubusercontent.com/gabo899s/educanMEP/luma-campus/downloads/LumaCampus.zip?v=8'
unzip LumaCampus.zip
cd LumaCampus
python3 install.py
python3 configure_ai.py
python3 run.py
```

Si ya existe una carpeta con ese nombre, usa el procedimiento de actualización con respaldo. El OCR es opcional para el campus y los PDF que ya tienen texto. Sin OCR, puedes subir imágenes o PDF escaneados y añadir su transcripción en la fuente.

### Windows y macOS

El chat, los PDF con texto, enlaces y sesiones usan las dependencias Python incluidas. Ejecuta `py -3 install.py`, `py -3 configure_ai.py` y `py -3 run.py` en Windows; en macOS utiliza `python3`. Para OCR instala Tesseract y Poppler, con sus ejecutables disponibles en PATH. En macOS con Homebrew: `brew install tesseract tesseract-lang poppler`. Los lanzadores están incluidos; esta versión se ha ejecutado y probado en Linux.

### Estudiar con Luma AI

1. Abre **Luma AI → Nueva sesión**, define un nombre y elige opcionalmente una materia matriculada.
2. Pulsa **Añadir** en Mis fuentes. Puedes pegar contenido, subir PDF/PNG/JPG/TXT/Markdown, usar un enlace público o YouTube, copiar un material o actividad de Classroom, o importar uno de tus apuntes privados.
3. También puedes abrir un material en Classroom y pulsar **Estudiar con Luma AI**. En una actividad, **Pensar con Luma AI** inicia acompañamiento de tutoría.
4. Abre cada fuente para revisar el texto extraído. Si necesita transcripción, pégala y guarda. El estudiante puede corregir errores de OCR, especialmente fórmulas y cifras.
5. Selecciona hasta diez fuentes y escribe tu pregunta. Las referencias de la respuesta abren el texto utilizado. Sin fuentes seleccionadas, la IA ofrece orientación conceptual general.
6. La sesión conserva conversación y fuentes. Puedes volver después, renombrarla, añadir o retirar material y exportar todo como Markdown. Eliminar una sesión retira también sus archivos locales.
7. Si falla NVIDIA, la pregunta permanece disponible para reintentar. Si la conexión se interrumpe durante el procesamiento, actualiza la sesión; el bloqueo caduca y la pregunta vuelve a estar disponible. El identificador evita generar dos veces una pregunta ya completada.

### Alcance y límites

- Solo chat de texto. No genera audio, videos ni imágenes.
- Hasta 100 sesiones por estudiante, 30 fuentes y 100 preguntas por sesión; 20 preguntas nuevas por cuenta cada diez minutos.
- Archivos de hasta 8 MB; PDF de hasta 80 páginas; hasta 100.000 caracteres por fuente. Divide documentos mayores.
- El OCR procesa imágenes PNG/JPG y hasta ocho páginas escaneadas por PDF; las páginas restantes necesitan texto adicional o documentos separados. No hay comprensión visual de diagramas, fotos o gráficos: Kimi K2 recibe el texto extraído.
- YouTube necesita subtítulos accesibles. Si no existen o el servicio bloquea el acceso, la fuente queda pendiente y se puede transcribir. No se descarga el video ni se procesa su audio.
- Los enlaces usan páginas públicas. No se leen intranets, redes privadas ni sitios que necesiten tus credenciales. Si un sitio público no se puede leer, se conserva el enlace y puedes pegar el contenido.
- Se seleccionan fragmentos relevantes, no se envía siempre el documento completo. Revisa las fuentes y divide temas extensos cuando haga falta.
- Agenda, apuntes y el resto del campus no se envían automáticamente a NVIDIA. Solo se copia lo que importas en Luma AI; al preguntar se envían la pregunta, historial reciente y fragmentos seleccionados.
- Importar una actividad o detectar un entregable activa tutoría persistente. Las pistas no deben contener respuestas finales, apartados resueltos, código entregable ni proyectos completos. Los filtros incluyen un revisor independiente y respuestas seguras si la revisión falla. Son controles de IA, no una garantía absoluta de detección perfecta.

Guarda juntos `campus.sqlite3`, `uploads/` y tu configuración privada en los respaldos. El ZIP nunca incluye sesiones, fuentes ni claves locales. La comprobación del contrato NVIDIA y las pruebas de interfaz usan un proveedor simulado únicamente en las pruebas; una respuesta real requiere tu clave y acceso al servicio.


## 15. Actualizar a Luma Campus 8

En Linux / Chromebook, detén el servidor anterior con **Ctrl+C** y copia este bloque completo. Conserva la copia de respaldo hasta comprobar tus datos:

```bash
cd "$HOME"
sudo apt update
sudo apt install -y python3 python3-venv unzip wget tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng poppler-utils
if [ -d LumaCampus ]; then
  cp -a LumaCampus "LumaCampus-respaldo-$(date +%Y%m%d-%H%M%S)"
fi
wget -O LumaCampus-v8.zip 'https://raw.githubusercontent.com/gabo899s/educanMEP/luma-campus/downloads/LumaCampus.zip?v=8'
unzip -o LumaCampus-v8.zip
cd LumaCampus
python3 install.py
python3 run.py
```

Abre **http://127.0.0.1:8000**. El arranque solicita crear administración si no existe una cuenta real activa. Si ya existe, inicia sesión con ella. No hay contraseñas compartidas ni botones de prueba. Las nuevas migraciones conservan las cuentas reales, matrículas, entregas, sesiones de IA, preferencias y archivos existentes. El ZIP no sobrescribe la base, `uploads/`, `.venv/` ni `.env`.

Para habilitar ambas áreas de IA, detén el servidor con **Ctrl+C**, configura tu clave privada y vuelve a iniciar:

```bash
cd "$HOME/LumaCampus"
python3 configure_ai.py
python3 run.py
```

No pegues la clave en el navegador, repositorio ni chat. No hace falta repetir la configuración si tu `.env` ya contiene una clave válida.

El docente entra en **Mi estudio**. El estudiante reserva tutorías en **Mi espacio → Consultas / ayuda**. Los borradores y las actividades programadas no son visibles para estudiantes hasta la publicación. Consulta **DOCENCIA.md** para el recorrido completo y los límites de cada herramienta.
