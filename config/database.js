'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */
const Env = use('Env')

/** @type {import('@adonisjs/ignitor/src/Helpers')} */
const Helpers = use('Helpers')

module.exports = {
  /*
  |--------------------------------------------------------------------------  
  | Default Connection  
  |--------------------------------------------------------------------------  
  |  
  | Aquí se define la conexión por defecto que se utilizará al interactuar  
  | con las bases de datos.  
  |  
  */
  connection: Env.get('DB_CONNECTION', 'mssql'),

  
  mongodb: {
    uri: Env.get('MONGO_URI', 'mongodb://localhost:27017/tu_basededatos'),
    client: 'mssql',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  /*
  |--------------------------------------------------------------------------  
  | Sqlite  
  |--------------------------------------------------------------------------  
  */
  sqlite: {
    client: 'sqlite3',
    connection: {
      filename: Helpers.databasePath(`${Env.get('DB_DATABASE', 'development')}.sqlite`)
    },
    useNullAsDefault: true,
    debug: Env.get('DB_DEBUG', false)
  },

  /*
  |--------------------------------------------------------------------------  
  | MySQL  
  |--------------------------------------------------------------------------  
  */
  mysql: {
    client: 'mysql',
    connection: {
      host: Env.get('DB_HOST', 'localhost'),
      port: Env.get('DB_PORT', ''),
      user: Env.get('DB_USER', 'root'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis')
    },
    debug: Env.get('DB_DEBUG', false)
  },

  /*
  |--------------------------------------------------------------------------  
  | PostgreSQL  
  |--------------------------------------------------------------------------  
  */
  pg: {
    client: 'pg',
    connection: {
      host: Env.get('DB_HOST', 'localhost'),
      port: Env.get('DB_PORT', ''),
      user: Env.get('DB_USER', 'root'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis')
    },
    debug: Env.get('DB_DEBUG', false)
  },

  /*
  |--------------------------------------------------------------------------  
  | SQL Server  
  |--------------------------------------------------------------------------  
  */
  mssql: {
    client: 'mssql',
    connection: {
      host: Env.get('DB_HOST', 'localhost'),
      port: Number(Env.get('DB_PORT', '1433')),
      user: Env.get('DB_USER', 'sa'),
      password: Env.get('DB_PASSWORD', ''),
      database: Env.get('DB_DATABASE', 'adonis'),
      options: {
        // Si se requiere conexión encriptada, esta opción se activa según la variable de entorno
        encrypt: Env.get('DB_ENCRYPT', false),
        // Para servidores con certificados autofirmados
        trustServerCertificate: Env.get('DB_TRUST_CERT', false)
      }
    },
    debug: Env.get('DB_DEBUG', false)
  }
}
