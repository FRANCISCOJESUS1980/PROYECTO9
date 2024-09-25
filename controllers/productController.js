const productModel = require('../models/productModel')
const { validationResult } = require('express-validator')
const { logger } = require('../utils/logger')

const getProducts = (req, res) => {
  productModel.getAllProducts((err, results) => {
    if (err) {
      logger.error('Error al obtener productos: ', err)
      return res.status(500).json({ error: 'Error al obtener productos' })
    }
    res.json(results)
  })
}

const insertProducts = (req, res) => {
  const products = require('../public/products.json')
  products.forEach((product) => {
    productModel.insertProduct(product, (err) => {
      if (err) {
        logger.error('Error al insertar productos: ', err)
        return res.status(500).json({ error: 'Error al insertar productos' })
      }
    })
  })
  res.send('Productos insertados correctamente')
}

const updateProduct = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const id = req.params.id
  const productData = req.body
  productModel.updateProduct(id, productData, (err) => {
    if (err) {
      logger.error('Error al actualizar producto: ', err)
      return res.status(500).json({ error: 'Error al actualizar producto' })
    }
    res.send('Producto actualizado correctamente')
  })
}

const deleteProduct = (req, res) => {
  const id = req.params.id
  productModel.deleteProduct(id, (err) => {
    if (err) {
      logger.error('Error al eliminar producto: ', err)
      return res.status(500).json({ error: 'Error al eliminar producto' })
    }
    res.send('Producto eliminado correctamente')
  })
}

module.exports = {
  getProducts,
  insertProducts,
  updateProduct,
  deleteProduct
}
