// fixPlaylistUrl.js
/**
 * YouTube Playlist URL Sanitizer
 *
 * Problem:
 * When using the play-dl library to parse playlist URLs in the form of
 * "https://www.youtube.com/playlist?list=...", it may throw the following error:
 *
 *     Error: While parsing playlist url
 *     Unavailable videos are hidden
 *
 * This typically occurs when the playlist contains private, deleted, or hidden videos.
 *
 * However, if the URL is in the form:
 * "https://www.youtube.com/watch?v=VIDEO_ID&list=...", where VIDEO_ID is a valid public video,
 * play-dl is able to parse the entire playlist successfully, skipping unavailable videos.
 *
 * Solution:
 * This helper function converts playlist URLs into the "watch?v=...&list=..." format
 * by injecting a known public video ID (e.g., dQw4w9WgXcQ) to work around the issue.
 *
 * Recommendation:
 * Always sanitize playlist URLs using this function before passing them to play-dl
 * to ensure better compatibility and avoid parsing failures.
 */
function fixPlaylistUrl(url) {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.pathname === "/playlist" && u.searchParams.has("list")) {
        // Inject a known public video ID to ensure play-dl can parse the playlist
        return `https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=${u.searchParams.get("list")}`;
    }
    return url;
}

module.exports = { fixPlaylistUrl };