# Demo 2.3 — Alumno relacionado con Grupo

`Alumno.grupoId` es la única relación académica persistida por Alumnos. Grupo,
Grado y CicloEscolar se derivan al serializar mediante los modelos existentes.

## Reglas de inscripción y edición

- Las nuevas inscripciones requieren Grupo Activo dentro del CicloEscolar
  efectivo Activo.
- Preinscripción para ciclos en planeación queda fuera del alcance de Demo 2.3.
- La edición ordinaria solo permite reasignar entre grupos activos del mismo
  ciclo activo.
- La asignación de un alumno de ciclo finalizado es histórica y no se modifica;
  sus datos personales sí pueden corregirse.
- Dar de baja cambia el estado del alumno y conserva `grupoId`.

## Compatibilidad e importación

Los filtros `grado` y `grupo` se mantienen temporalmente como compatibilidad,
pero se resuelven contra relaciones. Los filtros principales son `grupoId`,
`gradoId`, `cicloEscolarId`, `estado` y `search`.

La plantilla de importación conserva las columnas visibles `grado` y `grupo` y
agrega `cicloEscolarId`. La validación solo produce un registro con `grupoId`
cuando la coincidencia es inequívoca y corresponde al ciclo activo; una
coincidencia ambigua o histórica se rechaza para revisión.

## Dependencias revisadas

- Asistencias solo usa identidad y estado en backend; su frontend adapta los
  objetos académicos serializados a etiquetas visibles.
- Calificaciones deriva sus etiquetas desde el Grado y Grupo relacionados al
  crear una calificación; su CRUD no cambia.
- `Grupo.alumnosActuales` conserva los valores agregados de demostración. No se
  recalcula con los cinco alumnos seed ni se usa un conteo incompleto para
  bloquear altas.

Pendiente: unificar `alumnosActuales` con la matrícula real cuando exista
persistencia o un dataset completo que permita validar capacidad sin perder la
intención de los datos demo.
