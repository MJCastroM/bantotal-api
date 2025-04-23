'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')


class ProgramasSchema extends Schema {
  up () {
    this.create('programas', (table) => {
      table.increments('id') // Auto-incrementing primary key
      table.string('codigo').notNullable()
      table.string('descripcion').notNullable()
      table.boolean('es_rte').notNullable()
      table.timestamps() // Created at and updated at timestamps
    })
  }

  down () {
    this.drop('programas')
  }
}

module.exports = ProgramasSchema
