const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('View current queue'),
    async execute(interaction, bot) {
        //Process in bot instance
        await bot.viewQueue(interaction);
    },
};