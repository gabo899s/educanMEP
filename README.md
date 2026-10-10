# Luma Campus 🌷

Plataforma escolar funcional con una identidad visual colorida, cálida y coqueta. Interfaz en español, adaptable a móviles, con ilustraciones SVG propias y tipografías incluidas localmente.

## Descargar el paquete listo para ejecutar

[Descargar LumaCampus.zip](https://raw.githubusercontent.com/gabo899s/educanMEP/luma-campus/downloads/LumaCampus.zip)

El ZIP incluye el código, los instaladores, las tipografías, las cuatro dependencias de Python y la guía completa. No incluye una base de datos anterior ni sesiones. Consulta `downloads/SHA256SUMS.txt` para verificar su integridad.

## Ejecutar

Extrae todo el ZIP. Requiere Python 3.10 o superior (recomendado: 3.12).

**Windows:** doble clic en `start.bat`, o ejecuta `py -3 run.py`.

**macOS/Linux:** ejecuta `python3 run.py`, o `sh start.sh`.

El primer arranque instala automáticamente las dependencias incluidas, prepara SQLite y crea las cuentas de demostración. Abre **http://127.0.0.1:8000**. Deja la terminal abierta y usa Ctrl+C para detener el servidor.

No necesitas Node.js ni una base de datos externa. Los paquetes de instalación están en `vendor/wheels/`; no se descargan de Internet. Las instrucciones completas, las cuentas y la solución de problemas están en **INSTALACION.md**.

## Espacio docente — Luma Campus 5

- **Mi perfil → Abrir mi estudio** y **Mi estudio** reúnen aulas, revisiones pendientes y biblioteca privada de herramientas.
- Rúbricas reutilizables: hasta 10 criterios, con 2 a 5 niveles de logro, descripciones y puntos distintos. Cada criterio incluye 0 puntos. La nota se calcula en el servidor y se ajusta a los puntos de la actividad; incluye comentarios por criterio y desglose visible para el estudiante.
- Campos inteligentes: texto corto/largo, números con límites, opciones y casillas. Las preguntas pueden depender de una opción o casilla anterior. Solo se exigen las preguntas visibles. Los borradores guardan también las respuestas estructuradas.
- Plantillas privadas: crear, editar, duplicar y eliminar rúbricas o formularios. Las actividades conservan una copia independiente. Las rúbricas y los campos de una actividad quedan protegidos al existir borradores o entregas.
- Preferencias docentes: puntos, plazo, categoría, formato, color y entregas tardías habituales. Banco personal de comentarios para acompañar la evaluación.
- Implementación original en Django y JavaScript, sin servicios externos. Se revisaron los patrones de Moodle, Canvas y JSON Forms; consulta **REFERENTES_DOCENTES.md**.

## Formularios y permisos — Luma Campus 3

- Los formularios de creación y edición usan un editor con secciones, vista previa en vivo, campos obligatorios identificados y protección al salir con cambios sin guardar.
- Las actividades permiten elegir categoría, paleta, formato de entrega (texto, archivo o ambos) y entregas tardías. Se conservan el formato y los puntos cuando ya existen entregas.
- Perfil → Personalizar mi campus guarda acento de color, densidad y reducción de animaciones por cuenta.
- Perfil → Ver permisos por perfil muestra las reglas de acceso. La política central está en `campus/permissions.py`; cada aula también valida su alcance en el servidor.
- **Estudiante:** sus aulas matriculadas, sus entregas, notas y asistencia; su perfil y sus conversaciones. No crea materias, actividades, cuentas, eventos ni matrículas.
- **Profesor:** actividades, materiales, notas y asistencia de sus aulas asignadas, y eventos propios. No crea materias, cuentas ni matrículas.
- **Administrador:** materias, cuentas, matrículas y gestión académica de todo el colegio. Las conversaciones privadas solo las consultan sus participantes.
- Los tres perfiles pueden participar en el muro, gestionar sus propias publicaciones y personalizar su cuenta. Los profesores moderan sus aulas y administración puede moderar todas.
- Las opciones visuales no cambian el rol ni los permisos. La migración 0003 agrega las opciones sin eliminar datos.

## Novedades de Luma Campus 2

- Diseño mejorado conservando la paleta, las flores y la estética original: tarjetas con progreso, favoritas, enfoque del día, navegación móvil y formularios más legibles.
- Borradores de actividades guardados en la cuenta; carga de archivos con progreso, vista previa y arrastrar/soltar.
- Edición de actividades, materiales, publicaciones, eventos, aulas y personas según los permisos. Cierre/reapertura de actividades y publicaciones fijadas.
- Materiales con archivos descargables, filtros de tareas y personas, resumen de notas por aula y exportación CSV autorizada.
- Mensajería con confirmaciones de lectura, búsqueda y conservación del texto escrito. Sincronización condicional con ETag, reconexión y estados de carga.
- Con 46 aulas, la consulta del estado bajó de 55 a 11 consultas SQL (80 % menos) frente a la versión anterior, en el mismo ensayo local. Esta medición no equivale a una mejora global de 15 veces.
- Migración comprobada que conserva matrículas, entregas y calificaciones. Consulta **INSTALACION.md**, sección 9, para actualizar con respaldo.

## Funciones implementadas

- Sesiones autenticadas, contraseñas cifradas con hash, protección CSRF y autorización en el servidor.
- Dashboard con aulas, tareas pendientes, promedio, asistencia y calendario.
- Classroom: muro con publicaciones, tareas, materiales, personas y asistencia.
- Estudiantes: entregar texto y archivos de hasta 5 MB; consultar sus calificaciones y retroalimentación.
- Profesores: publicar actividades y materiales, revisar archivos, calificar y registrar asistencia en sus aulas.
- Administración: crear estudiantes, profesores y administradores; crear aulas; asignar profesor y matricular estudiantes.
- Mensajería entre cuentas reales, historial persistente y lectura. Las conversaciones se actualizan cada 6 segundos mientras la mensajería está abierta; no hay respuestas automáticas ficticias.
- Perfil editable, cambio de contraseña y cierre de sesión.
- Calendario mensual con creación de eventos y detalle de actividades.
- Búsqueda de aulas, actividades y personas.
- SQLite guarda los registros; los archivos se guardan en `uploads/` y se descargan mediante una ruta autorizada.

Las pruebas de navegador verificaron también entrega, mensajería, perfil, calificación y creación de usuario. Se revisaron escritorio (1440 px) y móvil (390 px), sin errores de JavaScript ni desbordamiento horizontal.

## Base de GitHub y adaptación

Se revisaron:

1. https://github.com/adilmohak/django-lms — seleccionado; licencia MIT.
2. https://github.com/Yogndrr/MERN-School-Management-System — referencia de módulos; no se incorporó su código al no encontrarse licencia en el checkout revisado.

Esta es una adaptación parcial, no un cambio de apariencia del sistema completo. El modelo `Course` de django-lms y su asignación de profesores sirvieron para adaptar `title`, `code`, `summary` y las relaciones académicas a un colegio. Los módulos de campus, permisos, mensajería y la interfaz son implementación nueva. El código de referencia y la licencia MIT se conservan en `third_party/`.

Referencia exacta de django-lms: commit `2f1baf17511d654190fd5b161648f4e8d426965d`.

Las tipografías Manrope y DM Sans provienen de google/fonts y conservan sus licencias OFL en `third_party/`.

## Verificación

```sh
python3 manage.py check
python3 manage.py test
node --check public/app.js
```

Las 72 pruebas del servidor verifican acceso autenticado, CSRF, permisos por rol/aula, entregas, calificaciones, conversaciones privadas, matrícula, asistencia, validación de enlaces, perfil y acceso a archivos.

## Publicación

El proyecto se ejecuta localmente con Django. Para publicarlo en un dominio, necesitas un alojamiento compatible con Python.

Para desplegar en un servidor compatible con Python, instala `requirements-production.txt`, usa WSGI (`campus.wsgi:application`) con Gunicorn, ejecuta las migraciones y configura:

- `LUMA_DEBUG=0`
- `LUMA_SECRET_KEY`: clave aleatoria privada.
- `LUMA_ALLOWED_HOSTS`: dominios separados por comas.
- HTTPS y almacenamiento persistente para la base SQLite y `uploads/`.

No uses las cuentas de demostración con datos reales. Para una instalación nueva de producción, omite `seed.py` y crea la primera cuenta administrativa con `python bootstrap_admin.py`.

Alcance actual: un colegio por instalación. No se incorporaron facturación, integración oficial con Google Classroom, videollamadas, correo de recuperación ni aplicación móvil nativa.

## Regenerar el ZIP

```sh
python scripts/package_zip.py
```

Genera `downloads/LumaCampus.zip` y su suma SHA-256. El empaquetador excluye Git, entornos virtuales, bases SQLite, archivos personales y paquetes ZIP anteriores.


## Centro de administración institucional · versión 5

Administración dispone de siete áreas: vista general, identidad, materias, personas, matrículas, módulos y apartados, e historial. La identidad admite nombre, marca corta, lema, período, colores y logo PNG; las materias conservan su color, ilustración, horario, grupo y responsable. Se pueden archivar y restaurar sin borrar sus registros.

Las fichas incluyen departamento, identificador y contacto. La administración crea/edita cuentas, cambia perfiles con salvaguardas y activa/desactiva el acceso. La reasignación docente y la matrícula por lote conservan actividades, entregas y notas. La vista previa de matrículas muestra altas y bajas antes de guardar.

Los módulos opcionales se pueden desactivar; el servidor bloquea sus acciones mientras conserva sus datos. Los nombres de apartados y hasta seis tarjetas institucionales de inicio son personalizables. El historial guarda las operaciones administrativas y el directorio se puede exportar como CSV.

[Guía de uso e instalación](INSTALACION.md#12-centro-de-administración-institucional) · [Análisis de Moodle y Canvas](REFERENTES_ADMINISTRACION.md). La migración 0005 conserva los datos existentes. Una institución por instalación; el historial no incluye mensajes privados ni contraseñas.
