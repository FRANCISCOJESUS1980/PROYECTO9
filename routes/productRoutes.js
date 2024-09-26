const express = require('express')
const router = express.Router()
const {
  getProducts,
  createProducts,
  updateProduct,
  deleteProduct
} = require('../controllers/productController')

router.get('/', getProducts)
router.post('/', createProducts)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

module.exports = router
