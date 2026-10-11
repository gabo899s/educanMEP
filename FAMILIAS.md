# Luma Familias · Luma Campus 9

Hogar y colegio comparten un espacio con información académica autorizada, comunicados y procesos completos. Mantiene el diseño de Luma y no crea cuentas de prueba.

## Comenzar con personas reales

1. En **Administración → Personas**, crea una cuenta con perfil **Familiar / encargado**. Usa su correo real y una contraseña individual; entrégala por un canal privado.
2. Crea o verifica la cuenta del estudiante y sus materias.
3. En **Hogar y colegio → Vínculos**, verifica la relación familiar y vincula ambas cuentas. Marca consulta académica solo cuando corresponda.
4. El encargado inicia sesión con su cuenta. Una cuenta puede tener varios hijos; cada hijo puede tener varios encargados.
5. Para retirar el acceso, revoca el vínculo o desactiva la cuenta. Los registros históricos permanecen. Cambiar el perfil de una cuenta revoca sus vínculos familiares.

El familiar consulta exclusivamente a sus hijos vinculados. La consulta académica muestra actividades publicadas, resultados, retroalimentación de actividades calificadas, horarios y asistencia. No incluye el cuerpo de las entregas, archivos de trabajos, respuestas privadas, notas personales, portafolio privado ni sesiones o conversaciones de Luma AI. Un vínculo sin consulta académica conserva comunicación, citas, permisos y trámites.

## Funciones y recorridos

- **Mi familia:** tarjetas por hijo, promedio ponderado por puntos de actividades calificadas, próximas entregas y ausencias de los últimos siete días. Este promedio no sustituye un boletín oficial por período.
- **Bienvenida:** lista de pasos para verificar el vínculo, completar contactos, revisar materias, presentar documentación y responder publicaciones de bienvenida. Administración puede publicar formularios de bienvenida o matrícula; el familiar presenta documentos mediante Trámites.
- **Comunicados:** docentes publican para sus propias materias; administración puede seleccionar estudiantes concretos. Los destinatarios se fijan al publicar y requieren vínculos verificados. Se pueden programar mensajes, adjuntar archivos de hasta 5 MB y definir plazos o urgencia.
- **Seguimiento:** lectura y respuesta explícita son estados distintos. El colegio consulta lecturas, firmas de confirmación y respuestas por encargado y estudiante. La confirmación registra cuenta, nombre y fecha; no es una firma electrónica certificada.
- **Formularios:** editor visual de texto, opciones, números y casillas; límites, preguntas obligatorias y campos condicionales. El servidor vuelve a validar las respuestas. La respuesta registrada no se puede sobrescribir desde la cuenta familiar.
- **Permisos:** aceptar o rechazar una autorización. Se exige confirmación de identidad y se conserva la decisión.
- **Eventos:** fecha, lugar, cupos, asistencia y voluntariado. Los cupos cuentan estudiantes distintos; otro encargado del mismo hijo no ocupa un cupo adicional. Si se completa la capacidad, la respuesta entra en lista de espera. La promoción desde esa lista se coordina con el colegio; no es automática.
- **Conversaciones:** asuntos y categorías, archivos, búsqueda, mensajes leídos, cierre y reapertura. Solo las ven sus participantes; un administrador ajeno tampoco puede leerlas. Los docentes destinatarios deben tener una materia activa con el estudiante. Revocar el vínculo bloquea también sus archivos.
- **Asistencia:** justificar ausencias o tardías y adjuntar comprobantes. El docente de esa materia o administración acepta, rechaza o solicita información adicional. Una ausencia aceptada permanece ausente y se identifica como justificada. Los registros de asistencia con solicitudes familiares no se pueden sobrescribir desde la asistencia general.
- **Citas:** el personal abre horarios de 10 a 120 minutos; el familiar reserva para un hijo. Hay control de superposición con otras citas y tutorías estudiantiles, reserva atómica, cancelación y acuerdos compartidos. La asignación del docente y la matrícula deben seguir vigentes.
- **Trámites:** constancias, documentos, cambios de datos, matrícula u otras solicitudes. Administración asigna responsable y registra cada cambio, respuesta y archivo. La familia puede ampliar información cuando se le solicita.
- **Matrícula:** una solicitud de tipo matrícula habilita **Revisar y matricular** a administración. Seleccionar materias confirma el trámite y añade matrículas reales, conservando las existentes. Para estudiantes nuevos, administración crea primero su cuenta y verifica el vínculo familiar.
- **Acompañamiento:** señales basadas en ausencias de los últimos 30 días y actividades abiertas vencidas sin entrega o devueltas; respeta fechas individuales. El personal configura umbrales. Revisa evidencias, registra acuerdos, responsable y fecha de seguimiento. Los planes son internos hasta marcar compartir con la familia. No hay contacto ni diagnóstico automático.
- **Administración:** lista de estudiantes sin encargados verificados, seguimiento de respuestas, justificaciones, trámites y entregas externas. La institución puede personalizar el nombre del apartado y desactivar el módulo sin borrar datos.
- **Preferencias:** idioma español, inglés, portugués o francés; canales, avisos inmediatos o resúmenes diarios/semanales y horario de silencio. El resumen semanal se prepara los lunes. Los avisos urgentes omiten el silencio y la agrupación.

