const test = require('node:test');
const assert = require('node:assert/strict');

const app = require('../src/server');

test('GET /api/health deve retornar status 200', async () => {
  const servidor = app.listen(0);

  try {
    await new Promise(resolve => {
      servidor.once('listening', resolve);
    });

    const porta = servidor.address().port;

    const resposta = await fetch(
      `http://127.0.0.1:${porta}/api/health`
    );

    const dados = await resposta.json();

    assert.equal(resposta.status, 200);
    assert.equal(dados.status, 'ok');
    assert.equal(
      dados.mensagem,
      'API do MapaSEBS funcionando!'
    );

  } finally {
    await new Promise(resolve => {
      servidor.close(resolve);
    });
  }
});