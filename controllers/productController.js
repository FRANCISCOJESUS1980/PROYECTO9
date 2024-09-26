const Product = require('../models/productModel')

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error })
  }
}

exports.createProducts = async (req, res) => {
  try {
    const products = await Product.insertMany(req.body)
    res.status(201).json(products)
  } catch (error) {
    res.status(500).json({ message: 'Error al crear productos', error })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    res.status(200).json(updatedProduct)
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id)
    res.status(200).json({ message: 'Producto eliminado' })
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error })
  }
}
