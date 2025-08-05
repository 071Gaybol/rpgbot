const fs = require('fs');
const path = require('path');
const { obterPesoMaximoMesa } = require('./fichaUtils');

const inventariosMesaPath = path.join(__dirname, '..', 'data', 'inventarios_mesa.json');
const itensPath = path.join(__dirname, '..', 'data', 'itens.json');

function carregarInventariosMesa(mesaId) {
  try {
    const data = fs.readFileSync(inventariosMesaPath, 'utf8');
    const inventariosMesas = JSON.parse(data);
    return inventariosMesas[mesaId] || { jogadores: {} };
  } catch (error) {
    console.error('Erro ao carregar inventários da mesa:', error);
    return { jogadores: {} };
  }
}

function salvarInventariosMesa(mesaId, inventariosMesa) {
  try {
    let inventariosMesas = {};
    try {
      inventariosMesas = JSON.parse(fs.readFileSync(inventariosMesaPath, 'utf8'));
    } catch {}
    inventariosMesas[mesaId] = inventariosMesa;
    fs.writeFileSync(inventariosMesaPath, JSON.stringify(inventariosMesas, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar inventários da mesa:', error);
    return false;
  }
}

function carregarItens() {
  try {
    const data = fs.readFileSync(itensPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar itens:', error);
    return { itens: {} };
  }
}

function obterInventarioMesa(userId, mesaId) {
  const inventariosMesa = carregarInventariosMesa(mesaId);
  const pesoMaximo = obterPesoMaximoMesa(userId, mesaId);

  if (!inventariosMesa.jogadores[userId]) {
    inventariosMesa.jogadores[userId] = {
      itens: [],
      pesoMaximo: pesoMaximo,
      pesoAtual: 0
    };
    salvarInventariosMesa(mesaId, inventariosMesa);
  } else {
  
    inventariosMesa.jogadores[userId].pesoMaximo = pesoMaximo;
  }
  return inventariosMesa.jogadores[userId];
}

function adicionarItemMesa(userId, itemId, quantidade = 1, mesaId) {
  const inventariosMesa = carregarInventariosMesa(mesaId);
  const itens = carregarItens();

  if (!itens.itens[itemId]) {
    return { sucesso: false, mensagem: 'Item não encontrado!' };
  }

  const jogador = inventariosMesa.jogadores[userId] || {
    itens: [],
    pesoMaximo: 50,
    pesoAtual: 0
  };

  const item = itens.itens[itemId];
  const pesoItem = item.peso * quantidade;

  if (jogador.pesoAtual + pesoItem > jogador.pesoMaximo) {
    return { sucesso: false, mensagem: 'Inventário muito pesado!' };
  }


  const itemExistente = jogador.itens.find(i => i.id === itemId);

  if (itemExistente) {
    itemExistente.quantidade += quantidade;
  } else {
    jogador.itens.push({
      id: itemId,
      quantidade: quantidade
    });
  }

  jogador.pesoAtual += pesoItem;
  inventariosMesa.jogadores[userId] = jogador;

  if (salvarInventariosMesa(mesaId, inventariosMesa)) {
    return {
      sucesso: true,
      mensagem: `Adicionado ${quantidade}x ${item.nome} ao inventário!`
    };
  } else {
    return { sucesso: false, mensagem: 'Erro ao salvar inventário!' };
  }
}

function removerItemMesa(userId, itemId, quantidade = 1, mesaId) {
  const inventariosMesa = carregarInventariosMesa(mesaId);
  const itens = carregarItens();

  if (!inventariosMesa.jogadores[userId]) {
    return { sucesso: false, mensagem: 'Inventário vazio!' };
  }

  const jogador = inventariosMesa.jogadores[userId];
  const itemIndex = jogador.itens.findIndex(i => i.id === itemId);

  if (itemIndex === -1) {
    return { sucesso: false, mensagem: 'Item não encontrado no inventário!' };
  }

  const item = jogador.itens[itemIndex];
  const itemData = itens.itens[itemId];

  if (item.quantidade < quantidade) {
    return { sucesso: false, mensagem: 'Quantidade insuficiente!' };
  }

  if (item.quantidade === quantidade) {
    jogador.itens.splice(itemIndex, 1);
  } else {
    item.quantidade -= quantidade;
  }

  jogador.pesoAtual -= itemData.peso * quantidade;
  inventariosMesa.jogadores[userId] = jogador;

  if (salvarInventariosMesa(mesaId, inventariosMesa)) {
    return {
      sucesso: true,
      mensagem: `Removido ${quantidade}x ${itemData.nome} do inventário!`
    };
  } else {
    return { sucesso: false, mensagem: 'Erro ao salvar inventário!' };
  }
}

function buscarItemPorNome(nome) {
  const itens = carregarItens();
  const nomeLower = nome.toLowerCase();
  for (const [id, item] of Object.entries(itens.itens)) {
    if (item.nome.toLowerCase().includes(nomeLower)) {
      return { id, ...item };
    }
  }
  return null;
}

function carregarInventarios() { return { jogadores: {} }; }
function salvarInventarios() { return false; }
function obterInventario() { return null; }
function adicionarItem() { return { sucesso: false, mensagem: 'Use o sistema de mesas!' }; }
function removerItem() { return { sucesso: false, mensagem: 'Use o sistema de mesas!' }; }

module.exports = {
  carregarInventariosMesa,
  salvarInventariosMesa,
  obterInventarioMesa,
  adicionarItemMesa,
  removerItemMesa,
  buscarItemPorNome,
  carregarItens,

  carregarInventarios,
  salvarInventarios,
  obterInventario,
  adicionarItem,
  removerItem
}; 