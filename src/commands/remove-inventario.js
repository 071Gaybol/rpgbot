const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { removerItemMesa, obterInventarioMesa, buscarItemPorNome } = require('../utils/inventarioUtils');
const { requireActiveMesa } = require('../middleware/mesaMiddleware');
const { getActiveMesa } = require('../utils/mesaContext');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-inventario')
    .setDescription('➖ Remove um item do seu inventário')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Nome do item para remover')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Quantidade do item para remover (padrão: 1)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const itemNome = interaction.options.getString('item');
      const quantidade = interaction.options.getInteger('quantidade') || 1;

      const cargoRPG = interaction.member.roles.cache.find(role => 
        role.name === 'Rpg homens'
      );
      if (!cargoRPG) {
        return interaction.reply({
          content: '❌ Você precisa ter o cargo "Rpg homens" para usar este comando!',
          ephemeral: true
        });
      }

      const mesa = await requireActiveMesa(interaction);
      if (!mesa) return;
      const mesaId = mesa.id;

      const item = buscarItemPorNome(itemNome);
      if (!item) {
        return interaction.reply({
          content: '❌ Item não encontrado!',
          ephemeral: true
        });
      }

      const inventario = obterInventarioMesa(userId, mesaId);
      const itemInventario = inventario.itens.find(i => i.id === item.id);
      if (!itemInventario) {
        return interaction.reply({
          content: `❌ Você não possui **${item.nome}** no seu inventário!`,
          ephemeral: true
        });
      }
      if (itemInventario.quantidade < quantidade) {
        return interaction.reply({
          content: `❌ Você só possui ${itemInventario.quantidade}x **${item.nome}**!`,
          ephemeral: true
        });
      }

      const resultado = removerItemMesa(userId, item.id, quantidade, mesaId);
      if (!resultado.sucesso) {
        return interaction.reply({
          content: `❌ ${resultado.mensagem}`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Item Removido!')
        .setDescription(resultado.mensagem)
        .setColor(0xff6600)
        .addFields(
          { name: '📦 Item', value: item.nome, inline: true },
          { name: '📊 Quantidade Removida', value: `${quantidade}x`, inline: true },
          { name: '⚖️ Peso Removido', value: `${item.peso * quantidade} kg`, inline: true },
          { name: '🎯 Tipo', value: item.tipo, inline: true },
          { name: '⭐ Raridade', value: item.raridade, inline: true },
          { name: '💰 Valor Perdido', value: `${item.valor * quantidade} moedas`, inline: true }
        )
        .setFooter({ 
          text: `Removido por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro no comando remove-inventario:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao remover o item!',
        ephemeral: true
      });
    }
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const userId = interaction.user.id;
    const mesaId = getActiveMesa(interaction.channelId);
    if (!mesaId) return await interaction.respond([]);
    const inventario = require('../utils/inventarioUtils').obterInventarioMesa(userId, mesaId);
    const itens = require('../data/itens.json');
    const choices = inventario.itens.map(itemInventario => {
      const item = itens.itens[itemInventario.id];
      return {
        name: `${item.nome} (${itemInventario.quantidade}x)`,
        value: item.nome
      };
    });
    const filtered = choices.filter(choice => 
      choice.name.toLowerCase().includes(focusedValue.toLowerCase())
    );
    await interaction.respond(
      filtered.slice(0, 25).map(choice => ({
        name: choice.name,
        value: choice.value
      }))
    );
  },
}; 