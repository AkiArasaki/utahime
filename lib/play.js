const { EmbedBuilder } = require('discord.js');

async function play(interaction, url, bot) {
    const id = interaction.guildId;
    // console.log(bot.left[id]);

    if (bot.left[id]) {
        bot.queue[id] = [];
        bot.isPlaying[id] = false;
        bot.left[id] = false;
    }

    if (!bot.queue[id]) bot.queue[id] = [];
    if (!bot.connection[id]) bot.queue[id].length = 0;

    if (!interaction.member.voice.channel) {
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('Please join a voice channel first')
                .setDescription('.help for commands')
                .setTimestamp()],
        });
        return;
    }

    if (!url.includes("youtube.com")) {
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('This is not a valid YouTube url')
                .setDescription('Use /search to queue with keywords')
                .setTimestamp()],
        });
    } else if (url.includes("playlist") || url.includes("list")) {
        await bot.dispatchPlaylist(interaction, url);
    } else {
        return bot.dispatch(interaction, url, false);
    }
}

module.exports = play;

