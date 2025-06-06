const { EmbedBuilder } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, StringSelectMenuBuilder, TextInputBuilder, TextInputStyle, Events, ComponentType } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");
const Genius = require("genius-lyrics");
const { geniusId } = require('./config.json');
const lyricClient = new Genius.Client(geniusId);
const ytdl = require('@distube/ytdl-core');
const { DisTube } = require('distube');
const play = require('play-dl');
require("tweetnacl");
require("ffmpeg-static");
const { AudioPlayerStatus } = require('@discordjs/voice');
const prism = require('prism-media');
// const { safeReply } = require('./checkReply');
// console.log('[DEBUG] prism-media Opus loaded:', prism.opus.Encoder !== undefined);
//Music bot class
class Bot {
    //constructor
    constructor() {
        this.connection = {};
        this.player = {};
        this.queue = {};
        this.isPlaying = {};
        this.left = {};
        this.searchResults = {};
    }
    insertTop(guildId, song) {
        if (!this.queue[guildId]) this.queue[guildId] = [];
        //this.player[guildId].stop();
        const queue = this.queue[guildId];
        // If the queue is empty, just push the song
        if (queue.length === 0) {
            // if queue is empty, just push the song
            queue.push(song);
        } else {
            // otherwise, insert the song at index 1
            // cant use unshift because it would break the queue order
            queue.splice(1, 0, song);
        }
    }
    generateEmbed(queue, page, pageSize = 10) {
        const totalPages = Math.ceil(queue.length / pageSize);
        const start = page * pageSize;
        const end = start + pageSize;
        const pageItems = queue.slice(start, end);
        const description = pageItems.map((item, idx) => `[${start + idx + 1}] ${item.title}`).join('\n');
        return new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('Current queue:')
            .setDescription(description)
            .setFooter({ text: `Page ${page + 1} of ${totalPages}` })
            .setTimestamp();
    }

