const { getDBStatus } = require('../config/database');
const {
  RolMongo,
  ProfesorMongo,
  CicloEscolarMongo,
  GradoMongo,
  GrupoMongo,
  MateriaMongo,
  AlumnoMongo,
  AsistenciaMongo,
  CalificacionMongo,
} = require('./schemas');

const modelMap = {
  roles: { model: RolMongo },
  profesores: { model: ProfesorMongo },
  ciclos_escolares: { model: CicloEscolarMongo },
  grados: { model: GradoMongo },
  grupos: { model: GrupoMongo },
  materias: { model: MateriaMongo },
  alumnos: { model: AlumnoMongo },
  asistencias: { model: AsistenciaMongo },
  calificaciones: { model: CalificacionMongo },
};

class MongoSyncService {
  async persist(collectionKey, document) {
    const status = getDBStatus();
    if (!status.isConnected || !modelMap[collectionKey]) return;

    try {
      const { model } = modelMap[collectionKey];
      const plainDoc = { ...document };
      delete plainDoc._id;

      await model.findOneAndUpdate(
        { id: plainDoc.id },
        { $set: plainDoc },
        { upsert: true, returnDocument: 'after' }
      );
    } catch (err) {
      console.warn(`[MongoSync] Error al persistir en ${collectionKey}:`, err.message);
    }
  }

  async remove(collectionKey, id) {
    const status = getDBStatus();
    if (!status.isConnected || !modelMap[collectionKey]) return;

    try {
      const { model } = modelMap[collectionKey];
      await model.deleteOne({ id });
    } catch (err) {
      console.warn(`[MongoSync] Error al eliminar en ${collectionKey}:`, err.message);
    }
  }

  async getCollectionCounts() {
    const status = getDBStatus();
    if (!status.isConnected) return {};

    const counts = {};
    for (const [key, config] of Object.entries(modelMap)) {
      try {
        counts[key] = await config.model.countDocuments();
      } catch {
        counts[key] = 0;
      }
    }
    return counts;
  }

  async cleanAll() {
    const status = getDBStatus();
    if (!status.isConnected) return false;

    for (const config of Object.values(modelMap)) {
      await config.model.deleteMany({});
    }
    return true;
  }

  async loadFromMongo(collectionKey) {
    const status = getDBStatus();
    if (!status.isConnected || !modelMap[collectionKey]) return [];

    try {
      const { model } = modelMap[collectionKey];
      const docs = await model.find({}).lean();
      return docs.map(doc => {
        const { _id, createdAt, updatedAt, __v, ...rest } = doc;
        return rest;
      });
    } catch (err) {
      console.warn(`[MongoSync] Error al cargar ${collectionKey} de MongoDB:`, err.message);
      return [];
    }
  }

  async hydrateModels(models) {
    const status = getDBStatus();
    if (!status.isConnected || !models) return;

    try {
      if (models.rolesModel) {
        const docs = await this.loadFromMongo('roles');
        if (docs.length) models.rolesModel.roles = docs;
      }
      if (models.profesoresModel) {
        const docs = await this.loadFromMongo('profesores');
        if (docs.length) models.profesoresModel.profesores = docs;
      }
      if (models.ciclosModel) {
        const docs = await this.loadFromMongo('ciclos_escolares');
        if (docs.length) models.ciclosModel.ciclos = docs;
      }
      if (models.gradosModel) {
        const docs = await this.loadFromMongo('grados');
        if (docs.length) models.gradosModel.grados = docs;
      }
      if (models.gruposModel) {
        const docs = await this.loadFromMongo('grupos');
        if (docs.length) models.gruposModel.grupos = docs;
      }
      if (models.materiasModel) {
        const docs = await this.loadFromMongo('materias');
        if (docs.length) models.materiasModel.materias = docs;
      }
      if (models.alumnosModel) {
        const docs = await this.loadFromMongo('alumnos');
        if (docs.length) models.alumnosModel.alumnos = docs;
      }
      if (models.asistenciasModel) {
        const docs = await this.loadFromMongo('asistencias');
        if (docs.length) models.asistenciasModel.asistencias = docs;
      }
      if (models.calificacionesModel) {
        const docs = await this.loadFromMongo('calificaciones');
        if (docs.length) models.calificacionesModel.calificaciones = docs;
      }
    } catch (err) {
      console.warn('[MongoSync] Error durante hydrateModels:', err.message);
    }
  }
}

module.exports = new MongoSyncService();
