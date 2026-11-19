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
  constructor() {
    this.pendingWrites = new Set();
    this.lastHydratedAt = 0;
  }

  _track(promise) {
    this.pendingWrites.add(promise);
    this.lastHydratedAt = 0;
    promise.finally(() => {
      this.pendingWrites.delete(promise);
      this.lastHydratedAt = 0;
    });
    return promise;
  }

  async flushPendingWrites() {
    if (this.pendingWrites.size > 0) {
      await Promise.allSettled([...this.pendingWrites]);
    }
  }

  async persist(collectionKey, document) {
    const status = getDBStatus();
    if (!status.isConnected || !modelMap[collectionKey]) return;

    const op = (async () => {
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
    })();

    return this._track(op);
  }

  async remove(collectionKey, id) {
    const status = getDBStatus();
    if (!status.isConnected || !modelMap[collectionKey]) return;

    const op = (async () => {
      try {
        const { model } = modelMap[collectionKey];
        const candidates = [id, String(id)];
        const numId = Number(id);
        if (!Number.isNaN(numId)) {
          candidates.push(numId);
        }
        await model.deleteMany({ id: { $in: candidates } });
      } catch (err) {
        console.warn(`[MongoSync] Error al eliminar en ${collectionKey}:`, err.message);
      }
    })();

    return this._track(op);
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

  async hydrateModels(models, options = {}) {
    const status = getDBStatus();
    if (!status.isConnected || !models) return;

    await this.flushPendingWrites();

    const now = Date.now();
    if (!options.force && this.lastHydratedAt && now - this.lastHydratedAt < 1500) {
      return;
    }

    try {
      const [
        rolesDocs,
        profesoresDocs,
        ciclosDocs,
        gradosDocs,
        gruposDocs,
        materiasDocs,
        alumnosDocs,
        asistenciasDocs,
        calificacionesDocs,
      ] = await Promise.all([
        models.rolesModel ? this.loadFromMongo('roles') : Promise.resolve(null),
        models.profesoresModel ? this.loadFromMongo('profesores') : Promise.resolve(null),
        models.ciclosModel ? this.loadFromMongo('ciclos_escolares') : Promise.resolve(null),
        models.gradosModel ? this.loadFromMongo('grados') : Promise.resolve(null),
        models.gruposModel ? this.loadFromMongo('grupos') : Promise.resolve(null),
        models.materiasModel ? this.loadFromMongo('materias') : Promise.resolve(null),
        models.alumnosModel ? this.loadFromMongo('alumnos') : Promise.resolve(null),
        models.asistenciasModel ? this.loadFromMongo('asistencias') : Promise.resolve(null),
        models.calificacionesModel ? this.loadFromMongo('calificaciones') : Promise.resolve(null),
      ]);

      if (models.rolesModel && Array.isArray(rolesDocs)) {
        models.rolesModel.roles = rolesDocs;
      }
      if (models.profesoresModel && Array.isArray(profesoresDocs)) {
        models.profesoresModel.profesores = profesoresDocs;
      }
      if (models.ciclosModel && Array.isArray(ciclosDocs)) {
        models.ciclosModel.ciclos = ciclosDocs;
      }
      if (models.gradosModel && Array.isArray(gradosDocs)) {
        models.gradosModel.grados = gradosDocs;
      }
      if (models.gruposModel && Array.isArray(gruposDocs)) {
        models.gruposModel.grupos = gruposDocs;
      }
      if (models.materiasModel && Array.isArray(materiasDocs)) {
        models.materiasModel.materias = materiasDocs;
      }
      if (models.alumnosModel && Array.isArray(alumnosDocs)) {
        models.alumnosModel.alumnos = alumnosDocs;
      }
      if (models.asistenciasModel && Array.isArray(asistenciasDocs)) {
        models.asistenciasModel.asistencias = asistenciasDocs;
      }
      if (models.calificacionesModel && Array.isArray(calificacionesDocs)) {
        models.calificacionesModel.calificaciones = calificacionesDocs;
      }
      this.lastHydratedAt = Date.now();
    } catch (err) {
      console.warn('[MongoSync] Error durante hydrateModels:', err.message);
    }
  }
}

module.exports = new MongoSyncService();
