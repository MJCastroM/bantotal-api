'use strict'

/**
 * @swagger
 * tags:
 *   name: Atributos
 *   description: API para la gestión de Atributos
 */

const Env = use('Env')
const connection = Env.get('DB_CONNECTION', 'mssql')

// Renombrado para evitar sombras
const AtributoModel = use('App/Models/Atributo')

// === Mongo helpers ===
const { MongoClient, ObjectId } = require('mongodb')
const MONGO_URI         = Env.get('MONGO_URI') || 'mongodb://localhost:27017'
const MONGO_DB_NAME     = Env.get('MONGO_DB', 'marcos')
const MONGO_COLLECTION  = Env.get('MONGO_COLLECTION', 'Atributos')

// Cliente Mongo singleton (reutiliza conexiones)
let __mongoClient = null
async function getMongo() {
  if (!__mongoClient) {
    __mongoClient = new MongoClient(MONGO_URI, { maxPoolSize: 10 })
    await __mongoClient.connect()
  } else if (!__mongoClient.topology || __mongoClient.topology.isClosed()) {
    // reconectar si se cerró
    await __mongoClient.connect()
  }
  const db = __mongoClient.db(MONGO_DB_NAME)
  const col = db.collection(MONGO_COLLECTION)
  return { client: __mongoClient, db, col }
}

// Whitelists
const ALLOWED_SORT_FIELDS = new Set(['_id', 'codigo', 'descripcion'])
// Nota: ampliá esta lista si querés filtrar por más campos vía `search`
const ALLOWED_FILTER_FIELDS = new Set(['codigo', 'descripcion'])

// Sanitiza el filtro recibido para evitar abusos
function sanitizeFilter(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (!ALLOWED_FILTER_FIELDS.has(k)) continue
    if (v == null) continue
    // Permitimos string/number/bool; si viene "/texto/i" lo interpretamos como regex
    if (typeof v === 'string') {
      const m = v.match(/^\/(.+)\/(i)?$/)
      if (m) {
        out[k] = { $regex: m[1], $options: m[2] || '' }
      } else {
        out[k] = v
      }
    } else if (['number', 'boolean'].includes(typeof v)) {
      out[k] = v
    }
  }
  return out
}

class AtributoController {
  /**
   * @swagger
   * /api/v1/Atributos:
   *   get:
   *     summary: Obtener la lista de Atributos
   *     tags: [Atributos]
   *     parameters:
   *       - name: page
   *         in: query
   *         description: Número de página
   *         required: false
   *         type: integer
   *       - name: limit
   *         in: query
   *         description: Cantidad de registros por página
   *         required: false
   *         type: integer
   *       - name: search
   *         in: query
   *         description: JSON de filtro. Ej: {"descripcion":"/foo/i"}
   *         required: false
   *         type: string
   *       - name: sortBy
   *         in: query
   *         description: Campo por el cual ordenar (permitidos: _id,codigo,descripcion)
   *         required: false
   *         type: string
   *       - name: order
   *         in: query
   *         description: Orden (asc o desc)
   *         required: false
   *         type: string
   *         enum: [asc, desc]
   *     responses:
   *       200:
   *         description: Lista de Atributos paginada
   */
  async index({ request, response }) {
    if (connection === 'mongodb') {
      try {
        const { col } = await getMongo()

        // Paginación/orden
        const page   = parseInt(request.input('page', 1), 10)
        const limit  = Math.max(parseInt(request.input('limit', 10), 10), 1)
        const skip   = (page - 1) * limit

        let sortBy   = request.input('sortBy', '_id')
        if (!ALLOWED_SORT_FIELDS.has(sortBy)) sortBy = '_id'
        const order  = request.input('order', 'asc') === 'desc' ? -1 : 1
        const sort   = { [sortBy]: order }

        // Filtro (JSON)
        const rawSearch = request.input('search', '{}')
        let filterParsed = {}
        try {
          filterParsed = JSON.parse(rawSearch)
        } catch (e) {
          // Si no es JSON válido, filtro vacío (no 400 para ser más tolerante)
          filterParsed = {}
        }
        const filter = sanitizeFilter(filterParsed)

        const total  = await col.countDocuments(filter)
        const cursor = col.find(filter).sort(sort).skip(skip).limit(limit)
        const data   = await cursor.toArray()
        const totalPages = Math.ceil(total / limit) || 1

        return response.json({ data, meta: { total, page, limit, totalPages } })
      } catch (error) {
        console.error(error)
        return response.status(500).json({ error: 'Error en la consulta a MongoDB' })
      }
    } else {
      // SQL/ORM
      const page  = request.input('page', 1)
      const limit = request.input('limit', 10)
      const search = request.input('search', '')
      const sortBy = request.input('sortBy', 'id')
      const order  = request.input('order', 'asc') === 'desc' ? 'desc' : 'asc'

      let query = AtributoModel.query()
      if (search) {
        query.where('nombre', 'LIKE', `%${search}%`)
             .orWhere('campo', 'LIKE', `%${search}%`)
      }

      query.orderBy(sortBy, order)
      const res = await query.paginate(page, limit)
      return response.json(res)
    }
  }

