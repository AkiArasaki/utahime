// interactionHandlers.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, Events, EmbedBuilder } = require('discord.js');
// const { renderQueueEmbed } = require('./queueView');

function registerInteractionHandlers(client, bot) {
    client.on(Events.InteractionCreate, async interaction => {
        if (interaction.isModalSubmit()) {
            const id = interaction.guildId;
            const queue = bot.queue[id] || [];
            const PAGE_SIZE = 10;
            const totalPages = Math.ceil(queue.length / PAGE_SIZE);

            if (interaction.customId === 'jumpModal') {
                const pageInput = interaction.fields.getTextInputValue('pageNumber');
                const pageNum = parseInt(pageInput, 10) - 1;

                if (isNaN(pageNum) || pageNum < 0) {
                    return await interaction.reply({ content: '❌ Invalid page number.', flags: 64 });
                }

                const id = interaction.guildId;
                const queue = bot.queue[id] || [];
                const PAGE_SIZE = 10;
                const totalPages = Math.ceil(queue.length / PAGE_SIZE);
                if (pageNum >= totalPages) {
                    return await interaction.reply({ content: `❌ Page number exceeds total pages (${totalPages}).`, flags: 64 });
                }

                const start = pageNum * PAGE_SIZE;
                const end = start + PAGE_SIZE;
                const pageItems = queue.slice(start, end);
                const description = pageItems.map((item, idx) => `[${start + idx + 1}] ${item.title}`).join('\n');
                const embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('Current queue:')
                    .setDescription(description)
                    .setFooter({ text: `Page ${pageNum + 1} of ${totalPages}` })
                    .setTimestamp();

                const createActionRow = (page) => {
                    return new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('prev').setLabel('⬅ Previous').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                        new ButtonBuilder().setCustomId('next').setLabel('Next ➡').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1),
                        new ButtonBuilder().setCustomId('jump').setLabel('📄 Jump to Page').setStyle(ButtonStyle.Primary),
                        new ButtonBuilder().setCustomId('search').setLabel('🔍 Search').setStyle(ButtonStyle.Primary),
                    );
                };

                await interaction.reply({
                    embeds: [embed],
                    components: [createActionRow(pageNum)],
                    flags: 64
                });
            }

            if (interaction.customId === 'searchModal') {
                await interaction.deferReply({ flags: 64 });
                const keyword = interaction.fields.getTextInputValue('keyword').toLowerCase();
                const filtered = queue.filter(item => item.title.toLowerCase().includes(keyword));

                if (!filtered.length) {
                    return await interaction.editReply({ content: 'No matching songs found.', flags: 64 });
                }

                bot.searchResults ??= {};
                bot.searchResults[id] = filtered;

                if (filtered.length === 1) {
                    bot.insertTop(id, filtered[0]);
                    return await interaction.editReply({ content: `✅ Inserted "${filtered[0].title}" to top of queue.`, flags: 64 });
                }

                const options = filtered.slice(0, 25).map((item, index) => ({
                    label: item.title.slice(0, 100),
                    value: String(index),
                }));
                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('selectSong')
                    .setPlaceholder('Select a song to insert')
                    .addOptions(options);

                const actionRow = new ActionRowBuilder().addComponents(selectMenu);
                const backButtonRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('backToQueue')
                        .setLabel('⬅ Return to Queue')
                        .setStyle(ButtonStyle.Secondary)
                );
                return await interaction.editReply({
                    content: `Found ${filtered.length} songs. Choose one to insert or return.`,
                    components: [actionRow, backButtonRow],
                    // components:[actionRow],
                    flags: 64,
                });
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'selectSong') {
                console.log('Test');
                const id = interaction.guildId;
                const index = parseInt(interaction.values[0]);
                const selected = bot.searchResults?.[id]?.[index];
                if (!selected) {
                    return await interaction.reply({ content: '❌ Selection error.', flags: 64 });
                }
                bot.insertTop(id, selected);
                return await interaction.update({ content: `✅ Inserted "${selected.title}" to top of queue.`, components: [] });
            }
        }

        if (interaction.isButton()) {
            if (interaction.customId === 'backToQueue') {
                // back to queue button
                // This file handles interaction events for the bot, specifically for queue management and searching tracks.
                // const { embed, components } = renderQueueEmbed(bot, interaction.guildId, 0);
                const id = interaction.guildId;
                const queue = bot.queue[id] || [];
                const totalPages = Math.ceil(queue.length / 10);
                const embed = bot.generateEmbed(queue, 0);
                const row = bot.createActionRow(0, totalPages);
                await bot.updateQueuePage(interaction, embed, [row]);
                // return bot.updateQueuePage(interaction,embed,[row]);
                // await interaction.update({ embeds: [embed], components });
            }
        }
    });
}

module.exports = { registerInteractionHandlers };

