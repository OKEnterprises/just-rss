# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Just RSS is a minimal Firefox extension that provides an RSS reader with a forest green theme. The extension displays subscribed feeds in a browser action popup, with posts sorted by date (newest first).

## Architecture

### Message Passing Pattern
The extension uses Firefox's message passing API to communicate between the popup UI and background script:
- **popup.js** sends `FETCH_FEEDS` and `TEST_FEED` messages
- **background.js** handles feed fetching and parsing, returns results asynchronously
- All feed fetching happens in the background script to bypass CORS restrictions

### Feed Parsing Strategy
The background script supports both RSS 2.0 and Atom feeds with special handling for edge cases:
- **RSS feeds**: Prefers `<guid isPermaLink="true">` over `<link>` for the post URL (handles feeds where `<link>` points to external content)
- **Atom feeds**: Prefers `<link rel="related">` over `<link rel="alternate">` (handles Daring Fireball's linked list posts where alternate points to external articles, but related points to DF's commentary)

### Storage
Uses `browser.storage.local` to persist:
- `feeds`: Array of subscribed feed URLs
- No post caching (feeds are re-fetched on each popup open)

## Development & Testing

### Loading the Extension
1. Navigate to `about:debugging` in Firefox
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on..."
4. Select `manifest.json` from the project directory

### Reloading After Changes
1. Go to `about:debugging`
2. Find "Just RSS" and click "Reload"

### Testing with Sample Feeds
- RSS feed: `http://feeds.bbci.co.uk/news/rss.xml`
- Atom feed with special link handling: `https://daringfireball.net/feeds/main`

## Theme Colors
The forest green theme uses these CSS custom properties (defined in popup.css):
- `--primary-green: #2d5016` (header background, primary UI elements)
- `--dark-green: #1a2f0d` (text, darker accents)
- `--light-green: #4a7c2c` (hover states)
- `--hover-green: #3d6621` (button hover)

## Key Constraints

### Manifest V2
This extension uses Manifest V2 (not V3) as it's the stable standard for Firefox extensions. The background script is non-persistent (`"persistent": false`).

### CORS Handling
The extension requests `<all_urls>` permission so the background script can fetch any RSS feed without CORS restrictions. All feed fetching must happen in background.js, not popup.js.
