# Luma Campus — instalación y ejecución

## 1. Preparar el equipo

Instala **Python 3.10 o superior**. Se recomienda **Python 3.12**.

- Windows: instala Python desde python.org y marca **Add Python to PATH**. El lanzador `py` también funciona.
- macOS: instala Python 3 desde python.org o con tu gestor habitual.
- Ubuntu/Debian: `sudo apt install python3 python3-venv`.

El ZIP incluye las dependencias de Python en `vendor/wheels/`: **la instalación de la aplicación no necesita Internet**, después de disponer de Python con `venv` y `pip`. SQLite viene con Python. No necesitas Node.js, MongoDB, MySQL ni claves de servicios externos.

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

En el primer inicio se crea `.venv`, se instalan las dependencias incluidas, se crea la base de datos y se preparan las cuentas de prueba. Los siguientes inicios conservan tus cambios.

Abre **http://127.0.0.1:8000** en tu navegador. Mantén la terminal abierta mientras uses la plataforma. Para detenerla, presiona **Ctrl+C**.

## 4. Entrar al campus

En la pantalla de acceso hay botones para probar cada rol. Las cuentas son:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Estudiante | estudiante@luma.demo | LumaDemo2026! |
| Profesor | profe@luma.demo | LumaDemo2026! |
| Administrador | admin@luma.demo | LumaDemo2026! |

Prueba este recorrido:

1. Estudiante → Mis tareas → Abrir actividad → escribe una respuesta → Entregar.
2. Cambiar de cuenta → Profesor → Actividades → Revisar → califica la entrega.
3. Estudiante → Calificaciones → consulta la nota y los comentarios.
4. Envía un mensaje al profesor; cambia a su cuenta para responder.
5. Administrador → Administración → crea una persona o un aula. Para matricular estudiantes, abre el aula → Personas → Gestionar matrículas.

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

Se incluyen **52 pruebas** del servidor. No necesitas Node.js para ejecutar la aplicación ni sus pruebas de Python.

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

Este paquete permite ejecutar y probar el campus localmente. Para ponerlo en Internet, consulta la sección Publicación del README y configura un servidor Python con HTTPS. Las cuentas de prueba son para demostración.

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
