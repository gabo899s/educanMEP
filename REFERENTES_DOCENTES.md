# Referentes reales para el estudio docente de Luma

Revisión realizada el 10 de octubre de 2026. Se estudiaron patrones de funcionamiento; la implementación de Luma es propia y no incorpora código ni dependencias de estos proyectos.

## Moodle: criterios, niveles y conversión de puntuación

[Implementación de rúbricas, Moodle 4.5](https://github.com/moodle/moodle/blob/215f44380bdc3ccf852a3a22e34f8423ff64033a/grade/grading/form/rubric/lib.php)

Moodle organiza la rúbrica por criterios y niveles. Cada nivel tiene una descripción y puntuación. Su cálculo puede usar una base de cero o ajustar el rango mínimo/máximo. También contempla cómo los cambios de criterios y niveles afectan evaluaciones previas.

Luma adopta criterios con descripciones y niveles de logro, exige un nivel de cero por criterio y convierte proporcionalmente el total a los puntos de la actividad. Guarda las selecciones y comentarios. Protege la configuración cuando hay borradores o entregas para conservar la interpretación de las respuestas y notas.

## Canvas: biblioteca y evaluación por criterio

[Controlador de rúbricas de Canvas](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/app/controllers/rubrics_controller.rb)

Canvas maneja criterios, descripciones, niveles con puntos y asociaciones entre rúbricas y actividades. Distingue la definición de la rúbrica y su uso en la evaluación.

Luma ofrece una biblioteca privada con creación, edición, duplicación y eliminación. La actividad recibe una copia independiente de la plantilla. El profesor selecciona niveles y deja comentarios por criterio; el servidor calcula la nota. Editar la biblioteca no modifica actividades existentes.

## JSON Forms: campos validados y reglas condicionales

[Modelo de reglas de JSON Forms](https://github.com/eclipsesource/jsonforms/blob/0b1cb5456909f81c35062c97e5f638572acae149/packages/core/src/models/uischema.ts)

JSON Forms separa datos, controles y reglas: una condición puede mostrar, ocultar, habilitar o deshabilitar elementos. La validación se deriva del esquema.

Luma incorpora cinco tipos de campo, obligatoriedad y límites numéricos. La condición «mostrar cuando» depende de una opción o casilla anterior; esto impide referencias circulares. La vista del estudiante y el servidor aplican la misma regla. Los campos ocultos se desactivan, no son obligatorios y sus respuestas se excluyen. Los borradores pueden estar incompletos, pero la entrega debe completar los campos visibles obligatorios.

## Adaptación al diseño y a la arquitectura existentes

- Paleta crema, lavanda, rosa y salvia, flores, tarjetas suaves y editores por secciones con vista previa.
- Django, SQLite y JavaScript del paquete actual; instalación offline conservada.
- Biblioteca y preferencias privadas del docente, alcance de aulas y autorización en servidor.
- Las notas heredadas mantienen la calificación directa. Las opciones nuevas son optativas por actividad.
- Los campos inteligentes usan reglas configuradas por el profesor. No se añadió generación con IA ni conexión oficial con Moodle, Canvas o Google Classroom.
