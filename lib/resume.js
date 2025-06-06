const { EmbedBuilder } = require('discord.js');

async function resume(interaction, bot) {
    const id = interaction.guildId
    //Check player existence
    if (bot.player[id]) {
        //Reply command call
        interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('Resume playing')
                .setTimestamp()
            ]
        });
        bot.player[id].unpause();
    }
}

module.exports = resume;