const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { obterInventarioMesa, carregarItens, buscarItemPorNome } = require('../utils/inventarioUtils');
const { requireActiveMesa } = require('../middleware/mesaMiddleware');
const { getActiveMesa } = require('../utils/mesaContext');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventario')
    .setDescription('🎒 Exibe seu inventário ou detalhes de um item específico')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('Nome do item para ver detalhes (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const itemNome = interaction.options.getString('item');

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

      const inventario = obterInventarioMesa(userId, mesaId);
      const itens = carregarItens();

      if (itemNome) {
        const item = buscarItemPorNome(itemNome);
        if (!item) {
          return interaction.reply({
            content: '❌ Item não encontrado!',
            ephemeral: true
          });
        }
        const itemInventario = inventario.itens.find(i => i.id === item.id);
        if (!itemInventario) {
          return interaction.reply({
            content: `❌ Você não possui **${item.nome}** no seu inventário!`,
            ephemeral: true
          });
        }
        const embed = new EmbedBuilder()
          .setTitle(`📦 ${item.nome}`)
          .setDescription(item.descricao)
          .setColor(0x0099ff)
          .addFields(
            { name: '🎯 Tipo', value: item.tipo, inline: true },
            { name: '⭐ Raridade', value: item.raridade, inline: true },
            { name: '📊 Quantidade', value: `${itemInventario.quantidade}x`, inline: true },
            { name: '⚖️ Peso', value: `${item.peso} kg`, inline: true },
            { name: '💰 Valor', value: `${item.valor} moedas`, inline: true }
          )
          .setFooter({ 
            text: `Solicitado por ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        if (item.dano) {
          embed.addFields({ name: '⚔️ Dano', value: item.dano, inline: true });
        }
        if (item.defesa) {
          embed.addFields({ name: '🛡️ Defesa', value: `${item.defesa}`, inline: true });
        }
        if (item.efeito) {
          embed.addFields({ name: '✨ Efeito', value: item.efeito, inline: true });
        }
        await interaction.reply({ embeds: [embed] });
        return;
      }

      if (inventario.itens.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🎒 Seu Inventário')
          .setDescription('Seu inventário está vazio! Use `/add-inventario` para adicionar itens.')
          .setColor(0xffff00)
          .addFields(
            { name: '⚖️ Peso', value: `${inventario.pesoAtual}/${inventario.pesoMaximo} kg`, inline: true },
            { name: '📦 Itens', value: '0', inline: true }
          )
          .setFooter({ 
            text: `Solicitado por ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL()
          })
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        return;
      }

      const itensPorTipo = {};
      inventario.itens.forEach(itemInventario => {
        const itemData = itens.itens[itemInventario.id];
        if (!itensPorTipo[itemData.tipo]) {
          itensPorTipo[itemData.tipo] = [];
        }
        itensPorTipo[itemData.tipo].push({
          ...itemData,
          quantidade: itemInventario.quantidade
        });
      });

      const embed = new EmbedBuilder()
        .setTitle('🎒 Seu Inventário')
        .setDescription(`Inventário de **${interaction.user.username}**`)
        .setColor(0x00ff00)
        .addFields(
          { name: '⚖️ Peso', value: `${inventario.pesoAtual}/${inventario.pesoMaximo} kg`, inline: true },
          { name: '📦 Total de Itens', value: `${inventario.itens.length}`, inline: true }
        )
        .setFooter({ 
          text: `Solicitado por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();
      for (const [tipo, itensTipo] of Object.entries(itensPorTipo)) {
        const emoji = {
          'arma': '⚔️',
          'armadura': '🛡️',
          'consumivel': '🪄',
          'magicos': '🔮'
        }[tipo] || '📦';
        const itensTexto = itensTipo
          .map(item => `${emoji} **${item.nome}** (${item.quantidade}x)`)
          .join('\n');
        embed.addFields({
          name: `${emoji} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`,
          value: itensTexto,
          inline: false
        });
      }
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro no comando inventario:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao acessar o inventário!',
        ephemeral: true
      });
    }
  },
}; 