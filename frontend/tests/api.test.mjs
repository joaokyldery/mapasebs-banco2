//testes da integração HTTP sem acessar o Supabase real
import test from 'node:test';
import assert from 'node:assert/strict';
import { listarPorArea, listarProximos, cadastrarPonto, excluirPonto } from '../js/api.js';
import { API_BASE_URL } from '../js/config.js';

const originalFetch = globalThis.fetch;
async function simularFetch(fn) {
  globalThis.fetch = async (url, options = {}) => {
    fn(String(url), options);
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
}

test.after(() => { globalThis.fetch = originalFetch; });

test('URL publica configurada usa HTTPS', () => {
  assert.match(API_BASE_URL, /^https:\/\//);
});

test('busca por area envia limites sem chave administrativa', async () => {
  await simularFetch((url, options) => {
    assert.match(url, /\/api\/pontos\?/);
    assert.match(url, /sul=-6.77/);
    assert.match(url, /leste=-38.22/);
    assert.equal(options.headers['x-admin-key'], undefined);
  });
  await listarPorArea({ sul:-6.77, norte:-6.75, oeste:-38.24, leste:-38.22 });
});

test('busca de proximidade chama rota espacial', async () => {
  await simularFetch(url => assert.match(url, /\/api\/pontos\/proximos\?/));
  await listarProximos({ latitude:-6.76, longitude:-38.23, raio:2000 });
});

test('cadastro envia POST e chave apenas no cabecalho', async () => {
  await simularFetch((url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['x-admin-key'], 'CHAVE_TESTE');
    assert.ok(!url.includes('CHAVE_TESTE'));
    assert.equal(JSON.parse(options.body).nome, 'Teste');
  });
  await cadastrarPonto({ nome:'Teste' }, 'CHAVE_TESTE');
});

test('exclusao envia DELETE e chave no cabecalho', async () => {
  await simularFetch((url, options) => {
    assert.match(url, /\/api\/pontos\/12$/);
    assert.equal(options.method, 'DELETE');
    assert.equal(options.headers['x-admin-key'], 'CHAVE_TESTE');
  });
  await excluirPonto('12', 'CHAVE_TESTE');
});
