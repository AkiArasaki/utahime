const {SlashCommandBuilder} = require('discord.js');
const resume = require('../../lib/resume');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume track from pausing'),
    async execute(interaction, bot) {
        //Process in bot instance
        resume(interaction, bot);
    },
};