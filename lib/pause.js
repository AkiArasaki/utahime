const { EmbedBuilder } = require('discord.js');

async function pause(interaction, bot) {
    const id = interaction.guildId
    //Check player existence
    if (bot.player[id]) {
        //Reply command call
        interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('Pause playing')
                .setTimestamp()
            ]
        });
        bot.player[id].pause();
    }
}

module.exports = pause;