    createActionRow(page, totalPages) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('prev').setLabel('⬅ Previous').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
            new ButtonBuilder().setCustomId('next').setLabel('Next ➡').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages - 1),
            new ButtonBuilder().setCustomId('jump').setLabel('🔢 Jump to Page').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('search').setLabel('🔍 Search').setStyle(ButtonStyle.Success)
        );
    }

    updateQueuePage(interaction, embed, components) {
        if (interaction.deferred || interaction.replied) {
            // already replied or deferred, use editReply
            return interaction.editReply({
                embeds: [embed],
                components: components
            });
        } else if (interaction.isButton()) {
            // button interaction, use update
            return interaction.update({
                embeds: [embed],
                components: components
            });
        } else {
            // fallback to reply
            console.warn('[updateQueuePage] Interaction is neither deferred nor replied, using reply instead');
            return interaction.reply({
                embeds: [embed],
                components: components,
                ephemeral: true
            });
        }
    }
    // playNext function to play next track in queue
    async playNext(id) {
        if (this.left[id]) {
            console.warn(`[dispatchPlaylist] Guild ${id} already left, skipping playNext`);
            return;
        }
        this.left[id] = false;
        const track = this.queue[id]?.[0];
        if (!track) {
            this.isPlaying[id] = false;
            if (this.connection[id] && this.connection[id].state.status !== 'destroyed') {
                this.connection[id].destroy();
            } //make sure to destroy the connection
            // this.connection[id].destroy();
            track?.interaction.channel.send({
                embeds: [new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('End of queue')
                    .setDescription('.help for commands')
                    .setTimestamp()]
            });
            return;
        }
        try {
            const stream = ytdl(track.url, {
                filter: 'audioonly',
                highWaterMark: 1 << 26, // 64MB
                quality: 'highestaudio', // 'highestaudio' for best quality
                /*quality: 0,*/
                liveBuffer: 4000,
                dlChunkSize: 64 * 1024, // avoid -1 issue
                /*dlChunkSize: 0,*/
                requestOptions: {
                    timeout: 30000 // 30 seconds timeout
                }
            });
            stream.on('error', err => {
                console.error('[Stream Error]', err);
                this.queue[id].shift();
                this.playNext(id);
            });
            const resource = createAudioResource(stream, { inlineVolume: true });
            resource.volume.setVolume(1.0);
            //const resource = createAudioResource(stream);
            this.player[id].play(resource);
            track.interaction.channel.send({
                embeds: [new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('Now playing:')
                    .setDescription(track.title)
                    .setURL(track.url)
                    .setTimestamp()]
            });
        } catch (error) {
            console.error(`[playNext Error] ${error.message}`);
            this.queue[id].shift();
            this.playNext(id); // play next track
        }
    }
    //Fetch single track url
    async dispatch(interaction, url, isPlaylist) {

        const id = interaction.guildId;
        if (this.left[id]) {
            console.warn(`[dispatchPlaylist] Guild ${id} already left, skipping dispatch`);
            return;
        }
        this.left[id] = false;
        //Join voice channel
        if (this.connection[id] == null || this.connection[id].state.status === "destroyed") {
            this.connection[id] = joinVoiceChannel({
                channelId: interaction.member.voice.channelId,
                guildId: id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });
            this.player[id] = createAudioPlayer({
                behaviors: {
                    maxMissedFrames: 8 // default is 5, increase to avoid disconnects
                }
            });
            this.connection[id].subscribe(this.player[id]);
            // add listeners for player events
            this.player[id].on(AudioPlayerStatus.Idle, () => {
                this.queue[id].shift();
                this.playNext(id);
            });
            this.player[id].on('error', error => {
                console.error(`[AudioPlayer Error]: ${error.message}`);
                this.queue[id].shift();
                this.playNext(id);
            });
        }
        try {
            //Fetch track info with play dl from YouTube
            let info = await ytdl.getBasicInfo(url);
            // console.log('[dispatch]', info.videoDetails.title, url);
            if (!this.queue[id]) {
                this.queue[id] = [];
            }
            //Push track into corresponding queue
            this.queue[id].push({
                interaction: interaction,
                title: info.videoDetails.title,
                url: url,
            });
            //Check if call is from fetchPlaylist
            if (!isPlaylist) {
                //Edit command call with success message
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#3498DB')
                        .setTitle('Track queued:')
                        .setDescription(info.videoDetails.title)
                        .setURL(url)
                        .setTimestamp()], components: [], flags: 64
                });
            }
            if (!this.isPlaying[id]) {
                this.isPlaying[id] = true;
                this.playNext(id);
            }

        } catch (e) {
            //Edit command call with failure message
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('This track is currently unavailable')
                    .setTimestamp()], components: [], flags: 64
            });
        }
    }

    //Fetch playlist url
    async dispatchPlaylist(interaction, url) {
        const id = interaction.guildId;
        if (this.left[id]) {
            return;
        }
        this.left[id] = false;
        try {
            //Fetch playlist info with play dl from YouTube
            const playlist = await play.playlist_info(url);
            const videos = await playlist.all_videos();
            //Queue tracks
            for (let i = 0; i < videos.length; i++) {
                if (this.left[id]) {
                    console.warn(`[dispatchPlaylist] Guild ${id} leaft during playlist dispatch, stopping further processing`);
                    break;
                }
                await this.dispatch(interaction, videos[i].url, true);
            }
            //Edit command call if playlist fetch successes
            if (!this.left[id]) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#3498DB')
                        .setTitle('Playlist queued:')
                        .setDescription(playlist.title)
                        .setURL(url)
                        .setTimestamp()], components: [], flags: 64
                });
            }
        } catch (e) {
            //Edit command call if playlist fetching failed
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('This playlist is currently unavailable')
                    .setTimestamp()], components: [], flags: 64
            });
        }
    }

    //Get lyrics of current playing track / specified track
    // async lyric(interaction, title) {
    //     const id = interaction.guildId
    //     try {
    //         //If 'title' argument is not provided
    //         if (!title) {
    //             //Assign 'title' with current playing track
    //             title = this.queue[id][0].title;
    //         }
    //         //Fetch lyric with track title
    //         const searches = await lyricClient.songs.search(title);
    //         const song = searches[0];
    //         const lyric = await song.lyrics();
    //         //Return embed message with fetched lyrics
    //         await interaction.reply({
    //             embeds: [new EmbedBuilder()
    //                 .setColor('#3498DB')
    //                 .setTitle(song.title)
    //                 .setURL(song.url)
    //                 .setDescription(lyric)
    //                 .setTimestamp()]
    //         });
    //     } catch (e) {
    //         //Lyric with given title can not be found
    //         await interaction.reply({
    //             embeds: [new EmbedBuilder()
    //                 .setColor('#E74C3C')
    //                 .setTitle('Lyric not found with title:')
    //                 .setDescription(title)
    //                 .setTimestamp()]
    //         });
    //     }
    // }
}

//Export class
module.exports = {
    Bot
}
