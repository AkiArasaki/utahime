const {EmbedBuilder} = require('discord.js');
const {joinVoiceChannel, createAudioPlayer, createAudioResource} = require("@discordjs/voice");
const Genius = require("genius-lyrics");
const {geniusId} = require('./config.json');
const lyricClient = new Genius.Client(geniusId);
const play = require('play-dl');
require("tweetnacl");
require("ffmpeg-static");

//Music bot class
class Bot {
    //constructor
    constructor() {
        this.connection = {};
        this.player = {};
        this.queue = {};
        this.isPlaying = {};
    }

    //Play music with url
    async play(interaction, url) {
        //If user is not in a voice channel
        if (!interaction.member.voice.channel) {
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('Please join a voice channel first')
                    .setDescription('.help for commands')
                    .setTimestamp()]
            });
        }
        if (!url.includes("youtube.com")) {
            //Url is invalid
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('This is not an valid YouTube url')
                    .setDescription('Use /search if you want to queue a track with keywords')
                    .setTimestamp()]
            });
        } else if (url.includes("playlist")) {
            //Url is a playlist
            await this.dispatchPlaylist(interaction, url);
        } else {
            //Url is a track
            return this.dispatch(interaction, url, false);
        }
    }

    //Search tracks with keywords
    async search(keywords) {
        //Fetch possible results from YouTube (5 items)
        const musicTitle = await play.search(keywords, {limit: 5});
        const choices = [];
        for (const youTubeVideo of musicTitle) {
            choices.push([youTubeVideo.title, youTubeVideo.url]);
        }
        //Return results array to command call
        return choices;
    }

    //Fetch single track url
    async dispatch(interaction, url, isPlaylist) {
        const id = interaction.guildId;
        //Join voice channel
        if (this.connection[id] == null || this.connection[id].state.status === "destroyed") {
            this.connection[id] = joinVoiceChannel({
                channelId: interaction.member.voice.channelId,
                guildId: id,
                adapterCreator: interaction.guild.voiceAdapterCreator
            });
            this.player[id] = createAudioPlayer();
            this.connection[id].subscribe(this.player[id]);
        }
        try {
            //Fetch track info with play dl from YouTube
            let info = await play.video_info(url);
            let stream = await play.stream_from_info(info);
            if (!this.queue[id]) {
                this.queue[id] = [];
            }
            //Push track into corresponding queue
            this.queue[id].push({
                interaction: interaction,
                title: info.video_details.title,
                url: url,
                stream: stream
            });
            //Check if call is from fetchPlaylist
            if (!isPlaylist) {
                //Edit command call with success message
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#3498DB')
                        .setTitle('Track queued:')
                        .setDescription(info.video_details.title)
                        .setURL(url)
                        .setTimestamp()], components: [], ephemeral: true
                });
            }
        } catch (e) {
            //Edit command call with failure message
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('This track is currently unavailable')
                    .setTimestamp()], components: [], ephemeral: true
            });
        }
        //Check if bot is already playing in the command call server
        if (!this.isPlaying[id]) {
            //Update isPlaying
            this.isPlaying[id] = true;
            this.player[id].play(createAudioResource(this.queue[id][0].stream.stream, {inputType: this.queue[id][0].stream.type}));
            //Broadcast player info / status
            interaction.channel.send({
                embeds: [new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('Now playing:')
                    .setDescription(this.queue[id][0].title)
                    .setURL(this.queue[id][0].url)
                    .setTimestamp()
                ]
            });
            //Player watchdog
            this.player[id].on("idle", () => {
                //Auto shifting tracks
                this.queue[id].shift();
                if (this.queue[id].length > 0) {
                    //Broadcast player info / status
                    this.queue[id][0].interaction.channel.send({
                        embeds: [new EmbedBuilder()
                            .setColor('#3498DB')
                            .setTitle('Now playing:')
                            .setDescription(this.queue[id][0].title)
                            .setURL(this.queue[id][0].url)
                            .setTimestamp()
                        ]
                    });
                    this.player[id].play(createAudioResource(this.queue[id][0].stream.stream, {inputType: this.queue[id][0].stream.type}));
                } else {
                    if (this.isPlaying[id] === true) {
                        this.isPlaying[id] = false;
                        //Broadcast player info / status
                        interaction.channel.send({
                            embeds: [new EmbedBuilder()
                                .setColor('#3498DB')
                                .setTitle('End of queue')
                                .setDescription('.help for commands')
                                .setTimestamp()]
                        });
                        this.connection[id].destroy();
                    }
                }
            });
        }
    }

    //Fetch playlist url
    async dispatchPlaylist(interaction, url) {
        try {
            //Fetch playlist info with play dl from YouTube
            const playlist = await play.playlist_info(url);
            const videos = await playlist.all_videos();
            //Queue tracks
            for (let i = 0; i < videos.length; i++) {
                await this.dispatch(interaction, videos[i].url, true);
            }
            //Edit command call if playlist fetch successes
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('Playlist queued:')
                    .setDescription(playlist.title)
                    .setURL(url)
                    .setTimestamp()], components: [], ephemeral: true
            });
        } catch (e) {
            //Edit command call if playlist fetching failed
            await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('This playlist is currently unavailable')
                    .setTimestamp()], components: [], ephemeral: true
            });
        }
    }

    //Force bot leave the voice channel currently in
    leave(interaction) {
        const id = interaction.guildId
        //Check bot status
        if (this.connection[id] && this.connection[id].state.status === "ready") {
            //Clear status
            if (this.queue.hasOwnProperty(id)) {
                delete this.queue[id];
                this.isPlaying[id] = false;
            }
            this.connection[id].destroy();
            //React command call
            interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('ヾ(￣▽￣)Bye~Bye~')
                    .setTimestamp()
                ]
            });
        } else {
            //If bot is not in any channel
            interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('I\'m not in any channel')
                    .setDescription('.help for commands')
                    .setTimestamp()
                ]
            });
        }
    }

    //Skip
    skip(interaction) {
        const id = interaction.guildId
        //Check player existence
        if (this.player[id]) {
            //Reply command call
            interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('Skip current track')
                    .setTimestamp()
                ]
            });
            this.player[id].stop(true);
        }
    }

    //Pause
    pause(interaction) {
        const id = interaction.guildId
        //Check player existence
        if (this.player[id]) {
            //Reply command call
            interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('Pause playing')
                    .setTimestamp()
                ]
            });
            this.player[id].pause();
        }
    }

    //Resume
    resume(interaction) {
        const id = interaction.guildId
        //Check player existence
        if (this.player[id]) {
            //Reply command call
            interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle('Resume playing')
                    .setTimestamp()
                ]
            });
            this.player[id].unpause();
        }
    }

    //Queue status process
    async viewQueue(interaction) {
        const id = interaction.guildId
        //Check queue existence
        if (this.queue[id] && this.queue[id].length > 0) {
            //Construct queue string
            const queueString = this.queue[id].map((item, index) => `\n[${index + 1}] ${item.title}`).join();
            //Return embed queue string
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('Current queue:')
                    .setDescription(queueString)
                    .setTimestamp()]
            });
        } else {
            //If queue is empty / does not exist
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('There\'s no track in queue')
                    .setTimestamp()]
            });
        }
    }

    //Get lyrics of current playing track / specified track
    async lyric(interaction, title) {
        const id = interaction.guildId
        try {
            //If 'title' argument is not provided
            if (!title) {
                //Assign 'title' with current playing track
                title = this.queue[id][0].title;
            }
            //Fetch lyric with track title
            const searches = await lyricClient.songs.search(title);
            const song = searches[0];
            const lyric = await song.lyrics();
            //Return embed message with fetched lyrics
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#3498DB')
                    .setTitle(song.title)
                    .setURL(song.url)
                    .setDescription(lyric)
                    .setTimestamp()]
            });
        } catch (e) {
            //Lyric with given title can not be found
            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('Lyric not found with title:')
                    .setDescription(title)
                    .setTimestamp()]
            });
        }
    }
}

//Export class
module.exports = {
    Bot
}