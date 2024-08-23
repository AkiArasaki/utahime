const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume track from pausing'),
    async execute(interaction, bot) {
        //Process in bot instance
        bot.resume(interaction);
    },
};