const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { searchTracks, buildSearchEmbed, buildButtonRow } = require('../../lib/search');
// const play = require('../../lib/play');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search track by keywords')
        .addStringOption(option =>
            option.setName('keywords')
                .setDescription('Keywords of track')
                .setRequired(true)
        ),

    async execute(interaction, bot) {
        await interaction.deferReply({ flags: 64 });

        const keywords = interaction.options.getString('keywords');
        const choices = await searchTracks(keywords);
        const embed = buildSearchEmbed(choices);
        const row = buildButtonRow(choices.length);

        const reply = await interaction.editReply({
            embeds: [embed],
            components: [row],
            flags: 64
        });

        try {
            const filter = i => i.user.id === interaction.user.id;
            const confirmation = await reply.awaitMessageComponent({ filter, time: 30_000 });
            const url = choices[parseInt(confirmation.customId)][1];

            // await play(interaction, url, bot);
            await bot.dispatch(interaction, url, false);
        } catch {
            const cancelEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('No response received, action canceled')
                .setTimestamp();
            await interaction.editReply({ embeds: [cancelEmbed], components: [], flags: 64 });
        }
    },
};
