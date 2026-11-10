// Integração do frontend
import {
  verificarApi, listarPorArea, listarProximos,
  cadastrarPonto, atualizarPonto, excluirPonto
} from './api.js';
import {
  iniciarMapa, obterLimites, centroDoMapa,
  centralizar, renderizarMarcadores, solicitarLocalizacao
} from './mapa.js';
import { pesquisarEndereco } from './geocodificacao.js';

const $ = id => document.getElementById(id);
const estado = { pontos: [], idEmEdicao: null, posicaoUsuario: null, controladorArea: null };

function informar(id, texto, tipo = '') {
  const elemento = $(id);
  elemento.textContent = texto;
  elemento.classList.remove('erro', 'sucesso');
  if (tipo) elemento.classList.add(tipo);
}

function criarItemPonto(ponto, detalhe = '') {
  const botao = document.createElement('button');
  botao.className = 'item-ponto';
  botao.type = 'button';
  const titulo = document.createElement('strong');
  titulo.textContent = ponto.nome;
  const subtitulo = document.createElement('small');
  subtitulo.textContent = [ponto.tipo_material, detalhe].filter(Boolean).join(' · ');
  botao.append(titulo, subtitulo);
  botao.addEventListener('click', () => selecionarPonto(ponto));
  return botao;
}

function desenharLista(id, pontos, vazio, mostrarDistancia = false) {
  const alvo = $(id);
  alvo.replaceChildren();
  if (pontos.length === 0) {
    const p = document.createElement('p');
    p.className = 'mensagem-pequena';
    p.textContent = vazio;
    alvo.append(p);
    return;
  }
  pontos.forEach(p => {
    const detalhe = mostrarDistancia ? `${Number(p.distancia_metros).toLocaleString('pt-BR')} m` : '';
    alvo.append(criarItemPonto(p, detalhe));
  });
}

async function carregarArea() {
  // Quando o usuario arrasta o mapa, so a consulta mais recente pode atualizar a tela
  estado.controladorArea?.abort();
  const controlador = new AbortController();
  estado.controladorArea = controlador;
  try {
    const pontos = await listarPorArea(obterLimites(), controlador.signal);
    if (controlador.signal.aborted) return;
    estado.pontos = pontos;
    $('contadorPontos').textContent = String(pontos.length);
    desenharLista('listaPontos', pontos, 'Nao ha pontos cadastrados nesta area.');
    renderizarMarcadores(pontos, selecionarPonto);
  } catch (erro) {
    if (erro.name === 'AbortError') return;
    informar('statusApi', 'Erro na consulta da área', 'erro');
    desenharLista('listaPontos', [], erro.message);
  }
}

