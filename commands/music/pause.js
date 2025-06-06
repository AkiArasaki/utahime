const {SlashCommandBuilder} = require('discord.js');
const pause = require('../../lib/pause');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause track from playing'),
    async execute(interaction, bot) {
        //Process in bot instance
        await pause(interaction, bot);
    },
};