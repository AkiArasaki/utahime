const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lyric')
        .setDescription('Get lyrics of current playing track')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Get lyrics with a specified title')),
    async execute(interaction, bot) {
        //Fetch optional argument
        let title = interaction.options.getString('title');
        //Process in bot instance
        await bot.lyric(interaction, title);
    },
};