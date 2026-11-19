const form = document.querySelector('#post-form');
const nameInput = document.querySelector('#name');
const messageInput = document.querySelector('#message');
const submitButton = document.querySelector('#submit-button');
const formStatus = document.querySelector('#form-status');
const postList = document.querySelector('#post-list');
const postCount = document.querySelector('#post-count');
const realtimeStatus = document.querySelector('#realtime-status');
const messages = new Map();

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function setRealtimeStatus(status) {
  const connected = status === 'SUBSCRIBED';
  realtimeStatus.textContent = connected ? 'Live' : 'Reconnecting...';
  realtimeStatus.classList.toggle('is-connected', connected);
}

function renderPosts() {
  const posts = [...messages.values()].sort((first, second) =>
    first.created_at.localeCompare(second.created_at),
  );
  const nearBottom =
    postList.scrollHeight - postList.clientHeight - postList.scrollTop < 80;

  postList.replaceChildren();
  postCount.textContent = `${messages.size} ${messages.size === 1 ? 'message' : 'messages'}`;

  if (posts.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'feed-state';
    emptyState.textContent = 'No messages yet. Start the conversation.';
    postList.append(emptyState);
    return;
  }

  for (const post of posts) {
    const article = document.createElement('article');
    article.className = 'post-card';

    const meta = document.createElement('div');
    meta.className = 'post-meta';

    const author = document.createElement('span');
    author.className = 'post-author';
    author.textContent = post.name;

    const time = document.createElement('time');
    time.className = 'post-time';
    time.dateTime = post.created_at;
    time.textContent = formatTime(post.created_at);

    const message = document.createElement('p');
    message.className = 'post-message';
    message.textContent = post.message;

    meta.append(author, time);
    article.append(meta, message);
    postList.append(article);
  }

  if (nearBottom) {
    postList.scrollTop = postList.scrollHeight;
  }
}

function addPost(post) {
  if (!post?.id || messages.has(post.id)) {
    return;
  }

  messages.set(post.id, post);
  renderPosts();
}

async function loadPosts() {
  try {
    const response = await fetch('/api/posts');
    const posts = await response.json();
    if (!response.ok) {
      throw new Error(posts.error || 'Could not load messages.');
    }

    for (const post of posts) {
      addPost(post);
    }
  } catch (error) {
    formStatus.textContent = error.message || 'Could not load messages. Please try again.';
    formStatus.classList.add('is-error');
  } finally {
    postList.setAttribute('aria-busy', 'false');
  }
}

const eventSource = new EventSource('/api/posts/stream');
eventSource.addEventListener('status', (event) => {
  const { status } = JSON.parse(event.data);
  setRealtimeStatus(status);
  if (status === 'SUBSCRIBED') {
    loadPosts();
  }
});
eventSource.addEventListener('post', (event) => {
  addPost(JSON.parse(event.data));
});
eventSource.onerror = () => {
  setRealtimeStatus('RECONNECTING');
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  formStatus.textContent = '';
  formStatus.classList.remove('is-error');
  submitButton.disabled = true;

  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.value,
        message: messageInput.value,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Could not post your message.');
    }

    messageInput.value = '';
    formStatus.textContent = 'Sent';
    addPost(result);
    messageInput.focus();
  } catch (error) {
    formStatus.textContent = error.message || 'Could not post your message. Please try again.';
    formStatus.classList.add('is-error');
  } finally {
    submitButton.disabled = false;
  }
});

messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

loadPosts();