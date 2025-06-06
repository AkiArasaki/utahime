const { EmbedBuilder } = require('discord.js');

async function skip(interaction, bot) {
    const id = interaction.guildId
    //Check player existence
    if (bot.player[id]) {
        //Reply command call
        interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('Skip current track')
                .setTimestamp()
            ]
        });
        bot.player[id].stop(true);
    }
}

module.exports = skip;