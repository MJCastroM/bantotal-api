'use strict'

/**
 * @swagger
 * tags:
 *   name: Sistemas
 *   description: API para la gestión de Atributos
 */

const Env = use('Env')
const connection = Env.get('DB_CONNECTION', 'mssql')

const Atributo = use('App/Models/Atributo')
const { MongoClient } = require("mongodb")
// Declaramos la URI de MongoDB para reutilizarla en los endpoints Mongo
const MONGO_URI = "mongodb+srv://marcoscastro0827:30Iq20vHTSLG4Ypc@cluster0.fberodi.mongodb.net/?appName=Cluster0";

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
   *         description: Lista de Atributos paginada
   */
  async index({ request, response }) {
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Atributos = database.collection('atributos');

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
      const total = await Atributos.countDocuments(filter);
      const cursor = Atributos.find(filter)
                              .sort(sort)
                              .skip(skip)
                              .limit(limit);
        const AtributosRes = await cursor.toArray();
        const totalPages = Math.ceil(total / limit);

        return response.json({
          data: AtributosRes,
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

      let query = Atributo.query();

      if (search) {
        query.where('nombre', 'LIKE', `%${search}%`)
             .orWhere('campo', 'LIKE', `%${search}%`);
      }

      query.orderBy(sortBy, order);
      const AtributosRes = await query.paginate(page, limit);
      return response.json(AtributosRes);
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
   *         description: ID del Atributo
   *         required: true
   *         type: integer
   *     responses:
   *       200:
   *         description: Datos del Atributo
   */
  async show({ params, response }) {
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Atributos = database.collection('atributos');
        // Se asume que los documentos tienen un campo "id" que coincide con params.id.
        const Atributo = await Atributos.findOne({ id: params.id });
        return response.json(Atributo);
      } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Error en la consulta a MongoDB' });
      } finally {
        await client.close();
      }
    } else {
      const Atributo = await Atributo.find(params.id);
      return response.json(Atributo);
    }
  }

  /**
   * @swagger
   * /api/v1/Atributos:
   *   post:
   *     summary: Crear un Atributo
   *     tags: [Atributos]
   *     parameters:
   *       - name: descripcion
   *         in: query
   *         description: Descripción del Atributo
   *         required: true
   *         type: string
   *       - name: codigo
   *         in: query
   *         description: Código del Atributo
   *         required: true
   *         type: string
   *     responses:
   *       201:
   *         description: Atributo creado
   */
  async store({ request, response }) {
    const data = request.only(['codigo', 'descripcion']);
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Atributos = database.collection('atributos');
        const result = await Atributos.insertOne(data);
        data._id = result.insertedId;
        return response.status(201).json(data);
      } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Error al insertar en MongoDB' });
      } finally {
        await client.close();
      }
    } else {
      const Atributo = await Atributo.create(data);
      return response.status(201).json(Atributo);
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
   *         description: ID del Atributo
   *         required: true
   *         type: integer
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
    const data = request.only(['codigo', 'descripcion']);
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Atributos = database.collection('atributos');
        // Se asume que los documentos tienen un campo "id" que coincide con params.id.
        const result = await Atributos.findOneAndUpdate(
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
      const Atributo = await Atributo.find(params.id);
      Atributo.merge(data);
      await Atributo.save();
      return response.json(Atributo);
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
   *         description: ID del Atributo a eliminar
   *         required: true
   *         type: integer
   *     responses:
   *       204:
   *         description: Atributo eliminado correctamente
   */
  async destroy({ params, response }) {
    if (connection === 'mongodb') {
      const client = new MongoClient(MONGO_URI);
      try {
        await client.connect();
        const database = client.db('marcos');
        const Atributos = database.collection('atributos');
        await Atributos.deleteOne({ id: params.id });
        return response.status(204).json(null);
      } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Error al eliminar en MongoDB' });
      } finally {
        await client.close();
      }
    } else {
      const Atributo = await Atributo.find(params.id);
      await Atributo.delete();
      return response.status(204).json(null);
    }
  }
}

module.exports = AtributoController;
