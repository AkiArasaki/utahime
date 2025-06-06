const { SlashCommandBuilder } = require('discord.js');
const leave = require('../../lib/leave');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Make bot leave voice channel'),

    async execute(interaction, bot) {
        await leave(interaction, bot);
    },
};
