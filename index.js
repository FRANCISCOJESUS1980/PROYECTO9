const express = require('express')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
const productRoutes = require('./routes/productRoutes')
const { logger } = require('./utils/logger')
const errorHandler = require('./utils/errorHandler')
const path = require('path')

dotenv.config()

connectDB()

const app = express()
app.use(express.json())

app.use('/api/products', productRoutes)

app.get('/api/scraped-products', (req, res) => {
  res.sendFile(path.join(__dirname, './output/products.json'))
})

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  logger.info(`Servidor corriendo en el puerto ${PORT}`)
})
