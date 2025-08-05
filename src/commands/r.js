const roll = require('./roll');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  ...roll,
  data: new SlashCommandBuilder()
    .setName('r')
    .setDescription('Atalho para /roll')
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
};