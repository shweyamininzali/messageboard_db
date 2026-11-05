const form = document.querySelector('#post-form');
const nameInput = document.querySelector('#name');
const messageInput = document.querySelector('#message');
const submitButton = document.querySelector('#submit-button');
const formStatus = document.querySelector('#form-status');
const postList = document.querySelector('#post-list');
const postCount = document.querySelector('#post-count');

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

function renderPosts(posts) {
  postList.replaceChildren();
  postCount.textContent = `${posts.length} ${posts.length === 1 ? 'note' : 'notes'}`;

  if (posts.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.className = 'feed-state';
    emptyState.textContent = 'No notes yet. Yours can be the first.';
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
}

async function loadPosts() {
  postList.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch('/api/posts');
    const posts = await response.json();
    if (!response.ok) {
      throw new Error(posts.error || 'Could not load messages.');
    }

    renderPosts(posts);
  } catch (error) {
    const errorState = document.createElement('p');
    errorState.className = 'feed-state';
    errorState.textContent = error.message || 'Could not load messages. Please try again.';
    postList.replaceChildren(errorState);
  } finally {
    postList.setAttribute('aria-busy', 'false');
  }
}

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

    form.reset();
    formStatus.textContent = 'Message posted.';
    await loadPosts();
  } catch (error) {
    formStatus.textContent = error.message || 'Could not post your message. Please try again.';
    formStatus.classList.add('is-error');
  } finally {
    submitButton.disabled = false;
  }
});

loadPosts();