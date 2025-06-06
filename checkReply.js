async function safeReply(interaction, messageOptions) {
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(messageOptions);
    } else {
        return interaction.reply(messageOptions);
    }
}

module.exports = {
    safeReply
};
