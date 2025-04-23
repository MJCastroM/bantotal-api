'use strict'

/**
 * @swagger
 * tags:
 *   name: Sistemas
 *   description: API para la gestión de Tablas
 */

const Env = use('Env')
const connection = Env.get('DB_CONNECTION', 'mssql')

const Tabla = use('App/Models/Tabla')
const { MongoClient } = require("mongodb")
// Declaramos la URI de MongoDB para reutilizarla en los endpoints Mongo
const MONGO_URI = "mongodb+srv://marcoscastro0827:30Iq20vHTSLG4Ypc@cluster0.fberodi.mongodb.net/?appName=Cluster0";

class TablaController {
  /**
   * @swagger
   * /api/v1/Tablas:
   *   get:
   *     summary: Obtener la lista de Tablas
   *     tags: [Tablas]
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
   *         description: Término de búsqueda
   *         required: false
   *         type: string
   *       - name: sortBy
   *         in: query
   *         description: Campo por el cual ordenar
   *         required: false
   *         type: string
   *       - name: order
   *         in: query
   *         description: Orden (ascendente o descendente)
   *         required: false
   *         type: string
   *         enum: [asc, desc]
   *     responses:
   *       200:
   *         description: Lista de Tablas paginada
   */
  async index({ request, response }) {
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Tablas = database.collection('tablas');

       // Parámetros de paginación y ordenación
      const page = parseInt(request.input('page', 1));
      const limit = parseInt(request.input('limit', 10));
      const sortBy = request.input('sortBy', 'id');
      const order = request.input('order', 'asc');
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

      // Obtener el parámetro "search" esperando un JSON válido.
      const rawSearch = request.input('search', '{}'); // Por defecto un objeto vacío
      let filter = {};
      try {
        filter = JSON.parse(rawSearch);
        if (typeof filter !== 'object' || filter === null) {
          // Si el parseo resulta en algo que no sea un objeto, usamos un filtro vacío
          filter = {};
        }
      } catch (e) {
        // Si no se puede parsear, podemos optar por retornar un error o usar filtro vacío.
        console.error("Error parsing 'search' filter, debe ser un JSON válido:", e);
        // Para retornar error:
        // return response.status(400).json({ error: 'El parámetro search debe ser un JSON válido' });
        // O, alternativamente, usar un filtro vacío:
        filter = {};
      }

      // Realizar la consulta usando el filtro recibido
      const total = await Tablas.countDocuments(filter);
      const cursor = Tablas.find(filter)
                              .sort(sort)
                              .skip(skip)
                              .limit(limit);
        const TablasRes = await cursor.toArray();
        const totalPages = Math.ceil(total / limit);

        return response.json({
          data: TablasRes,
          meta: { total, page, limit, totalPages }
        });
      } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Error en la consulta a MongoDB' });
      } finally {
        await client.close();
      }
    } else {
      // Lógica para conexión SQL/ORM
      const page = request.input('page', 1);
      const limit = request.input('limit', 10);
      const search = request.input('search', '');
      const sortBy = request.input('sortBy', 'id');
      const order = request.input('order', 'asc');

      let query = Tabla.query();

      if (search) {
        query.where('codigo', 'LIKE', `%${search}%`)
             .orWhere('descripcion', 'LIKE', `%${search}%`);
      }

      query.orderBy(sortBy, order);
      const TablasRes = await query.paginate(page, limit);
      return response.json(TablasRes);
    }
  }

  /**
   * @swagger
   * /api/v1/Tablas/{id}:
   *   get:
   *     summary: Obtener un Tabla por ID
   *     tags: [Tablas]
   *     parameters:
   *       - name: id
   *         in: path
   *         description: ID del Tabla
   *         required: true
   *         type: integer
   *     responses:
   *       200:
   *         description: Datos del Tabla
   */
  async show({ params, response }) {
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Tablas = database.collection('Tablas');
        // Se asume que los documentos tienen un campo "id" que coincide con params.id.
        const Tabla = await Tablas.findOne({ id: params.id });
        return response.json(Tabla);
      } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Error en la consulta a MongoDB' });
      } finally {
        await client.close();
      }
    } else {
      const Tabla = await Tabla.find(params.id);
      return response.json(Tabla);
    }
  }

  /**
   * @swagger
   * /api/v1/Tablas:
   *   post:
   *     summary: Crear un Tabla
   *     tags: [Tablas]
   *     parameters:
   *       - name: descripcion
   *         in: query
   *         description: Descripción del Tabla
   *         required: true
   *         type: string
   *       - name: codigo
   *         in: query
   *         description: Código del Tabla
   *         required: true
   *         type: string
   *     responses:
   *       201:
   *         description: Tabla creado
   */
  async store({ request, response }) {
    const data = request.only(['codigo', 'descripcion']);
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Tablas = database.collection('Tablas');
        const result = await Tablas.insertOne(data);
        data._id = result.insertedId;
        return response.status(201).json(data);
      } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Error al insertar en MongoDB' });
      } finally {
        await client.close();
      }
    } else {
      const Tabla = await Tabla.create(data);
      return response.status(201).json(Tabla);
    }
  }

  /**
   * @swagger
   * /api/v1/Tablas/{id}:
   *   put:
   *     summary: Actualizar un Tabla
   *     tags: [Tablas]
   *     parameters:
   *       - name: id
   *         in: path
   *         description: ID del Tabla
   *         required: true
   *         type: integer
   *       - name: codigo
   *         in: query
   *         description: Código del Tabla
   *         required: true
   *         type: string
   *       - name: descripcion
   *         in: query
   *         description: Descripción del Tabla
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: Tabla actualizado
   */
  async update({ params, request, response }) {
    const data = request.only(['codigo', 'descripcion']);
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Tablas = database.collection('Tablas');
        // Se asume que los documentos tienen un campo "id" que coincide con params.id.
        const result = await Tablas.findOneAndUpdate(
          { id: params.id },
          { $set: data },
          { returnDocument: 'after' }
        );
        return response.json(result.value);
      } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Error al actualizar en MongoDB' });
      } finally {
        await client.close();
      }
    } else {
      const Tabla = await Tabla.find(params.id);
      Tabla.merge(data);
      await Tabla.save();
      return response.json(Tabla);
    }
  }

  /**
   * @swagger
   * /api/v1/Tablas/{id}:
   *   delete:
   *     summary: Eliminar un Tabla
   *     tags: [Tablas]
   *     parameters:
   *       - name: id
   *         in: path
   *         description: ID del Tabla a eliminar
   *         required: true
   *         type: integer
   *     responses:
   *       204:
   *         description: Tabla eliminado correctamente
   */
  async destroy({ params, response }) {
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Tablas = database.collection('Tablas');
        await Tablas.deleteOne({ id: params.id });
        return response.status(204).json(null);
      } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Error al eliminar en MongoDB' });
      } finally {
        await client.close();
      }
    } else {
      const Tabla = await Tabla.find(params.id);
      await Tabla.delete();
      return response.status(204).json(null);
    }
  }
}

module.exports = TablaController;
