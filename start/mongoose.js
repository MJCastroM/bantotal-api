'use strict'

const mongoose = require('mongoose')

const mongoUri = "mongodb\+srv\:\/\/marcoscastro0827\:\<db\_password\>\@cluster0\.fberodi\.mongodb\.net\/\?appName\=Cluster0"

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

mongoose.connect(mongoUri, options)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error conectando a MongoDB:', err))
