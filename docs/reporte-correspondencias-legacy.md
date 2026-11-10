# Reporte de posibles correspondencias legacy

No se aplicó ninguna relación automática. Los nombres se muestran únicamente como indicios y nunca como llave foránea.

| Profesor histórico | Usuario/Rol posible | Rol actual | Cédula | Confianza | Decisión |
|---|---|---|---|---|---|
| Profra. Carmen Salinas | Usuario 2, Profra. Carmen Salinas | Directivos | DOC-2018-042 | Caso especial | Mantener ambos registros sin relación automática y sin cambiar el rol. |
| Profra. Elena Garro | Usuario 4, Profra. Elena Garro | Profesores | DOC-2019-018 | Alta por nombre | Revisión humana requerida. |
| Prof. Roberto Carlos Valdés | Usuario 3, Prof. Roberto Carlos Valdés | Profesores | DOC-2021-095 | Alta por nombre | Revisión humana requerida. |
| Profra. Gabriela Mistral | Usuario 5, Profra. Gabriela Mistral | Profesores | DOC-2016-011 | Media; existen variantes en otros catálogos | Revisión humana requerida. |
| Prof. Alfonso Reyes Ochoa | Usuario 6, Prof. Alfonso Reyes | Profesores | DOC-2022-073 | Media; nombres diferentes | No relacionar automáticamente. |
| Profra. Sofía Ramírez | Usuario 7, Profra. Sofía Ramírez | Profesores | DOC-2020-031 | Alta por nombre | Revisión humana requerida. |
| Prof. Miguel Ángel Torres | Usuario 8, Prof. Miguel Ángel Torres | Profesores | DOC-2017-088 | Alta por nombre | Revisión humana requerida. |

`usuario_id` permanece nullable y todos los profesores existentes comienzan con `usuarioId: null`. Los profesores nuevos creados desde Usuarios/Roles sí requieren una relación explícita.