function selecionarPonto(ponto) {
  estado.idEmEdicao = ponto.id;
  $('nomePonto').value = ponto.nome ?? '';
  $('tipoMaterial').value = ponto.tipo_material ?? '';
  $('enderecoPonto').value = ponto.endereco ?? '';
  $('descricaoPonto').value = ponto.descricao ?? '';
  $('latitudePonto').value = ponto.latitude;
  $('longitudePonto').value = ponto.longitude;
  $('tituloFormulario').textContent = 'Editar ponto de coleta';
  $('btnSalvarPonto').textContent = 'Salvar alterações';
  $('btnExcluirPonto').hidden = false;
  informar('statusFormulario', `Editando ponto #${ponto.id}. Para alterar, informe sua chave administrativa.`);
  centralizar(ponto.latitude, ponto.longitude, 16);
  $('secaoCadastro').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function limparFormulario() {
  $('formPonto').reset();
  estado.idEmEdicao = null;
  $('tituloFormulario').textContent = 'Cadastrar ponto';
  $('btnSalvarPonto').textContent = 'Cadastrar ponto';
  $('btnExcluirPonto').hidden = true;
  informar('statusFormulario', 'Clique no mapa para escolher as coordenadas.');
}

function dadosFormulario() {
  return {
    nome: $('nomePonto').value.trim(),
    tipo_material: $('tipoMaterial').value.trim(),
    endereco: $('enderecoPonto').value.trim(),
    descricao: $('descricaoPonto').value.trim(),
    latitude: Number($('latitudePonto').value),
    longitude: Number($('longitudePonto').value)
  };
}

$('formPonto').addEventListener('submit', async evento => {
  evento.preventDefault();
  const chave = $('chaveAdmin').value.trim();
  if (!chave) { informar('statusFormulario', 'Informe a chave administrativa.', 'erro'); return; }
  const dados = dadosFormulario();
  if (!Number.isFinite(dados.latitude) || !Number.isFinite(dados.longitude)) {
    informar('statusFormulario', 'Latitude ou longitude invalida.', 'erro'); return;
  }
  const botao = $('btnSalvarPonto');
  botao.disabled = true;
  informar('statusFormulario', 'Salvando...');
  try {
    if (estado.idEmEdicao !== null) await atualizarPonto(estado.idEmEdicao, dados, chave);
    else await cadastrarPonto(dados, chave);
    limparFormulario();
    informar('statusFormulario', 'Ponto salvo! O mapa foi atualizado.', 'sucesso');
    centralizar(dados.latitude, dados.longitude, 15);
    await carregarArea();
  } catch (erro) {
    informar('statusFormulario', erro.message, 'erro');
  } finally { botao.disabled = false; }
});

$('btnExcluirPonto').addEventListener('click', async () => {
  if (estado.idEmEdicao === null) return;
  const chave = $('chaveAdmin').value.trim();
  if (!chave) { informar('statusFormulario', 'Informe a chave administrativa.', 'erro'); return; }
  if (!window.confirm('Excluir definitivamente este ponto de coleta?')) return;
  const botao = $('btnExcluirPonto');
  botao.disabled = true;
  try {
    await excluirPonto(estado.idEmEdicao, chave);
    limparFormulario();
    informar('statusFormulario', 'Ponto excluido com sucesso.', 'sucesso');
    await carregarArea();
  } catch (erro) { informar('statusFormulario', erro.message, 'erro'); }
  finally { botao.disabled = false; }
});

$('btnCancelarEdicao').addEventListener('click', limparFormulario);

$('btnBuscarProximos').addEventListener('click', async () => {
  const origem = estado.posicaoUsuario || centroDoMapa();
  const raio = Number($('seletorRaio').value);
  informar('statusProximos', 'Buscando pontos próximos...');
  try {
    const pontos = await listarProximos({ ...origem, raio });
    desenharLista('listaProximos', pontos, 'Nenhum ponto dentro do raio selecionado.', true);
    informar('statusProximos', `${pontos.length} ponto(s) em ${raio.toLocaleString('pt-BR')} m. ` +
      (estado.posicaoUsuario ? 'Referência: sua localização.' : 'Sem permissão de localização: referência é o centro do mapa.'));
  } catch (erro) { informar('statusProximos', erro.message, 'erro'); }
});

function usuarioLocalizado(latitude, longitude) {
  estado.posicaoUsuario = { latitude, longitude };
  informar('statusLocalizacao', 'Sua localização está ativa.', 'sucesso');
}
function usuarioNaoLocalizado(mensagem) {
  estado.posicaoUsuario = null;
  informar('statusLocalizacao', mensagem, 'erro');
}
$('btnUsarLocalizacao').addEventListener('click', () => solicitarLocalizacao(usuarioLocalizado, usuarioNaoLocalizado));

$('formBusca').addEventListener('submit', async evento => {
  evento.preventDefault();
  const busca = $('buscaEndereco').value;
  const botao = $('btnPesquisarEndereco');
  botao.disabled = true;
  informar('statusBusca', 'Pesquisando endereço...');
  $('resultadosEndereco').replaceChildren();
  try {
    const resultados = await pesquisarEndereco(busca);
    informar('statusBusca', resultados.length ? `Encontrados ${resultados.length} locais. Escolha um.` : 'Nenhum local encontrado.');
    for (const local of resultados) {
      const item = document.createElement('button');
      item.className = 'resultado-endereco';
      item.type = 'button';
      item.textContent = local.nome;
      item.addEventListener('click', () => {
        centralizar(local.latitude, local.longitude);
        $('latitudePonto').value = local.latitude;
        $('longitudePonto').value = local.longitude;
        $('enderecoPonto').value = local.nome;
        $('resultadosEndereco').replaceChildren();
        informar('statusBusca', 'Local selecionado no mapa.');
      });
      $('resultadosEndereco').append(item);
    }
  } catch (erro) { informar('statusBusca', erro.message, 'erro'); }
  finally { botao.disabled = false; }
});

// Inicializacao do mapa e carregamento somente da area visivel
try {
  iniciarMapa({
    aoMover: carregarArea,
    aoClicar: (lat, lon) => {
      $('latitudePonto').value = lat.toFixed(6);
      $('longitudePonto').value = lon.toFixed(6);
      informar('statusFormulario', 'Coordenadas selecionadas no mapa.');
    },
    aoEncontrarUsuario: usuarioLocalizado,
    aoFalharLocalizacao: usuarioNaoLocalizado
  });
  await carregarArea();
} catch (erro) {
  informar('statusApi', `Erro ao abrir mapa: ${erro.message}`, 'erro');
}
verificarApi().then(() => informar('statusApi', 'API conectada', 'sucesso'))
  .catch(() => informar('statusApi', 'API indisponível no momento', 'erro'));
