// DANYLO — Geocodificacao com o Nominatim publico do OpenStreetMap.
// Uso educativo: somente pesquisas enviadas manualmente, nunca autocomplete.
// Politica oficial: https://operations.osmfoundation.org/policies/nominatim/
// Limite de 1 requisicao por segundo POR APLICACAO (nao apenas por usuario).
// Para uso com muitos visitantes, utilizar um proxy centralizado com cache e limite global.
const cache = new Map();
let ultimoPedido = 0;

export async function pesquisarEndereco(termo) {
  const busca = String(termo).trim();
  if (busca.length < 3) throw new Error('Digite pelo menos 3 caracteres.');

  const chave = busca.toLocaleLowerCase('pt-BR');
  if (cache.has(chave)) return cache.get(chave);
  if (Date.now() - ultimoPedido < 1100) {
    throw new Error('Aguarde um segundo antes de fazer outra pesquisa.');
  }
  ultimoPedido = Date.now();

  const parametros = new URLSearchParams({ q: busca, format: 'jsonv2', limit: '5', addressdetails: '1' });
  const url = `https://nominatim.openstreetmap.org/search?${parametros}`;
  const resposta = await fetch(url, {
    method: 'GET', headers: { Accept: 'application/json' },
    referrerPolicy: 'strict-origin-when-cross-origin'
  });
  if (!resposta.ok) throw new Error('O servico de enderecos nao respondeu. Tente mais tarde.');
  const dados = await resposta.json();
  const resultados = dados.map(item => ({
    nome: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon)
  })).filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  cache.set(chave, resultados);
  return resultados;
}
