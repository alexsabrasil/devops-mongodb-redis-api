
const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: '.env.test' });

const app = require('../src/app');
const User = require('../src/models/User');
const redisClient = require('../src/config/redis');

test('Integração: MongoDB, bcrypt e cache Redis', async () => {
  let server;
  let userId;

  try {
    // Conectar ao banco exclusivo de testes
    assert.match(process.env.MONGO_URL, /\/desafio-2-test$/);

    await mongoose.connect(process.env.MONGO_URL);
    await redisClient.connect();

    server = app.listen(0);

    await new Promise(resolve => {
      server.once('listening', resolve);
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const email = `teste-${crypto.randomUUID()}@example.com`;
    const password = 'SenhaFicticia2026!';

    // 1. Cadastrar usuário
    const cadastro = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Teste Integracao',
        email,
        password
      })
    });

    assert.equal(cadastro.status, 201);

    const criado = await cadastro.json();
    userId = criado._id;

    assert.ok(userId);
    assert.equal(criado.password, undefined);

    // 2. Verificar o hash no MongoDB
    const usuarioBanco = await User.findById(userId);

    assert.ok(usuarioBanco);
    assert.notEqual(usuarioBanco.password, password);
    assert.equal(
      await bcrypt.compare(password, usuarioBanco.password),
      true
    );

    // 3. Verificar o cache criado no cadastro
    const chave = `user:${userId}`;

    assert.equal(await redisClient.exists(chave), 1);

    const ttl = await redisClient.ttl(chave);
    assert.ok(ttl > 0 && ttl <= 3600);

    const cache = JSON.parse(await redisClient.get(chave));
    assert.equal(cache.password, undefined);

    // 4. Cache hit
    const hit = await fetch(`${baseUrl}/users/${userId}`);
    assert.equal(hit.status, 200);

    const respostaHit = await hit.json();
    assert.equal(respostaHit.source, 'redis');
    assert.equal(respostaHit.data.password, undefined);

    // 5. Remover a chave para simular cache miss
    await redisClient.del(chave);

    const miss = await fetch(`${baseUrl}/users/${userId}`);
    assert.equal(miss.status, 200);

    const respostaMiss = await miss.json();
    assert.equal(respostaMiss.source, 'mongodb');
    assert.equal(respostaMiss.data.password, undefined);

    // 6. Confirmar recriação do cache
    const novoHit = await fetch(`${baseUrl}/users/${userId}`);
    assert.equal(novoHit.status, 200);

    const respostaNovoHit = await novoHit.json();
    assert.equal(respostaNovoHit.source, 'redis');

  } finally {
    // Limpar somente os dados criados pelo teste
    if (userId) {
      if (redisClient.isOpen) {
        await redisClient.del(`user:${userId}`);
      }

      if (mongoose.connection.readyState === 1) {
        await User.deleteOne({ _id: userId });
      }
    }

    if (server) {
      await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }

    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    await mongoose.disconnect();
  }
});
