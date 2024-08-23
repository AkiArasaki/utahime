const {SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search track by keywords')
        .addStringOption(option =>
            option.setName('keywords')
                .setDescription('Keywords of track')
                .setRequired(true)),
    async execute(interaction, bot) {
        //Temporary reply, since this process takes time sometimes
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('Loading ...')
                .setTimestamp()], components: [], ephemeral: true
        });
        //Fetch required argument
        let keywords = interaction.options.getString('keywords')
        //Process in bot instance
        let choices = await bot.search(keywords)
        //Build embed message
        const choicesEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Please select a track:')
            .setDescription('[1] ' + choices[0][0] + '\n\n' +
                '[2] ' + choices[1][0] + '\n\n' +
                '[3] ' + choices[2][0] + '\n\n' +
                '[4] ' + choices[3][0] + '\n\n' +
                '[5] ' + choices[4][0])
            .setTimestamp();
        const one = new ButtonBuilder()
            .setCustomId('0')
            .setLabel('1')
            .setStyle(ButtonStyle.Secondary);
        const two = new ButtonBuilder()
            .setCustomId('1')
            .setLabel('2')
            .setStyle(ButtonStyle.Secondary);
        const three = new ButtonBuilder()
            .setCustomId('2')
            .setLabel('3')
            .setStyle(ButtonStyle.Secondary);
        const four = new ButtonBuilder()
            .setCustomId('3')
            .setLabel('4')
            .setStyle(ButtonStyle.Secondary);
        const five = new ButtonBuilder()
            .setCustomId('4')
            .setLabel('5')
            .setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder()
            .addComponents(one, two, three, four, five);
        //Edit command call with searched data with user prompted keywords
        const reply = await interaction.editReply({embeds: [choicesEmbed], components: [row], ephemeral: true})
        //Handle user replies
        const collectorFilter = i => i.user.id === interaction.user.id;
        try {
            const confirmation = await reply.awaitMessageComponent({filter: collectorFilter, time: 30_000});
            //Fetch user selected track url
            const url = choices[parseInt(confirmation.customId)][1]
            //Process in bot instance
            await bot.play(interaction, url)
        } catch (e) {
            //Build time out embed message
            const cancelEmbed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('No chosen received, queue action canceled')
                .setTimestamp();
            //Edit timed out command call
            await interaction.editReply({embeds: [cancelEmbed], components: [], ephemeral: true});
        }
    },
};