  /**
   * @swagger
   * /api/v1/Atributos/{id}:
   *   get:
   *     summary: Obtener un Atributo por ID
   *     tags: [Atributos]
   *     parameters:
   *       - name: id
   *         in: path
   *         description: ID del Atributo (Mongo: _id)
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Datos del Atributo
   */
  async show({ params, response }) {
    if (connection === 'mongodb') {
      try {
        const { col } = await getMongo()

        if (!ObjectId.isValid(params.id)) {
          return response.status(400).json({ error: 'id inválido' })
        }
        const _id = new ObjectId(params.id)
        const doc = await col.findOne({ _id })
        if (!doc) return response.status(404).json({ error: 'No encontrado' })
        return response.json(doc)
      } catch (error) {
        console.error(error)
        return response.status(500).json({ error: 'Error en la consulta a MongoDB' })
      }
    } else {
      const item = await AtributoModel.find(params.id)
      if (!item) return response.status(404).json({ error: 'No encontrado' })
      return response.json(item)
    }
  }

  /**
   * @swagger
   * /api/v1/Atributos:
   *   post:
   *     summary: Crear un Atributo
   *     tags: [Atributos]
   *     parameters:
   *       - name: codigo
   *         in: query
   *         description: Código del Atributo
   *         required: true
   *         type: string
   *       - name: descripcion
   *         in: query
   *         description: Descripción del Atributo
   *         required: true
   *         type: string
   *     responses:
   *       201:
   *         description: Atributo creado
   */
  async store({ request, response }) {
    const data = request.only(['codigo', 'descripcion'])
    if (connection === 'mongodb') {
      try {
        const { col } = await getMongo()
        const result = await col.insertOne(data)
        return response.status(201).json({ _id: result.insertedId, ...data })
      } catch (error) {
        console.error(error)
        return response.status(500).json({ error: 'Error al insertar en MongoDB' })
      }
    } else {
      const item = await AtributoModel.create(data)
      return response.status(201).json(item)
    }
  }

  /**
   * @swagger
   * /api/v1/Atributos/{id}:
   *   put:
   *     summary: Actualizar un Atributo
   *     tags: [Atributos]
   *     parameters:
   *       - name: id
   *         in: path
   *         description: ID del Atributo (Mongo: _id)
   *         required: true
   *         type: string
   *       - name: codigo
   *         in: query
   *         description: Código del Atributo
   *         required: true
   *         type: string
   *       - name: descripcion
   *         in: query
   *         description: Descripción del Atributo
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Atributo actualizado
   */
  async update({ params, request, response }) {
    const data = request.only(['codigo', 'descripcion'])
    if (connection === 'mongodb') {
      try {
        const { col } = await getMongo()

        if (!ObjectId.isValid(params.id)) {
          return response.status(400).json({ error: 'id inválido' })
        }
        const _id = new ObjectId(params.id)
        const result = await col.findOneAndUpdate(
          { _id },
          { $set: data },
          { returnDocument: 'after' }
        )
        if (!result.value) return response.status(404).json({ error: 'No encontrado' })
        return response.json(result.value)
      } catch (error) {
        console.error(error)
        return response.status(500).json({ error: 'Error al actualizar en MongoDB' })
      }
    } else {
      const item = await AtributoModel.find(params.id)
      if (!item) return response.status(404).json({ error: 'No encontrado' })
      item.merge(data)
      await item.save()
      return response.json(item)
    }
  }

  /**
   * @swagger
   * /api/v1/Atributos/{id}:
   *   delete:
   *     summary: Eliminar un Atributo
   *     tags: [Atributos]
   *     parameters:
   *       - name: id
   *         in: path
   *         description: ID del Atributo a eliminar (Mongo: _id)
   *         required: true
   *         type: string
   *     responses:
   *       204:
   *         description: Atributo eliminado correctamente
   */
  async destroy({ params, response }) {
    if (connection === 'mongodb') {
      try {
        const { col } = await getMongo()
        if (!ObjectId.isValid(params.id)) {
          return response.status(400).json({ error: 'id inválido' })
        }
        const _id = new ObjectId(params.id)
        const { deletedCount } = await col.deleteOne({ _id })
        if (!deletedCount) return response.status(404).json({ error: 'No encontrado' })
        return response.status(204).json(null)
      } catch (error) {
        console.error(error)
        return response.status(500).json({ error: 'Error al eliminar en MongoDB' })
      }
    } else {
      const item = await AtributoModel.find(params.id)
      if (!item) return response.status(404).json({ error: 'No encontrado' })
      await item.delete()
      return response.status(204).json(null)
    }
  }
}

module.exports = AtributoController
