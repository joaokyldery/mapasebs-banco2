const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

const app = require('../src/server');

test('Validacoes da API de pontos', async (t) => {
  const servidor = app.listen(0);

  try {
    await once(servidor, 'listening');

    const porta = servidor.address().port;
    const url = `http://127.0.0.1:${porta}/api/pontos`;

    // Teste 1 - Cadastro sem nome
    await t.test('Nao cadastrar ponto sem nome', async () => {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_material: 'Papel',
          latitude: -6.76,
          longitude: -38.23
        })
      });

      assert.equal(resposta.status, 400);
    });

    // Teste 2 - Latitude invalida
    await t.test('Rejeitar coordenadas invalidas', async () => {
      const resposta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

    // Teste 4 - Atualizacao com ID invalido
    await t.test('Rejeitar atualizacao com ID invalido', async () => {
      const resposta = await fetch(`${url}/abc`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      assert.equal(resposta.status, 400);
    });

    // Teste 5 - Raio invalido
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

  } finally {
    await new Promise((resolve, reject) => {
      servidor.close(erro => erro ? reject(erro) : resolve());
    });
  }
});