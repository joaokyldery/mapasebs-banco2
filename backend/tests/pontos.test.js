
const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

// Chave ficticia utilizada somente nos testes
process.env.ADMIN_API_KEY = 'chave-ficticia-para-testes';

const app = require('../src/server');

test('Validacoes da API de pontos', async (t) => {
  const servidor = app.listen(0);

  try {
    await once(servidor, 'listening');

    const porta = servidor.address().port;
    const url = `http://127.0.0.1:${porta}/api/pontos`;

    const headersAdmin = {
      'Content-Type': 'application/json',
      'x-admin-key': process.env.ADMIN_API_KEY
    };

    // Teste 1 - Cadastro sem nome
    await t.test('Nao cadastrar ponto sem nome', async () => {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: headersAdmin,
        body: JSON.stringify({
          tipo_material: 'Papel',
          latitude: -6.76,
          longitude: -38.23
        })
      });

      assert.equal(resposta.status, 400);
    });

    // Teste 2 - Coordenadas invalidas
    await t.test('Rejeitar coordenadas invalidas', async () => {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: headersAdmin,
        body: JSON.stringify({
          nome: 'Ecoponto',
          tipo_material: 'Papel',
          latitude: 200,
          longitude: -38.23
        })
      });

      assert.equal(resposta.status, 400);
    });

    // Teste 3 - ID invalido
    await t.test('Rejeitar ID invalido', async () => {
      const resposta = await fetch(`${url}/abc`);
      assert.equal(resposta.status, 400);
    });

    // Teste 4 - Atualizacao invalida
    await t.test('Rejeitar atualizacao com ID invalido', async () => {
      const resposta = await fetch(`${url}/abc`, {
        method: 'PUT',
        headers: headersAdmin,
        body: JSON.stringify({})
      });

      assert.equal(resposta.status, 400);
    });

    // Teste 5 - Raio negativo
    await t.test('Rejeitar raio negativo', async () => {
      const resposta = await fetch(
        `${url}/proximos?latitude=-6.76&longitude=-38.23&raio=-10`
      );

      assert.equal(resposta.status, 400);
    });

    // Teste 6 - Area sem limites
    await t.test('Exigir limites do mapa', async () => {
      const resposta = await fetch(url);
      assert.equal(resposta.status, 400);
    });

    // Teste 7 - Limites invertidos
    await t.test('Rejeitar limites invertidos', async () => {
      const resposta = await fetch(
        `${url}?sul=-6.7&norte=-6.8&oeste=-38.24&leste=-38.22`
      );

      assert.equal(resposta.status, 400);
    });

    // Teste 8 - Cadastro sem chave
    await t.test('Bloquear cadastro sem chave', async () => {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.equal(resposta.status, 401);
    });

    // Teste 9 - Atualizacao com chave incorreta
    await t.test('Bloquear atualizacao com chave errada', async () => {
      const resposta = await fetch(`${url}/1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'chave-incorreta'
        },
        body: JSON.stringify({})
      });

      assert.equal(resposta.status, 401);
    });

    // Teste 10 - Exclusao sem chave
    await t.test('Bloquear exclusao sem chave', async () => {
      const resposta = await fetch(`${url}/1`, {
        method: 'DELETE'
      });

      assert.equal(resposta.status, 401);
    });

  } finally {
    await new Promise((resolve, reject) => {
      servidor.close(erro => erro ? reject(erro) : resolve());
    });
  }
});
