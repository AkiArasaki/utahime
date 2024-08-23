const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Make bot leave voice channel'),
    async execute(interaction, bot) {
        //Process in bot instance
        bot.leave(interaction);
    },
};