# Luma AI · arquitectura de estudio

La interacción sigue el patrón de un cuaderno con fuentes: biblioteca de sesiones, colección de materiales seleccionables y conversación con referencias. La implementación es original, integrada en Django y JavaScript de Luma Campus; no se copió el código de NotebookLM ni de Astra AI.

## Datos y privacidad

`AIStudySession` pertenece a un estudiante y se relaciona opcionalmente con una materia. `AIStudySource` conserva texto, archivo y procedencia de una copia explícita. `AIStudyTurn` guarda pregunta, respuesta, selección de fuentes, referencias y estado. Las fuentes de Classroom se autorizan por matrícula antes de copiarlas; no se importan entregas ajenas ni conversaciones del colegio.

Todas las rutas `/api/ai/` requieren `ai.study`, exclusivo del estudiante. Cada sesión, fuente, descarga y exportación verifica además su propietario. Los datos no forman parte del estado común del campus. Las respuestas privadas usan `Cache-Control: private, no-store`. La clave se lee desde el servidor y nunca se devuelve a la interfaz.

## Lectura de fuentes

`ai_extract.py` ejecuta la extracción de archivos en un proceso separado, con tiempo y memoria limitados en Linux. pypdf lee PDF con texto. Tesseract aporta OCR de imágenes y Poppler rasteriza páginas escaneadas cuando ambos están instalados. Las fuentes sin texto permanecen identificadas y admiten una transcripción manual.

`ai_fetch.py` lee enlaces HTTP/HTTPS públicos, fija la dirección resuelta para la conexión, comprueba cada redirección y bloquea redes privadas y metadatos internos. El lector HTML retira scripts y estilos. YouTube utiliza subtítulos accesibles mediante youtube-transcript-api; no hay análisis audiovisual.

Los archivos originales se descargan como adjuntos autorizados. No se muestran HTML de documentos ni salidas del modelo sin escapar. El modelo no ejecuta herramientas, enlaces ni código del material.

## NVIDIA y referencias

`ai_provider.py` conecta con `https://integrate.api.nvidia.com/v1/chat/completions`, con `moonshotai/kimi-k2-instruct` por defecto y autorización del servidor. La petición contiene solo mensajes de texto. Cada pregunta recupera fragmentos relevantes de hasta diez fuentes y un historial reciente limitado. Los fragmentos llevan etiquetas F1, F2, etc.; las referencias se validan contra las etiquetas enviadas.

La conexión tiene tiempos máximos. Los fallos conservan una pregunta recuperable. Una clave UUID por pregunta permite reintentos sin duplicar una respuesta ya guardada; una reserva temporal impide procesar simultáneamente dos preguntas en la misma sesión. No se mantiene una transacción SQLite abierta durante las llamadas externas.

## Tutoría y entregables

La política combina señales locales, procedencia de actividades reales, clasificación semántica y revisión independiente de la respuesta. El modo de tutoría se conserva en el servidor y no se cambia desde formularios ni instrucciones del usuario. Retirar una consigna o renombrar la sesión no elimina ese modo.

Las instrucciones del sistema tratan documentos, OCR, transcripciones y mensajes como datos no confiables. Para tareas, evaluaciones y proyectos solo se permiten pistas conceptuales y preguntas socráticas; se rechazan resultados, desarrollo que resuelva el ejercicio, apartados listos para entregar y proyectos completos. La revisión fallida o ilegible sustituye la salida por acompañamiento seguro. Los controles basados en modelos no garantizan una detección perfecta de todos los casos.

## Verificación

Las pruebas cubren privacidad, matrícula, CSRF, archivos, extracción, SSRF, transcripciones, recuperación, referencias, concurrencia, claves y tutoría persistente. Las respuestas NVIDIA se controlan en las pruebas para ensayar tanto respuestas válidas como intentos de entregar soluciones; ese simulador no se incluye en el producto.

Referencias técnicas:

- NVIDIA API Catalog: https://build.nvidia.com/moonshotai/kimi-k2-instruct
- NVIDIA chat API: https://docs.api.nvidia.com/nim/reference/create_chat_completion_v1_chat_completions_post
- pypdf: https://pypdf.readthedocs.io/
- youtube-transcript-api: https://github.com/jdepoix/youtube-transcript-api
- Tesseract: https://tesseract-ocr.github.io/
