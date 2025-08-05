const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { adicionarItemMesa, buscarItemPorNome, carregarItens } = require('../utils/inventarioUtils');
const { requireActiveMesa } = require('../middleware/mesaMiddleware');
const { getActiveMesa } = require('../utils/mesaContext');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-inventario')
    .setDescription('➕ Adiciona um item ao seu inventário')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Nome do item para adicionar')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('quantidade')
        .setDescription('Quantidade do item (padrão: 1)')
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

      const resultado = adicionarItemMesa(userId, item.id, quantidade, mesaId);
      if (!resultado.sucesso) {
        return interaction.reply({
          content: `❌ ${resultado.mensagem}`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Item Adicionado!')
        .setDescription(resultado.mensagem)
        .setColor(0x00ff00)
        .addFields(
          { name: '📦 Item', value: item.nome, inline: true },
          { name: '📊 Quantidade', value: `${quantidade}x`, inline: true },
          { name: '⚖️ Peso', value: `${item.peso * quantidade} kg`, inline: true },
          { name: '🎯 Tipo', value: item.tipo, inline: true },
          { name: '⭐ Raridade', value: item.raridade, inline: true },
          { name: '💰 Valor', value: `${item.valor * quantidade} moedas`, inline: true }
        )
        .setFooter({ 
          text: `Adicionado por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro no comando add-inventario:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao adicionar o item!',
        ephemeral: true
      });
    }
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const itens = require('../data/itens.json');
    const choices = Object.values(itens.itens).map(item => ({
      name: item.nome,
      value: item.nome
    }));
    const filtered = choices.filter(choice => 
      choice.name.toLowerCase().includes(focusedValue.toLowerCase())
    );
    await interaction.respond(
      filtered.slice(0, 25).map(choice => ({
        name: choice.name,
        value: choice.name
      }))
    );
  },
}; 