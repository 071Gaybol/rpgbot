const fs = require('fs');
const path = require('path');

const mesasPath = path.join(__dirname, '..', 'data', 'mesas.json');

function carregarMesas() {
  try {
    const data = fs.readFileSync(mesasPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar mesas:', error);
    return { mesas: {} };
  }
}

function salvarMesas(mesas) {
  try {
    fs.writeFileSync(mesasPath, JSON.stringify(mesas, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar mesas:', error);
    return false;
  }
}

function criarMesa(dadosMesa) {
  const mesas = carregarMesas();
  
  const mesa = {
    id: dadosMesa.id,
    nome: dadosMesa.nome,
    descricao: dadosMesa.descricao || '',
    mestreId: dadosMesa.mestreId,
    canalId: dadosMesa.canalId || null,
    status: dadosMesa.status || 'inativa',
    criadaEm: new Date().toISOString(),
    atualizadaEm: new Date().toISOString(),
    configuracoes: {
      sistema: dadosMesa.configuracoes?.sistema || '3D&T',
      nivelMaximo: dadosMesa.configuracoes?.nivelMaximo || 20,
      permitirPvNegativo: dadosMesa.configuracoes?.permitirPvNegativo || false
    }
  };
  
  mesas.mesas[dadosMesa.id] = mesa;
  
  if (salvarMesas(mesas)) {
    return { sucesso: true, mesa: mesa };
  } else {
    return { sucesso: false, mensagem: 'Erro ao salvar mesa!' };
  }
}

function obterMesa(mesaId) {
  const mesas = carregarMesas();
  return mesas.mesas[mesaId] || null;
}

function listarMesasMestre(mestreId) {
  const mesas = carregarMesas();
  return Object.values(mesas.mesas).filter(mesa => mesa.mestreId === mestreId);
}

function atualizarMesa(mesaId, dadosAtualizacao) {
  const mesas = carregarMesas();
  
  if (!mesas.mesas[mesaId]) {
    return { sucesso: false, mensagem: 'Mesa não encontrada!' };
  }
  
  const mesa = mesas.mesas[mesaId];
  

  Object.keys(dadosAtualizacao).forEach(campo => {
    if (mesa.hasOwnProperty(campo)) {
      mesa[campo] = dadosAtualizacao[campo];
    }
  });
  
  mesa.atualizadaEm = new Date().toISOString();
  
  if (salvarMesas(mesas)) {
    return { sucesso: true, mesa: mesa };
  } else {
    return { sucesso: false, mensagem: 'Erro ao atualizar mesa!' };
  }
}

function removerMesa(mesaId) {
  const mesas = carregarMesas();
  
  if (!mesas.mesas[mesaId]) {
    return { sucesso: false, mensagem: 'Mesa não encontrada!' };
  }
  
  delete mesas.mesas[mesaId];
  
  if (salvarMesas(mesas)) {
    return { sucesso: true };
  } else {
    return { sucesso: false, mensagem: 'Erro ao remover mesa!' };
  }
}

function gerarMesaId() {
  return `mesa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isMestreMesa(mesaId, userId) {
  const mesa = obterMesa(mesaId);
  return mesa && mesa.mestreId === userId;
}

module.exports = {
  carregarMesas,
  criarMesa,
  obterMesa,
  listarMesasMestre,
  atualizarMesa,
  removerMesa,
  gerarMesaId,
  isMestreMesa
}; 