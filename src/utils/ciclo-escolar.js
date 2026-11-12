const ESTADOS_CICLO = Object.freeze({
  PLANEACION: 'Planeacion',
  ACTIVO: 'Activo',
  FINALIZADO: 'Finalizado'
});

function fechaLocalISO(fecha = new Date()) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function esFechaISO(valor) {
  const texto = String(valor || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const fecha = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === texto;
}

function determinarEstadoCiclo(fechaInicio, fechaFin, referencia = new Date()) {
  const hoy = referencia instanceof Date ? fechaLocalISO(referencia) : String(referencia);
  if (hoy < fechaInicio) return ESTADOS_CICLO.PLANEACION;
  if (hoy > fechaFin) return ESTADOS_CICLO.FINALIZADO;
  return ESTADOS_CICLO.ACTIVO;
}

function seSolapan(inicioA, finA, inicioB, finB) {
  return inicioA <= finB && inicioB <= finA;
}

module.exports = {
  ESTADOS_CICLO,
  determinarEstadoCiclo,
  esFechaISO,
  fechaLocalISO,
  seSolapan
};
