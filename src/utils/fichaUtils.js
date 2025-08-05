const fs = require('fs');
const path = require('path');

const fichasMesaPath = path.join(__dirname, '..', 'data', 'fichas_mesa.json');
function carregarFichasMesa(mesaId) {
  try {
    const data = fs.readFileSync(fichasMesaPath, 'utf8');
    const fichasMesas = JSON.parse(data);
    return fichasMesas[mesaId] || { personagens: {} };
  } catch (error) {
    console.error('Erro ao carregar fichas da mesa:', error);
    return { personagens: {} };
  }
}
function salvarFichasMesa(mesaId, fichasMesa) {
  try {
    let fichasMesas = {};
    try {
      fichasMesas = JSON.parse(fs.readFileSync(fichasMesaPath, 'utf8'));
    } catch {}
    fichasMesas[mesaId] = fichasMesa;
    fs.writeFileSync(fichasMesaPath, JSON.stringify(fichasMesas, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar fichas da mesa:', error);
    return false;
  }
}
function obterFichaMesa(userId, mesaId) {
  const fichasMesa = carregarFichasMesa(mesaId);
  return fichasMesa.personagens[userId] || null;
}
function criarFichaMesa(userId, dadosFicha, mesaId) {
  const fichasMesa = carregarFichasMesa(mesaId);
  const ficha = {
    userId: userId,
    nome: dadosFicha.nome,
    pontos: dadosFicha.pontos || 0,
    forca: dadosFicha.forca || 0,
    habilidade: dadosFicha.habilidade || 0,
    resistencia: dadosFicha.resistencia || 0,
    armadura: dadosFicha.armadura || 0,
    poderDeFogo: dadosFicha.poderDeFogo || 0,
    pv: dadosFicha.pv || 0,
    pvMaximo: dadosFicha.pvMaximo || 0,
    pm: dadosFicha.pm || 0,
    pmMaximo: dadosFicha.pmMaximo || 0,
    px: dadosFicha.px || 0,
    vantagens: dadosFicha.vantagens || [],
    desvantagens: dadosFicha.desvantagens || [],
    tiposDeDano: dadosFicha.tiposDeDano || [],
    magiasConhecidas: dadosFicha.magiasConhecidas || [],
    dinheiro: dadosFicha.dinheiro || 0,
    itens: dadosFicha.itens || [],
    historia: dadosFicha.historia || '',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  };
  fichasMesa.personagens[userId] = ficha;
  if (salvarFichasMesa(mesaId, fichasMesa)) {
    return { sucesso: true, ficha: ficha };
  } else {
    return { sucesso: false, mensagem: 'Erro ao salvar ficha!' };
  }
}
function atualizarFichaMesa(userId, dadosAtualizacao, mesaId) {
  const fichasMesa = carregarFichasMesa(mesaId);
  if (!fichasMesa.personagens[userId]) {
    return { sucesso: false, mensagem: 'Ficha não encontrada!' };
  }
  const ficha = fichasMesa.personagens[userId];
  Object.keys(dadosAtualizacao).forEach(campo => {
    if (ficha.hasOwnProperty(campo)) {
      ficha[campo] = dadosAtualizacao[campo];
    }
  });
  ficha.atualizadoEm = new Date().toISOString();
  if (salvarFichasMesa(mesaId, fichasMesa)) {
    return { sucesso: true, ficha: ficha };
  } else {
    return { sucesso: false, mensagem: 'Erro ao atualizar ficha!' };
  }
}
function temFichaMesa(userId, mesaId) {
  const fichasMesa = carregarFichasMesa(mesaId);
  return !!fichasMesa.personagens[userId];
}
function obterPesoMaximoMesa(userId, mesaId) {
  const ficha = obterFichaMesa(userId, mesaId);
  if (!ficha) return 20;
  return ficha.forca * 2;
}
function calcularPvMaximo(resistencia) {
  return resistencia;
}
function calcularPmMaximo(habilidade) {
  return habilidade;
}
function calcularIniciativa(habilidade) {
  return habilidade;
}
function calcularFACorpoACorpo(habilidade, forca) {
  return habilidade + forca;
}
function calcularFALongaDistancia(habilidade, poderDeFogo) {
  return habilidade + poderDeFogo;
}
function calcularForcaDefesa(habilidade, armadura) {
  return habilidade + armadura;
}
function validarAtributos(atributos) {
  const { forca, habilidade, resistencia, armadura, poderDeFogo } = atributos;
  const todosAtributos = [forca, habilidade, resistencia, armadura, poderDeFogo];
  for (const attr of todosAtributos) {
    if (attr < 0 || attr > 20) {
      return { valido: false, mensagem: 'Atributos devem estar entre 0 e 20!' };
    }
  }
  return { valido: true };
}
function carregarFichas() { return { personagens: {} }; }
function salvarFichas() { return false; }
function obterFicha() { return null; }
function criarFicha() { return { sucesso: false, mensagem: 'Use o sistema de mesas!' }; }
function atualizarFicha() { return { sucesso: false, mensagem: 'Use o sistema de mesas!' }; }
function temFicha() { return false; }
function obterPesoMaximo() { return 20; }

module.exports = {
  carregarFichasMesa,
  salvarFichasMesa,
  obterFichaMesa,
  criarFichaMesa,
  atualizarFichaMesa,
  temFichaMesa,
  obterPesoMaximoMesa,
  calcularPvMaximo,
  calcularPmMaximo,
  calcularIniciativa,
  calcularFACorpoACorpo,
  calcularFALongaDistancia,
  calcularForcaDefesa,
  validarAtributos,
  carregarFichas,
  salvarFichas,
  obterFicha,
  criarFicha,
  atualizarFicha,
  temFicha,
  obterPesoMaximo
}; 