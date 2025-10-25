// Background script for fetching and parsing RSS feeds

// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FETCH_FEEDS') {
    fetchAllFeeds().then(posts => {
      sendResponse({ posts });
    }).catch(error => {
      console.error('Error fetching feeds:', error);
      sendResponse({ posts: [], error: error.message });
    });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'TEST_FEED') {
    fetchAndParseFeed(message.url).then(posts => {
      sendResponse({ success: true, posts });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Fetch all subscribed feeds
async function fetchAllFeeds() {
  const { feeds = [] } = await browser.storage.local.get('feeds');

  if (feeds.length === 0) {
    return [];
  }

  const feedPromises = feeds.map(feedUrl =>
    fetchAndParseFeed(feedUrl).catch(err => {
      console.error(`Error fetching ${feedUrl}:`, err);
      return [];
    })
  );

  const feedResults = await Promise.all(feedPromises);
  const allPosts = feedResults.flat();

  // Sort by date, newest first
  allPosts.sort((a, b) => b.date - a.date);

  return allPosts;
}

// Fetch and parse a single RSS/Atom feed
async function fetchAndParseFeed(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');

  // Check for parsing errors
  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid XML');
  }

  // Detect feed type (RSS or Atom)
  const isAtom = doc.querySelector('feed');

  if (isAtom) {
    return parseAtomFeed(doc, url);
  } else {
    return parseRSSFeed(doc, url);
  }
}

// Parse RSS 2.0 feed
function parseRSSFeed(doc, feedUrl) {
  const items = doc.querySelectorAll('item');
  const posts = [];

  items.forEach(item => {
    const title = getTextContent(item, 'title');
    const link = getTextContent(item, 'link');
    const description = getTextContent(item, 'description');
    const pubDate = getTextContent(item, 'pubDate');
    const content = getTextContent(item, 'content\\:encoded') || description;

    // Check for guid (permalink) - some feeds like Daring Fireball use this for the actual post URL
    const guidElement = item.querySelector('guid');
    const guid = guidElement ? guidElement.textContent.trim() : '';
    const isPermaLink = guidElement ? guidElement.getAttribute('isPermaLink') !== 'false' : false;

    // Prefer guid if it's a permalink, otherwise use link
    const postLink = (guid && isPermaLink) ? guid : (link || feedUrl);

    const post = {
      title: title || 'Untitled',
      link: postLink,
      description: stripHtml(content || description || ''),
      date: pubDate ? new Date(pubDate) : new Date(0),
      feedUrl
    };

    posts.push(post);
  });

  return posts;
}

// Parse Atom feed
function parseAtomFeed(doc, feedUrl) {
  const entries = doc.querySelectorAll('entry');
  const posts = [];

  entries.forEach(entry => {
    const title = getTextContent(entry, 'title');

    // For feeds like Daring Fireball, prefer rel="related" (DF's own post) over rel="alternate" (external link)
    const relatedLink = entry.querySelector('link[rel="related"]');
    const alternateLink = entry.querySelector('link[rel="alternate"], link');
    const linkEl = relatedLink || alternateLink;
    const link = linkEl ? linkEl.getAttribute('href') : feedUrl;

    const summary = getTextContent(entry, 'summary');
    const content = getTextContent(entry, 'content');
    const updated = getTextContent(entry, 'updated');
    const published = getTextContent(entry, 'published');

    const post = {
      title: title || 'Untitled',
      link: link || feedUrl,
      description: stripHtml(content || summary || ''),
      date: new Date(updated || published || 0),
      feedUrl
    };

    posts.push(post);
  });

  return posts;
}

// Helper function to get text content from XML element
function getTextContent(parent, selector) {
  const element = parent.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

// Strip HTML tags and decode entities
function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
