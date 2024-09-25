const express = require('express')
const swaggerUi = require('swagger-ui-express')
const swaggerDocument = require('./docs/swagger.json')
const productRoutes = require('./routes/productRoutes')
const errorHandler = require('./utils/errorHandler')
require('dotenv').config()

const app = express()
app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/api', productRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`)
  console.log(
    `Documentación de la API disponible en http://localhost:${PORT}/api-docs`
  )
})

module.exports = app
