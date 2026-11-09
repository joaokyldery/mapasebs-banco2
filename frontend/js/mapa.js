// DANYLO — Leaflet: geolocalizacao, clique para cadastrar e marcadores do PostGIS.
// Coordenadas iniciais de REFERENCIA para o municipio do projeto, nao sao a posicao do usuario.
const POSICAO_INICIAL = [-6.76, -38.23];
let mapa;
let camadaPontos;
let camadaUsuario;

export function iniciarMapa({ aoMover, aoClicar, aoEncontrarUsuario, aoFalharLocalizacao }) {
  if (!window.L) throw new Error('Leaflet nao carregado. Verifique a conexao com a internet.');
  mapa = L.map('mapa', { zoomControl: true }).setView(POSICAO_INICIAL, 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(mapa);
  camadaPontos = L.layerGroup().addTo(mapa);
  mapa.on('moveend', () => aoMover?.());
  mapa.on('click', event => aoClicar?.(event.latlng.lat, event.latlng.lng));
  // Exigencia do professor: solicitar geolocalizacao ao abrir o mapa.
  solicitarLocalizacao(aoEncontrarUsuario, aoFalharLocalizacao);
  return mapa;
}

export function solicitarLocalizacao(aoSucesso, aoErro) {
  if (!navigator.geolocation) {
    aoErro?.('Seu navegador nao oferece geolocalizacao.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      if (camadaUsuario) mapa.removeLayer(camadaUsuario);
      camadaUsuario = L.circleMarker([latitude, longitude], {
        radius: 8, color: '#ffffff', weight: 3, fillColor: '#207bc5', fillOpacity: 1
      }).addTo(mapa).bindPopup('Sua localização aproximada');
      mapa.setView([latitude, longitude], 15);
      aoSucesso?.(latitude, longitude);
    },
    () => aoErro?.('Localizacao negada ou indisponivel. O mapa permanece em Sousa-PB.'),
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
}

export function obterLimites() {
  const limite = mapa.getBounds();
  return {
    sul: limite.getSouth(), norte: limite.getNorth(),
    oeste: limite.getWest(), leste: limite.getEast()
  };
}

export function centroDoMapa() {
  const c = mapa.getCenter();
  return { latitude: c.lat, longitude: c.lng };
}

export function centralizar(latitude, longitude, zoom = 15) {
  mapa.setView([Number(latitude), Number(longitude)], zoom);
}

export function renderizarMarcadores(pontos, aoSelecionar) {
  camadaPontos.clearLayers();
  pontos.forEach(ponto => {
    const latitude = Number(ponto.latitude);
    const longitude = Number(ponto.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const marcador = L.marker([latitude, longitude]).addTo(camadaPontos);
    // Usar textContent evita transformar dados cadastrados em HTML executavel.
    const conteudo = document.createElement('div');
    const nome = document.createElement('strong');
    nome.textContent = ponto.nome || 'Ponto de coleta';
    const materiais = document.createElement('p');
    materiais.textContent = ponto.tipo_material || 'Materiais nao informados';
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.textContent = 'Ver / editar ponto';
    botao.addEventListener('click', () => aoSelecionar?.(ponto));
    conteudo.append(nome, materiais, botao);
    marcador.bindPopup(conteudo);
  });
}
