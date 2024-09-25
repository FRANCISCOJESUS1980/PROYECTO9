const mysql = require('mysql')
const { logger } = require('../utils/logger')
require('dotenv').config()

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

connection.connect((err) => {
  if (err) {
    logger.error('Error conectando a la bbdd', err)
    process.exit(1)
  }
  logger.info('Conectado a la base de datos MySQL')
})

module.exports = connection
