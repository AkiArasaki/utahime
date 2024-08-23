const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current track'),
    async execute(interaction, bot) {
        //Process in bot instance
        bot.skip(interaction);
    },
};