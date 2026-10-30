// Basic tests for Esoterik-Welt

const request = require('supertest');
const app = require('../index');

describe('Esoterik-Welt API', () => {
  test('GET /api/health should return ok status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('esoterik-welt');
  });
  
  test('GET / should serve index.html', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);
    
    expect(response.text).toContain('Esoterik-Welt');
  });
});