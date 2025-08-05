const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const rollMessagesPath = path.join(__dirname, '..', 'data', 'rollMessages.json');
const rollMessages = JSON.parse(fs.readFileSync(rollMessagesPath, 'utf8'));

module.exports = {
  data: new SlashCommandBuilder()
    .setName('teste')
    .setDescription('🎲 Rola um ou mais dados com mensagens personalizadas')
    .addStringOption(option =>
      option.setName('dado')
        .setDescription('Formato do dado (ex: d20, 6, 2d6, 3d100)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('modificador')
        .setDescription('Modificador opcional (ex: +5, -2)')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      let dadoInput = interaction.options.getString('dado');
      const modificadorInput = interaction.options.getString('modificador') || '';

      if (!dadoInput) {
        dadoInput = '1d6';
      } else {
        dadoInput = dadoInput.toLowerCase();
        if (/^\d+$/.test(dadoInput)) {
          dadoInput = `1d${dadoInput}`;
        } else if (/^d\d+$/.test(dadoInput)) {
          dadoInput = `1${dadoInput}`;
        }
      }

      const dadoMatch = dadoInput.match(/^(\d+)d(\d+)$/);
      if (!dadoMatch) {
        return interaction.reply({
          content: '❌ Formato inválido! Use: `/roll d20`, `/roll 6`, `/roll 2d6`, etc.',
          ephemeral: true
        });
      }
      const quantidade = parseInt(dadoMatch[1]);
      const faces = parseInt(dadoMatch[2]);
      if (quantidade < 1 || quantidade > 20 || faces < 2 || faces > 1000) {
        return interaction.reply({
          content: '❌ Quantidade de dados (1-20) ou faces (2-1000) fora do permitido.',
          ephemeral: true
        });
      }

      let modificador = 0;
      let modificadorTexto = '';
      if (modificadorInput) {
        const modMatch = modificadorInput.match(/^([+-]?\d+)$/);
        if (modMatch) {
          modificador = parseInt(modMatch[1]);
          modificadorTexto = modificador >= 0 ? `+${modificador}` : `${modificador}`;
        } else {
          return interaction.reply({
            content: '❌ Modificador inválido! Use: +5, -2, etc.',
            ephemeral: true
          });
        }
      }

      const resultados = [];
      for (let i = 0; i < quantidade; i++) {
        resultados.push(Math.floor(Math.random() * faces) + 1);
      }
      const soma = resultados.reduce((a, b) => a + b, 0) + modificador;
      const maior = Math.max(...resultados);

      let categoria, cor, emoji, titulo;
      if (maior === 1) {
        categoria = 'criticalSuccess';
        cor = 0x00ff00;
        emoji = '🌟';
        titulo = 'SUCESSO CRÍTICO!';
      } else if (maior === faces) {
        categoria = 'criticalFail';
        cor = 0xff0000;
        emoji = '💀';
        titulo = 'FALHA CRÍTICA!';
      } else {
        const percentual = maior / faces;
        if (percentual <= 0.34) {
          categoria = 'high';
          cor = 0x00cc00;
          emoji = '😊';
          titulo = 'Bagaçou!';
        } else if (percentual <= 0.67) {
          categoria = 'medium';
          cor = 0x0099ff;
          emoji = '😐';
          titulo = 'Meia Bomba';
        } else {
          categoria = 'low';
          cor = 0xff6600;
          emoji = '😞';
          titulo = 'Fuleiro!';
        }
      }

      const mensagens = rollMessages[categoria];
      const mensagemAleatoria = mensagens[Math.floor(Math.random() * mensagens.length)];

      let emojiBg;
      if (categoria === 'criticalFail' || categoria === 'low') {
        emojiBg = '🟥';
      } else if (categoria === 'medium') {
        emojiBg = '🟦';
      } else {
        emojiBg = '🟩';
      }

      let resultadosTexto = '';
      let dadosIndividuaisTexto = '';
      if (quantidade === 1) {
        resultadosTexto = `${emojiBg} __**${soma}**__${modificador !== 0 ? ` (${modificadorTexto})` : ''}`;
      } else {
        resultadosTexto = `${emojiBg} __**${soma}**__${modificador !== 0 ? ` (${modificadorTexto})` : ''}`;
        dadosIndividuaisTexto = resultados.map((r, i) => `🎲 ${r}`).join(' | ');
      }

      const nomeJogador = interaction.member?.displayName || interaction.user.username;

      const embed = new EmbedBuilder()
        .setTitle(`${emoji} ${titulo}`)
        .setDescription(`**${nomeJogador}** rolou **${quantidade}d${faces}**`)
        .setColor(cor)
        .addFields(
          { name: '🎲 Resultado', value: resultadosTexto, inline: true },
          { name: '📊 Faces', value: `**${faces}**`, inline: true },
          ...(quantidade > 1 ? [
            { name: '🎲 Dados', value: dadosIndividuaisTexto, inline: false },
          ] : []),
          { name: '💬 Comentário', value: `*${mensagemAleatoria}*`, inline: false }
        )
        .setFooter({
          text: `Solicitado por ${nomeJogador}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro no comando roll:', error);
      await interaction.reply({
        content: '❌ Ocorreu um erro ao rolar o dado! Tente novamente.',
        ephemeral: true
      });
    }
  },
};
