const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ComponentType } = require('discord.js');
async function queue(interaction, bot) {
    const id = interaction.guildId;
    const queue = bot.queue[id] || [];
    if (!queue.length) {
        return await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('There\'s no track in queue')
                .setTimestamp()],
            flags: 64
        });
    }

    const PAGE_SIZE = 10;
    let currentPage = 0;
    const totalPages = Math.ceil(queue.length / PAGE_SIZE);

    const generateEmbed = (page) => {
        const start = page * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        const pageItems = queue.slice(start, end);
        const description = pageItems.map((item, idx) => `[${start + idx + 1}] ${item.title}`).join('\n');
        return new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Current queue:')
            .setDescription(description)
            .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
            .setTimestamp();
    };

    const createActionRow = (page) => {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setLabel('⬅ Previous').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId('next').setLabel('Next ➡').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1),
            new ButtonBuilder().setCustomId('jump').setLabel('📄 Jump to Page').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('search').setLabel('🔍 Search').setStyle(ButtonStyle.Primary),
        );
    };

    await interaction.reply({
        embeds: [generateEmbed(currentPage)],
        components: [createActionRow(currentPage)],
        flags: 64
    });

    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

    collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
            return await i.reply({ content: '⚠️ not your interaction.', flags: 64 });
        }

        if (i.customId === 'prev') {
            currentPage--;
            await i.update({ embeds: [generateEmbed(currentPage)], components: [createActionRow(currentPage)] });
        } else if (i.customId === 'next') {
            currentPage++;
            await i.update({ embeds: [generateEmbed(currentPage)], components: [createActionRow(currentPage)] });
        } else if (i.customId === 'jump') {
            const modal = new ModalBuilder()
                .setCustomId('jumpModal')
                .setTitle('Jump to Page')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('pageNumber')
                            .setLabel('Enter page number:')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder(`1 - ${totalPages}`)
                            .setRequired(true)
                    )
                );
            await i.showModal(modal);
        } else if (i.customId === 'search') {
            const modal = new ModalBuilder()
                .setCustomId('searchModal')
                .setTitle('Search Queue')
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('keyword')
                            .setLabel('Enter search keyword:')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );
            await i.showModal(modal);
        }
    });
}

module.exports = queue;