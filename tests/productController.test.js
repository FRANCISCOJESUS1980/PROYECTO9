const request = require('supertest')
const app = require('../index')

describe('Productos API', () => {
  it('Debe obtener todos los productos', async () => {
    const response = await request(app).get('/api/products')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })
})
