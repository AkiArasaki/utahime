const { EmbedBuilder } = require('discord.js');
const { AudioPlayerStatus } = require('@discordjs/voice');

// This function safely replies to an interaction, handling both initial replies and follow-ups.
// It ensures that if the interaction has already been replied to or deferred, it uses followUp.
// If not, it uses reply. It also catches any errors that may occur during the reply process.
async function safeReply(interaction, data) {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ ...data, ephemeral: true });
    } else {
      await interaction.reply({ ...data, ephemeral: true });
    }
  } catch (err) {
    console.error('[safeReply Error]', err);
  }
}
// This function handles the leave command for a music bot.
async function leave(interaction, bot) {
  const id = interaction.guildId;
  bot.left[id] = true;

  const connection = bot.connection[id];
  const player = bot.player?.[id];

  if (connection && connection.state.status === "ready") {
    if (Array.isArray(bot.queue[id])) {
      bot.queue[id].length = 0;
    }

    if (bot.queue.hasOwnProperty(id)) {
      delete bot.queue[id];
      bot.isPlaying[id] = false;
    }

    if (player && player.removeAllListeners) {
      player.removeAllListeners(AudioPlayerStatus.Idle);
      player.removeAllListeners(AudioPlayerStatus.Playing);
      player.stop(true);
    }

    // console.log('Queue after leave:', bot.queue[id]);

    connection.destroy();
    delete bot.connection[id];

    await safeReply(interaction, {
      embeds: [new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('ヾ(￣▽￣)Bye~Bye~')
        .setTimestamp()]
    });
  } else {
    await safeReply(interaction, {
      embeds: [new EmbedBuilder()
        .setColor('#E74C3C')
        .setTitle('I\'m not in any channel')
        .setDescription('.help for commands')
        .setTimestamp()]
    });
  }
}

module.exports = leave;
