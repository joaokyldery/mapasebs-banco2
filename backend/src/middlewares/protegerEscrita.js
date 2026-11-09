const crypto = require('node:crypto');

function protegerEscrita(req, res, next) {
  // Metodos que alteram os dados
  const metodosProtegidos = [
    'POST',
    'PUT',
    'PATCH',
    'DELETE'
  ];

  // Requisicoes de leitura continuam publicas
  if (!metodosProtegidos.includes(req.method)) {
    return next();
  }

  const chaveCorreta = process.env.ADMIN_API_KEY;

  // Bloqueia alteracoes se a chave nao foi configurada
  if (!chaveCorreta) {
    return res.status(503).json({
      mensagem: 'Operacoes de escrita indisponiveis'
    });
  }

  // Chave enviada pelo cliente no cabecalho HTTP
  const chaveRecebida = req.get('x-admin-key') || '';

  const recebida = Buffer.from(chaveRecebida);
  const correta = Buffer.from(chaveCorreta);

  // Compara as chaves
  const autorizada =
    recebida.length === correta.length &&
    crypto.timingSafeEqual(recebida, correta);

  if (!autorizada) {
    return res.status(401).json({
      mensagem: 'Chave de acesso invalida ou ausente'
    });
  }

  // Permite continuar para a rota
  next();
}

module.exports = protegerEscrita;