## Asistente de comunicación y traducciones

Usa la misma configuración NVIDIA Kimi K2 del servidor explicada en `LUMA_AI.md`. El asistente del personal prepara borradores privados; puede resumir una conversación propia o traducir una publicación propia. Nunca accede al cuaderno o Luma AI estudiantil ni envía mensajes o decide calificaciones.

En **Asistente**, revisa y edita el resultado, confirma tu revisión y continúa al formulario. Para traducciones, revisa también el título y publica la variante del idioma seleccionado. El familiar verá esa variante si coincide con su preferencia; puede abrir el original. Si falta una traducción revisada, ve el original. El envío externo usa la variante revisada disponible cuando se procesa. No se traducen automáticamente formularios ni chats.

Se necesitan una clave válida de NVIDIA y acceso al proveedor. Sin ellos, se informa del problema; no se inventan respuestas. Hay un límite de diez borradores por persona cada diez minutos.

## Canales externos: configuración real

Los avisos dentro de Luma funcionan sin proveedor externo. Correo, SMS y Web Push son opcionales y requieren configurar el servidor, seleccionar el canal en la cuenta familiar y ejecutar el procesador de envíos. No se envían por el simple hecho de abrir `run.py`.

Guarda la configuración en `.env` dentro de LumaCampus. Nunca la subas a GitHub. Los secretos no se exponen en el navegador ni en el ZIP.

### Correo SMTP

```dotenv
LUMA_SMTP_HOST=smtp.tu-proveedor.com
LUMA_SMTP_PORT=587
LUMA_SMTP_USER=avisos@tu-colegio.com
LUMA_SMTP_PASSWORD=tu-credencial-del-servidor
LUMA_SMTP_TLS=1
LUMA_SMTP_SSL=0
LUMA_EMAIL_FROM=avisos@tu-colegio.com
LUMA_PUBLIC_URL=https://campus.tu-colegio.com
```

Para SMTP con SSL en el puerto 465, configura `LUMA_SMTP_SSL=1` y `LUMA_SMTP_TLS=0`. Utiliza el método que indique tu proveedor. No requiere nuevas dependencias Python.

### SMS con Twilio

```dotenv
LUMA_TWILIO_ACCOUNT=tu-account-sid
LUMA_TWILIO_TOKEN=tu-auth-token
LUMA_TWILIO_FROM=tu-numero-twilio
```

El teléfono familiar debe tener formato internacional, por ejemplo `+50688888888`, y el remitente debe estar habilitado en Twilio. El proveedor aplica sus tarifas y restricciones. No requiere nuevas dependencias Python.

### Web Push

Necesita HTTPS —localhost también admite pruebas de navegador—, claves VAPID y un navegador compatible. Instala la dependencia opcional con conexión a Internet:

```bash
cd ~/LumaCampus
.venv/bin/python -m pip install -r requirements-notifications.txt
```

Genera tu par de claves VAPID con las herramientas de tu servidor y configura:

