const XLSX = require('xlsx');

// Convierte las fechas al formato AAAA-MM-DD
function convertirFecha(valor) {
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const anio = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  const texto = String(valor ?? '').trim();

  // Convierte fechas DD/MM/AAAA
  const partes = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (partes) {
    const dia = partes[1].padStart(2, '0');
    const mes = partes[2].padStart(2, '0');

    return `${partes[3]}-${mes}-${dia}`;
  }

  return texto;
}

// Lee archivos Excel y CSV
function leerExcel(buffer) {
  const libro = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true
  });

  const nombreHoja = libro.SheetNames[0];

  if (!nombreHoja) {
    throw new Error('El archivo no contiene hojas.');
  }

  const hoja = libro.Sheets[nombreHoja];

  const registros = XLSX.utils.sheet_to_json(hoja, {
    defval: '',
    raw: true
  });

  // Limpia espacios de encabezados y normaliza las fechas
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

module.exports = { leerExcel };