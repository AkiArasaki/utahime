const { SlashCommandBuilder } = require('discord.js');
const skip = require('../../lib/skip');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current track'),
    async execute(interaction, bot) {
        //Process in bot instance
        await skip(interaction, bot);
    },
};