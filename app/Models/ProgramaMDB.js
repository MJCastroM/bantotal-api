'use strict'

const mongoose = require('mongoose')

const ProgramaMDBS = new mongoose.Schema({
  name: String,
  description: String,
}, { timestamps: true })

module.exports = mongoose.model('ProgramaMDB', ProgramaMDBS)
