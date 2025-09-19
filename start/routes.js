'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

Route.get('/', () => {
  return { greeting: 'Hello world in JSON' }
})

Route.group(() => {
  Route.post('login', 'AuthController.login');
  Route.post('register', 'AuthController.register');
  //Route.put('profile', 'AuthController.profile').middleware(['auth:jwt']);

  Route.get('import', 'InventarioController.import');
  // Rutas para el CRUD de inventarios
  Route.get('inventarios', 'InventarioController.index');

  Route.post('inventarios', 'InventarioController.store');
  Route.get('inventarios/:id', 'InventarioController.show');
  Route.put('inventarios/:id', 'InventarioController.update');
  Route.delete('inventarios/:id', 'InventarioController.destroy');

  // Routes for Sistemas
  Route.resource('sistemas', 'SistemaController').apiOnly()

  // Routes for Areas Funcionales
  Route.resource('areas', 'AreaController').apiOnly();

  // Routes for Paises
  Route.resource('paises', 'PaisController').apiOnly();

  // Routes for Programas
  Route.resource('Programas', 'ProgramaController').apiOnly()
  // Routes for Tablas
  Route.resource('Tablas', 'TablaController').apiOnly()
  Route.resource('Atributos', 'AtributoController').apiOnly()



  // Route.post('categorias', 'CategoryController.store').middleware(['auth:jwt']);
  // Route.put('categorias/:id', 'CategoryController.update').middleware(['auth:jwt']);
  // Route.delete('categorias/:id', 'CategoryController.destroy').middleware(['auth:jwt']);

  // Route.get('scp-items', 'ItemScpController.index');
  // Route.post('scp-items', 'ItemScpController.store').middleware(['auth:jwt']);
  // Route.put('scp-items/:id', 'ItemScpController.update').middleware(['auth:jwt']);
  // Route.delete('scp-items/:id', 'ItemScpController.destroy').middleware(['auth:jwt']);
}).prefix('api/v1');