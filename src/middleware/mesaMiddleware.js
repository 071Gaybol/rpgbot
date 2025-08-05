const { getActiveMesa } = require('../utils/mesaContext');
const { obterMesa } = require('../utils/mesaUtils');
async function requireActiveMesa(interaction) {
  const mesaAtiva = getActiveMesa(interaction.channelId);
  
  if (!mesaAtiva) {
    await interaction.reply({
      content: '❌ Nenhuma mesa ativa neste canal! Peça ao mestre para ativar uma mesa.',
      ephemeral: true
    });
    return false;
  }
  
  const mesa = obterMesa(mesaAtiva);
  if (!mesa) {
    await interaction.reply({
      content: '❌ Mesa ativa não encontrada! Peça ao mestre para reativar a mesa.',
      ephemeral: true
    });
    return false;
  }
  
  return mesa;
}
async function requireMestreRole(interaction) {
  const cargoMestre = interaction.member.roles.cache.find(role => 
    role.name === 'Mestre'
  );

  if (!cargoMestre) {
    await interaction.reply({
      content: '❌ Você precisa ter o cargo "Mestre" para usar este comando!',
      ephemeral: true
    });
    return false;
  }
  
  return true;
}
async function requireMesaMestre(interaction, mesaId) {
  const { isMestreMesa } = require('../utils/mesaUtils');
  
  if (!isMestreMesa(mesaId, interaction.user.id)) {
    await interaction.reply({
      content: '❌ Você não é o mestre desta mesa!',
      ephemeral: true
    });
    return false;
  }
  
  return true;
}
async function requireActiveMesaAndMestre(interaction) {
  const mesa = await requireActiveMesa(interaction);
  if (!mesa) return false;
  
  const isMestre = await requireMesaMestre(interaction, mesa.id);
  if (!isMestre) return false;
  
  return mesa;
}

module.exports = {
  requireActiveMesa,
  requireMestreRole,
  requireMesaMestre,
  requireActiveMesaAndMestre
}; 