```dotenv
LUMA_VAPID_PRIVATE_KEY=/ruta/absoluta/a/tu-clave-vapid.pem
LUMA_VAPID_PUBLIC_KEY=tu-clave-publica-base64url
LUMA_VAPID_SUBJECT=mailto:administracion@tu-colegio.com
```

El familiar pulsa **Preferencias → Activar avisos en este navegador**, permite las notificaciones y selecciona Push en sus canales. El trabajador admite proveedores de Chrome/FCM, Firefox, Safari y Windows. El service worker no almacena información académica en caché. Las notificaciones tienen un texto genérico para no exponer el contenido en la pantalla bloqueada. Cerrar sesión cancela la suscripción de ese navegador.

### Procesar los envíos

Primero comprueba manualmente:

```bash
cd ~/LumaCampus
.venv/bin/python manage.py send_family_notifications --limit 100
```

En un servidor Linux, programa ese comando cada minuto. Para obtener una línea de cron con las rutas reales de tu instalación:

```bash
cd ~/LumaCampus
python3 - <<'PY'
from pathlib import Path
import shlex
root = Path.cwd()
print('* * * * * cd ' + shlex.quote(str(root)) + ' && ' + shlex.quote(str(root / '.venv/bin/python')) + ' manage.py send_family_notifications --limit 100 >> ' + shlex.quote(str(root / 'family-delivery.log')) + ' 2>&1')
PY
crontab -e
```

Copia en el editor la línea impresa, guarda y cierra. No reemplaces otros trabajos existentes. Configura rotación para el archivo de registro en producción. El servidor debe permanecer encendido y tener acceso a los proveedores.

Cada aviso tiene una clave única para evitar duplicados, una reserva de procesamiento y hasta tres intentos. Respeta las preferencias y el horario de silencio; cancela entregas si se revoca el acceso. Si un proceso muere durante un envío, su resultado se marca desconocido y no se reenvía automáticamente. Antes de reintentar manualmente, verifica el proveedor. En Preferencias, el personal puede usar **Revisar y reintentar**, confirmar esa verificación y volver a poner el aviso en cola.

**Aceptado por proveedor** significa aceptación por SMTP, Twilio o el servicio push; no garantiza entrega al dispositivo, lectura o confirmación. No se integraron webhooks de entrega. Los estados de lectura y respuesta solo se registran dentro de Luma.

## Verificación y alcance

Las pruebas verifican el servidor, los permisos y los recorridos de navegador con datos aislados. Las respuestas de NVIDIA y de proveedores externos se prueban con adaptadores simulados; la entrega real necesita tus credenciales y una prueba de extremo a extremo en tu servidor.

Las funciones financieras, transporte, enfermería, llamadas telefónicas y una app nativa no forman parte de esta actualización.

## Referencias de producto

Se analizaron patrones públicos de [CloudCampus Pro](https://hola.cloudcampuspro.com/ccpro), [WOOT IT](https://static.wootit.com/comunicacion1.html) y [ParentSquare](https://www.parentsquare.com/platform/classroom-communications/). La implementación de este módulo es propia y conserva el diseño de Luma; no incluye código ni marcas de esas plataformas.

### Generar claves VAPID sin exponer la clave privada

Tras instalar `requirements-notifications.txt`, ejecuta una vez en Linux:

```bash
cd ~/LumaCampus
.venv/bin/python - <<'PY'
from pathlib import Path
import base64
import os
from py_vapid import Vapid
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
root = Path.cwd() / 'private'
root.mkdir(mode=0o700, exist_ok=True)
key_file = root / 'vapid-private.pem'
if key_file.exists():
    vapid = Vapid.from_file(str(key_file))
else:
    vapid = Vapid()
    vapid.generate_keys()
    vapid.save_key(str(key_file))
    os.chmod(key_file, 0o600)
public = base64.urlsafe_b64encode(vapid.public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)).decode().rstrip('=')
print('LUMA_VAPID_PRIVATE_KEY=' + str(key_file))
print('LUMA_VAPID_PUBLIC_KEY=' + public)
PY
```

Añade las dos líneas impresas a `.env`, configura `LUMA_VAPID_SUBJECT` con un correo real y reinicia el servidor. La carpeta `private/` se excluye de Git y del empaquetador. Consérvala en un respaldo privado: cambiar las claves invalida las suscripciones anteriores.
