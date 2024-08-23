const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play track by YouTube url')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Url of track')
                .setRequired(true)),
    async execute(interaction, bot) {
        //Temporary reply, since this process takes time sometimes
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('Loading ...')
                .setTimestamp()], components: [], ephemeral: true
        });
        //Fetch required argument
        let url = interaction.options.getString('url');
        //Process in bot instance
        await bot.play(interaction, url);
    },
};