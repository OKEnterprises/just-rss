# Just RSS

A minimal RSS reader Firefox extension with a clean forest green theme.

## Features

- **Simple Feed Reading**: Subscribe to RSS and Atom feeds and view posts in a clean, distraction-free interface
- **Smart Sorting**: Posts are automatically sorted by date, newest first
- **Forest Green Theme**: Calming, minimal design with a solid forest green header
- **Feed Management**: Easy subscribe/unsubscribe through a settings menu
- **Smart Link Handling**: Correctly handles complex feeds like Daring Fireball where post titles link externally but you want to read the site's commentary
- **Auto-Refresh**: Feeds update automatically when you open the extension
- **Quick Preview**: See a 2-line preview of each post before clicking through

## Installation

### From Source (Development)

1. Clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on..."
5. Navigate to the project directory and select `manifest.json`

The RSS icon will appear in your Firefox toolbar.

## Usage

### Subscribing to Feeds

1. Click the RSS icon in your toolbar
2. Click the menu icon (three horizontal lines) in the top right
3. Enter an RSS or Atom feed URL
4. Click "Subscribe"

The extension will validate the feed before subscribing. If successful, you'll see the latest posts appear in your feed list.

### Reading Posts

Click any post title to open it in a new tab. Posts show:
- **Title**: The article headline
- **Preview**: First 2 lines of the post content
- **Date**: Relative time (e.g., "2h ago") or absolute date
- **Source**: The feed's domain name

### Unsubscribing

1. Click the menu icon
2. Find the feed you want to remove under "Subscribed Feeds"
3. Click "Unsubscribe"

## Sample Feeds to Try

- **BBC News**: `http://feeds.bbci.co.uk/news/rss.xml`
- **NASA Breaking News**: `https://www.nasa.gov/rss/dyn/breaking_news.rss`
- **Hacker News**: `https://news.ycombinator.com/rss`
- **The Verge**: `https://www.theverge.com/rss/index.xml`
- **Daring Fireball**: `https://daringfireball.net/feeds/main`

## Development

### Project Structure

- `manifest.json` - Extension configuration and permissions
- `background.js` - Feed fetching and XML parsing (bypasses CORS)
- `popup.html` - Main UI structure with feed and settings views
- `popup.js` - UI logic and event handling
- `popup.css` - Forest green theme styles
- `icons/` - Extension icons

### How It Works

The extension uses a **message passing architecture**:
1. User opens popup → `popup.js` sends `FETCH_FEEDS` message to background script
2. `background.js` fetches all subscribed feeds (with `<all_urls>` permission to bypass CORS)
3. Background script parses RSS/Atom XML and returns unified post data
4. `popup.js` renders posts sorted by date

**Special Feed Handling**: The parser intelligently handles edge cases:
- For RSS feeds where `<link>` points to external content, it uses `<guid>` as the permalink
- For Atom feeds like Daring Fireball, it prefers `<link rel="related">` (the site's post) over `<link rel="alternate">` (external article)

### Testing Changes

After making code changes:
1. Go to `about:debugging` in Firefox
2. Find "Just RSS" and click "Reload"
3. Open the extension popup to see your changes

### Theme Customization

The forest green theme uses CSS custom properties in `popup.css`:
- `--primary-green: #2d5016` - Header and primary elements
- `--dark-green: #1a2f0d` - Text and dark accents
- `--light-green: #4a7c2c` - Hover states

Change these values to customize the color scheme.

## Technical Notes

- **Manifest Version**: Uses Manifest V2 (Firefox standard) with non-persistent background script
- **Storage**: Feed URLs stored in `browser.storage.local`
- **Permissions**: Requires `storage` and `<all_urls>` for feed fetching
- **Feed Support**: Both RSS 2.0 and Atom feeds
- **No Caching**: Feeds are re-fetched each time the popup opens for maximum freshness

## License

See LICENSE file for details.
