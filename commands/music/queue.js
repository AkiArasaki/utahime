const { SlashCommandBuilder } = require('discord.js');
const queue = require('../../lib/queue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('View current queue'),
    async execute(interaction, bot) {
        //Process in bot instance
        await queue(interaction, bot);
    },
};