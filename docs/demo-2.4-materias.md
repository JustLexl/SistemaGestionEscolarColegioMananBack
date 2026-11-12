# Demo 2.4: Materias con relaciones reales

## Arquitectura

Materia persiste exclusivamente `id`, `codigo`, `nombre`, `claveSep`,
`cargaHoraria`, `grupoIds`, `profesorId`, `estado` e `isTroncoComun`.
`grupos`, `grados`, `cicloEscolar`, `profesor`, `cedula` y `gruposCount` se
derivan al serializar. No se almacena `cicloEscolarId`: todos los grupos deben
pertenecer al mismo ciclo, que constituye la única fuente de verdad.

Toda materia debe tener al menos un grupo. `profesorId` puede ser `null`
únicamente en Planeación; una materia del ciclo Activo requiere Profesor
activo. Las materias de ciclos Finalizados son de sólo lectura. En ciclo
Activo no se pueden cambiar grupos; en Planeación pueden cambiar dentro del
mismo ciclo. El borrado físico sólo se admite en Planeación.

## Migración de las 18 semillas

| Clasificación | Materias | Decisión |
|---|---|---|
| A. Relación inequívoca completa | 1, 2, 3, 4, 6, 7, 8, 14, 15, 16 | Se vincularon todos los grupos existentes. |
| B. Relación parcial | 5, 9, 10, 11, 12, 13 | Se conservaron sólo los grupos reales inequívocos. |
| C. Relación imposible original | 17, 18 | Se ajustaron explícitamente a un grupo real del mismo grado y ciclo para evitar materias huérfanas. |

Los grupos legacy inexistentes encontrados fueron `5° B`, `3° B`, `6° B` y
`2° C`. No se creó ningún Grupo para satisfacer Materias. Las diferencias
quedan comentadas junto a cada semilla.

`alumnosImpactados` y la multiplicación por 36 se eliminaron. Las métricas
expuestas son total, activas, en planeación, inactivas, Profesores asignados y
Grupos con Materias, todas derivadas de relaciones disponibles.

## Importación

Antes, la plantilla dependía de `gradoId` y `gruposAsignados` como texto.
Ahora incorpora `cicloEscolarId` y `grupoIds`. `grupoIds` es la entrada
preferida. La entrada legacy `gradoId` + `gruposAsignados` sigue aceptándose,
pero exige `cicloEscolarId`; cada etiqueta debe resolverse de forma única antes
de llegar al modelo. Nunca se persisten strings académicos.

## Estados y errores

- `grupoIds` inválido: 400.
- Grupo o Profesor inexistente: 404.
- Grupos de ciclos diferentes, ciclo Finalizado, Profesor inactivo o clave SEP duplicada: 409.
- Estados persistidos: `Activa`, `En planeacion`, `Inactiva`; la interfaz muestra `En planeación`.
