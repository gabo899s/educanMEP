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

## Funciones implementadas

- Sesiones autenticadas, contraseñas cifradas con hash, protección CSRF y autorización en el servidor.
- Dashboard con aulas, tareas pendientes, promedio, asistencia y calendario.
- Classroom: muro con publicaciones, tareas, materiales, personas y asistencia.
- Estudiantes: entregar texto y archivos de hasta 5 MB; consultar sus calificaciones y retroalimentación.
- Profesores: publicar actividades y materiales, revisar archivos, calificar y registrar asistencia en sus aulas.
- Administración: crear estudiantes, profesores y administradores; crear aulas; asignar profesor y matricular estudiantes.
- Mensajería entre cuentas reales, historial persistente y lectura. Las conversaciones se actualizan cada 15 segundos; no hay respuestas automáticas ficticias.
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
python manage.py check
python manage.py test
node --check public/app.js
```

Las 10 pruebas del servidor verifican acceso autenticado, CSRF, permisos por rol/aula, entregas, calificaciones, conversaciones privadas, matrícula, asistencia, validación de enlaces, perfil y acceso a archivos.

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
