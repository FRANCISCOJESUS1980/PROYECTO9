const errorHandler = (err, req, res, next) => {
  res.status(500).json({
    message: err.message || 'Error del servidor',
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  })
}

module.exports = errorHandler
