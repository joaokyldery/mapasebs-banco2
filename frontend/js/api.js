//integracao HTTP entre frontend (GitHub Pages) e backend (Render)
import { API_BASE_URL } from './config.js';

async function requisitar(caminho, { method = 'GET', dados, chave, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (dados !== undefined) headers['Content-Type'] = 'application/json';
  if (chave) headers['x-admin-key'] = chave;

  let resposta;
  try {
    resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      method, headers,
      body: dados === undefined ? undefined : JSON.stringify(dados),
      signal
    });
  } catch (erro) {
    if (erro.name === 'AbortError') throw erro;
    throw new Error('Nao foi possivel acessar a API. Confira o Render e sua conexao.');
  }

  const tipo = resposta.headers.get('content-type') || '';
  const resultado = tipo.includes('application/json') ? await resposta.json() : null;
  if (!resposta.ok) {
    throw new Error(resultado?.mensagem || `Erro HTTP ${resposta.status}`);
  }
  return resultado;
}

export function verificarApi() { return requisitar('/api/health'); }
export function listarPorArea({ sul, norte, oeste, leste }, signal) {
  const q = new URLSearchParams({ sul, norte, oeste, leste });
  return requisitar(`/api/pontos?${q}`, { signal });
}
export function listarProximos({ latitude, longitude, raio }) {
  const q = new URLSearchParams({ latitude, longitude, raio });
  return requisitar(`/api/pontos/proximos?${q}`);
}
export function consultarPonto(id) { return requisitar(`/api/pontos/${encodeURIComponent(id)}`); }
export function cadastrarPonto(dados, chave) { return requisitar('/api/pontos', { method: 'POST', dados, chave }); }
export function atualizarPonto(id, dados, chave) {
  return requisitar(`/api/pontos/${encodeURIComponent(id)}`, { method: 'PUT', dados, chave });
}
export function excluirPonto(id, chave) {
  return requisitar(`/api/pontos/${encodeURIComponent(id)}`, { method: 'DELETE', chave });
}
