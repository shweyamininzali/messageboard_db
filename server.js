require('dotenv').config();

const path = require('node:path');
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = Number(process.env.PORT) || 3000;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error('Set both SUPABASE_URL and SUPABASE_SECRET_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
const eventClients = new Set();
let realtimeStatus = 'CONNECTING';

function sendEvent(response, event, data) {
  response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function broadcastEvent(event, data) {
  for (const response of eventClients) {
    if (!response.destroyed) {
      sendEvent(response, event, data);
    }
  }
}

supabase
  .channel('message-board-posts')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'posts' },
    ({ new: post }) => {
      if (post) {
        broadcastEvent('post', post);
      }
    },
  )
  .subscribe((status, error) => {
    realtimeStatus = status;
    broadcastEvent('status', { status });
    if (status !== 'SUBSCRIBED') {
      console.error(`Supabase Realtime status: ${status}`, error?.message || '');
    }
  });

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/api/posts', async (request, response, next) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, name, message, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    return response.json(data);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/posts/stream', (request, response) => {
  response.set({
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',
  });
  response.flushHeaders();
  eventClients.add(response);
  sendEvent(response, 'status', { status: realtimeStatus });

  const heartbeat = setInterval(() => {
    if (!response.destroyed) {
      response.write(': keep-alive\n\n');
    }
  }, 25000);

  response.on('close', () => {
    clearInterval(heartbeat);
    eventClients.delete(response);
  });
});

app.post('/api/posts', async (request, response, next) => {
  try {
    const name = typeof request.body?.name === 'string' ? request.body.name.trim() : '';
    const message = typeof request.body?.message === 'string' ? request.body.message.trim() : '';

    if (!name || [...name].length > 80 || !message || [...message].length > 2000) {
      return response.status(400).json({
        error: 'Name is required (up to 80 characters) and message is required (up to 2,000 characters).',
      });
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({ name, message })
      .select('id, name, message, created_at')
      .single();

    if (error) {
      throw error;
    }

    return response.status(201).json(data);
  } catch (error) {
    return next(error);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((error, request, response, next) => {
  if (response.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }

  console.error(error);
  return response.status(500).json({ error: 'Unable to process the request.' });
});

app.listen(port, () => {
  console.log(`Message board listening on http://localhost:${port} (Supabase)`);
});