const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const play = require('../../lib/play');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play track by YouTube url')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Url of track')
                .setRequired(true)),
    async execute(interaction, bot) {
        await interaction.deferReply({ flags: 64 });
        //Temporary reply, since this process takes time sometimes
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('Loading ...')
                .setTimestamp()], components: [], flags: 64
        });
        //Fetch required argument
        let url = interaction.options.getString('url');
        console.log('[play command] url:', url);
        //Process in bot instance
        await play(interaction, url, bot);
    },
};
