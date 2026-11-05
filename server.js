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

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/api/posts', async (request, response, next) => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, name, message, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return response.json(data);
  } catch (error) {
    return next(error);
  }
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