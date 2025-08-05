require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`Comando carregado: ${command.data.name}`);
  } else {
    console.log(`[AVISO] O comando em ${filePath} está faltando propriedades obrigatórias.`);
  }
}

client.once('ready', () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  try {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error('Erro no autocomplete:', error);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'criar_ficha_descritivo_modal') {
        await handleCriarFichaDescritivoModal(interaction);
      } else if (interaction.customId === 'criar_ficha_atributos_modal') {
        await handleCriarFichaAtributosModal(interaction);
      } else if (interaction.customId === 'criar_mesa_modal') {
        await handleCriarMesaModal(interaction);
      }
      return;
    }

    if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
      return;
    }

    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Erro ao executar comando:', error);
        await interaction.reply({ 
          content: '❌ Erro ao executar o comando!', 
          ephemeral: true 
        });
      }
    }
  } catch (error) {
    console.error('Erro geral no interactionCreate:', error);
  }
});

async function handleCriarFichaDescritivoModal(interaction) {
  try {
    const userId = interaction.user.id;
    const nome = interaction.fields.getTextInputValue('nome');
    const vantagens = interaction.fields.getTextInputValue('vantagens') || '';
    const desvantagens = interaction.fields.getTextInputValue('desvantagens') || '';
    const historia = interaction.fields.getTextInputValue('historia') || '';

    const dadosTemp = {
      userId,
      nome,
      vantagens: vantagens ? vantagens.split(',').map(v => v.trim()) : [],
      desvantagens: desvantagens ? desvantagens.split(',').map(d => d.trim()) : [],
      historia
    };

    if (!global.dadosTempFichas) global.dadosTempFichas = {};
    global.dadosTempFichas[userId] = dadosTemp;

    const embed = new (require('discord.js').EmbedBuilder)()
      .setTitle('📋 Dados Descritivos Salvos!')
      .setDescription(`**Nome:** ${nome}`)
      .setColor(0x00ff00)
      .addFields(
        { name: '✨ Vantagens', value: vantagens || 'Nenhuma', inline: true },
        { name: '⚠️ Desvantagens', value: desvantagens || 'Nenhuma', inline: true },
        { name: '📖 História', value: historia ? (historia.length > 100 ? historia.substring(0, 100) + '...' : historia) : 'Não informada', inline: false }
      )
      .setFooter({ text: 'Clique no botão abaixo para continuar com os atributos' });

    const button = new (require('discord.js').ActionRowBuilder)()
      .addComponents(
        new (require('discord.js').ButtonBuilder)()
          .setCustomId('continuar_atributos')
          .setLabel('Continuar para Atributos')
          .setStyle(require('discord.js').ButtonStyle.Primary)
      );

    await interaction.reply({ 
      embeds: [embed], 
      components: [button],
      ephemeral: true 
    });
  } catch (error) {
    console.error('Erro ao processar modal descritivo:', error);
    await interaction.reply({
      content: '❌ Erro ao processar dados descritivos!',
      ephemeral: true
    });
  }
}

