# Referentes reales para el centro de administración

Se consultó el código público de dos plataformas. Las ideas se adaptaron a la arquitectura de Luma; no se copiaron componentes ni se añadieron dependencias de esos proyectos.

| Referente y código consultado | Cómo organiza la administración | Adaptación en Luma |
| --- | --- | --- |
| [Moodle: configuración de apariencia](https://github.com/moodle/moodle/blob/215f44380bdc3ccf852a3a22e34f8423ff64033a/admin/settings/appearance.php) | Agrupa logos, identidad visual y colores de cursos en ajustes protegidos por capacidades. El reemplazo de marca actualiza los recursos visibles. | Área Identidad con nombre, marca corta, lema, período, dos colores y logo. Vista previa antes de publicar; el logo cambia su URL de versión. Colores e ilustraciones propios de cada materia. |
| [Canvas: administración de cuentas](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/app/controllers/accounts_controller.rb) | Separa configuración de cuenta, cursos, personas y permisos. `show_settings` exige `manage_account_settings`; los datos de gestión se presentan según la autorización. | Siete áreas administrativas; permiso `institution.manage` exclusivo de administración; catálogo, personas y matrículas con comprobaciones en servidor. La respuesta pública solo contiene identidad y apartados publicados. |

## Decisiones de producto

- **Un colegio por instalación.** La configuración institucional se comparte con sus tres perfiles. No se ha implementado una red de colegios o subcuentas de Canvas.
- **Permisos escolares explícitos.** El estudiante nunca crea materias, cuentas ni matrículas. El profesor gestiona sus aulas asignadas. Administración configura toda la institución. Cambiar de perfil requiere una operación administrativa específica y protegida.
- **Matrículas con intención.** Añadir, retirar y reemplazar son operaciones distintas. La vista previa cuenta matrículas nuevas y retiradas; el servidor valida todo el lote antes de aplicarlo dentro de una transacción.
- **Conservación académica.** Archivar materias, desactivar cuentas y retirar matrículas no elimina entregas ni notas. Restaurar devuelve el acceso correspondiente. Un profesor con materias activas debe ser reasignado antes de perder acceso o cambiar de perfil.
- **Módulos opcionales.** Mensajería, calendario, notas, asistencia, estudio, materiales y muro se pueden desactivar. Sus mutaciones se bloquean en servidor; los datos se conservan. Inicio, aulas y actividades permanecen como núcleo del sistema. Administración y el perfil propio siempre quedan disponibles.
- **Personalización segura.** Se validan colores hexadecimales, contraste del principal con texto blanco y enlaces HTTP/HTTPS. Los textos se escapan; los apartados no aceptan HTML ejecutable. El logo admite PNG, validado sin librerías nuevas, con límite de tamaño y dimensiones.
- **Preferencia individual.** La identidad institucional aparece en el acceso y en la marca de todos los perfiles. El acento institucional se usa por defecto; cada persona puede elegir otro acento para su propia cuenta.
- **Privacidad y trazabilidad.** Las fichas de administración incluyen contacto e identificadores, sin preferencias personales ni bibliotecas docentes privadas. Los mensajes siguen siendo visibles solo para sus participantes. El historial muestra hasta 100 operaciones administrativas recientes con actor y fecha; no almacena contraseñas ni contenido de mensajes.

## Alcance implementado

Gestión real y persistente de marca institucional, logo, módulos, tarjetas de inicio, materias, archivo/restauración, asignación docente, creación y edición de cuentas, cambios protegidos de perfil, activación/desactivación, fichas, matrículas por lote, exportación CSV y registro de cambios.

La referencia a una mejora «30x» se tomó como una petición de ampliación sustancial; no representa una medición de rendimiento ni una equivalencia funcional con todas las capacidades de Moodle o Canvas.
