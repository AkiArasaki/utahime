const play = require('play-dl');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function searchTracks(keywords, limit = 5) {
    const results = await play.search(keywords, { limit });
    return results.map(video => [video.title, video.url]);
}

function buildSearchEmbed(choices) {
    const description = choices.map((item, i) => `[${i + 1}] ${item[0]}`).join('\n\n');
    return new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle('Please select a track:')
        .setDescription(description)
        .setTimestamp();
}

function buildButtonRow(count = 5) {
    const row = new ActionRowBuilder();
    for (let i = 0; i < count; i++) {
        row.addComponents(
            new ButtonBuilder()
                .setCustomId(`${i}`)
                .setLabel(`${i + 1}`)
                .setStyle(ButtonStyle.Secondary)
        );
    }
    return row;
}

module.exports = {
    searchTracks,
    buildSearchEmbed,
    buildButtonRow,
};
