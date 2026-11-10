
const { leerExcel } = require('../utils/excel.parser');

// FUNCIÓN GENERAL PARA VALIDAR ARCHIVOS
// ==================================================

// Recibe el archivo y ejecuta la validación correspondiente.
function procesarValidacion(validar, entidad) {
  return (req, res) => {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        mensaje: 'No se seleccionó ningún archivo.'
      });
    }

    const extension = req.file.originalname
      .split('.')
      .pop()
      .toLowerCase();

    if (!['xlsx', 'csv'].includes(extension)) {
      return res.status(400).json({
        success: false,
        mensaje: 'Solo se permiten archivos Excel (.xlsx) o CSV.'
      });
    }

    try {
      // Lee los registros del archivo
      const registros = leerExcel(req.file.buffer);

      // Valida sin guardar información
      const resultado = validar(registros);

      return res.status(200).json({
        success: true,
        mensaje: `Validación de ${entidad} finalizada.`,
        ...resultado
      });

    } catch (error) {
      console.error(`Error al validar ${entidad}:`, error);

      return res.status(400).json({
        success: false,
        mensaje: `No se pudo procesar el archivo de ${entidad}.`
      });
    }
  };
}

// FUNCIÓN GENERAL PARA CONFIRMAR IMPORTACIONES
// ==================================================

function procesarConfirmacion(validar, registrar, entidad) {
  return (req, res) => {
    const registros = req.body?.validos;

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({
        success: false,
        mensaje: `No se recibieron ${entidad} para importar.`
      });
    }

    try {
      // Valida nuevamente antes de guardar
      const resultado = validar(registros);

      if (resultado.totalErrores > 0) {
        return res.status(400).json({
          success: false,
          mensaje: 'La importación contiene registros inválidos.',
          ...resultado
        });
      }

      const importados = [];

      // Registra los datos mediante el servicio correspondiente
      for (const registro of resultado.validos) {
        const nuevo = registrar(registro);
        importados.push(nuevo);
      }

      return res.status(201).json({
        success: true,
        mensaje: `Importación de ${entidad} finalizada correctamente.`,
        totalImportados: importados.length,
        [entidad]: importados
      });

    } catch (error) {
      return res.status(error.statusCode || 500).json({
        success: false,
        mensaje: error.message
      });
    }
  };
}


 // PLANTILLAS OFICIALES
 // ==================================================

 // Encabezados requeridos para cada entidad
const plantillas = {
  alumnos: [
    'matricula', 'nombre', 'fechaNacimiento',
    'grado', 'grupo', 'tutor'
  ],

  profesores: [
    'nombre', 'puesto', 'correo', 'cedula', 'estado'
  ],

  grados: [
    'nombre', 'nivel', 'ciclo'
  ],

  grupos: [
    'gradoId', 'nombre', 'grupoLetra', 'clave',
    'aula', 'edificio', 'turno', 'profesorId',
    'alumnosMax', 'estado'
  ],

  materias: [
    'codigo', 'nombre', 'claveSep', 'cargaHoraria',
    'gradoId', 'gruposAsignados', 'profesorId',
    'estado', 'isTroncoComun'
  ]
};

// DESCARGAR PLANTILLAS
// ==================================================

function descargarPlantilla(req, res) {
  const entidad = req.params.entidad.toLowerCase();
  const encabezados = plantillas[entidad];

  // Comprueba que exista la plantilla solicitada
  if (!encabezados) {
    return res.status(404).json({
      success: false,
      mensaje: 'No existe una plantilla para esta entidad.'
    });
  }

  // Genera el CSV con los encabezados oficiales
  const csv = '\uFEFF' + encabezados.join(',') + '\r\n';

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="plantilla_${entidad}.csv"`
  );

  return res.status(200).send(csv);
}

// Permite utilizar estas funciones desde las rutas
module.exports = {
  procesarValidacion,
  procesarConfirmacion,
  descargarPlantilla
};
