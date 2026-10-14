
const { test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

async function request(path, options = {}) {
  const server = app.listen(0);

  try {
    await new Promise((resolve) => {
      server.once('listening', resolve);
    });

    const address = server.address();

    const response = await fetch(
      `http://127.0.0.1:${address.port}${path}`,
      options
    );

const contentType = response.headers.get('content-type') || '';

const body = contentType.includes('application/json')
  ? await response.json()
  : await response.text();
    return {
      status: response.status,
      body,
      headers: response.headers
    };

  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

test('POST /users rejeita cadastro sem dados obrigatorios', async () => {
  const response = await request('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 400);
  assert.match(response.body.error, /Invalid input/);
});

test('GET /users/:id rejeita identificador invalido', async () => {
  const response = await request('/users/id-invalido');

  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Invalid user ID');
});

test('GET rota inexistente retorna HTTP 404', async () => {
  const response = await request('/rota-inexistente');

  assert.equal(response.status, 404);
});
