const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { obterFichaMesa, criarFichaMesa, temFichaMesa, validarAtributos, calcularPvMaximo, calcularPmMaximo, carregarFichasMesa } = require('../utils/fichaUtils');
const { requireActiveMesa } = require('../middleware/mesaMiddleware');
const { getActiveMesa } = require('../utils/mesaContext');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ficha')
    .setDescription('📋 Gerencia sua ficha de personagem 3D&T')
    .addSubcommand(subcommand =>
      subcommand
        .setName('criar')
        .setDescription('Cria uma nova ficha de personagem 3D&T')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver')
        .setDescription('Exibe sua ficha de personagem')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ver-mestre')
        .setDescription('Mestre: Exibe ficha de outro jogador')
        .addStringOption(option =>
          option
            .setName('personagem')
            .setDescription('Nome do personagem')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('editar')
        .setDescription('Edita sua ficha de personagem')
    ),

  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const subcommand = interaction.options.getSubcommand();

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

      if (subcommand === 'criar') {
        await this.criarFicha(interaction, userId, mesaId);
      } else if (subcommand === 'ver') {
        await this.verFicha(interaction, userId, mesaId);
      } else if (subcommand === 'ver-mestre') {
        await this.verFichaMestre(interaction, mesaId);
      } else if (subcommand === 'editar') {
        await this.editarFicha(interaction, userId, mesaId);
      }

    } catch (error) {
      console.error('Erro no comando ficha:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao processar a ficha!',
        ephemeral: true
      });
    }
  },

  async criarFicha(interaction, userId, mesaId) {
    if (temFichaMesa(userId, mesaId)) {
      return interaction.reply({
        content: '❌ Você já possui uma ficha nesta mesa! Use `/ficha editar` para modificá-la.',
        ephemeral: true
      });
    }
    const modal = new ModalBuilder()
      .setCustomId('criar_ficha_descritivo_modal')
      .setTitle('Criar Ficha 3D&T - Passo 1/2');

    const nomeInput = new TextInputBuilder()
      .setCustomId('nome')
      .setLabel('Nome do Personagem')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Ex: Kamen Rider, Ultraman, Godzilla')
      .setRequired(true)
      .setMaxLength(50);

    const vantagensInput = new TextInputBuilder()
      .setCustomId('vantagens')
      .setLabel('Vantagens (opcional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex: Super Força, Voo, Regeneração')
      .setRequired(false)
      .setMaxLength(500);

    const desvantagensInput = new TextInputBuilder()
      .setCustomId('desvantagens')
      .setLabel('Desvantagens (opcional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex: Fraqueza à água, Medo de altura')
      .setRequired(false)
      .setMaxLength(500);

    const historiaInput = new TextInputBuilder()
      .setCustomId('historia')
      .setLabel('História (opcional)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Conte a história do seu personagem...')
      .setRequired(false)
      .setMaxLength(1000);

    const primeiraLinha = new ActionRowBuilder().addComponents(nomeInput);
    const segundaLinha = new ActionRowBuilder().addComponents(vantagensInput);
    const terceiraLinha = new ActionRowBuilder().addComponents(desvantagensInput);
    const quartaLinha = new ActionRowBuilder().addComponents(historiaInput);

    modal.addComponents(primeiraLinha, segundaLinha, terceiraLinha, quartaLinha);

    await interaction.showModal(modal);
  },

  async verFicha(interaction, userId, mesaId) {
    const ficha = obterFichaMesa(userId, mesaId);
    
    if (!ficha) {
      return interaction.reply({
        content: '❌ Você não possui uma ficha nesta mesa! Use `/ficha criar` para criar uma.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`📋 Ficha de ${ficha.nome}`)
      .setDescription('**3D&T • Defensores de Tóquio 3ª Edição Alpha**')
      .setColor(0x0099ff)
      .addFields(
        { 
          name: '⚔️ Características', 
          value: `**Força:** ${ficha.forca}\n**Habilidade:** ${ficha.habilidade}\n**Resistência:** ${ficha.resistencia}\n**Armadura:** ${ficha.armadura}\n**Poder de Fogo:** ${ficha.poderDeFogo}`, 
          inline: true 
        },
        { 
          name: '🛡️ Pontos', 
          value: `**PV:** ${ficha.pv}/${ficha.pvMaximo}\n**PM:** ${ficha.pm}/${ficha.pmMaximo}\n**PX:** ${ficha.px}`, 
          inline: true 
        },
        { 
          name: '💰 Recursos', 
          value: `**Dinheiro:** ${ficha.dinheiro} moedas\n**Peso Máximo:** ${ficha.forca * 2} kg`, 
          inline: true 
        }
      )
      .setFooter({ 
        text: `Criado em ${new Date(ficha.criadoEm).toLocaleDateString('pt-BR')}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    if (ficha.vantagens && ficha.vantagens.length > 0) {
      embed.addFields({
        name: '✨ Vantagens',
        value: ficha.vantagens.join(', '),
        inline: false
      });
    }

    if (ficha.desvantagens && ficha.desvantagens.length > 0) {
      embed.addFields({
        name: '⚠️ Desvantagens',
        value: ficha.desvantagens.join(', '),
        inline: false
      });
    }

    if (ficha.tiposDeDano && ficha.tiposDeDano.length > 0) {
      embed.addFields({
        name: '💥 Tipos de Dano',
        value: ficha.tiposDeDano.join(', '),
        inline: false
      });
    }

    if (ficha.magiasConhecidas && ficha.magiasConhecidas.length > 0) {
      embed.addFields({
        name: '🔮 Magias Conhecidas',
        value: ficha.magiasConhecidas.join(', '),
        inline: false
      });
    }

    if (ficha.historia) {
      embed.addFields({
        name: '📖 História',
        value: ficha.historia.length > 1000 ? ficha.historia.substring(0, 1000) + '...' : ficha.historia,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  },

  async verFichaMestre(interaction, mesaId) 
    const cargoMestre = interaction.member.roles.cache.find(role => 
      role.name === 'Mestre'
    );

    if (!cargoMestre) {
      return interaction.reply({
        content: '❌ Você precisa ter o cargo "Mestre" para usar este comando!',
        ephemeral: true
      });
    }

    const nomePersonagem = interaction.options.getString('personagem');
  
    const fichas = carregarFichasMesa(mesaId);
    const fichaEncontrada = Object.values(fichas.personagens).find(ficha => 
      ficha.nome.toLowerCase().includes(nomePersonagem.toLowerCase())
    );

    if (!fichaEncontrada) {
      return interaction.reply({
        content: `❌ Personagem "${nomePersonagem}" não encontrado nesta mesa!`,
        ephemeral: true
      });
    }
    const userId = Object.keys(fichas.personagens).find(key => 
      fichas.personagens[key].nome === fichaEncontrada.nome
    );

    const embed = new EmbedBuilder()
      .setTitle(`📋 Ficha de ${fichaEncontrada.nome} (Mestre)`)
      .setDescription('**3D&T • Defensores de Tóquio 3ª Edição Alpha**')
      .setColor(0xff66
      .addFields(
        { 
          name: '⚔️ Características', 
          value: `**Força:** ${fichaEncontrada.forca}\n**Habilidade:** ${fichaEncontrada.habilidade}\n**Resistência:** ${fichaEncontrada.resistencia}\n**Armadura:** ${fichaEncontrada.armadura}\n**Poder de Fogo:** ${fichaEncontrada.poderDeFogo}`, 
          inline: true 
        },
        { 
          name: '🛡️ Pontos', 
          value: `**PV:** ${fichaEncontrada.pv}/${fichaEncontrada.pvMaximo}\n**PM:** ${fichaEncontrada.pm}/${fichaEncontrada.pmMaximo}\n**PX:** ${fichaEncontrada.px}`, 
          inline: true 
        },
        { 
          name: '💰 Recursos', 
          value: `**Dinheiro:** ${fichaEncontrada.dinheiro} moedas\n**Peso Máximo:** ${fichaEncontrada.forca * 2} kg`, 
          inline: true 
        }
      )
      .setFooter({ 
        text: `Visualizado por ${interaction.user.username} (Mestre)`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    if (fichaEncontrada.vantagens && fichaEncontrada.vantagens.length > 0) {
      embed.addFields({
        name: '✨ Vantagens',
        value: fichaEncontrada.vantagens.join(', '),
        inline: false
      });
    }

    if (fichaEncontrada.desvantagens && fichaEncontrada.desvantagens.length > 0) {
      embed.addFields({
        name: '⚠️ Desvantagens',
        value: fichaEncontrada.desvantagens.join(', '),
        inline: false
      });
    }

    if (fichaEncontrada.tiposDeDano && fichaEncontrada.tiposDeDano.length > 0) {
      embed.addFields({
        name: '💥 Tipos de Dano',
        value: fichaEncontrada.tiposDeDano.join(', '),
        inline: false
      });
    }

    if (fichaEncontrada.magiasConhecidas && fichaEncontrada.magiasConhecidas.length > 0) {
      embed.addFields({
        name: '🔮 Magias Conhecidas',
        value: fichaEncontrada.magiasConhecidas.join(', '),
        inline: false
      });
    }

    if (fichaEncontrada.historia) {
      embed.addFields({
        name: '📖 História',
        value: fichaEncontrada.historia.length > 1000 ? fichaEncontrada.historia.substring(0, 1000) + '...' : fichaEncontrada.historia,
        inline: false
      });
    }

    await interaction.reply({ embeds: [embed] });
  },

  async editarFicha(interaction, userId, mesaId) {
    const ficha = obterFichaMesa(userId, mesaId);
    
    if (!ficha) {
      return interaction.reply({
        content: '❌ Você não possui uma ficha nesta mesa! Use `/ficha criar` para criar uma.',
        ephemeral: true
      });
    }
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('editar_caracteristicas')
          .setLabel('Características')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('editar_pontos')
          .setLabel('Pontos')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('editar_vantagens')
          .setLabel('Vantagens')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('editar_historia')
          .setLabel('História')
          .setStyle(ButtonStyle.Secondary)
      );

    const embed = new EmbedBuilder()
      .setTitle('✏️ Editar Ficha 3D&T')
      .setDescription('Escolha o que deseja editar:')
      .setColor(0xffff00);

    await interaction.reply({ 
      embeds: [embed], 
      components: [row],
      ephemeral: true 
    });
  },

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const subcommand = interaction.options.getSubcommand()
    if (subcommand === 'ver-mestre') {
      try {
        const mesaId = getActiveMesa(interaction.channelId);
        if (!mesaId) return await interaction.respond([]);
        const fichas = carregarFichasMesa(mesaId);
        const nomesPersonagens = Object.values(fichas.personagens).map(ficha => ficha.nome);
        const filtered = nomesPersonagens.filter(nome => 
          nome.toLowerCase().includes(focusedValue.toLowerCase())
        );
        const choices = filtered.slice(0, 25).map(nome => ({
          name: nome,
          value: nome
        }));
        await interaction.respond(choices);
      } catch (error) {
        console.error('Erro no autocomplete:', error);
        await interaction.respond([]);
      }
    }
  }
}; 