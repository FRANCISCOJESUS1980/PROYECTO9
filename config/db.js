const mongoose = require('mongoose')
const { logger } = require('../utils/logger')

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.DB_URL)
    logger.info(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    logger.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
