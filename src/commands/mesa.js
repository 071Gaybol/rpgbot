const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { requireMestreRole, requireActiveMesa } = require('../middleware/mesaMiddleware');
const { criarMesa, listarMesasMestre, obterMesa, gerarMesaId } = require('../utils/mesaUtils');
const { setActiveMesa, getActiveMesa, removeActiveMesa } = require('../utils/mesaContext');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mesa')
    .setDescription('🎲 Gerencia mesas de RPG')
    .addSubcommand(subcommand =>
      subcommand
        .setName('criar')
        .setDescription('Mestre: Cria uma nova mesa')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ativar')
        .setDescription('Mestre: Ativa uma mesa neste canal')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('desativar')
        .setDescription('Mestre: Desativa a mesa ativa deste canal')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('listar')
        .setDescription('Mestre: Lista suas mesas')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Mostra informações da mesa ativa')
    ),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'criar') {
        await this.criarMesa(interaction);
      } else if (subcommand === 'ativar') {
        await this.ativarMesa(interaction);
      } else if (subcommand === 'desativar') {
        await this.desativarMesa(interaction);
      } else if (subcommand === 'listar') {
        await this.listarMesas(interaction);
      } else if (subcommand === 'info') {
        await this.infoMesa(interaction);
      }

    } catch (error) {
      console.error('Erro no comando mesa:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao processar o comando!',
        ephemeral: true
      });
    }
  },

  async criarMesa(interaction) {
    const isMestre = await requireMestreRole(interaction);
    if (!isMestre) return;

    const modal = new ModalBuilder()
      .setCustomId('criar_mesa_modal')
      .setTitle('Criar Nova Mesa');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome da Mesa')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Defensores de Tóquio - Campanha 1')
      .setRequired(true)
      .setMaxLength(100);

    const descricaoInput = new TextInputBuilder()
      .setCustomId('descricao')
      .setLabel('Descrição (opcional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Descreva sua campanha...')
      .setRequired(false)
      .setMaxLength(500);

    const sistemaInput = new TextInputBuilder()
      .setCustomId('sistema')
      .setLabel('Sistema de RPG')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 3D&T, D&D, Pathfinder')
      .setRequired(true)
      .setMaxLength(50);

    const nivelMaximoInput = new TextInputBuilder()
      .setCustomId('nivelMaximo')
      .setLabel('Nível Máximo')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: 20')
      .setRequired(true)
      .setMaxLength(3);

    const primeiraLinha = new ActionRowBuilder().addComponents(nomeInput);
    const segundaLinha = new ActionRowBuilder().addComponents(descricaoInput);
    const terceiraLinha = new ActionRowBuilder().addComponents(sistemaInput);
    const quartaLinha = new ActionRowBuilder().addComponents(nivelMaximoInput);

    modal.addComponents(primeiraLinha, segundaLinha, terceiraLinha, quartaLinha);

    await interaction.showModal(modal);
  },

  async ativarMesa(interaction) {
    const isMestre = await requireMestreRole(interaction);
    if (!isMestre) return;

    const mesas = listarMesasMestre(interaction.user.id);
    
    if (mesas.length === 0) {
      return interaction.reply({
        content: '❌ Você não possui mesas criadas! Use `/mesa criar` para criar uma.',
        ephemeral: true
      });
    }

    const rows = [];
    const buttonsPerRow = 3;
    
    for (let i = 0; i < mesas.length; i += buttonsPerRow) {
      const row = new ActionRowBuilder();
      const mesaGroup = mesas.slice(i, i + buttonsPerRow);
      
      mesaGroup.forEach(mesa => {
        const button = new ButtonBuilder()
          .setCustomId(`ativar_mesa_${mesa.id}`)
          .setLabel(mesa.nome.length > 20 ? mesa.nome.substring(0, 17) + '...' : mesa.nome)
          .setStyle(ButtonStyle.Primary);
        
        row.addComponents(button);
      });
      
      rows.push(row);
    }

    const embed = new EmbedBuilder()
      .setTitle('🎲 Ativar Mesa')
      .setDescription('Escolha uma mesa para ativar neste canal:')
      .setColor(0x0099ff);

    await interaction.reply({
      embeds: [embed],
      components: rows,
      ephemeral: true
    });
  },

  async listarMesas(interaction) {
    const isMestre = await requireMestreRole(interaction);
    if (!isMestre) return;

    const mesas = listarMesasMestre(interaction.user.id);
    
    if (mesas.length === 0) {
      return interaction.reply({
        content: '❌ Você não possui mesas criadas! Use `/mesa criar` para criar uma.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('📋 Suas Mesas')
      .setDescription(`Você possui **${mesas.length}** mesa(s):`)
      .setColor(0x00ff00);

    mesas.forEach((mesa, index) => {
      const status = mesa.status === 'ativa' ? '🟢 Ativa' : '🔴 Inativa';
      const canal = mesa.canalId ? `<#${mesa.canalId}>` : 'Nenhum';
      
      embed.addFields({
        name: `${index + 1}. ${mesa.nome}`,
        value: `**Status:** ${status}\n**Canal:** ${canal}\n**Sistema:** ${mesa.configuracoes.sistema}\n**Criada:** ${new Date(mesa.criadaEm).toLocaleDateString('pt-BR')}`,
        inline: true
      });
    });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  },

  async infoMesa(interaction) {
    const mesa = await requireActiveMesa(interaction);
    if (!mesa) return;

    const embed = new EmbedBuilder()
      .setTitle(`🎲 ${mesa.nome}`)
      .setDescription(mesa.descricao || 'Sem descrição')
      .setColor(0x0099ff)
      .addFields(
        { name: '👑 Mestre', value: `<@${mesa.mestreId}>`, inline: true },
        { name: '📊 Status', value: mesa.status === 'ativa' ? '🟢 Ativa' : '🔴 Inativa', inline: true },
        { name: '🎮 Sistema', value: mesa.configuracoes.sistema, inline: true },
        { name: '📈 Nível Máximo', value: mesa.configuracoes.nivelMaximo.toString(), inline: true },
        { name: '📅 Criada em', value: new Date(mesa.criadaEm).toLocaleDateString('pt-BR'), inline: true },
        { name: '🔄 Atualizada', value: new Date(mesa.atualizadaEm).toLocaleDateString('pt-BR'), inline: true }
      )
      .setFooter({ 
        text: `ID: ${mesa.id}`,
        iconURL: interaction.guild.iconURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  async desativarMesa(interaction) {
    const isMestre = await requireMestreRole(interaction);
    if (!isMestre) return;

    const mesaId = getActiveMesa(interaction.channelId);
    if (!mesaId) {
      return interaction.reply({
        content: '❌ Não há mesa ativa neste canal!',
        ephemeral: true
      });
    }

    const mesa = obterMesa(mesaId);
    if (!mesa) {
      removeActiveMesa(interaction.channelId);
      return interaction.reply({
        content: '⚠️ Mesa ativa não encontrada nos dados, mas foi removida do canal. Caso persista, contate o suporte.',
        ephemeral: true
      });
    }

    removeActiveMesa(interaction.channelId);

    const embed = new EmbedBuilder()
      .setTitle('🔕 Mesa Desativada')
      .setDescription(`A mesa **${mesa.nome}** foi desativada neste canal.`)
      .setColor(0xff0000)
      .addFields(
        { name: '🎮 Sistema', value: mesa.configuracoes.sistema, inline: true },
        { name: '👑 Mestre', value: `<@${mesa.mestreId}>`, inline: true }
      )
      .setFooter({
        text: `Canal: #${interaction.channel.name}`,
        iconURL: interaction.guild.iconURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ativar') {
      try {
        const mesas = listarMesasMestre(interaction.user.id);
        
        const filtered = mesas.filter(mesa => 
          mesa.nome.toLowerCase().includes(focusedValue.toLowerCase())
        );

        const choices = filtered.slice(0, 25).map(mesa => ({
          name: mesa.nome,
          value: mesa.id
        }));

        await interaction.respond(choices);
      } catch (error) {
        console.error('Erro no autocomplete:', error);
        await interaction.respond([]);
      }
    }
  }
}; 