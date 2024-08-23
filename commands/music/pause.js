const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause track from playing'),
    async execute(interaction, bot) {
        //Process in bot instance
        await bot.pause(interaction);
    },
};