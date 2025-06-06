🛠 Changes

This PR includes the following updates:
🎵 New Features

    Added pagination to queue display (10 songs per page)

    Supported queue search and page navigation via interaction buttons

    Added insert play feature: push a selected song to the front of the queue and play it next

    Added "return to playlist" button in search results to go back to the full queue view
    ⚠️ Note: This button currently breaks after interaction expires — global registration of interactions is not yet implemented

🐞 Bug Fixes

    Fixed bot crashes that occurred during certain playback scenarios

    Fixed issue where some YouTube links could not be played

    Fixed commands not responding correctly under specific conditions

🔧 Other Improvements

    Refactored play.js, queue.js, and related modules for improved modularity and readability

    Introduced lib/ and handlers/ directories to separate concerns

    Added .gitignore to prevent committing node_modules/, config.json, .env, and other sensitive or large files

✅ Testing

All features were tested locally in a Discord server:

    Queue pagination and navigation

    Insert play logic and immediate playback

    Song search functionality

    Button-based interaction and partial recovery
