
const XLSX = require('xlsx');


function convertirFecha(valor) {

  if (typeof valor === 'number') {
    const fecha = XLSX.SSF.parse_date_code(valor);

    if (fecha) {
      const anio = fecha.y;
      const mes = String(fecha.m).padStart(2, '0');
      const dia = String(fecha.d).padStart(2, '0');

      return `${anio}-${mes}-${dia}`;
    }
  }

  // Fechas que llegan como objetos Date
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const anio = valor.getUTCFullYear();
    const mes = String(valor.getUTCMonth() + 1).padStart(2, '0');
    const dia = String(valor.getUTCDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  const texto = String(valor ?? '').trim();

  // Conserva fechas que ya están en formato AAAA-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto;
  }

  // Convierte fechas DD/MM/AAAA
  const partes = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (partes) {
    const dia = partes[1].padStart(2, '0');
    const mes = partes[2].padStart(2, '0');
    const anio = partes[3];

    return `${anio}-${mes}-${dia}`;
  }

 
  return texto;
}


function leerExcel(buffer) {

  const libro = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: false,
    raw: true
  });

  // Obtiene la primera hoja del archivo
  const nombreHoja = libro.SheetNames[0];

  if (!nombreHoja) {
    throw new Error('El archivo no contiene hojas.');
  }

  const hoja = libro.Sheets[nombreHoja];

  const registros = XLSX.utils.sheet_to_json(hoja, {
    defval: '',
    raw: true
  });

  // Limpia los encabezados y normaliza las fechas
  return registros.map(registro => {
    const datos = {};

    for (const [campo, valor] of Object.entries(registro)) {
      datos[campo.trim()] = valor;
    }

    if (Object.prototype.hasOwnProperty.call(datos, 'fechaNacimiento')) {
      datos.fechaNacimiento = convertirFecha(datos.fechaNacimiento);
    }

    return datos;
  });
}

// Exporta la función utilizada por el controlador
module.exports = { leerExcel };