async function handleCriarFichaAtributosModal(interaction) {
  try {
    const userId = interaction.user.id;
    const forca = parseInt(interaction.fields.getTextInputValue('forca'));
    const habilidade = parseInt(interaction.fields.getTextInputValue('habilidade'));
    const resistencia = parseInt(interaction.fields.getTextInputValue('resistencia'));
    const armadura = parseInt(interaction.fields.getTextInputValue('armadura'));
    const poderDeFogo = parseInt(interaction.fields.getTextInputValue('poderDeFogo'));

    if (forca < 0 || forca > 20 || habilidade < 0 || habilidade > 20 || 
        resistencia < 0 || resistencia > 20 || armadura < 0 || armadura > 20 ||
        poderDeFogo < 0 || poderDeFogo > 20) {
      return interaction.reply({
        content: '❌ Características devem estar entre 0 e 20!',
        ephemeral: true
      });
    }

    const { criarFichaMesa, validarAtributos, calcularPvMaximo, calcularPmMaximo } = require('./utils/fichaUtils');
    const { getActiveMesa } = require('./utils/mesaContext');

    const validacao = validarAtributos({ forca, habilidade, resistencia, armadura, poderDeFogo });
    if (!validacao.valido) {
      return interaction.reply({
        content: `❌ ${validacao.mensagem}`,
        ephemeral: true
      });
    }

    const mesaId = getActiveMesa(interaction.channelId);
    if (!mesaId) {
      return interaction.reply({
        content: '❌ Nenhuma mesa ativa neste canal!',
        ephemeral: true
      });
    }

    const dadosTemp = global.dadosTempFichas?.[userId];
    if (!dadosTemp) {
      return interaction.reply({
        content: '❌ Dados descritivos não encontrados. Tente criar a ficha novamente.',
        ephemeral: true
      });
    }

    const pvMaximo = calcularPvMaximo(resistencia);
    const pmMaximo = calcularPmMaximo(habilidade);

    const resultado = criarFichaMesa(userId, {
      nome: dadosTemp.nome,
      forca,
      habilidade,
      resistencia,
      armadura,
      poderDeFogo,
      pv: pvMaximo,
      pvMaximo,
      pm: pmMaximo,
      pmMaximo,
      px: 0,
      dinheiro: 100,
      vantagens: dadosTemp.vantagens,
      desvantagens: dadosTemp.desvantagens,
      historia: dadosTemp.historia
    }, mesaId);

    if (global.dadosTempFichas) delete global.dadosTempFichas[userId];

    if (resultado.sucesso) {
      const embed = new (require('discord.js').EmbedBuilder)()
        .setTitle('✅ Ficha 3D&T Criada com Sucesso!')
        .setDescription(`**${dadosTemp.nome}** - Defensor de Tóquio`)
        .setColor(0x00ff00)
        .addFields(
          { 
            name: '⚔️ Características', 
            value: `**Força:** ${forca}\n**Habilidade:** ${habilidade}\n**Resistência:** ${resistencia}\n**Armadura:** ${armadura}\n**Poder de Fogo:** ${poderDeFogo}`, 
            inline: true 
          },
          { 
            name: '🛡️ Pontos', 
            value: `**PV:** ${pvMaximo}\n**PM:** ${pmMaximo}\n**PX:** 0`, 
            inline: true 
          },
          { 
            name: '💰 Recursos', 
            value: `**Peso Máximo:** ${forca * 2} kg\n**Dinheiro:** 100 moedas`, 
            inline: true 
          }
        )
        .setFooter({ 
          text: `Criado por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({
        content: `❌ ${resultado.mensagem}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Erro ao processar modal de atributos:', error);
    await interaction.reply({
      content: '❌ Erro ao criar ficha!',
      ephemeral: true
    });
  }
}

async function handleButtonInteraction(interaction) {
  try {
    const customId = interaction.customId;
    
    if (customId.startsWith('editar_')) {
      await handleEditarFichaButton(interaction);
    } else if (customId === 'continuar_atributos') {
      await handleContinuarAtributos(interaction);
    } else if (customId.startsWith('ativar_mesa_')) {
      await handleAtivarMesaButton(interaction);
    }
  } catch (error) {
    console.error('Erro ao processar botão:', error);
    await interaction.reply({
      content: '❌ Erro ao processar botão!',
      ephemeral: true
    });
  }
}

async function handleEditarFichaButton(interaction) {
  const tipo = interaction.customId.replace('editar_', '');
  
  await interaction.reply({
    content: `✏️ Funcionalidade de edição de ${tipo} será implementada em breve!`,
    ephemeral: true
  });
}

async function handleContinuarAtributos(interaction) {
  try {
    const userId = interaction.user.id;
    
    const dadosTemp = global.dadosTempFichas?.[userId];
    if (!dadosTemp) {
      return interaction.reply({
        content: '❌ Dados descritivos não encontrados. Tente criar a ficha novamente.',
        ephemeral: true
      });
    }

    const modal = new (require('discord.js').ModalBuilder)()
      .setCustomId('criar_ficha_atributos_modal')
      .setTitle('Criar Ficha 3D&T - Passo 2/2');

    const forcaInput = new (require('discord.js').TextInputBuilder)()
      .setCustomId('forca')
      .setLabel('Força (0-20)')
      .setStyle(require('discord.js').TextInputStyle.Short)
      .setPlaceholder('Ex: 15')
      .setRequired(true)
      .setMaxLength(2);

    const habilidadeInput = new (require('discord.js').TextInputBuilder)()
      .setCustomId('habilidade')
      .setLabel('Habilidade (0-20)')
      .setStyle(require('discord.js').TextInputStyle.Short)
      .setPlaceholder('Ex: 14')
      .setRequired(true)
      .setMaxLength(2);

    const resistenciaInput = new (require('discord.js').TextInputBuilder)()
      .setCustomId('resistencia')
      .setLabel('Resistência (0-20)')
      .setStyle(require('discord.js').TextInputStyle.Short)
      .setPlaceholder('Ex: 12')
      .setRequired(true)
      .setMaxLength(2);

    const armaduraInput = new (require('discord.js').TextInputBuilder)()
      .setCustomId('armadura')
      .setLabel('Armadura (0-20)')
      .setStyle(require('discord.js').TextInputStyle.Short)
      .setPlaceholder('Ex: 8')
      .setRequired(true)
      .setMaxLength(2);

    const poderDeFogoInput = new (require('discord.js').TextInputBuilder)()
      .setCustomId('poderDeFogo')
      .setLabel('Poder de Fogo (0-20)')
      .setStyle(require('discord.js').TextInputStyle.Short)
      .setPlaceholder('Ex: 10')
      .setRequired(true)
      .setMaxLength(2);

    const primeiraLinha = new (require('discord.js').ActionRowBuilder)().addComponents(forcaInput);
    const segundaLinha = new (require('discord.js').ActionRowBuilder)().addComponents(habilidadeInput);
    const terceiraLinha = new (require('discord.js').ActionRowBuilder)().addComponents(resistenciaInput);
    const quartaLinha = new (require('discord.js').ActionRowBuilder)().addComponents(armaduraInput);
    const quintaLinha = new (require('discord.js').ActionRowBuilder)().addComponents(poderDeFogoInput);

    modal.addComponents(primeiraLinha, segundaLinha, terceiraLinha, quartaLinha, quintaLinha);

    await interaction.showModal(modal);
  } catch (error) {
    console.error('Erro ao mostrar modal de atributos:', error);
    await interaction.reply({
      content: '❌ Erro ao mostrar modal de atributos!',
      ephemeral: true
    });
  }
}

async function handleCriarMesaModal(interaction) {
  try {
    const nome = interaction.fields.getTextInputValue('nome');
    const descricao = interaction.fields.getTextInputValue('descricao') || '';
    const sistema = interaction.fields.getTextInputValue('sistema');
    const nivelMaximo = parseInt(interaction.fields.getTextInputValue('nivelMaximo'));

    if (!nome || !sistema || isNaN(nivelMaximo) || nivelMaximo < 1 || nivelMaximo > 100) {
      return interaction.reply({
        content: '❌ Dados inválidos! Verifique o nome, sistema e nível máximo.',
        ephemeral: true
      });
    }

    const { criarMesa, gerarMesaId } = require('./utils/mesaUtils');

    const mesaId = gerarMesaId();
    const resultado = criarMesa({
      id: mesaId,
      nome,
      descricao,
      mestreId: interaction.user.id,
      configuracoes: {
        sistema,
        nivelMaximo,
        permitirPvNegativo: false
      }
    });

    if (resultado.sucesso) {
      const embed = new (require('discord.js').EmbedBuilder)()
        .setTitle('✅ Mesa Criada com Sucesso!')
        .setDescription(`**${nome}**`)
        .setColor(0x00ff00)
        .addFields(
          { name: '🎮 Sistema', value: sistema, inline: true },
          { name: '📈 Nível Máximo', value: nivelMaximo.toString(), inline: true },
          { name: '👑 Mestre', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setFooter({ 
          text: `ID: ${mesaId}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      if (descricao) {
        embed.addFields({
          name: '📖 Descrição',
          value: descricao,
          inline: false
        });
      }

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({
        content: `❌ ${resultado.mensagem}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Erro ao processar modal de mesa:', error);
    await interaction.reply({
      content: '❌ Erro ao criar mesa!',
      ephemeral: true
    });
  }
}

async function handleAtivarMesaButton(interaction) {
  try {
    const mesaId = interaction.customId.replace('ativar_mesa_', '');
    
    const { obterMesa } = require('./utils/mesaUtils');
    const { setActiveMesa } = require('./utils/mesaContext');

    const mesa = obterMesa(mesaId);
    if (!mesa) {
      return interaction.reply({
        content: '❌ Mesa não encontrada!',
        ephemeral: true
      });
    }

    if (mesa.mestreId !== interaction.user.id) {
      return interaction.reply({
        content: '❌ Você não é o mestre desta mesa!',
        ephemeral: true
      });
    }

    const sucesso = setActiveMesa(interaction.channelId, mesaId);
    
    if (sucesso) {
      const embed = new (require('discord.js').EmbedBuilder)()
        .setTitle('🎲 Mesa Ativada!')
        .setDescription(`**${mesa.nome}** está agora ativa neste canal.`)
        .setColor(0x00ff00)
        .addFields(
          { name: '🎮 Sistema', value: mesa.configuracoes.sistema, inline: true },
          { name: '📈 Nível Máximo', value: mesa.configuracoes.nivelMaximo.toString(), inline: true },
          { name: '👑 Mestre', value: `<@${mesa.mestreId}>`, inline: true }
        )
        .setFooter({ 
          text: `Canal: #${interaction.channel.name}`,
          iconURL: interaction.guild.iconURL()
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({
        content: '❌ Erro ao ativar mesa!',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Erro ao ativar mesa:', error);
    await interaction.reply({
      content: '❌ Erro ao ativar mesa!',
      ephemeral: true
    });
  }
}

client.login(process.env.TOKEN);
