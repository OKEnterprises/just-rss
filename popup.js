// Popup UI logic and interactions

document.addEventListener('DOMContentLoaded', async () => {
  // DOM elements
  const feedView = document.getElementById('feedView');
  const settingsView = document.getElementById('settingsView');
  const menuBtn = document.getElementById('menuBtn');
  const backBtn = document.getElementById('backBtn');
  const feedsList = document.getElementById('feedsList');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('emptyState');
  const subscribeBtn = document.getElementById('subscribeBtn');
  const feedUrlInput = document.getElementById('feedUrlInput');
  const subscribeError = document.getElementById('subscribeError');
  const subscribeSuccess = document.getElementById('subscribeSuccess');
  const subscribedFeedsList = document.getElementById('subscribedFeedsList');

  // View switching
  menuBtn.addEventListener('click', () => {
    feedView.style.display = 'none';
    settingsView.style.display = 'flex';
    loadSubscribedFeeds();
  });

  backBtn.addEventListener('click', () => {
    settingsView.style.display = 'none';
    feedView.style.display = 'flex';
    loadFeeds();
  });

  // Subscribe to new feed
  subscribeBtn.addEventListener('click', async () => {
    const url = feedUrlInput.value.trim();

    if (!url) {
      showError('Please enter a feed URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      showError('Please enter a valid URL');
      return;
    }

    subscribeBtn.disabled = true;
    subscribeBtn.textContent = 'Testing...';
    hideMessages();

    try {
      // Test the feed first
      const response = await browser.runtime.sendMessage({
        type: 'TEST_FEED',
        url: url
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch feed');
      }

      // Add to subscribed feeds
      const { feeds = [] } = await browser.storage.local.get('feeds');

      if (feeds.includes(url)) {
        showError('Already subscribed to this feed');
        return;
      }

      feeds.push(url);
      await browser.storage.local.set({ feeds });

      showSuccess('Successfully subscribed!');
      feedUrlInput.value = '';
      loadSubscribedFeeds();

      // Reload feeds after a brief delay
      setTimeout(() => {
        backBtn.click();
      }, 1500);

    } catch (error) {
      showError(`Error: ${error.message}`);
    } finally {
      subscribeBtn.disabled = false;
      subscribeBtn.textContent = 'Subscribe';
    }
  });

  // Allow Enter key to subscribe
  feedUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      subscribeBtn.click();
    }
  });

  // Load and display feeds
  async function loadFeeds() {
    loading.style.display = 'block';
    emptyState.style.display = 'none';
    feedsList.innerHTML = '';

    try {
      const response = await browser.runtime.sendMessage({ type: 'FETCH_FEEDS' });
      const posts = response.posts || [];

      loading.style.display = 'none';

      if (posts.length === 0) {
        const { feeds = [] } = await browser.storage.local.get('feeds');
        if (feeds.length === 0) {
          emptyState.style.display = 'block';
        } else {
          feedsList.innerHTML = '<div class="empty-hint" style="text-align: center; padding: 40px 20px;">No posts found in your feeds.</div>';
        }
        return;
      }

      renderPosts(posts);

    } catch (error) {
      loading.style.display = 'none';
      feedsList.innerHTML = `<div class="error-message">Error loading feeds: ${error.message}</div>`;
    }
  }

  // Render posts
  function renderPosts(posts) {
    feedsList.innerHTML = '';

    posts.forEach(post => {
      const feedItem = document.createElement('div');
      feedItem.className = 'feed-item';

      const title = document.createElement('a');
      title.className = 'feed-item-title';
      title.href = post.link;
      title.textContent = post.title;
      title.target = '_blank';
      title.addEventListener('click', (e) => {
        e.preventDefault();
        browser.tabs.create({ url: post.link });
      });

      const preview = document.createElement('div');
      preview.className = 'feed-item-preview';
      preview.textContent = post.description || 'No preview available';

      const meta = document.createElement('div');
      meta.className = 'feed-item-meta';

      const date = document.createElement('span');
      date.className = 'feed-item-date';
      date.textContent = formatDate(post.date);

      const source = document.createElement('span');
      source.className = 'feed-item-source';
      source.textContent = getDomainFromUrl(post.feedUrl);
      source.title = post.feedUrl;

      meta.appendChild(date);
      meta.appendChild(source);

      feedItem.appendChild(title);
      feedItem.appendChild(preview);
      feedItem.appendChild(meta);

      feedsList.appendChild(feedItem);
    });
  }

  // Load subscribed feeds list
  async function loadSubscribedFeeds() {
    const { feeds = [] } = await browser.storage.local.get('feeds');

    if (feeds.length === 0) {
      subscribedFeedsList.innerHTML = '<div class="empty-hint">No feeds subscribed yet.</div>';
      return;
    }

    subscribedFeedsList.innerHTML = '';

    feeds.forEach(feedUrl => {
      const item = document.createElement('div');
      item.className = 'subscribed-feed-item';

      const url = document.createElement('span');
      url.className = 'subscribed-feed-url';
      url.textContent = feedUrl;

      const unsubscribeBtn = document.createElement('button');
      unsubscribeBtn.className = 'btn btn-danger';
      unsubscribeBtn.textContent = 'Unsubscribe';
      unsubscribeBtn.addEventListener('click', async () => {
        await unsubscribeFeed(feedUrl);
        loadSubscribedFeeds();
      });

      item.appendChild(url);
      item.appendChild(unsubscribeBtn);
      subscribedFeedsList.appendChild(item);
    });
  }

  // Unsubscribe from a feed
  async function unsubscribeFeed(feedUrl) {
    const { feeds = [] } = await browser.storage.local.get('feeds');
    const updatedFeeds = feeds.filter(url => url !== feedUrl);
    await browser.storage.local.set({ feeds: updatedFeeds });
  }

  // Helper functions
  function showError(message) {
    subscribeError.textContent = message;
    subscribeError.style.display = 'block';
    subscribeSuccess.style.display = 'none';
  }

  function showSuccess(message) {
    subscribeSuccess.textContent = message;
    subscribeSuccess.style.display = 'block';
    subscribeError.style.display = 'none';
  }

  function hideMessages() {
    subscribeError.style.display = 'none';
    subscribeSuccess.style.display = 'none';
  }

  function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
      return 'Unknown date';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function getDomainFromUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  }

  // Initial load
  loadFeeds();
});
