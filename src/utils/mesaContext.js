const fs = require('fs');
const path = require('path');

const canaisAtivosPath = path.join(__dirname, '..', 'data', 'canais_ativos.json');

function carregarCanaisAtivos() {
  try {
    const data = fs.readFileSync(canaisAtivosPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar canais ativos:', error);
    return { canais: {} };
  }
}

function salvarCanaisAtivos(canaisAtivos) {
  try {
    fs.writeFileSync(canaisAtivosPath, JSON.stringify(canaisAtivos, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar canais ativos:', error);
    return false;
  }
}

function getActiveMesa(channelId) {
  const canaisAtivos = carregarCanaisAtivos();
  return canaisAtivos.canais[channelId] || null;
}

function setActiveMesa(channelId, mesaId) {
  const canaisAtivos = carregarCanaisAtivos();
  canaisAtivos.canais[channelId] = mesaId;
  return salvarCanaisAtivos(canaisAtivos);
}

function removeActiveMesa(channelId) {
  const canaisAtivos = carregarCanaisAtivos();
  delete canaisAtivos.canais[channelId];
  return salvarCanaisAtivos(canaisAtivos);
}

function isMesaActive(channelId) {
  return !!getActiveMesa(channelId);
}

function getActiveCanais() {
  const canaisAtivos = carregarCanaisAtivos();
  return canaisAtivos.canais;
}

module.exports = {
  getActiveMesa,
  setActiveMesa,
  removeActiveMesa,
  isMesaActive,
  getActiveCanais
}; 